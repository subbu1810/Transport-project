<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Waybill;
use App\Models\WaybillArticle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use App\Models\CashBookEntry;
use App\Models\AccountHead;
use App\Models\AuditLog;
use App\Models\WaybillPayment;

class WaybillController extends Controller
{
    /**
     * Get all reference lists for the Waybill creation screen in one call.
     * This avoids throwing 10 concurrent requests from the frontend at once,
     * which slows down local/dev environments significantly.
     */
    public function initData(): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => [
                    'branches' => \App\Models\Branch::all(),
                    'destinations' => \App\Models\Destination::all(),
                    'consignors' => \App\Models\Consignor::all(),
                    'consignees' => \App\Models\Consignee::all(),
                    'lookups' => \App\Models\Lookup::where('type', 'ARTICLE_TYPE')->where('is_active', true)->get(),
                    'rates' => \App\Models\Rate::where('is_active', true)->get(),
                    'settings' => \App\Models\Setting::whereIn('key', [
                        'logo_path',
                        'upi_id',
                        'upi_account_holder',
                        'upi_qr_path',
                        'gst_number'
                    ])->pluck('value', 'key'),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Display a listing of waybills with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $relations = [
                'originBranch',
                'destination.branchMappings',
                'destination.taluk',
                'consignor',
                'consignee',
                'inwardBranch',
                'articles'
            ];

            // Only load heavy relations if explicitly requested
            if ($request->has('full_data') && $request->full_data == '1') {
                $relations[] = 'auditLogs.user';
            }

            $query = Waybill::with($relations);

            // Filter by date range
            if ($request->filled('from_date')) {
                $query->whereDate('bill_date', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('bill_date', '<=', $request->to_date);
            }

            // Filter by branch
            if ($request->filled('branch_id')) {
                $query->where('origin_branch_id', $request->branch_id);
            }

            // Filter for GCs available at a specific branch (either booked there or inwarded there)
            if ($request->has('available_at_branch')) {
                $branchId = $request->available_at_branch;
                $query->where(function (\Illuminate\Database\Eloquent\Builder $q) use ($branchId) {
                    $q->where(function (\Illuminate\Database\Eloquent\Builder $q2) use ($branchId) {
                        $q2->where('origin_branch_id', $branchId)
                            ->whereIn('status', ['PENDING', 'Booked', 'INWARDED']);
                    })->orWhere(function (\Illuminate\Database\Eloquent\Builder $q2) use ($branchId) {
                        $q2->where('inward_branch_id', $branchId)
                            ->whereIn('status', ['RECEIVED', 'INWARDED']);
                    });
                });
            }

            // Filter by destination branch (Inward)
            if ($request->has('destination_branch_id')) {
                $destBranchId = $request->destination_branch_id;
                $query->where(function (\Illuminate\Database\Eloquent\Builder $q) use ($destBranchId) {
                    $q->where('destination_id', $destBranchId)
                        ->orWhereHas('destination.branchMappings', function ($bq) use ($destBranchId) {
                            $bq->where('branch_id', $destBranchId);
                        });
                });
            }

            // Filter by destination taluk (Magic Inward)
            if ($request->has('destination_taluk')) {
                $talukName = $request->destination_taluk;
                $query->whereHas('destination.taluk', function ($q) use ($talukName) {
                    $q->where('name', $talukName);
                });
            }

            // Filter by status (supports comma-separated list)
            if ($request->has('status')) {
                $statuses = explode(',', $request->status);
                if (count($statuses) > 1) {
                    $query->whereIn('status', $statuses);
                } else {
                    $query->where('status', $request->status);
                }
            }

            // Filter by consignor
            if ($request->has('consignor_id')) {
                $query->where('consignor_id', $request->consignor_id);
            }

            // Filter by account type (freight type)
            if ($request->has('account_type')) {
                $query->where('account_type', $request->account_type);
            }

            // Filter by invoice number
            if ($request->has('invoice_no')) {
                $query->where('invoice_no', $request->invoice_no);
            }

            // Exclude waybills that are already bundled in a Consignor Receipt
            if ($request->has('exclude_receipted') && $request->exclude_receipted == '1') {
                $query->whereNotIn('id', function ($q) {
                    $q->select('waybill_id')
                        ->from('consignor_receipt_waybills');
                });
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
                'eway_bill_no' => $request->declared_value > 49999 ? 'required|string' : 'nullable|string',
                'tax_payable_by' => 'nullable|string',
                'account_type' => 'nullable|string',
                'gst_percent' => 'required|numeric',
                'gst_amount' => 'required|numeric',
                'grand_total' => 'required|numeric',
                'remarks' => 'nullable|string',
                'created_by' => 'nullable|integer',
                'booking_clerk' => 'nullable|string',
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
                'articles.*.dd_rate' => 'required|numeric',
                'articles.*.dd_total' => 'required|numeric',
                'articles.*.amount' => 'required|numeric',
            ], [
                'eway_bill_no.required' => 'E-Way Bill No. is mandatory when declared value exceeds ₹49,999.'
            ]);

            // Unique Invoice Number per Consignor Validation
            if ($request->filled('invoice_no')) {
                $duplicate = Waybill::where('consignor_id', $validated['consignor_id'])
                    ->where('invoice_no', $validated['invoice_no'])
                    ->exists();

                if ($duplicate) {
                    return response()->json([
                        'success' => false,
                        'message' => "Duplicate Entry: Invoice No '{$validated['invoice_no']}' already recorded for this consignor."
                    ], 422);
                }
            }

            // Maintenance Validation: Block operations if overdue bills
            $today = now();
            if ($today->day > 10) {
                // Check if branch has an unpaid bill for PREVIOUS months
                $hasOverdueBill = \App\Models\MaintenanceBill::where('branch_id', $validated['origin_branch_id'])
                    ->where('status', 'Pending')
                    ->where(function($query) use ($today) {
                        $query->where('bill_year', '<', $today->year)
                              ->orWhere(function($q) use ($today) {
                                  $q->where('bill_year', $today->year)
                                    ->where('bill_month', '<', $today->month);
                              });
                    })->exists();

                if ($hasOverdueBill) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Operations Blocked: This branch has an completely unpaid maintenance bill from a previous month. Please clear all dues to resume booking Waybills.'
                    ], 403);
                }
            }

            $isPaidImmediately = $validated['account_type'] === 'paid' && (bool) $request->input('cash_received', true);

            // 1. Create waybill with a temporary unique GC number
            $waybill = Waybill::create(array_merge($validated, [
                'gc_number' => 'TMP-' . uniqid(),
                'status' => 'PENDING',
                'deliver_status' => 'PENDING',
                'amount_paid' => $isPaidImmediately ? $validated['grand_total'] : 0
            ]));

            // 2. Generate the permanent GC number using the latest sequence for that branch
            $branch = \App\Models\Branch::find($validated['origin_branch_id']);
            $branchPrefix = $branch ? ($branch->branch_code ?: 'GC') : 'GC';

            // Find the highest existing GC number that starts with this branch's prefix
            $lastWaybill = Waybill::where('origin_branch_id', $validated['origin_branch_id'])
                ->where('gc_number', 'LIKE', $branchPrefix . '%')
                ->where('id', '!=', $waybill->id) // Exclude the temporary record we just created
                ->orderByRaw('LENGTH(gc_number) DESC')
                ->orderBy('gc_number', 'DESC')
                ->first();

            $nextNumber = 1;
            if ($lastWaybill) {
                // Extract numeric part by removing the prefix
                $lastNumStr = str_replace($branchPrefix, '', $lastWaybill->gc_number);
                if (is_numeric($lastNumStr)) {
                    $nextNumber = intval($lastNumStr) + 1;
                } else {
                    // Fallback if formatting is weird: count records
                    $nextNumber = Waybill::where('origin_branch_id', $validated['origin_branch_id'])->count();
                }
            }

            // Final safety check: if the generated number STILL exists (maybe from another branch with same prefix),
            // loop until unique.
            $finalGcNumber = $branchPrefix . $nextNumber;
            while (Waybill::where('gc_number', $finalGcNumber)->exists()) {
                $nextNumber++;
                $finalGcNumber = $branchPrefix . $nextNumber;
            }

            $waybill->update(['gc_number' => $finalGcNumber]);

            $gcNumber = $waybill->gc_number;

            foreach ($validated['articles'] as $articleData) {
                $waybill->articles()->create($articleData);
            }

            \App\Models\WaybillTransit::create([
                'waybill_id' => $waybill->id,
                'branch_id' => $validated['origin_branch_id'],
                'status' => 'BOOKED',
                'remarks' => 'Waybill Booked',
            ]);

            // Automatically create Cash Book Entry for 'Paid' GC at Booking Branch
            if ($isPaidImmediately) {
                $waybill->load('consignor');
                CashBookEntry::create([
                    'voucher_no' => 'BK-' . strtoupper(substr(uniqid(), -6)),
                    'transaction_date' => $validated['bill_date'],
                    'transaction_type' => 'CREDIT',
                    'account_head_id' => $this->getBookingAccountHeadId(),
                    'amount' => $validated['grand_total'],
                    'branch_id' => $validated['origin_branch_id'],
                    'paid_to_receive_from' => $waybill->consignor->name ?? 'Consignor',
                    'mode_of_pay' => 'CASH', // Default for booking
                    'remarks' => "Collected Booking Freight for GC: {$gcNumber}",
                    'authorised_by' => 'System Auto',
                    'paid_by_received_by' => 'Booking Clerk',
                    'is_closing_entry' => false
                ]);

                // Create detailed payment record
                WaybillPayment::create([
                    'waybill_id' => $waybill->id,
                    'paid_amount' => $validated['grand_total'],
                    'discount' => 0,
                    'payment_date' => $validated['bill_date'],
                    'mode_of_pay' => 'CASH',
                    'remarks' => 'Paid during Booking',
                    'branch_id' => $validated['origin_branch_id'],
                    'created_by' => $request->user()->id ?? 1,
                ]);
            }

            DB::commit();

            // Audit logging
            AuditLog::record($waybill, 'CREATE', null, $waybill->toArray(), $gcNumber, "Created via Booking");

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
            $waybill = Waybill::with([
                'originBranch',
                'destination',
                'consignor',
                'consignee',
                'articles',
                'inwardBranch',
                'tripSheets.vehicle',
                'tripSheets.driver',
                'ackBundle',
                'deliveryAttempts',
                'consignorReceipts',
                'transits.branch',
                'transits.tripSheet',
                'transits.tripSheet.vehicle',
                'transits.tripSheet.driver'
            ])
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

            // Prevent modification if already delivered (unless superadmin)
            $userRole = $request->input('role') ?? ($request->user()?->role ?? (auth()->user()?->role ?? ''));
            if ($userRole !== 'superadmin') {
                if (strtoupper($waybill->status) === 'DELIVERED' || strtoupper($waybill->deliver_status) === 'DELIVERED') {
                    return response()->json([
                        'success' => false,
                        'message' => 'This Waybill has already been DELIVERED and cannot be modified.'
                    ], 400);
                }
            }

            $validated = $request->validate([
                'bill_date' => 'sometimes|date',
                'origin_branch_id' => 'sometimes|exists:branches,id',
                'destination_id' => 'sometimes|exists:destinations,id',
                'consignor_id' => 'sometimes|exists:consignors,id',
                'consignee_id' => 'sometimes|exists:consignees,id',
                'article_desc' => 'nullable|string',
                'total_articles' => 'sometimes|integer',
                'freight_amount' => 'sometimes|numeric',
                'dd_charges' => 'sometimes|numeric',
                'handling_charges' => 'sometimes|numeric',
                'stationary_charges' => 'sometimes|numeric',
                'total_amount' => 'sometimes|numeric',
                'invoice_no' => 'nullable|string',
                'declared_value' => 'sometimes|numeric',
                'eway_bill_no' => (($request->declared_value ?? $waybill->declared_value) > 49999) ? 'required|string' : 'nullable|string',
                'tax_payable_by' => 'nullable|string',
                'account_type' => 'nullable|string',
                'gst_percent' => 'sometimes|numeric',
                'gst_amount' => 'sometimes|numeric',
                'grand_total' => 'sometimes|numeric',
                'remarks' => 'nullable|string',
                'created_by' => 'nullable|integer',
                'booking_clerk' => 'nullable|string',
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
                'articles.*.dd_rate' => 'nullable|numeric',
                'articles.*.dd_total' => 'nullable|numeric',
                'articles.*.amount' => 'nullable|numeric',
            ], [
                'eway_bill_no.required' => 'E-Way Bill No. is mandatory when declared value exceeds ₹49,999.'
            ]);

            // Unique Invoice Number per Consignor Validation on Update
            if ($request->filled('invoice_no')) {
                $consignorId = $validated['consignor_id'] ?? $waybill->consignor_id;
                $duplicate = Waybill::where('consignor_id', $consignorId)
                    ->where('invoice_no', $validated['invoice_no'])
                    ->where('id', '!=', $id) // Exclude self
                    ->exists();

                if ($duplicate) {
                    return response()->json([
                        'success' => false,
                        'message' => "Duplicate Entry: Invoice No '{$validated['invoice_no']}' is already used by this consignor in another GC."
                    ], 422);
                }
            }

            // Separate articles from main waybill data for update
            $articlesData = $validated['articles'] ?? null;
            $waybillData = $validated;
            unset($waybillData['articles']);

            // Keep old values for comparison (exclude articles for audit)
            $oldValues = $waybill->only(array_keys($waybillData));

            // Keep original financial data before update
            $oldAmountPaidVal = $waybill->amount_paid;
            $oldAccountTypeVal = $waybill->account_type;

            // Update waybill
            $waybill->update($waybillData);

            // Audit logging if values changed
            $newValues = $waybill->only(array_keys($waybillData));
            $changes = array_diff_assoc($newValues, $oldValues);

            if (!empty($changes)) {
                AuditLog::record($waybill, 'UPDATE', $oldValues, $newValues, $waybill->gc_number, $request->get('edit_reason') ?: "Modified from Management Console");
            }

            // Financial Sync for 'Paid' GCs
            $newAccountType = $waybill->account_type;
            $newGrandTotal = (float) $waybill->grand_total;
            $oldAmountPaid = (float) $oldAmountPaidVal;

            $waybill->load('consignor');

            if ($newAccountType === 'paid') {
                $delta = $newGrandTotal - $oldAmountPaid;
                
                // Only create adjustment entries if the amount was previously received
                if ($oldAmountPaid > 0 && abs($delta) > 0.01) {
                    $waybill->amount_paid = $newGrandTotal;
                    $waybill->save();

                    // 1. Post adjustment entry to Cash Book (CREDIT if amount increased, DEBIT if decreased/refund)
                    CashBookEntry::create([
                        'voucher_no'          => 'BKADJ-' . strtoupper(substr(uniqid(), -6)),
                        'transaction_date'    => date('Y-m-d'),
                        'transaction_type'    => $delta > 0 ? 'CREDIT' : 'DEBIT',
                        'account_head_id'     => $this->getBookingAccountHeadId(),
                        'amount'              => abs($delta),
                        'branch_id'           => $waybill->origin_branch_id,
                        'paid_to_receive_from'=> $waybill->consignor->name ?? 'Consignor',
                        'mode_of_pay'         => 'CASH',
                        'remarks'             => ($delta > 0 ? 'Amount Adjustment (Extra Collected)' : 'Amount Adjustment (Refund/Reversal)') . " for GC: {$waybill->gc_number} | Old: ₹{$oldAmountPaid} → New: ₹{$newGrandTotal}",
                        'authorised_by'       => 'System Auto',
                        'paid_by_received_by' => 'System (GC Edit)',
                        'is_closing_entry'    => false,
                    ]);

                    // 2. Create detailed payment record for tracking WHO and WHEN
                    WaybillPayment::create([
                        'waybill_id'   => $waybill->id,
                        'paid_amount'  => $delta, // Can be negative for refunds
                        'discount'     => 0,
                        'payment_date' => date('Y-m-d'),
                        'mode_of_pay'  => 'CASH',
                        'remarks'      => $delta > 0 ? "Additional collection via Edit" : "Refund adjustment via Edit",
                        'branch_id'    => $waybill->origin_branch_id,
                        'created_by'   => auth()->id() ?? 1,
                    ]);
                }
            } elseif (($oldAccountTypeVal ?? '') === 'paid' && $newAccountType !== 'paid') {
                // GC was PAID but type changed to ToPay/Account — reverse the entire collected amount
                if ($oldAmountPaid > 0) {
                    CashBookEntry::create([
                        'voucher_no'          => 'BKREV-' . strtoupper(substr(uniqid(), -6)),
                        'transaction_date'    => date('Y-m-d'),
                        'transaction_type'    => 'DEBIT',
                        'account_head_id'     => $this->getBookingAccountHeadId(),
                        'amount'              => $oldAmountPaid,
                        'branch_id'           => $waybill->origin_branch_id,
                        'paid_to_receive_from'=> $waybill->consignor->name ?? 'Consignor',
                        'mode_of_pay'         => 'CASH',
                        'remarks'             => "REVERSAL: GC {$waybill->gc_number} changed from PAID → " . strtoupper($newAccountType) . " | Reversed ₹{$oldAmountPaid}",
                        'authorised_by'       => 'System Auto',
                        'paid_by_received_by' => 'System (GC Edit)',
                        'is_closing_entry'    => false,
                    ]);
                    $waybill->amount_paid = 0;
                    $waybill->save();
                }
            }

            // Update articles if provided
            if ($articlesData) {
                foreach ($articlesData as $articleData) {
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

            // GCs booked at this branch that need acknowledgment:
            // 1. Marked as DELIVERED by another branch but NOT YET acknowledged here
            // 2. OR Local deliveries (booked here for a destination here) that aren't DELIVERED yet
            // 1. GCs booked at this branch
            // 2. Status is DELIVERED (physically delivered)
            // 3. Not yet marked as ACK_RECEIVED (paperwork confirmed)
            $waybills = Waybill::with(['originBranch', 'destination', 'consignor', 'consignee', 'articles'])
                ->where('origin_branch_id', $branch->id)
                ->where('status', 'DELIVERED')
                ->where('deliver_status', '!=', 'ACK_RECEIVED')
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

            // Handle file upload if provided
            if ($request->hasFile('delivery_proof')) {
                // Delete old proof if it exists
                if ($waybill->delivery_proof) {
                    \App\Helpers\ImageHelper::purge($waybill->delivery_proof);
                }

                $file = $request->file('delivery_proof');
                $filename = 'ack_' . time() . '_' . $waybill->gc_number;

                // Use ImageHelper for compression and WebP conversion
                $path = \App\Helpers\ImageHelper::compressAndStore($file, 'delivery_proofs', $filename);

                $waybill->delivery_proof = $path;
            }

            $ackBranchId = $validated['branch_id'] ?? $waybill->origin_branch_id;

            // Strict Logic: If not already delivered, only allow delivery update if it's a LOCAL delivery
            // (i.e., the acknowledging branch handles the destination).
            if (strtoupper($waybill->status) !== 'DELIVERED') {
                $isLocalDelivery = \Illuminate\Support\Facades\DB::table('branch_destination_mappings')
                    ->where('branch_id', $ackBranchId)
                    ->where('destination_id', $waybill->destination_id)
                    ->exists();

                if (!$isLocalDelivery) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Status update not allowed. For cross-branch shipments, the destination branch must update status via "Update Delivery" first.'
                    ], 403);
                }
            }

            // Fallback: If it was never inwarded, set inward details to current delivery event
            $inwardAt = $waybill->inward_at ?? now();
            $inwardBranchId = $waybill->inward_branch_id ?? $ackBranchId;

            // Update status to DELIVERED and set deliver_status to ACK_RECEIVED
            $waybill->update([
                'status' => 'DELIVERED',
                'deliver_status' => 'ACK_RECEIVED',
                'delivered_at' => $waybill->delivered_at ?? now(),
                'delivered_branch_id' => $ackBranchId,
                'inward_at' => $inwardAt,
                'inward_branch_id' => $inwardBranchId,
                'remarks' => $validated['remarks'] ?? $waybill->remarks,
                'delivery_proof' => $waybill->delivery_proof
            ]);

            \App\Models\WaybillTransit::create([
                'waybill_id' => $waybill->id,
                'branch_id' => $ackBranchId,
                'status' => 'DELIVERED',
                'remarks' => 'GC marked as DELIVERED and acknowledgment received',
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
                'inward_by' => 'nullable|exists:admins,id',
            ]);

            DB::beginTransaction();

            $waybills = Waybill::whereIn('id', $validated['waybill_ids'])->get();
            $inwardAt = $validated['received_date'] ? date('Y-m-d H:i:s', strtotime($validated['received_date'] . ' ' . date('H:i:s'))) : now();

            foreach ($waybills as $waybill) {
                if (in_array($waybill->status, ['INWARDED', 'DELIVERED', 'Out for Delivery', 'Arrived at Destination'])) {
                    throw new \Exception("GC {$waybill->gc_number} is already {$waybill->status} and cannot be inwarded again.");
                }

                $oldValues = $waybill->toArray();

                $waybill->update([
                    'status' => 'INWARDED',
                    'inward_branch_id' => $validated['received_branch_id'],
                    'inward_at' => $inwardAt,
                    'remarks' => $validated['remarks'] ?: "Inwarded at destination branch",
                    'inward_by' => $validated['inward_by'] ?? null,
                ]);

                \App\Models\WaybillTransit::create([
                    'waybill_id' => $waybill->id,
                    'branch_id' => $validated['received_branch_id'],
                    'status' => 'INWARDED',
                    'remarks' => $validated['remarks'] ?: "GC Inwarded at destination branch",
                ]);

                AuditLog::record(
                    $waybill,
                    'UPDATE',
                    $oldValues,
                    $waybill->fresh()->toArray(),
                    $waybill->gc_number,
                    $validated['remarks'] ?: "GC Inwarded at destination branch",
                    $validated['received_branch_id']
                );
            }

            $updatedCount = count($waybills);
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
    public function updateDeliveryStatus(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'gc_number' => 'required|string',
                'status' => 'required|string',
                'remarks' => 'nullable|string',
                'receiver_name' => 'nullable|string',
                // proof is optional - can be uploaded later via Upload POD screen
                'delivery_proof' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
                'payment_method' => 'nullable|string',
                'discount' => 'nullable|numeric|min:0',
            ]);

            $waybill = Waybill::where('gc_number', $validated['gc_number'])->first();

            if (!$waybill) {
                return response()->json([
                    'success' => false,
                    'message' => 'Waybill not found'
                ], 404);
            }

            // Only INWARDED, RECEIVED, or LOCAL_TRIP waybills can be processed for delivery
            $deliverableStatuses = ['BOOKED', 'PENDING', 'DISPATCHED', 'RECEIVED', 'INWARDED', 'LOCAL_TRIP', 'Arrived at Destination', 'Out for Delivery'];
            $currentStatus = strtoupper($waybill->status);

            if ($currentStatus === 'DELIVERED') {
                return response()->json([
                    'success' => false,
                    'message' => 'GC ' . $waybill->gc_number . ' is already DELIVERED.'
                ], 400);
            }

            $isDeliverable = false;
            foreach ($deliverableStatuses as $ds) {
                if (strtoupper($ds) === $currentStatus) {
                    $isDeliverable = true;
                    break;
                }
            }

            if (!$isDeliverable) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only Inwarded or Local Trip GCs can be delivered. Current status: ' . $waybill->status
                ], 400);
            }

            // Strictly enforce that ONLY the branch that inwarded the goods can update delivery status.
            // For BOOKED status, only the origin branch can update it.
            if ($request->filled('delivered_branch_id')) {
                $deliveredBranchId = (int) $request->delivered_branch_id;

                // If status is booked, ONLY origin branch is allowed
                if ($currentStatus === 'BOOKED') {
                    $isEligibleBranch = (int) $waybill->origin_branch_id === $deliveredBranchId;
                } else {
                    $isEligibleBranch = (int) $waybill->inward_branch_id === $deliveredBranchId || (int) $waybill->origin_branch_id === $deliveredBranchId;
                }

                if (!$isEligibleBranch) {
                    $branch = \App\Models\Branch::find($deliveredBranchId);
                    $branchName = $branch ? $branch->branch_name : "Branch #{$deliveredBranchId}";

                    $errorReason = $currentStatus === 'BOOKED'
                        ? "direct delivery for BOOKED GCs is only allowed at the Booking Branch"
                        : "this branch did not book or inward the goods";

                    return response()->json([
                        'success' => false,
                        'message' => "Branch Mismatch — GC {$waybill->gc_number} cannot be delivered at {$branchName} because {$errorReason}."
                    ], 403);
                }
            }
            // ──────────────────────────────────────────────────────────────

            // Handle file upload
            if ($request->hasFile('delivery_proof')) {
                // Delete old proof if it exists
                if ($waybill->delivery_proof) {
                    \App\Helpers\ImageHelper::purge($waybill->delivery_proof);
                }

                $file = $request->file('delivery_proof');
                $filename = time() . '_' . $waybill->gc_number;

                // Use ImageHelper for compression and WebP conversion
                $path = \App\Helpers\ImageHelper::compressAndStore($file, 'delivery_proofs', $filename);

                $waybill->delivery_proof = $path;
            }

            $newStatus = $validated['status'];
            $remarks = $validated['remarks'] ?? null;

            if (in_array($newStatus, ['Not Delivered', 'Redirected', 'RTO (Return to Origin)'])) {
                // Record the failed delivery/redirection attempt
                \Illuminate\Support\Facades\DB::table('waybill_delivery_attempts')->insert([
                    'gc_number' => $waybill->gc_number,
                    'status' => $newStatus,
                    'reason' => $remarks,
                    'branch_id' => $request->input('delivered_branch_id') ?? null,
                    'branch_name' => $request->input('delivered_branch_name') ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $dateStr = now()->format('d-M');

                if ($newStatus === 'Not Delivered') {
                    // Prepend the attempt info
                    $waybill->remarks = "[Attempted $dateStr: $remarks] " . ($waybill->remarks ?? '');
                } elseif ($newStatus === 'Redirected') {
                    if ($request->has('redirect_branch_id')) {
                        $targetBranchId = (int) $request->input('redirect_branch_id');
                        $targetBranch = \App\Models\Branch::find($targetBranchId);
                        $targetBranchName = ($targetBranch instanceof \App\Models\Branch) ? $targetBranch->branch_name : "Branch #$targetBranchId";

                        // Change destination_id to a valid destination served by the target branch
                        $mapping = \Illuminate\Support\Facades\DB::table('branch_destination_mappings')
                            ->where('branch_id', $targetBranchId)
                            ->first();

                        if ($mapping) {
                            $waybill->destination_id = $mapping->destination_id;
                        }

                        // Prepend redirect info
                        $waybill->remarks = "[Redirected to $targetBranchName on $dateStr: $remarks] " . ($waybill->remarks ?? '');
                    }
                } elseif ($newStatus === 'RTO (Return to Origin)') {
                    // Find a destination mapping for the origin branch
                    $mapping = \Illuminate\Support\Facades\DB::table('branch_destination_mappings')
                        ->where('branch_id', $waybill->origin_branch_id)
                        ->first();

                    if ($mapping) {
                        $waybill->destination_id = $mapping->destination_id;
                    }

                    // Prepend RTO info
                    $waybill->remarks = "[RTO Initiated on $dateStr: $remarks] " . ($waybill->remarks ?? '');
                }

                // For all three cases, reset status back to INWARDED so it can be shipped again.
                $newStatus = 'INWARDED';
            } else {
                $waybill->status = $newStatus;
                if ($remarks) {
                    $waybill->remarks = $remarks;
                }
            }
            $waybill->status = $newStatus;

            if (isset($validated['receiver_name'])) {
                $waybill->receiver_name = $validated['receiver_name'];
            }
            if (isset($validated['payment_method'])) {
                $waybill->payment_method = $validated['payment_method'];
            }
            if (isset($validated['discount'])) {
                $waybill->discount = $validated['discount'];
            } else {
                $waybill->discount = 0;
            }

            // If Delivered, update deliver_status and delivery details
            if (strtoupper($validated['status']) === 'DELIVERED') {
                $waybill->status = 'DELIVERED';
                $waybill->deliver_status = 'DELIVERED';
                $waybill->delivered_at = now();

                // Fallback: If it was never inwarded, set inward details to current delivery event
                if (!$waybill->inward_at) {
                    $waybill->inward_at = now();
                }
                if (!$waybill->inward_branch_id) {
                    $waybill->inward_branch_id = $request->delivered_branch_id ?? $waybill->destination_id;
                }

                if ($request->has('delivered_branch_id')) {
                    $waybill->delivered_branch_id = $request->delivered_branch_id;
                }

                if ($request->has('delivered_branch_name')) {
                    $waybill->delivered_branch_name = $request->delivered_branch_name;
                }

                \App\Models\WaybillTransit::create([
                    'waybill_id' => $waybill->id,
                    'branch_id' => $waybill->delivered_branch_id ?? 1,
                    'status' => 'DELIVERED',
                    'remarks' => 'GC Delivered to consignee',
                ]);

                // If it's a 'topay' GC AND cash was explicitly confirmed as received at delivery
                if ($waybill->account_type === 'topay' && $request->input('cash_received') === 'true') {
                    $finalAmount = $waybill->grand_total - ($waybill->discount ?? 0);
                    $waybill->amount_paid = $finalAmount;

                    // Create WaybillPayment record
                    WaybillPayment::create([
                        'waybill_id'    => $waybill->id,
                        'paid_amount'   => $finalAmount,
                        'discount'      => $waybill->discount ?? 0,
                        'mode_of_pay'   => strtoupper($waybill->payment_method ?? 'CASH'),
                        'payment_date'  => now()->format('Y-m-d'),
                        'branch_id'     => $waybill->delivered_branch_id ?? null,
                        'created_by'    => $request->input('delivered_by') ?? null,
                    ]);

                    // Create Cash Book Entry for collected payment
                    CashBookEntry::create([
                        'voucher_no'          => 'DLV-' . strtoupper(substr(uniqid(), -6)),
                        'transaction_date'    => now()->format('Y-m-d'),
                        'transaction_type'    => 'CREDIT',
                        'account_head_id'     => $this->getBookingAccountHeadId(),
                        'amount'              => $finalAmount,
                        'branch_id'           => $waybill->delivered_branch_id ?? $waybill->destination_id,
                        'paid_to_receive_from' => $waybill->consignee->name ?? 'Consignee',
                        'mode_of_pay'         => strtoupper($waybill->payment_method ?? 'CASH'),
                        'remarks'             => "Collected Freight for GC: {$waybill->gc_number}" . ($waybill->payment_method ? " via " . strtoupper($waybill->payment_method) : "") . ($waybill->discount > 0 ? " (After Discount: ₹{$waybill->discount})" : ""),
                        'authorised_by'       => 'System Auto',
                        'paid_by_received_by' => 'Delivery Staff',
                        'is_closing_entry'    => false
                    ]);
                }
                // If topay but cash NOT confirmed received - delivery is marked but payment stays pending
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
            $query = Waybill::with(['consignee', 'destination', 'originBranch', 'deliveredBranch']);

            // Handle Report Type
            $type = $request->get('report_type', 'delivered');
            if ($type === 'delivered') {
                $query->where('status', 'DELIVERED');
                // For Delivered report, filter by the date it was actually DELIVERED
                if ($request->filled('from_date')) {
                    $query->whereDate('delivered_at', '>=', $request->from_date);
                }
                if ($request->filled('to_date')) {
                    $query->whereDate('delivered_at', '<=', $request->to_date);
                }
                // Filter by the branch where it was DELIVERED
                if ($request->filled('branch_id') && $request->branch_id !== 'All Branches') {
                    $query->where('delivered_branch_id', $request->branch_id);
                }
                $query->orderBy('delivered_at', 'desc');
            } else {
                if ($type === 'undelivered') {
                    $query->whereNotIn('status', ['DELIVERED', 'RTO (Return to Origin)', 'CANCELLED']);
                } elseif ($type === 'rto') {
                    $query->where('status', 'RTO (Return to Origin)');
                } elseif ($type === 'cancelled') {
                    $query->where('status', 'CANCELLED');
                }

                // For Undelivered/RTO, filter by booking date as they have no delivered_at
                if ($request->filled('from_date')) {
                    $query->whereDate('bill_date', '>=', $request->from_date);
                }
                if ($request->filled('to_date')) {
                    $query->whereDate('bill_date', '<=', $request->to_date);
                }
                // Filter by booking branch
                if ($request->filled('branch_id') && $request->branch_id !== 'All Branches') {
                    $query->where('origin_branch_id', $request->branch_id);
                }
                $query->orderBy('bill_date', 'desc');
            }

            $reports = $query->get();

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

    public function getPendingPodReport(Request $request): JsonResponse
    {
        try {
            $query = Waybill::with(['consignee', 'consignor', 'destination', 'originBranch', 'deliveredBranch'])
                ->where(function($q) {
                    $q->where('status', 'DELIVERED')
                      ->orWhere('status', 'delivered')
                      ->orWhere('deliver_status', 'DELIVERED')
                      ->orWhere('deliver_status', 'delivered');
                })
                ->where(function($q) {
                    $q->whereNull('delivery_proof')
                      ->orWhere('delivery_proof', '');
                });

            if ($request->filled('from_date')) {
                $query->where(function($q) use ($request) {
                    $q->whereDate('delivered_at', '>=', $request->from_date)
                      ->orWhere(function($sub) use ($request) {
                          $sub->whereNull('delivered_at')
                              ->whereDate('bill_date', '>=', $request->from_date);
                      });
                });
            }
            if ($request->filled('to_date')) {
                $query->where(function($q) use ($request) {
                    $q->whereDate('delivered_at', '<=', $request->to_date)
                      ->orWhere(function($sub) use ($request) {
                          $sub->whereNull('delivered_at')
                              ->whereDate('bill_date', '<=', $request->to_date);
                      });
                });
            }
            if ($request->filled('branch_id') && $request->branch_id !== 'All Branches') {
                $query->where(function($q) use ($request) {
                    $q->where('delivered_branch_id', $request->branch_id)
                      ->orWhere('origin_branch_id', $request->branch_id);
                });
            }

            $reports = $query->orderByRaw('COALESCE(delivered_at, bill_date) desc')->get();

            return response()->json([
                'success' => true,
                'data' => $reports
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending POD report: ' . $e->getMessage()
            ], 500);
        }
    }


    public function getInwardStatusReport(Request $request): JsonResponse
    {
        try {
            // Start with a query that includes all needed relationships
            $query = Waybill::with(['originBranch', 'destination', 'consignee', 'inwardBranch', 'articles']);

            // Filter by Inward Branch
            if ($request->filled('inward_branch_id')) {
                $query->where('inward_branch_id', $request->inward_branch_id);
            }
            
            // Exclude local bookings (where booking branch is the same as inward branch)
            $query->whereColumn('origin_branch_id', '!=', 'inward_branch_id');

            // Inward Date Range Filter
            // If dates are provided, we should only look at records WHERE inward_at is NOT NULL
            if ($request->filled('from_date')) {
                $query->whereDate('inward_at', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('inward_at', '<=', $request->to_date);
            }

            // Show ALL GCs that have ever been inwarded (have an inward_at record),
            // regardless of their current status (DELIVERED, LOCAL_TRIP, INWARDED, etc.)
            $query->whereNotNull('inward_at');

            // Optional Status Filter — filters by current status if user selects a specific one
            // Handles case variants (e.g. 'DELIVERED' and 'Delivered')
            if ($request->filled('status') && $request->status !== 'All') {
                $filterStatus = $request->status;
                $query->where(function ($q) use ($filterStatus) {
                    $q->where('status', $filterStatus)
                      ->orWhere('status', ucfirst(strtolower($filterStatus)))
                      ->orWhere('status', strtoupper($filterStatus));
                });
            }

            $results = $query->orderBy('inward_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $results,
                'summary' => [
                    'total_count' => $results->count(),
                    'total_freight' => (float) $results->sum('grand_total'),
                    'total_articles' => (int) $results->sum('total_articles')
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Report Error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getBalanceSheetReport(Request $request): JsonResponse
    {
        try {
            $branchId = $request->get('branch_id');
            $fromDate = $request->get('from_date');
            $toDate = $request->get('to_date');

            $query = Waybill::query();

            if ($fromDate) {
                $query->whereDate('bill_date', '>=', $fromDate);
            }
            if ($toDate) {
                $query->whereDate('bill_date', '<=', $toDate);
            }
            if ($branchId && $branchId !== 'All Branches') {
                $query->where('origin_branch_id', $branchId);
            }

            $rawResults = $query->selectRaw('UPPER(account_type) as type, SUM(grand_total) as total')
                ->groupBy('type')
                ->get();

            $results = [];
            foreach ($rawResults as $row) {
                $results[$row->type] = $row->total;
            }

            $data = [
                'topay' => (float) ($results['TOPAY'] ?? 0) + (float) ($results['TO PAY'] ?? 0),
                'paid' => (float) ($results['PAID'] ?? 0) + (float) ($results['CASH'] ?? 0),
                'account' => (float) ($results['ACCOUNT'] ?? 0) + (float) ($results['TBB'] ?? 0),
            ];
            $data['total_balance'] = array_sum($data);

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getConsignorHistoryReport(Request $request): JsonResponse
    {
        try {
            $consignorId = $request->get('consignor_id');
            $fromDate = $request->get('from_date');
            $toDate = $request->get('to_date');
            $branchId = $request->get('branch_id');

            if (!$consignorId) {
                return response()->json(['success' => false, 'message' => 'Consignor is required'], 400);
            }

            $query = Waybill::with(['originBranch', 'destination', 'consignor', 'consignee', 'deliveredBranch', 'articles'])
                ->where('consignor_id', $consignorId);

            if ($fromDate) {
                $query->whereDate('bill_date', '>=', $fromDate);
            }
            if ($toDate) {
                $query->whereDate('bill_date', '<=', $toDate);
            }
            if ($branchId && $branchId !== 'All Branches') {
                $query->where('origin_branch_id', $branchId);
            }

            $waybills = $query->orderBy('bill_date', 'desc')->get();

            // Stats
            $stats = [
                'booking_details' => [
                    'total' => $waybills->count(),
                    'delivered' => $waybills->filter(fn($wb) => strtoupper($wb->status) === 'DELIVERED')->count(),
                    'pending' => $waybills->filter(fn($wb) => strtoupper($wb->status) !== 'DELIVERED')->count(),
                ],
                'freight_wise_booking' => [
                    'account' => $waybills->filter(fn($wb) => strtoupper($wb->account_type) === 'ACCOUNT')->count(),
                    'topay' => $waybills->filter(fn($wb) => strtoupper($wb->account_type) === 'TOPAY' || strtoupper($wb->account_type) === 'TO PAY')->count(),
                    'paid' => $waybills->filter(fn($wb) => strtoupper($wb->account_type) === 'PAID' || strtoupper($wb->account_type) === 'CASH')->count(),
                ],
                'payment_details' => [
                    'booking_amount' => (float) $waybills->sum('grand_total'),
                    'paid_amount' => (float) $waybills->sum('amount_paid'),
                    'balance' => (float) ($waybills->sum('grand_total') - $waybills->sum('amount_paid')),
                ],
                'freight_wise_payment' => [
                    'account' => (float) $waybills->where('account_type', 'account')->sum('amount_paid'),
                    'topay' => (float) $waybills->where('account_type', 'topay')->sum('amount_paid'),
                    'paid' => (float) $waybills->where('account_type', 'paid')->sum('amount_paid'),
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'waybills' => $waybills
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function getAckStatusReport(Request $request): JsonResponse
    {
        try {
            $fromDate = $request->get('from_date');
            $toDate = $request->get('to_date');
            $branchId = $request->get('branch_id');
            $status = $request->get('status');

            $query = Waybill::with(['originBranch', 'destination', 'consignor', 'consignee', 'articles', 'ackBundle']);

            if ($fromDate) {
                $query->whereDate('bill_date', '>=', $fromDate);
            }
            if ($toDate) {
                $query->whereDate('bill_date', '<=', $toDate);
            }
            if ($branchId && $branchId !== 'All Branches' && $branchId !== '') {
                $query->where(function ($q) use ($branchId) {
                    $q->where('origin_branch_id', $branchId)
                        ->orWhere('delivered_branch_id', $branchId)
                        ->orWhere('inward_branch_id', $branchId);
                });
            }

            if ($status === 'Acknowledged') {
                $query->whereNotNull('ack_bundle_id');
            } elseif ($status === 'Pending') {
                $query->whereNull('ack_bundle_id');
            }

            $waybills = $query->orderBy('bill_date', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $waybills
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    /**
     * Receive payment for a waybill.
     */
    public function receivePayment(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'id' => 'required|exists:waybills,id',
                'payment_date' => 'required|date',
                'paid_amount' => 'required|numeric|min:0.01',
                'mode_of_pay' => 'required|string',
                'remarks' => 'nullable|string',
                'payer_name' => 'nullable|string',
                'dd_check_no' => 'nullable|string',
                'dd_check_date' => 'nullable|date',
                'discount' => 'nullable|numeric|min:0',
                'branch_id' => 'required|exists:branches,id',
            ]);

            $waybill = Waybill::find($validated['id']);

            $normalizedAccountType = strtoupper(str_replace(' ', '', $waybill->account_type ?? ''));
            if ($normalizedAccountType === 'TOPAY' && strtoupper($waybill->status) !== 'DELIVERED') {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment can only be collected for DELIVERED waybills for TOPAY account type. Current status: ' . $waybill->status
                ], 400);
            }

            $totalAlreadyPaid = (float) $waybill->amount_paid;
            $newPayment = (float) $validated['paid_amount'];
            $discount = (float) ($validated['discount'] ?? 0);
            $grandTotal = (float) $waybill->grand_total;

            if ($totalAlreadyPaid + $newPayment + $discount > $grandTotal + 0.01) {
                return response()->json([
                    'success' => false,
                    'message' => 'Total paid amount and discount exceeds waybill grand total. Balance: ' . ($grandTotal - $totalAlreadyPaid)
                ], 400);
            }

            // Update waybill amount_paid
            $oldAmountPaid = $waybill->amount_paid;
            $waybill->amount_paid = $totalAlreadyPaid + $newPayment + $discount;

            // If fully paid, we could potentially update status, but for now just update amount_paid
            $waybill->save();

            // Create Cash Book Entry
            CashBookEntry::create([
                'voucher_no' => 'PAY-' . strtoupper(substr(uniqid(), -6)),
                'transaction_date' => $validated['payment_date'],
                'transaction_type' => 'CREDIT',
                'account_head_id' => $this->getBookingAccountHeadId(),
                'amount' => $newPayment,
                'branch_id' => $validated['branch_id'],
                'paid_to_receive_from' => $validated['payer_name'] ?? ($waybill->consignor->name ?? 'Customer'),
                'mode_of_pay' => strtoupper($validated['mode_of_pay']),
                'remarks' => ($validated['remarks'] ?? "Payment received for GC: {$waybill->gc_number}") . ($discount > 0 ? " (Discount: {$discount})" : ""),
                'authorised_by' => 'User',
                'paid_by_received_by' => $validated['payer_name'] ?? 'Customer',
                'is_closing_entry' => false,
                'instrument_no' => $validated['dd_check_no'] ?? null,
                'instrument_date' => $validated['dd_check_date'] ?? null,
            ]);

            // Create detailed payment record
            WaybillPayment::create([
                'waybill_id' => $waybill->id,
                'paid_amount' => $newPayment,
                'discount' => $discount,
                'payment_date' => $validated['payment_date'],
                'mode_of_pay' => $validated['mode_of_pay'],
                'remarks' => $validated['remarks'],
                'branch_id' => $validated['branch_id'],
                'created_by' => auth()->id() ?? 1,
            ]);

            // Audit logging
            AuditLog::record(
                $waybill,
                'PAYMENT_RECEIVE',
                ['amount_paid' => $oldAmountPaid],
                ['amount_paid' => $waybill->amount_paid],
                $waybill->gc_number,
                "Received payment: {$newPayment}" . ($discount > 0 ? " with discount: {$discount}" : "")
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment received successfully',
                'data' => $waybill->load(['originBranch', 'destination', 'consignor', 'consignee'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to receive payment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Receive bulk payment for multiple waybills.
     */
    public function bulkReceivePayment(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'payment_date' => 'required|date',
                'mode_of_pay' => 'required|string',
                'remarks' => 'nullable|string',
                'payer_name' => 'required|string',
                'ref_no' => 'nullable|string',
                'branch_id' => 'required|exists:branches,id',
                'payments' => 'required|array|min:1',
                'payments.*.id' => 'required|exists:waybills,id',
                'payments.*.paid_amount' => 'required|numeric|min:0',
                'payments.*.discount' => 'nullable|numeric|min:0',
            ]);

            $totalPaidAmount = 0;
            $totalDiscountAmount = 0;
            $gcNumbers = [];

            foreach ($validated['payments'] as $payData) {
                if ($payData['paid_amount'] <= 0 && (!isset($payData['discount']) || $payData['discount'] <= 0)) {
                    continue;
                }

                $waybill = Waybill::find($payData['id']);
                $paid = (float) $payData['paid_amount'];
                $disc = (float) ($payData['discount'] ?? 0);

                $normalizedAccountType = strtoupper(str_replace(' ', '', $waybill->account_type ?? ''));
                if ($normalizedAccountType === 'TOPAY' && strtoupper($waybill->status) !== 'DELIVERED') {
                    throw new \Exception("Payment can only be collected for DELIVERED waybills for TOPAY account type. GC: {$waybill->gc_number} is " . $waybill->status);
                }

                $canPay = (float) $waybill->grand_total - (float) $waybill->amount_paid;

                if ($paid + $disc > $canPay + 0.01) {
                    throw new \Exception("Payment for GC {$waybill->gc_number} exceeds balance. Max allowed: {$canPay}");
                }

                $waybill->amount_paid += ($paid + $disc);
                $waybill->discount = ($waybill->discount ?? 0) + $disc; // Update cumulative discount
                $waybill->save();

                // 2. Create detailed payment record
                WaybillPayment::create([
                    'waybill_id' => $waybill->id,
                    'paid_amount' => $paid,
                    'discount' => $disc,
                    'payment_date' => $validated['payment_date'],
                    'mode_of_pay' => $validated['mode_of_pay'],
                    'receipt_no' => $validated['ref_no'],
                    'remarks' => $validated['remarks'],
                    'branch_id' => $validated['branch_id'],
                    'created_by' => auth()->id() ?? 1, // Fallback to system admin
                ]);

                $totalPaidAmount += $paid;
                $totalDiscountAmount += $disc;
                $gcNumbers[] = $waybill->gc_number;

                // Audit log for each
                AuditLog::record($waybill, 'PAYMENT_RECEIVE', null, ['balance' => $waybill->grand_total - $waybill->amount_paid], $waybill->gc_number, "Payment: {$paid}, Discount: {$disc}");
            }

            if ($totalPaidAmount > 0) {
                $totalBeforeDiscount = $totalPaidAmount + $totalDiscountAmount;
                $remarks = "Bulk Payment on: " . $validated['payment_date'] .
                    " | Consignor: " . $validated['payer_name'] .
                    ($validated['ref_no'] ? " [Ref: {$validated['ref_no']}]" : "") .
                    " | Total: ₹" . number_format($totalBeforeDiscount, 2) .
                    " | Discount: ₹" . number_format($totalDiscountAmount, 2) .
                    " | Net Cash Received: ₹" . number_format($totalPaidAmount, 2);

                // Create single Cash Book Entry for the bulk sum
                CashBookEntry::create([
                    'voucher_no' => 'BLK-' . strtoupper(substr(uniqid(), -6)),
                    'transaction_date' => $validated['payment_date'],
                    'transaction_type' => 'CREDIT',
                    'account_head_id' => $this->getBookingAccountHeadId(),
                    'amount' => $totalPaidAmount,
                    'branch_id' => $validated['branch_id'],
                    'paid_to_receive_from' => $validated['payer_name'],
                    'mode_of_pay' => strtoupper($validated['mode_of_pay']),
                    'remarks' => $remarks,
                    'authorised_by' => 'User',
                    'paid_by_received_by' => $validated['payer_name'],
                    'is_closing_entry' => false
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Bulk payment processed successfully',
                'total_paid' => $totalPaidAmount
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
     * Get summarized report of pending payments.
     */
    public function getPaymentPendingReport(Request $request): JsonResponse
    {
        try {
            // Return individual GC records (flat list) with outstanding balance
            $query = Waybill::with(['consignor', 'originBranch', 'destination'])
                ->whereRaw('grand_total > (COALESCE(amount_paid, 0) + 0.01)'); // Use small epsilon for float comparison

            if ($request->filled('from_date')) {
                $query->whereDate('bill_date', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('bill_date', '<=', $request->to_date);
            }
            if ($request->filled('branch_id') && $request->branch_id !== 'All Branches') {
                $query->where('origin_branch_id', $request->branch_id);
            }
            if ($request->filled('consignor_id')) {
                $query->where('consignor_id', $request->consignor_id);
            }
            if ($request->filled('account_type')) {
                $query->where('account_type', $request->account_type);
            }

            $waybills = $query->orderBy('bill_date', 'desc')->get();

            $data = $waybills->map(function ($wb) {
                return [
                    'gc_number'      => $wb->gc_number,
                    'bill_date'      => $wb->bill_date,
                    'consignor_name' => $wb->consignor->name ?? 'Unknown',
                    'account_type'   => $wb->account_type ?? 'Other',
                    'destination'    => $wb->destination->city_name ?? '-',
                    'branch'         => $wb->originBranch->branch_name ?? '-',
                    'grand_total'    => (float) $wb->grand_total,
                    'amount_paid'    => (float) $wb->amount_paid,
                    'balance'        => (float) ($wb->grand_total - $wb->amount_paid),
                    'status'         => $wb->status,
                ];
            })->values();

            return response()->json([
                'success' => true,
                'data'    => $data,
                'summary' => [
                    'total_pending' => (float) $data->sum('balance'),
                    'total_count'   => (int) $data->count()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user history report (what each clerk/admin did)
     */
    public function getUserHistoryReport(Request $request): JsonResponse
    {
        try {
            $query = Waybill::with(['destination', 'originBranch']);

            if ($request->filled('from_date')) {
                $query->whereDate('bill_date', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('bill_date', '<=', $request->to_date);
            }
            if ($request->filled('branch_id')) {
                $query->where('origin_branch_id', $request->branch_id);
            }
            if ($request->filled('created_by')) {
                $query->where('created_by', $request->created_by);
            }

            $data = $query->latest()->get();

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user history: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel a waybill at any stage.
     */
    public function cancel(Request $request, $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $waybill = Waybill::with(['originBranch', 'consignor'])->find($id);
            if (!$waybill) {
                return response()->json(['success' => false, 'message' => 'Waybill not found'], 404);
            }

            // Branch Restriction: Only booked branch can cancel (unless it's a superadmin)
            // Assuming branch_id is passed in request or we can infer it
            $userBranchId = $request->input('branch_id');
            $userRole = $request->input('role'); // Get role to check for admin/superadmin

            if ($userRole !== 'superadmin') {
                if (!$userBranchId || $waybill->origin_branch_id != $userBranchId) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized: This Waybill can only be cancelled by the BOOKED BRANCH (' . ($waybill->originBranch->branch_name ?? 'Origin Branch') . ').'
                    ], 403);
                }
            }

            // Prevent cancellation of already delivered GCs
            if ($waybill->status === 'Delivered' || $waybill->deliver_status === 'DELIVERED') {
                return response()->json([
                    'success' => false,
                    'message' => 'This Waybill has already been DELIVERED and cannot be cancelled.'
                ], 400);
            }

            $request->validate([
                'cancel_reason' => 'required|string|max:500'
            ]);

            $oldStatus = $waybill->status;
            $oldDeliverStatus = $waybill->deliver_status;

            // Update waybill status
            $waybill->update([
                'status' => 'CANCELLED',
                'deliver_status' => 'CANCELLED',
                'remarks' => ($waybill->remarks ? $waybill->remarks . " | " : "") . "CANCELLED: " . $request->cancel_reason
            ]);

            // Financial Reversal: If it was a PAID GC, we need to create a DEBIT entry in the Cash Book
            if ($waybill->account_type === 'paid') {
                CashBookEntry::create([
                    'voucher_no' => 'CN-' . strtoupper(substr(uniqid(), -6)),
                    'transaction_date' => date('Y-m-d'),
                    'transaction_type' => 'DEBIT',
                    'account_head_id' => $this->getBookingAccountHeadId(),
                    'amount' => $waybill->grand_total,
                    'branch_id' => $waybill->origin_branch_id,
                    'paid_to_receive_from' => $waybill->consignor->name ?? 'Consignor',
                    'mode_of_pay' => 'CASH', // Reversing the original cash collection
                    'remarks' => "REVERSAL: GC booking cancelled ({$waybill->gc_number}). Reason: {$request->cancel_reason}",
                    'authorised_by' => 'System Auto',
                    'paid_by_received_by' => 'System',
                    'is_closing_entry' => false
                ]);
            }

            // Record Audit Log
            AuditLog::record(
                $waybill,
                'CANCEL',
                ['status' => $oldStatus, 'deliver_status' => $oldDeliverStatus],
                ['status' => 'CANCELLED', 'deliver_status' => 'CANCELLED'],
                $waybill->gc_number,
                "GC Cancelled. Reason: " . $request->cancel_reason
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Waybill cancelled successfully and financial entries reversed.',
                'data' => $waybill
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel Waybill: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the account head ID for booking payments.
     */
    private function getBookingAccountHeadId()
    {
        return AccountHead::firstOrCreate(
            ['name' => 'CONSIGNOR PAYMENT'],
            [
                'description' => 'Payment received against booking of goods / consignor account',
                'transaction_type' => 'CREDIT',
                'status' => 'Active'
            ]
        )->id;
    }

    public function uploadPod(Request $request, $id): JsonResponse
    {
        try {
            $waybill = Waybill::findOrFail($id);
            
            $request->validate([
                'pod_file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048',
            ]);

            if ($request->hasFile('pod_file')) {
                // Delete old POD if exists
                if ($waybill->delivery_proof) {
                    \Storage::disk('public')->delete($waybill->delivery_proof);
                }

                $file = $request->file('pod_file');
                
                if (in_array(strtolower($file->getClientOriginalExtension()), ['jpg', 'jpeg', 'png'])) {
                    // Use ImageHelper for compression (GD-based, works on shared hosting)
                    $filename = uniqid();
                    $path = \App\Helpers\ImageHelper::compressAndStore($file, 'pods', $filename, 800, 70);
                } else {
                    // Normal upload for PDFs
                    $path = $file->store('pods', 'public');
                }
                
                $waybill->update([
                    'delivery_proof' => $path,
                    'delivered_at' => $waybill->delivered_at ?? now(),
                    'remarks' => ($waybill->remarks ? $waybill->remarks . ' | ' : '') . 'POD Uploaded at ' . now()->format('Y-m-d H:i')
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'POD uploaded successfully',
                    'path' => $path
                ]);
            }

            return response()->json(['success' => false, 'message' => 'No file uploaded'], 400);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}

