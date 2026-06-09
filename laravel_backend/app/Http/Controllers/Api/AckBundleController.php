<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AckBundle;
use App\Models\Waybill;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class AckBundleController extends Controller
{
    /**
     * Get waybills awaiting bundling for a specific branch.
     * These are GCs that are marked as DELIVERED but not yet in an ACK Bundle.
     */
    public function getAwaitingBundle(Request $request): JsonResponse
    {
        try {
            $branchId = $request->branch_id;
            $fromDate = $request->from_date;
            $toDate = $request->to_date;

            $query = Waybill::with(['destination', 'consignor', 'consignee', 'articles'])
                ->where(function($q) {
                    $q->where('status', 'DELIVERED')
                      ->orWhere('status', 'delivered')
                      ->orWhere('deliver_status', 'DELIVERED')
                      ->orWhere('deliver_status', 'delivered')
                      ->orWhere('deliver_status', 'ACK_RECEIVED')
                      ->orWhere('deliver_status', 'ack_received');
                })
                ->whereNull('ack_bundle_id');

            if ($branchId && $branchId !== '' && $branchId !== 'All Branches') {
                $query->whereNested(function($q) use ($branchId) {
                    $q->where('delivered_branch_id', $branchId)
                      ->orWhere('origin_branch_id', $branchId)
                      ->orWhere('inward_branch_id', $branchId);
                });
            }

            if ($fromDate && $fromDate !== '') {
                $query->whereDate('bill_date', '>=', $fromDate);
            }

            if ($toDate && $toDate !== '') {
                $query->whereDate('bill_date', '<=', $toDate);
            }

            $waybills = $query->get();

            // Separate topay GCs that have pending payment — flag them but still return them so frontend can show warning
            $waybills = $waybills->map(function ($wb) {
                $isPendingPayment = $wb->account_type === 'topay'
                    && (float) $wb->amount_paid < (float) $wb->grand_total - 0.01;
                $wb->payment_pending = $isPendingPayment;
                return $wb;
            });

            return response()->json([
                'success' => true,
                'data' => $waybills
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new ACK Bundle and link waybills to it.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'branch_id' => 'required|exists:branches,id',
                'bundle_date' => 'required|date',
                'created_by' => 'required|exists:admins,id',
                'waybill_ids' => 'required|array|min:1',
                'remarks' => 'nullable|string'
            ]);

            DB::beginTransaction();

            // Generate Sequential Bundle Number: ACK1, ACK2, etc.
            $lastBundle = AckBundle::orderBy('id', 'desc')->first();
            $nextId = $lastBundle ? ($lastBundle->id + 1) : 1;
            $bundleNumber = 'ACK' . $nextId;

            $bundle = AckBundle::create([
                'bundle_number' => $bundleNumber,
                'branch_id' => $request->branch_id,
                'bundle_date' => $request->bundle_date,
                'created_by' => $request->created_by,
                'status' => 'CREATED',
                'remarks' => $request->remarks
            ]);

            // Safety check: reject any topay GC that still has unpaid balance
            $blockedGcs = Waybill::whereIn('id', $request->waybill_ids)
                ->where('account_type', 'topay')
                ->whereRaw('COALESCE(amount_paid, 0) < (grand_total - 0.01)')
                ->pluck('gc_number');

            if ($blockedGcs->isNotEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment pending for ToPay GC(s): ' . $blockedGcs->implode(', ') . '. Please collect payment before preparing ACK bundle.'
                ], 422);
            }

            // Link waybills to this bundle
            Waybill::whereIn('id', $request->waybill_ids)
                ->update(['ack_bundle_id' => $bundle->id]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'ACK Bundle generated successfully!',
                'data' => $bundle->load('waybills')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * List all ACK Bundles.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = AckBundle::with(['branch', 'creator'])->withCount('waybills');

            if ($request->branch_id) {
                $query->where('branch_id', $request->branch_id);
            }

            $bundles = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $bundles
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get details of a specific bundle.
     */
    public function show($id): JsonResponse
    {
        try {
            $bundle = AckBundle::with(['branch', 'creator', 'waybills.destination', 'waybills.consignor', 'waybills.consignee', 'waybills.articles'])->find($id);

            if (!$bundle) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bundle not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $bundle
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Search for a bundle by its bundle number.
     */
    public function searchByBundleNumber(Request $request): JsonResponse
    {
        try {
            $bundleNumber = $request->bundle_number;
            
            if (!$bundleNumber) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bundle number is required'
                ], 400);
            }

            $bundle = AckBundle::with(['branch', 'creator', 'waybills.destination', 'waybills.consignor', 'waybills.consignee', 'waybills.articles'])
                ->where('bundle_number', $bundleNumber)
                ->first();

            if (!$bundle) {
                return response()->json([
                    'success' => false,
                    'message' => 'No bundle found with this ID'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $bundle
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
