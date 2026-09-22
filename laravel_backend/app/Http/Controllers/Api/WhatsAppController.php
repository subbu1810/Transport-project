<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * WhatsAppController
 *
 * Handles Meta WhatsApp Business API webhook.
 * This controller is COMPLETELY ISOLATED from the existing Transport app.
 * It only handles:
 *   - GET  /api/whatsapp/webhook  → Meta webhook verification
 *   - POST /api/whatsapp/webhook  → Incoming message events from Meta
 */
class WhatsAppController extends Controller
{
    /**
     * STEP 1: Meta Webhook Verification (GET request)
     *
     * When you enter the Callback URL in Meta Developer Dashboard and click
     * "Verify and Save", Meta sends a GET request with these query params:
     *   - hub.mode         = "subscribe"
     *   - hub.verify_token = the token you entered in Meta Dashboard
     *   - hub.challenge    = a random number Meta wants you to echo back
     *
     * If your WHATSAPP_VERIFY_TOKEN matches, respond with hub.challenge.
     * Otherwise return 403 Forbidden.
     */
    public function verify(Request $request)
    {
        // Meta sends: hub.mode, hub.verify_token, hub.challenge (with dots)
        // PHP converts dots to underscores in $_GET, $request->input() handles both
        $mode      = $request->input('hub_mode');
        $token     = $request->input('hub_verify_token');
        $challenge = $request->input('hub_challenge');

        $verifyToken = env('WHATSAPP_VERIFY_TOKEN', '');

        if ($mode === 'subscribe' && $token === $verifyToken) {
            Log::info('[WhatsApp] Webhook verified successfully.');
            return response($challenge, 200)->header('Content-Type', 'text/plain');
        }

        Log::warning('[WhatsApp] Webhook verification failed. Token mismatch or wrong mode.', [
            'received_token' => $token,
            'received_mode'  => $mode,
        ]);

        return response()->json(['error' => 'Verification failed'], 403);
    }

    /**
     * STEP 2: Receive Incoming Messages (POST request)
     *
     * Meta sends a POST request each time:
     *   - A user sends a WhatsApp message to your number
     *   - A message status changes (sent, delivered, read, failed)
     *
     * All events are logged. You can extend this method to:
     *   - Auto-reply with GC tracking info
     *   - Store messages in the database
     *   - Trigger notifications
     */
    public function receive(Request $request)
    {
        $payload = $request->all();

        // Always log the raw payload for debugging
        Log::info('[WhatsApp] Incoming webhook payload:', $payload);

        try {
            $entry   = $payload['entry'][0]           ?? null;
            $changes = $entry  ? ($entry['changes'][0]  ?? null) : null;
            $value   = $changes ? ($changes['value']    ?? null) : null;

            if (!$value) {
                return response()->json(['status' => 'ok', 'note' => 'No value in payload'], 200);
            }

            // ── Handle Incoming Messages ──────────────────────────────────────
            if (!empty($value['messages'])) {
                foreach ($value['messages'] as $message) {
                    $from = $message['from']          ?? 'unknown';  // Sender's WhatsApp number
                    $type = $message['type']          ?? 'unknown';  // text, image, document, etc.
                    $body = $message['text']['body']  ?? null;       // Text content (if text message)

                    Log::info("[WhatsApp] Message from {$from} | Type: {$type} | Body: {$body}");

                    // ── TODO: Add your business logic here ────────────────────
                    // Example: if message says "TRACK GC123", look up GC and reply
                    // $this->handleIncomingMessage($from, $type, $body, $message);
                    // ─────────────────────────────────────────────────────────
                }
            }

            // ── Handle Message Status Updates ─────────────────────────────────
            if (!empty($value['statuses'])) {
                foreach ($value['statuses'] as $status) {
                    $msgId      = $status['id']         ?? '';
                    $statusVal  = $status['status']     ?? '';   // sent, delivered, read, failed
                    $recipient  = $status['recipient_id'] ?? '';

                    Log::info("[WhatsApp] Status update | MsgID: {$msgId} | Status: {$statusVal} | To: {$recipient}");
                }
            }

        } catch (\Exception $e) {
            Log::error('[WhatsApp] Error processing webhook: ' . $e->getMessage());
        }

        // Always return 200 OK to Meta — otherwise Meta will retry sending
        return response()->json(['status' => 'ok'], 200);
    }

    /**
     * Helper: Send a WhatsApp text message via Meta Cloud API
     *
     * Usage:
     *   $this->sendMessage('919876543210', 'Your GC 12345 has been delivered!');
     *
     * @param string $to    Recipient phone number with country code (no + or spaces)
     * @param string $text  Message text
     */
    public function sendMessage(string $to, string $text): bool
    {
        $token       = env('WHATSAPP_TOKEN', '');
        $phoneId     = env('WHATSAPP_PHONE_NUMBER_ID', '');

        if (!$token || !$phoneId) {
            Log::error('[WhatsApp] WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set in .env');
            return false;
        }

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

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            Log::info("[WhatsApp] Message sent to {$to} | HTTP {$httpCode} | Response: {$response}");
            return $httpCode === 200;

        } catch (\Exception $e) {
            Log::error('[WhatsApp] Failed to send message: ' . $e->getMessage());
            return false;
        }
    }
}
