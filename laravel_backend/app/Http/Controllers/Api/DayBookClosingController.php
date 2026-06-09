<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DayBookClosing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DayBookClosingController extends Controller
{
    /**
     * Fetch the opening balance for a specific branch and date
     */
    public function getOpeningBalance(Request $request)
    {
        $branchId = $request->query('branch_id');
        $date = $request->query('date');

        if (!$branchId || !$date) {
            return response()->json([
                'success' => false, 
                'message' => 'branch_id and date are required parameters'
            ], 400);
        }

        // 1. Find the latest closing balance prior to the selected date
        $lastClosing = DayBookClosing::where('branch_id', $branchId)
            ->where('closing_date', '<', $date)
            ->orderBy('closing_date', 'desc')
            ->first();

        $baseBalance = $lastClosing ? (float)$lastClosing->closing_balance : 0;
        $lastClosingDate = $lastClosing ? $lastClosing->closing_date : '1900-01-01';

        // 2. Find any unclosed entries between the last formal closing and the requested date
        // Note: transaction_date is inclusive of the requested date if we were looking for daily, 
        // but for OPENING balance we only want transactions < date.
        $unclosedEntries = \App\Models\CashBookEntry::where('branch_id', $branchId)
            ->where('transaction_date', '>', $lastClosingDate)
            ->where('transaction_date', '<', $date)
            ->get();

        $receiptsTotal = $unclosedEntries->where('transaction_type', 'CREDIT')->sum('amount');
        $paymentsTotal = $unclosedEntries->where('transaction_type', 'DEBIT')->sum('amount');

        $openingBalance = $baseBalance + ($receiptsTotal - $paymentsTotal);

        return response()->json([
            'success' => true,
            'data' => [
                'opening_balance' => (float)$openingBalance,
                'last_closing_date' => $lastClosing ? $lastClosing->closing_date : null,
                'additional_receipts' => (float)$receiptsTotal,
                'additional_payments' => (float)$paymentsTotal
            ]
        ]);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = DayBookClosing::with('branch');

        if ($request->has('from_date') && $request->has('to_date')) {
            $query->whereBetween('closing_date', [$request->from_date, $request->to_date]);
        }

        if ($request->has('branch_id') && $request->branch_id != 'All Branches') {
            $query->where('branch_id', $request->branch_id);
        }

        $closings = $query->orderBy('closing_date', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $closings
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'closing_date' => 'required|date',
            'branch_id' => 'nullable|exists:branches,id',
            'opening_balance' => 'required|numeric',
            'credit_total' => 'required|numeric',
            'debit_total' => 'required|numeric',
            'closing_balance' => 'required|numeric',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()
            ], 400);
        }

        // Use updateOrCreate to avoid duplicates for the same day/branch
        $closing = DayBookClosing::updateOrCreate(
            ['branch_id' => $request->branch_id, 'closing_date' => $request->closing_date],
            $request->all()
        );

        return response()->json([
            'success' => true,
            'message' => 'DayBook closed and stored successfully',
            'data' => $closing
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $closing = DayBookClosing::with('branch')->find($id);

        if (!$closing) {
            return response()->json([
                'success' => false,
                'message' => 'Closing record not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $closing
        ]);
    }
}
