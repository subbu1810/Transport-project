<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\MessageLog;
use App\Models\Transport;
use App\Models\WhatsAppIntegration;
use App\Services\MetaWhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class WhatsAppIntegrationController extends Controller
{
    protected MetaWhatsAppService $metaService;

    public function __construct(MetaWhatsAppService $metaService)
    {
        $this->metaService = $metaService;
    }

    /**
     * Resolve current Tenant ID from request or authenticated admin
     */
    protected function resolveTenantId(Request $request): int
    {
        // 1. Direct tenant_id in request body or query
        if ($request->filled('tenant_id')) {
            return (int) $request->input('tenant_id');
        }

        if ($request->filled('transport_id')) {
            return (int) $request->input('transport_id');
        }

        // 2. Try from Authorization header or admin_id if present
        if ($request->filled('admin_id')) {
            $admin = Admin::find($request->input('admin_id'));
            if ($admin && $admin->transport_id) {
                return (int) $admin->transport_id;
            }
        }

        // 3. Fallback: First active transport or default tenant 1
        $defaultTransport = Transport::where('is_active', true)->first() ?? Transport::first();
        return $defaultTransport ? (int) $defaultTransport->id : 1;
    }

    /**
     * GET /api/v1/whatsapp/config
     * Public configuration for Meta SDK initialization (never exposes secrets)
     */
    public function config(Request $request): JsonResponse
    {
        $appId = $this->metaService->getAppId();
        $configId = $this->metaService->getConfigId();
        $apiVersion = $this->metaService->getApiVersion();

        return response()->json([
            'success' => true,
            'data' => [
                'app_id'      => $appId,
                'config_id'   => $configId,
                'api_version' => $apiVersion,
                'sdk_url'     => 'https://connect.facebook.net/en_US/sdk.js',
            ],
        ]);
    }

    /**
     * GET /api/v1/whatsapp/status
     * Check tenant WhatsApp Business connection status
     */
    public function status(Request $request): JsonResponse
    {
        $tenantId = $this->resolveTenantId($request);
        $integration = WhatsAppIntegration::where('tenant_id', $tenantId)->first();

        if (!$integration || $integration->status !== 'connected') {
            return response()->json([
                'success'   => true,
                'connected' => false,
                'tenant_id' => $tenantId,
                'data'      => null,
                'message'   => 'WhatsApp Business is not connected for this tenant.',
            ]);
        }

        return response()->json([
            'success'   => true,
            'connected' => true,
            'tenant_id' => $tenantId,
            'data'      => [
                'id'                   => $integration->id,
                'tenant_id'            => $integration->tenant_id,
                'business_id'          => $integration->business_id,
                'waba_id'              => $integration->waba_id,
                'phone_number_id'      => $integration->phone_number_id,
                'display_phone_number' => $integration->display_phone_number,
                'business_name'        => $integration->business_name,
                'status'               => $integration->status,
                'connected_at'         => $integration->connected_at ? $integration->connected_at->toIso8601String() : null,
                'updated_at'           => $integration->updated_at ? $integration->updated_at->toIso8601String() : null,
            ],
        ]);
    }

    /**
     * POST /api/v1/whatsapp/embedded-signup
     * Process Meta WhatsApp Business Embedded Signup authorization callback
     */
    public function embeddedSignup(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'code'            => 'required|string',
            'tenant_id'       => 'nullable|integer',
            'waba_id'         => 'nullable|string',
            'phone_number_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $tenantId = $this->resolveTenantId($request);
        $code = $request->input('code');
        $passedWabaId = $request->input('waba_id');
        $passedPhoneId = $request->input('phone_number_id');

        // Step 1: Exchange code for Access Token
        $tokenExchange = $this->metaService->exchangeCodeForToken($code);
        if (!$tokenExchange['success']) {
            return response()->json([
                'success' => false,
                'message' => 'Meta authorization code exchange failed: ' . ($tokenExchange['error'] ?? 'Unknown error'),
            ], 400);
        }

        $accessToken = $tokenExchange['access_token'];
        $tokenType = $tokenExchange['token_type'] ?? 'Bearer';

        // Step 2: Resolve WABA ID and Business ID
        $wabaId = $passedWabaId;
        $businessId = null;
        $businessName = null;

        // Inspect debug token to get granular scopes and IDs if needed
        $debugInfo = $this->metaService->inspectDebugToken($accessToken);
        if ($debugInfo['success']) {
            $businessId = $debugInfo['business_id'] ?? null;
            if (empty($wabaId) && !empty($debugInfo['waba_id'])) {
                $wabaId = $debugInfo['waba_id'];
            }
        }

        // Fetch WABA Details
        if (!empty($wabaId)) {
            $wabaDetails = $this->metaService->getWabaDetails($wabaId, $accessToken);
            if ($wabaDetails['success']) {
                $businessName = $wabaDetails['data']['name'] ?? null;
            }
        }

        // Step 3: Retrieve Phone Numbers for the WABA
        $phoneNumberId = $passedPhoneId;
        $displayPhoneNumber = null;

        if (!empty($wabaId)) {
            $phonesRes = $this->metaService->getWabaPhoneNumbers($wabaId, $accessToken);
            if ($phonesRes['success'] && !empty($phonesRes['numbers'])) {
                $numbers = $phonesRes['numbers'];
                
                // If a phone_number_id was passed, find that specific one
                $targetPhone = null;
                if (!empty($phoneNumberId)) {
                    foreach ($numbers as $num) {
                        if (isset($num['id']) && (string) $num['id'] === (string) $phoneNumberId) {
                            $targetPhone = $num;
                            break;
                        }
                    }
                }

                // Fallback to first available phone number
                if (!$targetPhone) {
                    $targetPhone = $numbers[0];
                }

                $phoneNumberId = $targetPhone['id'] ?? $phoneNumberId;
                $displayPhoneNumber = $targetPhone['display_phone_number'] ?? null;
                if (empty($businessName) && !empty($targetPhone['verified_name'])) {
                    $businessName = $targetPhone['verified_name'];
                }
            }
        }

        // Fallback for business name if still empty
        if (empty($businessName)) {
            $transport = Transport::find($tenantId);
            $businessName = $transport ? $transport->transport_name : 'Garuda Transport Customer';
        }

        // Step 4: Subscribe our Meta App to WABA Webhooks automatically
        if (!empty($wabaId)) {
            $this->metaService->subscribeWabaApp($wabaId, $accessToken);
        }

        // Step 5: Save or update WhatsApp Integration for this Tenant
        $integration = WhatsAppIntegration::updateOrCreate(
            ['tenant_id' => $tenantId],
            [
                'business_id'            => $businessId,
                'waba_id'                => $wabaId,
                'phone_number_id'        => $phoneNumberId,
                'display_phone_number'   => $displayPhoneNumber,
                'business_name'          => $businessName,
                'access_token_encrypted' => \Illuminate\Support\Facades\Crypt::encryptString($accessToken),
                'token_type'             => $tokenType,
                'status'                 => 'connected',
                'meta_app_id'            => $this->metaService->getAppId(),
                'connected_at'           => now(),
                'raw_metadata'           => [
                    'token_exchange' => [
                        'token_type' => $tokenType,
                        'received_at' => now()->toIso8601String(),
                    ],
                    'debug_info' => $debugInfo['raw'] ?? null,
                ],
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'WhatsApp Business Account successfully connected to Garuda Transport ERP!',
            'data'    => [
                'tenant_id'            => $integration->tenant_id,
                'business_id'          => $integration->business_id,
                'waba_id'              => $integration->waba_id,
                'phone_number_id'      => $integration->phone_number_id,
                'display_phone_number' => $integration->display_phone_number,
                'business_name'        => $integration->business_name,
                'status'               => $integration->status,
                'connected_at'         => $integration->connected_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * POST /api/v1/whatsapp/send-test-message
     * Send a test WhatsApp message using the connected tenant account
     */
    public function sendTestMessage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone'     => 'required|string',
            'message'   => 'nullable|string',
            'tenant_id' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $tenantId = $this->resolveTenantId($request);
        $integration = WhatsAppIntegration::where('tenant_id', $tenantId)->first();

        if (!$integration || $integration->status !== 'connected') {
            return response()->json([
                'success' => false,
                'message' => 'No active WhatsApp Business Account is connected for this transport company. Please connect via Embedded Signup first.',
            ], 400);
        }

        $phoneNumberId = $integration->phone_number_id;
        $accessToken = $integration->getDecryptedAccessToken();

        if (empty($phoneNumberId) || empty($accessToken)) {
            return response()->json([
                'success' => false,
                'message' => 'Connected WhatsApp configuration is incomplete (missing Phone Number ID or Access Token).',
            ], 400);
        }

        $recipientPhone = $request->input('phone');
        $transport = Transport::find($tenantId);
        $companyName = $transport?->transport_name ?? $integration->business_name ?? 'Garuda Transport ERP';

        $testBody = $request->input('message') ?: "Hello! 👋\n\nThis is a test notification from *{$companyName}* via *Garuda Transport ERP*.\n\nYour Meta WhatsApp Business Embedded Signup integration is active and operating perfectly! 🚀\n\nDate: " . now()->format('d-M-Y H:i:s');

        // Dispatch via Meta WhatsApp Cloud API
        $result = $this->metaService->sendTextMessage($phoneNumberId, $accessToken, $recipientPhone, $testBody);

        $cleanedPhone = preg_replace('/[^0-9]/', '', $recipientPhone);
        if (strlen($cleanedPhone) === 10) {
            $cleanedPhone = '91' . $cleanedPhone;
        }

        // Log message
        $log = MessageLog::create([
            'channel'        => 'whatsapp',
            'recipient_name' => 'Test Recipient',
            'phone'          => $cleanedPhone,
            'message_type'   => 'test',
            'template_id'    => null,
            'message_body'   => $testBody,
            'status'         => $result['success'] ? 'sent' : 'failed',
            'external_id'    => $result['message_id'] ?? null,
            'error_message'  => $result['success'] ? null : ($result['error'] ?? 'API dispatch error'),
            'branch_id'      => $request->input('branch_id'),
            'user_id'        => $request->input('user_id'),
            'sent_at'        => now(),
        ]);

        if (!$result['success']) {
            return response()->json([
                'success'       => false,
                'message'       => 'Failed to send test message: ' . ($result['error'] ?? 'Unknown Meta API error'),
                'error_details' => $result['error'] ?? null,
                'log_id'        => $log->id,
            ], 400);
        }

        return response()->json([
            'success'    => true,
            'message'    => 'Test WhatsApp message sent successfully via Meta WhatsApp Cloud API!',
            'message_id' => $result['message_id'] ?? null,
            'to_phone'   => $cleanedPhone,
            'log_id'     => $log->id,
        ]);
    }

    /**
     * POST /api/v1/whatsapp/disconnect
     * Disconnect tenant's WhatsApp Business Account
     */
    public function disconnect(Request $request): JsonResponse
    {
        $tenantId = $this->resolveTenantId($request);
        $integration = WhatsAppIntegration::where('tenant_id', $tenantId)->first();

        if (!$integration) {
            return response()->json([
                'success' => true,
                'message' => 'No active WhatsApp integration found to disconnect.',
            ]);
        }

        $integration->update([
            'status'                 => 'disconnected',
            'access_token_encrypted' => null,
            'updated_at'             => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'WhatsApp Business Account disconnected successfully.',
        ]);
    }

    /**
     * GET /api/v1/webhooks/whatsapp or /api/webhooks/whatsapp
     * Meta Webhook Verification Challenge Handler
     */
    public function webhookGet(Request $request): Response
    {
        $hubMode = $request->query('hub_mode', $request->query('hub.mode'));
        $hubVerifyToken = $request->query('hub_verify_token', $request->query('hub.verify_token'));
        $hubChallenge = $request->query('hub_challenge', $request->query('hub.challenge'));

        $configuredToken = env('META_VERIFY_TOKEN', env('WHATSAPP_VERIFY_TOKEN', 'lifetransport_wa_verify_2026'));

        if ($hubMode === 'subscribe' && $hubVerifyToken === $configuredToken) {
            Log::info('Meta Webhook verification succeeded');
            return response($hubChallenge, 200)->header('Content-Type', 'text/plain');
        }

        Log::warning('Meta Webhook verification failed', [
            'mode'           => $hubMode,
            'verify_token'   => $hubVerifyToken,
            'expected_token' => $configuredToken,
        ]);

        return response('Forbidden', 403)->header('Content-Type', 'text/plain');
    }

    /**
     * POST /api/v1/webhooks/whatsapp or /api/webhooks/whatsapp
     * Meta Webhook Event Notifications (Delivery status updates & incoming messages)
     */
    public function webhookPost(Request $request): JsonResponse
    {
        $rawPayload = $request->getContent();
        $signatureHeader = $request->header('X-Hub-Signature-256');

        // Signature check
        if (!$this->metaService->verifyWebhookSignature($rawPayload, $signatureHeader)) {
            Log::warning('Meta Webhook: Invalid SHA256 signature');
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $data = json_decode($rawPayload, true) ?: [];

        if (isset($data['entry']) && is_array($data['entry'])) {
            foreach ($data['entry'] as $entry) {
                if (isset($entry['changes']) && is_array($entry['changes'])) {
                    foreach ($entry['changes'] as $change) {
                        $value = $change['value'] ?? [];

                        // 1. Process Status Updates (sent, delivered, read, failed)
                        if (isset($value['statuses']) && is_array($value['statuses'])) {
                            foreach ($value['statuses'] as $statusUpdate) {
                                $metaMsgId = $statusUpdate['id'] ?? null;
                                $status = $statusUpdate['status'] ?? null; // delivered, read, failed, sent
                                $recipientId = $statusUpdate['recipient_id'] ?? null;

                                if ($metaMsgId && $status) {
                                    $log = MessageLog::where('external_id', $metaMsgId)->first();
                                    if ($log) {
                                        $log->status = $status;
                                        if ($status === 'failed') {
                                            $log->error_message = json_encode($statusUpdate['errors'] ?? 'Delivery failed');
                                        }
                                        $log->save();
                                    }
                                }
                            }
                        }

                        // 2. Process Incoming Messages if any
                        if (isset($value['messages']) && is_array($value['messages'])) {
                            foreach ($value['messages'] as $incomingMsg) {
                                $from = $incomingMsg['from'] ?? '';
                                $msgId = $incomingMsg['id'] ?? '';
                                $msgType = $incomingMsg['type'] ?? 'text';
                                $text = $incomingMsg['text']['body'] ?? "[Media: {$msgType}]";

                                MessageLog::create([
                                    'channel'        => 'whatsapp',
                                    'recipient_name' => 'Customer (' . $from . ')',
                                    'phone'          => $from,
                                    'message_type'   => 'incoming',
                                    'template_id'    => null,
                                    'message_body'   => $text,
                                    'status'         => 'delivered',
                                    'external_id'    => $msgId,
                                    'sent_at'        => now(),
                                ]);
                            }
                        }
                    }
                }
            }
        }

        return response()->json(['status' => 'EVENT_RECEIVED'], 200);
    }
}
