<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class MetaWhatsAppService
{
    protected string $appId;
    protected string $appSecret;
    protected string $configId;
    protected string $apiVersion;

    public function __construct()
    {
        $this->appId = env('META_APP_ID', env('WHATSAPP_APP_ID', ''));
        $this->appSecret = env('META_APP_SECRET', env('WHATSAPP_APP_SECRET', ''));
        $this->configId = env('META_CONFIG_ID', env('WHATSAPP_CONFIG_ID', ''));
        $this->apiVersion = env('META_API_VERSION', 'v21.0');
    }

    public function getAppId(): string
    {
        return $this->appId;
    }

    public function getConfigId(): string
    {
        return $this->configId;
    }

    public function getApiVersion(): string
    {
        return $this->apiVersion;
    }

    /**
     * Exchange Meta OAuth Authorization Code for an Access Token
     * Meta API: GET https://graph.facebook.com/{version}/oauth/access_token
     */
    public function exchangeCodeForToken(string $code): array
    {
        $url = "https://graph.facebook.com/{$this->apiVersion}/oauth/access_token?" . http_build_query([
            'client_id'     => $this->appId,
            'client_secret' => $this->appSecret,
            'code'          => $code,
        ]);

        $response = $this->makeHttpRequest($url, 'GET');

        if (!$response['success']) {
            Log::error('MetaWhatsAppService: Token exchange failed', [
                'error' => $response['error'] ?? 'Unknown error',
                'http_code' => $response['http_code'] ?? 0
            ]);
            return [
                'success' => false,
                'error'   => $response['error'] ?? 'Failed to exchange authorization code with Meta',
            ];
        }

        $data = $response['data'];
        $accessToken = $data['access_token'] ?? null;
        $tokenType = $data['token_type'] ?? 'Bearer';

        if (!$accessToken) {
            return [
                'success' => false,
                'error'   => 'Access token missing in Meta OAuth response',
            ];
        }

        return [
            'success'      => true,
            'access_token' => $accessToken,
            'token_type'   => $tokenType,
            'data'         => $data,
        ];
    }

    /**
     * Inspect token using debug_token API to find granted scopes, business ID, and WABA ID
     * Meta API: GET https://graph.facebook.com/{version}/debug_token
     */
    public function inspectDebugToken(string $inputToken): array
    {
        $appAccessToken = "{$this->appId}|{$this->appSecret}";
        $url = "https://graph.facebook.com/{$this->apiVersion}/debug_token?" . http_build_query([
            'input_token'  => $inputToken,
            'access_token' => $appAccessToken,
        ]);

        $response = $this->makeHttpRequest($url, 'GET');

        if (!$response['success']) {
            Log::warning('MetaWhatsAppService: debug_token failed, falling back to direct endpoints', [
                'error' => $response['error'] ?? 'Unknown'
            ]);
            return [
                'success' => false,
                'error'   => $response['error'] ?? 'debug_token request failed',
            ];
        }

        $data = $response['data']['data'] ?? [];
        $granularScopes = $data['granular_scopes'] ?? [];
        $wabaId = null;

        foreach ($granularScopes as $scope) {
            if (isset($scope['scope']) && $scope['scope'] === 'whatsapp_business_management') {
                $targetIds = $scope['target_ids'] ?? [];
                if (!empty($targetIds)) {
                    $wabaId = $targetIds[0];
                    break;
                }
            }
        }

        return [
            'success'         => true,
            'waba_id'         => $wabaId,
            'business_id'     => $data['business_id'] ?? null,
            'app_id'          => $data['app_id'] ?? null,
            'is_valid'        => $data['is_valid'] ?? true,
            'scopes'          => $data['scopes'] ?? [],
            'granular_scopes' => $granularScopes,
            'raw'             => $data,
        ];
    }

    /**
     * Retrieve WhatsApp Business Account (WABA) details
     * Meta API: GET https://graph.facebook.com/{version}/{waba_id}
     */
    public function getWabaDetails(string $wabaId, string $accessToken): array
    {
        $url = "https://graph.facebook.com/{$this->apiVersion}/{$wabaId}?" . http_build_query([
            'fields'       => 'id,name,currency,timezone_id,message_template_namespace,account_review_status',
            'access_token' => $accessToken,
        ]);

        $response = $this->makeHttpRequest($url, 'GET');

        if (!$response['success']) {
            return [
                'success' => false,
                'error'   => $response['error'] ?? 'Failed to fetch WABA details',
            ];
        }

        return [
            'success' => true,
            'data'    => $response['data'],
        ];
    }

    /**
     * Retrieve phone numbers associated with a WABA
     * Meta API: GET https://graph.facebook.com/{version}/{waba_id}/phone_numbers
     */
    public function getWabaPhoneNumbers(string $wabaId, string $accessToken): array
    {
        $url = "https://graph.facebook.com/{$this->apiVersion}/{$wabaId}/phone_numbers?" . http_build_query([
            'fields'       => 'id,display_phone_number,verified_name,code_verification_status,quality_rating,platform_type,status',
            'access_token' => $accessToken,
        ]);

        $response = $this->makeHttpRequest($url, 'GET');

        if (!$response['success']) {
            return [
                'success' => false,
                'error'   => $response['error'] ?? 'Failed to fetch phone numbers for WABA',
                'numbers' => [],
            ];
        }

        $numbers = $response['data']['data'] ?? [];

        return [
            'success' => true,
            'numbers' => $numbers,
        ];
    }

    /**
     * Subscribe our Meta App to receive Webhooks for the customer's WABA
     * Meta API: POST https://graph.facebook.com/{version}/{waba_id}/subscribed_apps
     */
    public function subscribeWabaApp(string $wabaId, string $accessToken): array
    {
        $url = "https://graph.facebook.com/{$this->apiVersion}/{$wabaId}/subscribed_apps";

        $response = $this->makeHttpRequest($url, 'POST', [], [
            "Authorization: Bearer {$accessToken}",
        ]);

        if (!$response['success']) {
            Log::warning("MetaWhatsAppService: Could not auto-subscribe WABA {$wabaId} to app: " . ($response['error'] ?? 'unknown'));
            return [
                'success' => false,
                'error'   => $response['error'] ?? 'Failed to subscribe app to WABA',
            ];
        }

        return [
            'success' => true,
            'data'    => $response['data'],
        ];
    }

    /**
     * Send a single text message via Meta WhatsApp Cloud API
     * Meta API: POST https://graph.facebook.com/{version}/{phone_number_id}/messages
     */
    public function sendTextMessage(string $phoneNumberId, string $accessToken, string $toPhone, string $messageBody): array
    {
        $cleanedPhone = preg_replace('/[^0-9]/', '', $toPhone);
        if (strlen($cleanedPhone) === 10) {
            $cleanedPhone = '91' . $cleanedPhone; // Standard 10-digit Indian mobile number
        }

        $url = "https://graph.facebook.com/{$this->apiVersion}/{$phoneNumberId}/messages";

        $payload = [
            'messaging_product' => 'whatsapp',
            'recipient_type'    => 'individual',
            'to'                => $cleanedPhone,
            'type'              => 'text',
            'text'              => [
                'preview_url' => false,
                'body'        => $messageBody,
            ],
        ];

        $response = $this->makeHttpRequest($url, 'POST', $payload, [
            "Authorization: Bearer {$accessToken}",
            'Content-Type: application/json',
        ]);

        if (!$response['success']) {
            return [
                'success' => false,
                'error'   => $response['error'] ?? 'Failed to send WhatsApp message',
                'raw'     => $response['data'] ?? null,
            ];
        }

        $messageId = $response['data']['messages'][0]['id'] ?? null;

        return [
            'success'    => true,
            'message_id' => $messageId,
            'data'       => $response['data'],
        ];
    }

    /**
     * Verify Meta Webhook SHA256 signature
     */
    public function verifyWebhookSignature(string $payload, ?string $signatureHeader): bool
    {
        if (empty($this->appSecret) || empty($signatureHeader)) {
            return true; // Allow if app secret not configured in local environment
        }

        if (str_starts_with($signatureHeader, 'sha256=')) {
            $signatureHeader = substr($signatureHeader, 7);
        }

        $expectedSignature = hash_hmac('sha256', $payload, $this->appSecret);

        return hash_equals($expectedSignature, $signatureHeader);
    }

    /**
     * Universal HTTP cURL executor
     */
    protected function makeHttpRequest(string $url, string $method = 'GET', array $payload = [], array $headers = []): array
    {
        try {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

            if (empty($headers)) {
                $headers = ['Accept: application/json'];
            }
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

            if (strtoupper($method) === 'POST') {
                curl_setopt($ch, CURLOPT_POST, true);
                if (!empty($payload)) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
                }
            } elseif (strtoupper($method) === 'DELETE') {
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
            }

            $rawResponse = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            if ($rawResponse === false || !empty($curlError)) {
                return [
                    'success'   => false,
                    'http_code' => $httpCode,
                    'error'     => $curlError ?: 'Connection to Meta Graph API failed',
                ];
            }

            $decoded = json_decode($rawResponse, true);

            if ($httpCode >= 200 && $httpCode < 300) {
                return [
                    'success'   => true,
                    'http_code' => $httpCode,
                    'data'      => $decoded ?: [],
                ];
            }

            $errorMessage = $decoded['error']['message'] ?? $decoded['error_description'] ?? 'Meta API error: HTTP ' . $httpCode;
            if (isset($decoded['error']['error_user_msg'])) {
                $errorMessage .= ' - ' . $decoded['error']['error_user_msg'];
            }

            return [
                'success'   => false,
                'http_code' => $httpCode,
                'error'     => $errorMessage,
                'data'      => $decoded,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error'   => $e->getMessage(),
            ];
        }
    }
}
