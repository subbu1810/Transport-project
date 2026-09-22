<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EwayBillConfiguration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EwayBillConfigController extends Controller
{
    public function show(int $transportId): JsonResponse
    {
        $config = EwayBillConfiguration::where('transport_id', $transportId)->first();
        
        if (!$config) {
            return response()->json(['success' => true, 'data' => null]);
        }

        // Hide credentials when sending to frontend
        $config->makeHidden(['credentials']);

        return response()->json(['success' => true, 'data' => $config]);
    }

    public function storeOrUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'transport_id' => 'required|exists:transports,id',
            'provider' => 'required|string|in:masters_india,cleartax',
            'credentials' => 'required|array',
            'is_active' => 'boolean'
        ]);

        $config = EwayBillConfiguration::updateOrCreate(
            ['transport_id' => $validated['transport_id']],
            [
                'provider' => $validated['provider'],
                'credentials' => $validated['credentials'],
                'is_active' => $validated['is_active'] ?? true,
            ]
        );

        return response()->json([
            'success' => true, 
            'message' => 'e-Way Bill Configuration saved successfully.'
        ]);
    }
}
