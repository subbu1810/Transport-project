<?php

/**
 * WhatsApp API Routes
 *
 * These routes are COMPLETELY SEPARATE from the main Transport app routes.
 * They are loaded via bootstrap/app.php (Laravel 11) or RouteServiceProvider.
 *
 * Callback URL to enter in Meta Developer Dashboard:
 *   https://api.lifetransport.ssquareg.com/api/whatsapp/webhook
 *
 * Verify Token: set WHATSAPP_VERIFY_TOKEN in your .env file
 */

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\WhatsAppController;

// ── WhatsApp Webhook Routes ────────────────────────────────────────────────────
// No auth middleware — Meta needs to access these without authentication
// No rate limiting that could block Meta's pings

Route::prefix('whatsapp')->group(function () {

    /**
     * GET /api/whatsapp/webhook
     * Meta uses this to verify your Callback URL.
     * Called once when you click "Verify and Save" in Meta Dashboard.
     */
    Route::get('webhook', [WhatsAppController::class, 'verify'])->name('whatsapp.verify');

    /**
     * POST /api/whatsapp/webhook
     * Meta sends incoming messages and status updates here.
     */
    Route::post('webhook', [WhatsAppController::class, 'receive'])->name('whatsapp.receive');

    /**
     * GET /api/whatsapp/status
     * Simple health-check to confirm the WhatsApp route is working.
     */
    Route::get('status', function () {
        return response()->json([
            'status'    => 'WhatsApp webhook is active',
            'phone_id'  => env('WHATSAPP_PHONE_NUMBER_ID') ? '✓ Set' : '✗ Not set',
            'token'     => env('WHATSAPP_TOKEN')           ? '✓ Set' : '✗ Not set',
            'verify_tk' => env('WHATSAPP_VERIFY_TOKEN')    ? '✓ Set' : '✗ Not set',
        ]);
    })->name('whatsapp.status');

    /**
     * GET /api/whatsapp/test-send?to=919876543210
     *
     * TEMPORARY TEST ROUTE — Open this in browser to send a test WhatsApp message.
     * Replace the 'to' number with your verified WhatsApp number (country code, no +).
     *
     * Example:
     *   https://api.lifetransport.ssquareg.com/api/whatsapp/test-send?to=919876543210
     *
     * REMOVE THIS ROUTE after testing is complete.
     */
    Route::get('test-send', function (\Illuminate\Http\Request $request) {
        $to = $request->query('to');

        if (!$to) {
            return response()->json([
                'success' => false,
                'error'   => 'Missing ?to= parameter. Example: ?to=919876543210'
            ], 400);
        }

        $token   = env('WHATSAPP_TOKEN', '');
        $phoneId = env('WHATSAPP_PHONE_NUMBER_ID', '');

        if (!$token || !$phoneId) {
            return response()->json([
                'success' => false,
                'error'   => 'WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set in .env'
            ], 500);
        }

        $url  = "https://graph.facebook.com/v19.0/{$phoneId}/messages";
        $body = json_encode([
            'messaging_product' => 'whatsapp',
            'to'                => $to,
            'type'              => 'text',
            'text'              => [
                'body' => "✅ Test message from Life Transport System!\n\nYour WhatsApp API is working correctly.\n\n🚚 Powered by ssquareg.com"
            ],
        ]);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            "Authorization: Bearer {$token}",
        ]);
        // SSL + timeout settings for shared hosting servers
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

        $response  = curl_exec($ch);
        $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);   // capture exact error if code is 0
        $curlErrNo = curl_errno($ch);
        curl_close($ch);

        $decoded = json_decode($response, true);

        return response()->json([
            'success'        => $httpCode === 200,
            'http_code'      => $httpCode,
            'sent_to'        => $to,
            'meta_response'  => $decoded,
            // diagnostic fields — visible only when something goes wrong
            'curl_error'     => $curlError  ?: null,
            'curl_errno'     => $curlErrNo  ?: null,
            'raw_response'   => $response   ?: null,
        ]);
    })->name('whatsapp.test-send');

});
