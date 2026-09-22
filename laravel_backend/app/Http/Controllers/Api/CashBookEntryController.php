<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashBookEntry;
use App\Models\AuditLog;
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

        // Date Filter (ALWAYS apply if present)
        if ($request->filled('from_date') && $request->filled('to_date')) {
            $query->whereBetween('transaction_date', [$request->from_date, $request->to_date]);
        } elseif ($request->filled('date')) {
            $query->where('transaction_date', $request->date);
        }

        // Branch Filter
        if ($request->filled('branch_id')) {
            if ($request->branch_id !== 'All Branches' && $request->branch_id !== 'All') {
                $query->where('branch_id', $request->branch_id);
            }
        }

        // Search Filter (applied within the date range)
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('remarks', 'like', "%$search%")
                  ->orWhere('voucher_no', 'like', "%$search%")
                  ->orWhereHas('accountHead', function($qh) use ($search) {
                      $qh->where('name', 'like', "%$search%");
                  });
            });
        }

        // Grand Totals for the entire filtered query
        $totalCredits = (clone $query)->where('transaction_type', 'CREDIT')->where('is_closing_entry', false)->sum('amount');
        $totalDebits = (clone $query)->where('transaction_type', 'DEBIT')->where('is_closing_entry', false)->sum('amount');

        // Pagination
        $perPage = $request->get('per_page', 1000000); // Default to a large number to preserve backwards compatibility for reports if they don't pass per_page
        $page = $request->get('page', 1);
        $paginator = $query->orderBy('transaction_date', 'asc')->orderBy('id', 'asc')->paginate($perPage);
        $entries = $paginator->items();

        // Calculate running balance offset (balance from previous pages in this query)
        $previousBalance = 0;
        $offset = ($page - 1) * $perPage;
        if ($offset > 0) {
            $subQuery = clone $query;
            $subQuery->orderBy('transaction_date', 'asc')->orderBy('id', 'asc')
                     ->select('amount', 'transaction_type')->limit($offset);
            
            $previousBalance = \DB::table(\DB::raw("({$subQuery->toSql()}) as sub"))
                ->mergeBindings($subQuery->getQuery())
                ->selectRaw("SUM(CASE WHEN transaction_type = 'CREDIT' THEN amount ELSE -amount END) as balance")
                ->value('balance') ?? 0;
        }

        // Calculate running balance per row
        $currentBalance = $previousBalance;
        foreach ($entries as $entry) {
            if ($entry->transaction_type === 'CREDIT') {
                $currentBalance += $entry->amount;
            } else {
                $currentBalance -= $entry->amount;
            }
            $entry->running_balance = $currentBalance;
        }

        return response()->json([
            'success' => true,
            'data' => $entries, // return entries directly in data to avoid breaking reports temporarily if they don't expect pagination structure, wait!
            // To properly support pagination without breaking older endpoints that just expect an array:
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'totals' => [
                'credit' => $totalCredits,
                'debit' => $totalDebits,
                'balance' => $totalCredits - $totalDebits
            ],
            'previous_balance' => $previousBalance
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'voucher_no' => 'required|unique:cash_book_entries,voucher_no',
            'transaction_date' => 'required|date|before_or_equal:today',
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

        // Audit logging
        AuditLog::record($entry, 'CREATE', null, $entry->toArray(), $entry->voucher_no, "Manual Cash Book Entry");

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
            'transaction_date' => 'sometimes|required|date|before_or_equal:today',
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

        // Keep old values for comparison
        $oldValues = $entry->only(array_keys($request->all()));
        
        $entry->update($request->all());

        // Audit logging
        $newValues = $entry->only(array_keys($request->all()));
        $changes = array_diff_assoc($newValues, $oldValues);
        
        if (!empty($changes)) {
            AuditLog::record($entry, 'UPDATE', $oldValues, $newValues, $entry->voucher_no, "Entry updated");
        }

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

        $oldData = $entry->toArray();
        $voucherNo = $entry->voucher_no;
        $entry->delete();

        // Audit logging
        AuditLog::record((new \App\Models\CashBookEntry), 'DELETE', $oldData, null, $voucherNo, "Entry deleted");

        return response()->json([
            'success' => true,
            'message' => 'Entry deleted successfully'
        ]);
    }

    public function getReport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'from_date' => 'required|date',
            'to_date' => 'required|date',
            'branch_id' => 'nullable|exists:branches,id',
            'transaction_type' => 'nullable|in:CREDIT,DEBIT'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $query = CashBookEntry::with(['accountHead', 'branch'])
            ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
            ->orderBy('transaction_date', 'asc');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('transaction_type')) {
            $query->where('transaction_type', $request->transaction_type);
        }

        $entries = $query->get();

        // Aggregate by account head
        $reportData = $entries->groupBy('account_head_id')->map(function ($group) {
            $first = $group->first();
            return [
                'account_head_name' => $first->accountHead->name ?? 'Unknown',
                'transaction_type' => $first->transaction_type,
                'total_amount' => $group->sum('amount'),
                'count' => $group->count()
            ];
        })->values();

        $totals = [
            'total_credit' => $entries->where('transaction_type', 'CREDIT')->sum('amount'),
            'total_debit' => $entries->where('transaction_type', 'DEBIT')->sum('amount'),
            'net_balance' => $entries->where('transaction_type', 'CREDIT')->sum('amount') - $entries->where('transaction_type', 'DEBIT')->sum('amount')
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'report' => $reportData,
                'totals' => $totals,
                'entries' => $entries
            ]
        ]);
    }

    public function getHeadwiseReport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'from_date' => 'required|date',
            'to_date' => 'required|date',
            'account_head_id' => 'nullable|exists:account_heads,id',
            'branch_id' => 'nullable|exists:branches,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $query = CashBookEntry::with(['accountHead', 'branch'])
            ->whereBetween('transaction_date', [$request->from_date, $request->to_date]);

        if ($request->filled('account_head_id') && $request->account_head_id !== 'All') {
            $query->where('account_head_id', $request->account_head_id);
        }

        if ($request->filled('branch_id') && $request->branch_id !== 'All Branches') {
            $query->where('branch_id', $request->branch_id);
        }

        $entries = $query->orderBy('transaction_date', 'asc')->get();

        // Aggregation by Head
        $headAggregated = $entries->groupBy('account_head_id')->map(function ($group) {
            $first = $group->first();
            return [
                'head_id' => $first->account_head_id,
                'head_name' => $first->accountHead->name ?? 'Unknown',
                'transaction_type' => $first->transaction_type,
                'total_amount' => $group->sum('amount'),
                'entry_count' => $group->count()
            ];
        })->values();

        // Daily Trend for Graph
        $dailySummary = $entries->groupBy('transaction_date')->map(function ($group, $date) {
            return [
                'date' => $date,
                'credit' => $group->where('transaction_type', 'CREDIT')->sum('amount'),
                'debit' => $group->where('transaction_type', 'DEBIT')->sum('amount')
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'entries' => $entries,
                'head_aggregated' => $headAggregated,
                'daily_summary' => $dailySummary,
                'totals' => [
                    'credit' => $entries->where('transaction_type', 'CREDIT')->sum('amount'),
                    'debit' => $entries->where('transaction_type', 'DEBIT')->sum('amount'),
                    'balance' => $entries->where('transaction_type', 'CREDIT')->sum('amount') - $entries->where('transaction_type', 'DEBIT')->sum('amount')
                ]
            ]
        ]);
    }
}
