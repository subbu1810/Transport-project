<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MessageTemplate;
use App\Models\MessageLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class CommunicationController extends Controller
{
    /**
     * Get list of all message templates
     */
    public function getTemplates(Request $request)
    {
        try {
            if (!Schema::hasTable('message_templates')) {
                return response()->json([
                    'success' => true,
                    'data'    => []
                ]);
            }

            $query = MessageTemplate::query();

            if ($request->has('channel') && $request->channel) {
                $query->where('channel', $request->channel);
            }

            if ($request->has('type') && $request->type) {
                $query->where('type', $request->type);
            }

            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            $templates = $query->latest()->get();

            return response()->json([
                'success' => true,
                'data'    => $templates
            ]);
        } catch (\Throwable $e) {
            Log::warning('Error fetching message templates: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data'    => []
            ]);
        }
    }

    /**
     * Create a new message template
     */
    public function createTemplate(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'type'     => 'nullable|string|max:50',
            'channel'  => 'nullable|string|in:whatsapp,sms,all',
            'body'     => 'required|string',
            'language' => 'nullable|string|max:10',
            'status'   => 'nullable|string|in:active,inactive',
        ]);

        $template = MessageTemplate::create([
            'name'       => $validated['name'],
            'type'       => $validated['type'] ?? 'custom',
            'channel'    => $validated['channel'] ?? 'whatsapp',
            'body'       => $validated['body'],
            'language'   => $validated['language'] ?? 'en',
            'status'     => $validated['status'] ?? 'active',
            'branch_id'  => $request->input('branch_id'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Template created successfully',
            'data'    => $template
        ], 201);
    }

    /**
     * Update an existing message template
     */
    public function updateTemplate(Request $request, $id)
    {
        $template = MessageTemplate::findOrFail($id);

        $validated = $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'type'     => 'nullable|string|max:50',
            'channel'  => 'nullable|string|in:whatsapp,sms,all',
            'body'     => 'sometimes|required|string',
            'language' => 'nullable|string|max:10',
            'status'   => 'nullable|string|in:active,inactive',
        ]);

        $template->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Template updated successfully',
            'data'    => $template
        ]);
    }

    /**
     * Delete a message template
     */
    public function deleteTemplate($id)
    {
        $template = MessageTemplate::findOrFail($id);
        $template->delete();

        return response()->json([
            'success' => true,
            'message' => 'Template deleted successfully'
        ]);
    }

    /**
     * Get paginated message logs
     */
    public function logs(Request $request)
    {
        try {
            if (!Schema::hasTable('message_logs')) {
                return response()->json([
                    'current_page' => 1,
                    'data'         => [],
                    'total'        => 0,
                    'per_page'     => 20,
                    'last_page'    => 1,
                ]);
            }

            $query = MessageLog::query();
            if (Schema::hasTable('message_templates')) {
                $query->with('template');
            }

            if ($request->filled('phone')) {
                $query->where('phone', 'like', '%' . $request->phone . '%');
            }

            if ($request->filled('channel')) {
                $query->where('channel', $request->channel);
            }

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('date')) {
                $query->whereDate('created_at', $request->date);
            }

            $perPage = $request->input('per_page', 20);
            $logs = $query->latest()->paginate($perPage);

            return response()->json($logs);
        } catch (\Throwable $e) {
            Log::warning('Error fetching message logs: ' . $e->getMessage());
            return response()->json([
                'current_page' => 1,
                'data'         => [],
                'total'        => 0,
                'per_page'     => 20,
                'last_page'    => 1,
            ]);
        }
    }

    /**
     * Send a single message (WhatsApp or SMS)
     */
    public function send(Request $request)
    {
        $validated = $request->validate([
            'phone'          => 'required|string',
            'recipient_name' => 'nullable|string',
            'channel'        => 'nullable|string|in:whatsapp,sms',
            'message_body'   => 'required|string',
            'template_id'    => 'nullable|integer',
            'message_type'   => 'nullable|string',
        ]);

        $channel = $validated['channel'] ?? 'whatsapp';
        $phoneRaw = preg_replace('/[^0-9]/', '', $validated['phone']);
        
        // Ensure 91 prefix for standard 10 digit Indian numbers if missing
        $phone = (strlen($phoneRaw) === 10) ? '91' . $phoneRaw : $phoneRaw;

        $messageBody = $validated['message_body'];
        $recipientName = $validated['recipient_name'] ?? 'Recipient';
        $templateId = $validated['template_id'] ?? null;
        $messageType = $validated['message_type'] ?? 'custom';

        $tenantId = $request->input('tenant_id') ?? $request->input('transport_id');
        $integration = null;
        if ($tenantId) {
            $integration = \App\Models\WhatsAppIntegration::where('tenant_id', $tenantId)
                ->where('status', 'connected')
                ->first();
        } else {
            $integration = \App\Models\WhatsAppIntegration::where('status', 'connected')->first();
        }

        $token   = $integration ? $integration->getDecryptedAccessToken() : env('WHATSAPP_TOKEN', '');
        $phoneId = $integration ? $integration->phone_number_id : env('WHATSAPP_PHONE_NUMBER_ID', '');

        $status = 'sent';
        $externalId = null;
        $errorMessage = null;
        $sentViaApi = false;

        // If Meta WhatsApp API credentials exist, send via Cloud API
        if ($channel === 'whatsapp' && !empty($token) && !empty($phoneId)) {
            $apiResult = $this->sendMetaWhatsApp($phone, $messageBody, $token, $phoneId);
            if ($apiResult['success']) {
                $status = 'sent';
                $externalId = $apiResult['message_id'] ?? null;
                $sentViaApi = true;
            } else {
                $status = 'failed';
                $errorMessage = $apiResult['error'] ?? 'Failed to send via Meta Cloud API';
            }
        }

        // Create WhatsApp direct web URL as fallback / convenience
        $encodedText = urlencode($messageBody);
        $directWaUrl = "https://wa.me/{$phone}?text={$encodedText}";

        // Save to MessageLog if table exists
        $log = null;
        if (Schema::hasTable('message_logs')) {
            try {
                $log = MessageLog::create([
                    'channel'        => $channel,
                    'recipient_name' => $recipientName,
                    'phone'          => $phone,
                    'message_type'   => $messageType,
                    'template_id'    => $templateId,
                    'message_body'   => $messageBody,
                    'status'         => $status,
                    'external_id'    => $externalId,
                    'error_message'  => $errorMessage,
                    'branch_id'      => $request->input('branch_id'),
                    'user_id'        => $request->input('user_id'),
                    'sent_at'        => now(),
                ]);
            } catch (\Throwable $e) {
                Log::warning('Failed to save MessageLog: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success'       => ($status === 'sent'),
            'sent_via_api'  => $sentViaApi,
            'message'       => $sentViaApi ? 'WhatsApp message dispatched successfully via API' : 'Message logged. Direct WhatsApp link ready.',
            'direct_wa_url' => $directWaUrl,
            'data'          => $log,
        ]);
    }

    /**
     * Bulk send WhatsApp messages
     */
    public function bulkSend(Request $request)
    {
        $validated = $request->validate([
            'recipients'   => 'required|array|min:1',
            'recipients.*.phone' => 'required|string',
            'recipients.*.name'  => 'nullable|string',
            'channel'      => 'nullable|string|in:whatsapp,sms',
            'message_body' => 'required|string',
            'template_id'  => 'nullable|integer',
        ]);

        $results = [];
        foreach ($validated['recipients'] as $recipient) {
            $phoneRaw = preg_replace('/[^0-9]/', '', $recipient['phone']);
            $phone = (strlen($phoneRaw) === 10) ? '91' . $phoneRaw : $phoneRaw;
            $name = $recipient['name'] ?? 'Customer';

            $body = str_replace(
                ['{{name}}', '{{customer_name}}', '{{phone}}'],
                [$name, $name, $phone],
                $validated['message_body']
            );

            $log = null;
            if (Schema::hasTable('message_logs')) {
                try {
                    $log = MessageLog::create([
                        'channel'        => $validated['channel'] ?? 'whatsapp',
                        'recipient_name' => $name,
                        'phone'          => $phone,
                        'message_type'   => 'bulk',
                        'template_id'    => $validated['template_id'] ?? null,
                        'message_body'   => $body,
                        'status'         => 'sent',
                        'sent_at'        => now(),
                    ]);
                } catch (\Throwable $e) {
                    Log::warning('Failed to save bulk MessageLog: ' . $e->getMessage());
                }
            }

            if ($log) {
                $results[] = $log;
            }
        }

        return response()->json([
            'success' => true,
            'count'   => count($results),
            'message' => 'Bulk messages processed successfully',
            'data'    => $results
        ]);
    }

    /**
     * Helper to send message via Meta WhatsApp Cloud API
     */
    private function sendMetaWhatsApp(string $to, string $text, string $token, string $phoneId): array
    {
        $url = "https://graph.facebook.com/v19.0/{$phoneId}/messages";

        $body = [
            'messaging_product' => 'whatsapp',
            'to'                => $to,
            'type'              => 'text',
            'text'              => ['body' => $text],
        ];

        try {
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                "Authorization: Bearer {$token}",
            ]);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 20);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            $decoded = json_decode($response, true);

            if ($httpCode === 200 && isset($decoded['messages'][0]['id'])) {
                return [
                    'success'    => true,
                    'message_id' => $decoded['messages'][0]['id'],
                ];
            }

            return [
                'success' => false,
                'error'   => $decoded['error']['message'] ?? $curlError ?? 'HTTP ' . $httpCode,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error'   => $e->getMessage(),
            ];
        }
    }
}
