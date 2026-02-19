<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TripSheet;
use App\Models\TripSheetDetail;
use App\Models\Waybill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class TripSheetController extends Controller
{
    /**
     * Display a listing of trip sheets with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = TripSheet::with(['vehicle', 'driver', 'dispatchBranch', 'destinationBranch', 'waybills']);

            if ($request->has('from_date')) {
                $query->whereDate('trip_date', '>=', $request->from_date);
            }
            if ($request->has('to_date')) {
                $query->whereDate('trip_date', '<=', $request->to_date);
            }
            if ($request->has('branch_id')) {
                $query->where('dispatch_branch_id', $request->branch_id);
            }
            
            // Default: Only show acknowledged trip sheets in report unless requested otherwise
            if ($request->has('show_all') && $request->show_all == 'true') {
                // Show all
            } else if ($request->has('status')) {
                $query->where('status', $request->status);
            } else {
                $query->whereNotNull('ack_date');
            }

            $tripSheets = $query->orderBy('trip_date', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $tripSheets
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get trip sheets awaiting acknowledgment.
     */
    public function getAwaitingAck(Request $request): JsonResponse
    {
        try {
            $query = TripSheet::with(['vehicle', 'driver', 'dispatchBranch', 'destinationBranch', 'waybills'])
                ->whereNull('ack_date');

            if ($request->has('branch_id')) {
                $query->where('dispatch_branch_id', $request->branch_id);
            }

            $tripSheets = $query->orderBy('trip_date', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $tripSheets
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get trip sheets awaiting verification (acknowledged but not verified).
     */
    public function getAwaitingVerification(Request $request): JsonResponse
    {
        try {
            $query = TripSheet::with(['vehicle', 'driver', 'dispatchBranch', 'destinationBranch', 'waybills'])
                ->whereNotNull('ack_date')
                ->whereNull('verification_date');

            if ($request->has('branch_id') && !empty($request->branch_id)) {
                $query->where('dispatch_branch_id', $request->branch_id);
            }

            if ($request->has('from_date')) {
                $query->whereDate('trip_date', '>=', $request->from_date);
            }
            if ($request->has('to_date')) {
                $query->whereDate('trip_date', '<=', $request->to_date);
            }

            $tripSheets = $query->orderBy('trip_date', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $tripSheets
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Verify a trip sheet.
     */
    public function verify(Request $request, $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $tripSheet = TripSheet::find($id);
            if (!$tripSheet) {
                return response()->json(['success' => false, 'message' => 'Trip Sheet not found'], 404);
            }

            $validated = $request->validate([
                'verification_date' => 'required|date',
                'verified_by' => 'required|exists:admins,id'
            ]);

            $tripSheet->update(array_merge($validated, [
                'status' => 'VERIFIED'
            ]));

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Trip Sheet verified successfully',
                'data' => $tripSheet
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Submit acknowledgment for a trip sheet.
     */
    public function acknowledge(Request $request, $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $tripSheet = TripSheet::find($id);
            if (!$tripSheet) {
                return response()->json(['success' => false, 'message' => 'Trip Sheet not found'], 404);
            }

            $validated = $request->validate([
                'ack_date' => 'required|date',
                'ack_remarks' => 'nullable|string',
                'total_freight' => 'required|numeric',
                'total_collection' => 'required|numeric',
                'less_paid_driver' => 'required|numeric',
                'balance_at_office' => 'required|numeric',
                'total_kms' => 'required|numeric',
            ]);

            $tripSheet->update(array_merge($validated, [
                'status' => 'DELIVERED'
            ]));

            // Update all associated GC/Waybill statuses to 'dispatched' as per user request
            $waybillIds = TripSheetDetail::where('trip_sheet_id', $tripSheet->id)
                ->pluck('waybill_id');

            if ($waybillIds->isNotEmpty()) {
                Waybill::whereIn('id', $waybillIds)
                    ->update(['status' => 'dispatched']);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Trip Sheet acknowledged successfully and GCs marked as dispatched',
                'data' => $tripSheet
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created trip sheet.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'trip_number' => 'nullable|string|unique:trip_sheets,trip_number',
                'trip_date' => 'required|date',
                'vehicle_id' => 'required|exists:vehicles,id',
                'driver_id' => 'required|exists:drivers,id',
                'owner_name' => 'nullable|string',
                'dispatch_date' => 'nullable|date',
                'dispatch_branch_id' => 'nullable|exists:branches,id',
                'destination_branch_id' => 'nullable|exists:branches,id',
                'advance_amount' => 'nullable|numeric',
                'lr_number' => 'nullable|string',
                'cr_number' => 'nullable|string',
                'indent_number' => 'nullable|string',
                'trip_remarks' => 'nullable|string',
                'gc_ids' => 'required|array|min:1',
                'gc_ids.*' => 'exists:waybills,id'
            ]);

            // Auto-generate trip number if not provided
            if (empty($validated['trip_number'])) {
                $lastTrip = TripSheet::orderBy('id', 'desc')->first();
                $nextId = $lastTrip ? $lastTrip->id + 1 : 1;
                $validated['trip_number'] = 'TS-' . date('Y') . '-' . str_pad($nextId, 5, '0', STR_PAD_LEFT);
            }

            $tripSheet = TripSheet::create(array_merge($validated, [
                'status' => 'PENDING',
                'created_by' => $request->user_id ?? null
            ]));

            foreach ($validated['gc_ids'] as $waybillId) {
                TripSheetDetail::create([
                    'trip_sheet_id' => $tripSheet->id,
                    'waybill_id' => $waybillId
                ]);
                
                // Update waybill status to DISPATCHED
                Waybill::where('id', $waybillId)->update(['status' => 'DISPATCHED']);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Trip Sheet created successfully',
                'data' => $tripSheet->load(['vehicle', 'driver', 'waybills'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create Trip Sheet: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified trip sheet.
     */
    public function show($id): JsonResponse
    {
        try {
            $tripSheet = TripSheet::with(['vehicle', 'driver', 'dispatchBranch', 'destinationBranch', 'waybills.articles', 'waybills.consignor', 'waybills.consignee', 'waybills.destination'])->find($id);

            if (!$tripSheet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trip Sheet not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $tripSheet
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search trip sheet by Trip Number.
     */
    public function searchByTripNumber($tripNumber): JsonResponse
    {
        try {
            $tripSheet = TripSheet::with(['vehicle', 'driver', 'dispatchBranch', 'destinationBranch', 'waybills.articles', 'waybills.consignor', 'waybills.consignee'])
                ->where('trip_number', $tripNumber)
                ->first();

            if (!$tripSheet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trip Sheet not found with Number: ' . $tripNumber
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $tripSheet
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified trip sheet.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $tripSheet = TripSheet::find($id);
            if (!$tripSheet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trip Sheet not found'
                ], 404);
            }

            $validated = $request->validate([
                'trip_date' => 'nullable|date',
                'vehicle_id' => 'nullable|exists:vehicles,id',
                'driver_id' => 'nullable|exists:drivers,id',
                'owner_name' => 'nullable|string',
                'dispatch_date' => 'nullable|date',
                'dispatch_branch_id' => 'nullable|exists:branches,id',
                'destination_branch_id' => 'nullable|exists:branches,id',
                'advance_amount' => 'nullable|numeric',
                'lr_number' => 'nullable|string',
                'cr_number' => 'nullable|string',
                'indent_number' => 'nullable|string',
                'trip_remarks' => 'nullable|string',
                'status' => 'nullable|string',
                'ack_date' => 'nullable|date',
                'ack_remarks' => 'nullable|string',
                'waybill_ids' => 'nullable|array',
                'waybill_ids.*' => 'exists:waybills,id'
            ]);

            $tripSheet->update($validated);

            if (isset($validated['gc_ids'])) {
                // Re-sync waybills
                // First, reset old waybills status to PENDING
                $oldWaybillIds = TripSheetDetail::where('trip_sheet_id', $tripSheet->id)->pluck('waybill_id');
                Waybill::whereIn('id', $oldWaybillIds)->update(['status' => 'PENDING']);
                
                // Delete old details
                TripSheetDetail::where('trip_sheet_id', $tripSheet->id)->delete();

                // Create new details
                foreach ($validated['gc_ids'] as $waybillId) {
                    TripSheetDetail::create([
                        'trip_sheet_id' => $tripSheet->id,
                        'waybill_id' => $waybillId
                    ]);
                    Waybill::where('id', $waybillId)->update(['status' => 'DISPATCHED']);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Trip Sheet updated successfully',
                'data' => $tripSheet->load(['vehicle', 'driver', 'waybills'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update Trip Sheet: ' . $e->getMessage()
            ], 500);
        }
    }
}
