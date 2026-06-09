<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConsignorReceipt;
use App\Models\ConsignorReceiptWaybill;
use App\Models\Waybill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ConsignorReceiptController extends Controller
{
    public function generateReceipt(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'branch_id' => 'required|exists:branches,id',
            'consignor_id' => 'required|exists:consignors,id',
            'transaction_date' => 'required|date',
            'waybills' => 'required|array|min:1',
            'waybills.*.id' => 'required|exists:waybills,id',
            'waybills.*.amount' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Generate receipt number e.g. CR-2026-0001
            $year = date('Y', strtotime($request->transaction_date));
            $count = ConsignorReceipt::whereYear('transaction_date', $year)->count();
            $receiptNo = 'CR-' . $year . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

            // Calculate total amount
            $totalAmount = 0;
            foreach ($request->waybills as $wb) {
                $totalAmount += $wb['amount'];
            }

            // Create receipt
            $receipt = ConsignorReceipt::create([
                'receipt_no' => $receiptNo,
                'branch_id' => $request->branch_id,
                'consignor_id' => $request->consignor_id,
                'transaction_date' => $request->transaction_date,
                'total_amount' => $totalAmount,
                'created_by' => $request->user()->id ?? null,
            ]);

            // Add waybills to receipt
            foreach ($request->waybills as $wb) {
                ConsignorReceiptWaybill::create([
                    'consignor_receipt_id' => $receipt->id,
                    'waybill_id' => $wb['id'],
                    'amount' => $wb['amount'],
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Consignor Receipt generated successfully',
                'data' => [
                    'receipt_no' => $receiptNo,
                    'receipt_id' => $receipt->id
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate receipt: ' . $e->getMessage()
            ], 500);
        }
    }

    public function index(Request $request)
    {
        try {
            $query = ConsignorReceipt::with(['consignor', 'branch']);

            if ($request->has('branch_id')) {
                $query->where('branch_id', $request->branch_id);
            }

            if ($request->has('consignor_id')) {
                $query->where('consignor_id', $request->consignor_id);
            }

            if ($request->has('pending_only')) {
                $query->whereHas('waybills', function($q) {
                    $q->whereRaw("grand_total > (COALESCE(amount_paid, 0) + 0.1) OR account_type = 'paid'");
                });
            }

            $receipts = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $receipts
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch receipts: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($receiptNo)
    {
        try {
            $receipt = ConsignorReceipt::with([
                'branch',
                'consignor',
                'creator',
                'waybills.originBranch',
                'waybills.destination',
                'waybills.consignee',
                'waybills.consignor'
            ])
            ->where('receipt_no', $receiptNo)
            ->first();

            if (!$receipt) {
                return response()->json([
                    'success' => false,
                    'message' => 'Consignor Receipt not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $receipt
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch receipt details: ' . $e->getMessage()
            ], 500);
        }
    }
    public function updateReceipt(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'transaction_date' => 'required|date',
            'waybills' => 'required|array|min:1',
            'waybills.*.id' => 'required|exists:waybills,id',
            'waybills.*.amount' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $receipt = ConsignorReceipt::findOrFail($id);
            
            // Check if any payment is already received for this receipt's waybills
            // (Optional: You might want to prevent editing if payment started)

            // Update receipt details
            $totalAmount = 0;
            foreach ($request->waybills as $wb) {
                $totalAmount += $wb['amount'];
            }

            $receipt->update([
                'transaction_date' => $request->transaction_date,
                'total_amount' => $totalAmount,
            ]);

            // Sync waybills: Remove old ones and add new ones
            ConsignorReceiptWaybill::where('consignor_receipt_id', $receipt->id)->delete();

            foreach ($request->waybills as $wb) {
                ConsignorReceiptWaybill::create([
                    'consignor_receipt_id' => $receipt->id,
                    'waybill_id' => $wb['id'],
                    'amount' => $wb['amount'],
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Consignor Receipt updated successfully',
                'data' => $receipt
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update receipt: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteReceipt($id)
    {
        try {
            DB::beginTransaction();
            $receipt = ConsignorReceipt::findOrFail($id);
            
            // Remove associated waybill mappings first
            ConsignorReceiptWaybill::where('consignor_receipt_id', $receipt->id)->delete();
            
            // Delete the receipt record
            $receipt->delete();

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Consignor Receipt deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete receipt: ' . $e->getMessage()
            ], 500);
        }
    }
}
