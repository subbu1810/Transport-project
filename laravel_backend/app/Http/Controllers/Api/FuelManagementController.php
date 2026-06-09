<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FuelToken;
use App\Models\FuelBill;
use App\Models\FuelPayment;
use App\Models\Bunk;
use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\TripSheet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class FuelManagementController extends Controller
{
    // Initialize data for forms
    public function getInitData()
    {
        return response()->json([
            'success' => true,
            'bunks' => Bunk::where('is_active', true)->get(),
            'vehicles' => Vehicle::where('is_active', true)->get(),
            'drivers' => Driver::where('is_active', true)->get(),
            'branches' => DB::table('branches')->select('id', 'branch_name', 'branch_code')->get(),
            'next_token_no' => 'FT-' . str_pad((FuelToken::max('id') ?? 0) + 1, 6, '0', STR_PAD_LEFT)
        ]);
    }

    // --- FUEL TOKENS ---
    public function indexTokens(Request $request)
    {
        $tokens = FuelToken::with(['bunk', 'vehicle', 'driver', 'tripSheet'])
            ->orderBy('id', 'desc')
            ->paginate(15);
            
        return response()->json([
            'success' => true,
            'data' => $tokens
        ]);
    }

    public function storeToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token_date' => 'required|date',
            'bunk_id' => 'required|exists:bunks,id',
            'vehicle_id' => 'required|exists:vehicles,id',
            'driver_id' => 'required|exists:drivers,id',
            'quantity' => 'required|numeric|min:0.01',
            'rate' => 'nullable|numeric',
            'amount' => 'required|numeric',
            'branch_id' => 'required|exists:branches,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $tokenNo = 'FT-' . str_pad((FuelToken::max('id') ?? 0) + 1, 6, '0', STR_PAD_LEFT);

        $token = FuelToken::create(array_merge($request->all(), [
            'token_number' => $tokenNo,
            'status' => 'ISSUED'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Fuel token created successfully',
            'data' => $token->load(['bunk', 'vehicle', 'driver'])
        ]);
    }

    // --- FUEL BILLS ---
    public function indexBills(Request $request)
    {
        $bills = FuelBill::with(['bunk'])
            ->orderBy('id', 'desc')
            ->paginate(15);
            
        return response()->json(['success' => true, 'data' => $bills]);
    }

    public function storeBill(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'bill_number' => 'required|string',
            'bill_date' => 'required|date',
            'bunk_id' => 'required|exists:bunks,id',
            'total_amount' => 'required|numeric',
            'token_ids' => 'required|array',
            'branch_id' => 'required|exists:branches,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $bill = FuelBill::create([
                'bill_number' => $request->bill_number,
                'bill_date' => $request->bill_date,
                'bunk_id' => $request->bunk_id,
                'total_amount' => $request->total_amount,
                'balance_amount' => $request->total_amount,
                'remarks' => $request->remarks,
                'branch_id' => $request->branch_id,
                'status' => 'PENDING'
            ]);

            // Link tokens to this bill
            FuelToken::whereIn('id', $request->token_ids)
                ->update([
                    'fuel_bill_id' => $bill->id,
                    'status' => 'BILLED'
                ]);

            DB::commit();

            return response()->json(['success' => true, 'message' => 'Bill recorded successfully', 'data' => $bill]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // --- FUEL PAYMENTS ---
    public function indexPayments(Request $request)
    {
        $payments = FuelPayment::with(['bunk', 'bill', 'branch'])
            ->orderBy('id', 'desc')
            ->paginate(15);
            
        return response()->json([
            'success' => true,
            'data' => $payments
        ]);
    }

    public function storePayment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'payment_date' => 'required|date',
            'bunk_id' => 'required|exists:bunks,id',
            'amount' => 'required|numeric|min:0.01',
            'mode_of_payment' => 'required|string',
            'branch_id' => 'required|exists:branches,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $paymentNo = 'FP-' . str_pad((FuelPayment::max('id') ?? 0) + 1, 6, '0', STR_PAD_LEFT);

        $payment = FuelPayment::create(array_merge($request->all(), [
            'payment_number' => $paymentNo,
            'created_by' => auth()->id()
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Payment recorded successfully',
            'data' => $payment->load(['bunk'])
        ]);
    }

    // --- REPORTS ---
    public function getBunkLedger(Request $request)
    {
        $bunkId = $request->bunk_id;
        $fromDate = $request->from_date;
        $toDate = $request->to_date;

        if (!$bunkId) {
            return response()->json(['success' => false, 'message' => 'Bunk ID is required'], 400);
        }

        $bunk = Bunk::find($bunkId);
        
        // Calculate Opening Balance based on bills and payments BEFORE fromDate
        $historicBills = FuelBill::where('bunk_id', $bunkId)->where('bill_date', '<', $fromDate)->sum('total_amount');
        $historicPayments = FuelPayment::where('bunk_id', $bunkId)->where('payment_date', '<', $fromDate)->sum('amount');
        $calculatedOpening = ($bunk->opening_balance ?? 0) + $historicBills - $historicPayments;

        // Fetch Bills (as debits/obligations) within range
        $bills = FuelBill::where('bunk_id', $bunkId)
            ->whereBetween('bill_date', [$fromDate, $toDate])
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->bill_date,
                    'type' => 'FUEL BILL',
                    'ref_no' => $item->bill_number,
                    'debit' => $item->total_amount,
                    'credit' => 0,
                    'remarks' => $item->remarks
                ];
            });

        // Fetch Payments (as credits/settlements) within range
        $payments = FuelPayment::where('bunk_id', $bunkId)
            ->whereBetween('payment_date', [$fromDate, $toDate])
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->payment_date,
                    'type' => 'SETTLEMENT',
                    'ref_no' => $item->payment_number,
                    'debit' => 0,
                    'credit' => $item->amount,
                    'remarks' => $item->mode_of_payment . ($item->reference_no ? ' (' . $item->reference_no . ')' : '')
                ];
            });

        $ledger = $bills->concat($payments)->sortBy('date')->values();
        
        // Calculate running balance
        $currentBalance = $calculatedOpening;
        $ledgerWithBalance = $ledger->map(function($row) use (&$currentBalance) {
            $currentBalance += ($row['debit'] - $row['credit']);
            $row['balance'] = $currentBalance;
            return $row;
        });

        return response()->json([
            'success' => true,
            'bunk' => $bunk,
            'opening_balance' => $calculatedOpening,
            'ledger' => $ledgerWithBalance,
            'closing_balance' => $currentBalance
        ]);
    }
}
