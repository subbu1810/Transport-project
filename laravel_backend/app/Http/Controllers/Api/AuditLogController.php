<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = \App\Models\AuditLog::with(['user', 'branch']);

        // Role-based filtering: Admins only see their branch
        if ($request->header('X-User-Role') === 'admin' || $request->input('logged_role') === 'admin') {
            $branchId = $request->header('X-Branch-Id') ?? $request->input('logged_branch_id');
            if ($branchId) {
                $query->where('branch_id', $branchId);
            }
        }

        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Specific branch filter (only applies if superadmin or matching admin branch)
        if ($request->has('branch_id') && $request->branch_id !== 'All Branches') {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('gc_number')) {
            $query->where('gc_number', 'like', '%' . $request->gc_number . '%');
        }

        $logs = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
