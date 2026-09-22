<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Waybill;
use App\Services\EwayBill\EwayBillManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class EwayBillController extends Controller
{
    public function generate(Request $request, $id): JsonResponse
    {
        try {
            $waybill = Waybill::with('originBranch.transport')->findOrFail($id);
            $transportId = $waybill->originBranch->transport_id;

            $provider = EwayBillManager::resolve($transportId);
            
            // Map Waybill data to e-Way bill payload schema
            $payload = [
                'docNo' => $waybill->invoice_no,
                'docDate' => $waybill->bill_date,
                // Add more mapped fields here based on the provider requirements
            ];

            $response = $provider->generate($payload);

            if ($response['success']) {
                $waybill->update(['eway_bill_no' => $response['ewayBillNo']]);
            }

            return response()->json($response);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function cancel(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'cancel_reason_code' => 'required|integer',
            'cancel_remark' => 'required|string',
        ]);

        try {
            $waybill = Waybill::with('originBranch.transport')->findOrFail($id);
            $transportId = $waybill->originBranch->transport_id;

            if (!$waybill->eway_bill_no) {
                return response()->json(['success' => false, 'message' => 'No e-Way Bill attached to this GC.'], 400);
            }

            $provider = EwayBillManager::resolve($transportId);
            $response = $provider->cancel($waybill->eway_bill_no, $validated['cancel_reason_code'], $validated['cancel_remark']);

            return response()->json($response);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
