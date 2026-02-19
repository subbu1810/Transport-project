<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashBookEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CashBookEntryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = CashBookEntry::with(['accountHead', 'branch']);

        if ($request->has('date')) {
            $query->where('transaction_date', $request->date);
        }

        if ($request->has('branch_id') && $request->branch_id != 'All Branches') {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('remarks', 'like', "%$search%")
                  ->orWhereHas('accountHead', function($qh) use ($search) {
                      $qh->where('name', 'like', "%$search%");
                  });
            });
        }

        $entries = $query->orderBy('transaction_date', 'asc')->orderBy('id', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $entries
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'voucher_no' => 'required|unique:cash_book_entries,voucher_no',
            'transaction_date' => 'required|date',
            'transaction_type' => 'required|in:CREDIT,DEBIT',
            'account_head_id' => 'required|exists:account_heads,id',
            'amount' => 'required|numeric|min:0',
            'branch_id' => 'nullable|exists:branches,id',
            'mode_of_pay' => 'required|string',
            'is_closing_entry' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()
            ], 400);
        }

        $entry = CashBookEntry::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Cash book entry created successfully',
            'data' => $entry->load(['accountHead', 'branch'])
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $entry = CashBookEntry::with(['accountHead', 'branch'])->find($id);

        if (!$entry) {
            return response()->json([
                'success' => false,
                'message' => 'Entry not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $entry
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $entry = CashBookEntry::find($id);

        if (!$entry) {
            return response()->json([
                'success' => false,
                'message' => 'Entry not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'voucher_no' => 'sometimes|required|unique:cash_book_entries,voucher_no,' . $id,
            'transaction_date' => 'sometimes|required|date',
            'transaction_type' => 'sometimes|required|in:CREDIT,DEBIT',
            'account_head_id' => 'sometimes|required|exists:account_heads,id',
            'amount' => 'sometimes|required|numeric|min:0',
            'branch_id' => 'nullable|exists:branches,id',
            'mode_of_pay' => 'sometimes|required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()
            ], 400);
        }

        $entry->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Entry updated successfully',
            'data' => $entry->load(['accountHead', 'branch'])
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $entry = CashBookEntry::find($id);

        if (!$entry) {
            return response()->json([
                'success' => false,
                'message' => 'Entry not found'
            ], 404);
        }

        $entry->delete();

        return response()->json([
            'success' => true,
            'message' => 'Entry deleted successfully'
        ]);
    }
}
