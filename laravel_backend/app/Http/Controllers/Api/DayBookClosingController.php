<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DayBookClosing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DayBookClosingController extends Controller
{
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
