<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Waybill;
use App\Models\WaybillArticle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class WaybillController extends Controller
{
    /**
     * Display a listing of waybills with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Waybill::with(['originBranch', 'destination', 'consignor', 'consignee', 'articles']);

            // Filter by date range
            if ($request->has('from_date')) {
                $query->whereDate('bill_date', '>=', $request->from_date);
            }
            if ($request->has('to_date')) {
                $query->whereDate('bill_date', '<=', $request->to_date);
            }

            // Filter by branch
            if ($request->has('branch_id')) {
                $query->where('origin_branch_id', $request->branch_id);
            }

            // Filter by destination branch (Inward)
            if ($request->has('destination_branch_id')) {
                $destBranchId = $request->destination_branch_id;
                $query->where(function($q) use ($destBranchId) {
                    $q->where('destination_id', $destBranchId)
                      ->orWhereHas('destination.branchMappings', function($bq) use ($destBranchId) {
                          $bq->where('branch_id', $destBranchId);
                      });
                });
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Filter by consignor
            if ($request->has('consignor_id')) {
                $query->where('consignor_id', $request->consignor_id);
            }

            // Filter by account type (freight type)
            if ($request->has('account_type')) {
                $query->where('account_type', $request->account_type);
            }

            $waybills = $query->orderBy('bill_date', 'desc')->get();

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
     * Store a newly created waybill in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'bill_date' => 'required|date',
                'origin_branch_id' => 'required|exists:branches,id',
                'destination_id' => 'required|exists:destinations,id',
                'consignor_id' => 'required|exists:consignors,id',
                'consignee_id' => 'required|exists:consignees,id',
                'article_desc' => 'nullable|string',
                'total_articles' => 'required|integer',
                'freight_amount' => 'required|numeric',
                'dd_charges' => 'required|numeric',
                'handling_charges' => 'required|numeric',
                'stationary_charges' => 'required|numeric',
                'total_amount' => 'required|numeric',
                'invoice_no' => 'nullable|string',
                'declared_value' => 'required|numeric',
                'eway_bill_no' => 'nullable|string',
                'tax_payable_by' => 'nullable|string',
                'account_type' => 'nullable|string',
                'gst_percent' => 'required|numeric',
                'gst_amount' => 'required|numeric',
                'grand_total' => 'required|numeric',
                'roading_clerk' => 'nullable|string',
                'remarks' => 'nullable|string',
                'articles' => 'required|array|min:1',
                'articles.*.article_type' => 'nullable|string',
                'articles.*.no_of_articles' => 'required|integer',
                'articles.*.rate' => 'required|numeric',
                'articles.*.total' => 'required|numeric',
                'articles.*.handling_rate' => 'required|numeric',
                'articles.*.handling_total' => 'required|numeric',
                'articles.*.freight' => 'required|numeric',
                'articles.*.actual_weight' => 'required|numeric',
                'articles.*.charged_weight' => 'required|numeric',
                'articles.*.amount' => 'required|numeric',
            ]);

            // Generate unique GC Number (e.g., GC-2026-0001)
            $lastWaybill = Waybill::orderBy('id', 'desc')->first();
            $nextId = $lastWaybill ? $lastWaybill->id + 1 : 1;
            $gcNumber = 'GC-' . date('Y') . '-' . str_pad($nextId, 5, '0', STR_PAD_LEFT);
            
            $waybill = Waybill::create(array_merge($validated, [
                'gc_number' => $gcNumber,
                'status' => 'PENDING',
                'deliver_status' => 'PENDING',
                'amount_paid' => 0
            ]));

            foreach ($validated['articles'] as $articleData) {
                $waybill->articles()->create($articleData);
            }

            DB::commit();

            // Load relationships for receipt
            $waybill->load(['originBranch', 'destination', 'consignor', 'consignee', 'articles']);

            return response()->json([
                'success' => true,
                'message' => 'Waybill created successfully',
                'data' => $waybill
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create Waybill: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified waybill.
     */
    public function show($id): JsonResponse
    {
        try {
            $waybill = Waybill::with(['originBranch', 'destination', 'consignor', 'consignee', 'articles'])->find($id);

            if (!$waybill) {
                return response()->json([
                    'success' => false,
                    'message' => 'Waybill not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $waybill
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search waybill by GC number.
     */
    public function searchByGcNumber($gcNumber): JsonResponse
    {
        try {
            $waybill = Waybill::with(['originBranch', 'destination', 'consignor', 'consignee', 'articles'])
                ->where('gc_number', $gcNumber)
                ->first();

            if (!$waybill) {
                return response()->json([
                    'success' => false,
                    'message' => 'Waybill not found with GC Number: ' . $gcNumber
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $waybill
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified waybill.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $waybill = Waybill::find($id);
            if (!$waybill) {
                return response()->json([
                    'success' => false,
                    'message' => 'Waybill not found'
                ], 404);
            }

            $validated = $request->validate([
                'bill_date' => 'nullable|date',
                'origin_branch_id' => 'nullable|exists:branches,id',
                'destination_id' => 'nullable|exists:destinations,id',
                'consignor_id' => 'nullable|exists:consignors,id',
                'consignee_id' => 'nullable|exists:consignees,id',
                'article_desc' => 'nullable|string',
                'total_articles' => 'nullable|integer',
                'freight_amount' => 'nullable|numeric',
                'dd_charges' => 'nullable|numeric',
                'handling_charges' => 'nullable|numeric',
                'stationary_charges' => 'nullable|numeric',
                'total_amount' => 'nullable|numeric',
                'invoice_no' => 'nullable|string',
                'declared_value' => 'nullable|numeric',
                'eway_bill_no' => 'nullable|string',
                'tax_payable_by' => 'nullable|string',
                'account_type' => 'nullable|string',
                'gst_percent' => 'nullable|numeric',
                'gst_amount' => 'nullable|numeric',
                'grand_total' => 'nullable|numeric',
                'roading_clerk' => 'nullable|string',
                'remarks' => 'nullable|string',
                'articles' => 'nullable|array',
                'articles.*.id' => 'nullable|exists:waybill_articles,id',
                'articles.*.article_type' => 'nullable|string',
                'articles.*.no_of_articles' => 'nullable|integer',
                'articles.*.rate' => 'nullable|numeric',
                'articles.*.total' => 'nullable|numeric',
                'articles.*.handling_rate' => 'nullable|numeric',
                'articles.*.handling_total' => 'nullable|numeric',
                'articles.*.freight' => 'nullable|numeric',
                'articles.*.actual_weight' => 'nullable|numeric',
                'articles.*.charged_weight' => 'nullable|numeric',
                'articles.*.amount' => 'nullable|numeric',
            ]);

            // Update waybill
            $waybill->update($validated);

            // Update articles if provided
            if (isset($validated['articles'])) {
                foreach ($validated['articles'] as $articleData) {
                    if (isset($articleData['id'])) {
                        // Update existing article
                        $article = WaybillArticle::find($articleData['id']);
                        if ($article && $article->waybill_id == $waybill->id) {
                            $article->update($articleData);
                        }
                    } else {
                        // Create new article
                        $waybill->articles()->create($articleData);
                    }
                }
            }

            DB::commit();

            $waybill->load(['originBranch', 'destination', 'consignor', 'consignee', 'articles']);

            return response()->json([
                'success' => true,
                'message' => 'Waybill updated successfully',
                'data' => $waybill
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update Waybill: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get waybills awaiting acknowledgment for a branch.
     */
    public function getAwaitingAck($branchCode): JsonResponse
    {
        try {
            // Find the branch by code
            $branch = \App\Models\Branch::where('branch_code', $branchCode)->first();
            if (!$branch) {
                 return response()->json([
                    'success' => false,
                    'message' => 'Branch not found'
                ], 404);
            }

            // GCs booked at this branch that are:
            // 1. Marked as DELIVERED
            // 2. OR Booked for a destination that belongs to this same branch (Same-branch delivery)
            $waybills = Waybill::with(['originBranch', 'destination', 'consignor', 'consignee', 'articles'])
                ->where('origin_branch_id', $branch->id)
                ->where(function($query) use ($branch) {
                    $query->where('status', 'DELIVERED')
                          ->orWhere(function($sq) use ($branch) {
                              $sq->where('status', 'PENDING')
                                 ->whereHas('destination.branchMappings', function($bq) use ($branch) {
                                     $bq->where('branch_id', $branch->id);
                                 });
                          });
                })
                ->get();

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
     * Submit acknowledgment for a waybill.
     */
    public function submitAck(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'gc_number' => 'required|string',
                'remarks' => 'nullable|string',
                'branch_id' => 'nullable|exists:branches,id'
            ]);

            $waybill = Waybill::where('gc_number', $validated['gc_number'])->first();
            
            if (!$waybill) {
                return response()->json([
                    'success' => false,
                    'message' => 'Waybill not found'
                ], 404);
            }

            // Update status to DELIVERED and set delivered_branch_id
            // If branch_id is provided, use it. Otherwise use the waybill's origin_branch_id
            $waybill->update([
                'status' => 'DELIVERED',
                'deliver_status' => 'DELIVERED',
                'delivered_branch_id' => $validated['branch_id'] ?? $waybill->origin_branch_id,
                'remarks' => $validated['remarks'] ?? $waybill->remarks
            ]);

            return response()->json([
                'success' => true,
                'message' => 'GC marked as DELIVERED and acknowledgment received',
                'data' => $waybill
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process bulk inward of waybills at a branch.
     */
    public function bulkInward(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'waybill_ids' => 'required|array|min:1',
                'waybill_ids.*' => 'exists:waybills,id',
                'received_branch_id' => 'required|exists:branches,id',
                'received_date' => 'required|date',
                'remarks' => 'nullable|string',
            ]);

            DB::beginTransaction();

            $updatedCount = Waybill::whereIn('id', $validated['waybill_ids'])
                ->update([
                    'status' => 'RECEIVED',
                    'remarks' => $validated['remarks'] ?? DB::raw('remarks')
                ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully inwarded $updatedCount waybill(s)",
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to process inward: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Update delivery status for a waybill.
     */
    public function updateDeliveryStatus(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'gc_number' => 'required|string',
                'status' => 'required|string',
                'remarks' => 'nullable|string',
                'receiver_name' => 'nullable|string',
                'delivery_proof' => 'required', // Bypassing fileinfo dependency
            ]);





            $waybill = Waybill::where('gc_number', $validated['gc_number'])->first();

            if (!$waybill) {
                return response()->json([
                    'success' => false,
                    'message' => 'Waybill not found'
                ], 404);
            }

            // Handle file upload
            if ($request->hasFile('delivery_proof')) {
                $file = $request->file('delivery_proof');
                $filename = time() . '_' . $file->getClientOriginalName();
                
                // Use move() instead of storeAs() to bypass finfo dependency
                $file->move(storage_path('app/public/delivery_proofs'), $filename);
                
                $waybill->delivery_proof = 'delivery_proofs/' . $filename;
            }


            $waybill->status = $validated['status'];
            if (isset($validated['remarks'])) {
                $waybill->remarks = $validated['remarks'];
            }
            if (isset($validated['receiver_name'])) {
                $waybill->receiver_name = $validated['receiver_name'];
            }

            
            // If Delivered, update deliver_status and delivery details
            if ($validated['status'] === 'Delivered') {
                $waybill->deliver_status = 'DELIVERED';
                $waybill->delivered_at = now();
                
                if ($request->has('delivered_branch_id')) {
                    $waybill->delivered_branch_id = $request->delivered_branch_id;
                }
                
                if ($request->has('delivered_branch_name')) {
                    $waybill->delivered_branch_name = $request->delivered_branch_name;
                }
            }

            $waybill->save();

            $waybill->load(['originBranch', 'destination', 'consignor', 'consignee', 'articles']);

            return response()->json([

                'success' => true,
                'message' => 'Delivery status updated successfully',
                'data' => $waybill
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update delivery: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getDeliveryStatusReport(Request $request): JsonResponse
    {
        try {
            $query = Waybill::with(['consignee', 'destination', 'originBranch']);

            // Handle Report Type
            $type = $request->get('report_type', 'delivered');
            if ($type === 'delivered') {
                $query->where('status', 'Delivered');
            } elseif ($type === 'undelivered') {
                $query->whereNotIn('status', ['Delivered', 'RTO (Return to Origin)']);
            } elseif ($type === 'rto') {
                $query->where('status', 'RTO (Return to Origin)');
            }

            if ($request->filled('from_date')) {
                $query->whereDate('bill_date', '>=', $request->from_date);
            }

            if ($request->filled('to_date')) {
                $query->whereDate('bill_date', '<=', $request->to_date);
            }

            if ($request->filled('branch_id') && $request->branch_id !== 'All Branches') {
                $query->where('origin_branch_id', $request->branch_id);
            }

            $reports = $query->orderBy('bill_date', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $reports
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch report: ' . $e->getMessage()
            ], 500);
        }
    }
}

