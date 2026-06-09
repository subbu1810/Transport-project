<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OwnerSettlement;
use App\Models\TripSheet;
use App\Models\VehicleOwner;
use App\Models\CashBookEntry;
use App\Models\AccountHead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OwnerSettlementController extends Controller
{
    /**
     * Display a listing of settlements.
     */
    public function index()
    {
        try {
            $settlements = OwnerSettlement::with('owner')->orderBy('created_at', 'desc')->get();
            return response()->json([
                'success' => true,
                'data' => $settlements
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get owners with unsettled trips.
     */
    public function getPendingSettlements()
    {
        try {
            // Get unique owners (by name) from unsettled trip sheets
            $pendingOwners = TripSheet::where('is_settled', false)
                ->where('status', 'VERIFIED') // Only verified trips can be settled
                ->select('owner_name', DB::raw('count(*) as trip_count'), DB::raw('sum(advance_amount) as total_advance'))
                ->groupBy('owner_name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $pendingOwners
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get pending trips for a specific owner.
     */
    public function getOwnerPendingTrips($ownerName)
    {
        try {
            $trips = TripSheet::where('owner_name', $ownerName)
                ->where('is_settled', false)
                ->where('status', 'VERIFIED')
                ->with('vehicle')
                ->get()
                ->map(function ($trip) {
                    // If trip has no rate_per_km, fall back to the vehicle's configured rate
                    if (empty($trip->rate_per_km) || $trip->rate_per_km == 0) {
                        $trip->rate_per_km = $trip->vehicle?->rate_per_km ?? 0;
                    }
                    return $trip;
                });

            return response()->json([
                'success' => true,
                'data' => $trips
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }


    /**
     * Store a newly created settlement in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'owner_name' => 'required|string',
            'trip_ids' => 'required|array',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date',
            'total_earnings' => 'required|numeric',
            'total_advances' => 'required|numeric',
            'driver_pending_deduction' => 'nullable|numeric',
            'net_payable' => 'required|numeric',
            'payment_method' => 'nullable|string',
            'payment_reference' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // 1. Ensure a VehicleOwner record exists for this name
            $owner = VehicleOwner::firstOrCreate(
                ['owner_name' => $validated['owner_name']],
                ['is_active' => true]
            );

            // Fetch dates if needed to satisfy DB constraints
            $selectedTrips = TripSheet::whereIn('id', $validated['trip_ids'])->select('trip_date')->get();
            $calculatedFromDate = $selectedTrips->min('trip_date') ?? now()->toDateString();
            $calculatedToDate = $selectedTrips->max('trip_date') ?? now()->toDateString();

            // 2. Create the settlement
            $settlement = OwnerSettlement::create([
                'owner_id' => $owner->id,
                'settlement_number' => 'SET-' . strtoupper(uniqid()),
                'from_date' => $validated['from_date'] ?? $calculatedFromDate,
                'to_date' => $validated['to_date'] ?? $calculatedToDate,
                'total_earnings' => $validated['total_earnings'],
                'total_advances' => $validated['total_advances'],
                'driver_pending_deduction' => $validated['driver_pending_deduction'] ?? 0,
                'net_payable' => $validated['net_payable'],
                'payment_date' => now(),
                'payment_method' => $validated['payment_method'],
                'payment_reference' => $validated['payment_reference'],
                'status' => 'PAID',
                'remarks' => $validated['remarks'],
            ]);

            // 3. Mark trips as settled
            TripSheet::whereIn('id', $validated['trip_ids'])
                ->update([
                    'is_settled' => true,
                    'settlement_id' => $settlement->id
                ]);

            // 4. Create CashBook record
            // Determine branch_id from the first selected trip sheet if available
            $firstTrip = TripSheet::find($validated['trip_ids'][0]);
            $branchId = $firstTrip ? ($firstTrip->dispatch_branch_id ?? $firstTrip->destination_branch_id) : null;

            if ($validated['net_payable'] > 0) {
                // We owe owner money -> DEBIT
                $accountHead = AccountHead::firstOrCreate(
                    ['name' => 'Owner Settlement Payouts'],
                    [
                        'description' => 'Final freight payments settling accounts with vehicle owners.',
                        'transaction_type' => 'DEBIT',
                        'status' => 'active'
                    ]
                );
                CashBookEntry::create([
                    'voucher_no' => 'OWNS-' . strtoupper(substr(uniqid(), -6)),
                    'transaction_date' => now(),
                    'transaction_type' => 'DEBIT',
                    'account_head_id' => $accountHead->id,
                    'amount' => $validated['net_payable'],
                    'branch_id' => $branchId,
                    'paid_to_receive_from' => $validated['owner_name'],
                    'mode_of_pay' => $validated['payment_method'] ?? 'CASH',
                    'remarks' => "Final payout for Settlement " . $settlement->settlement_number . " ({$validated['owner_name']}) | Target trips: " . count($validated['trip_ids'])
                ]);
            } elseif ($validated['net_payable'] < 0) {
                // Owner owes us money -> CREDIT
                $accountHead = AccountHead::firstOrCreate(
                    ['name' => 'Owner Recovery'],
                    [
                        'description' => 'Recovery of excessive advance or pending cash from owner.',
                        'transaction_type' => 'CREDIT',
                        'status' => 'active'
                    ]
                );
                CashBookEntry::create([
                     'voucher_no' => 'OWNR-' . strtoupper(substr(uniqid(), -6)),
                     'transaction_date' => now(),
                     'transaction_type' => 'CREDIT',
                     'account_head_id' => $accountHead->id,
                     'amount' => abs($validated['net_payable']),
                     'branch_id' => $branchId,
                     'paid_to_receive_from' => $validated['owner_name'],
                     'mode_of_pay' => $validated['payment_method'] ?? 'CASH',
                     'remarks' => "Recovery from Settlement " . $settlement->settlement_number . " ({$validated['owner_name']}) | Target trips: " . count($validated['trip_ids'])
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Settlement created successfully',
                'data' => $settlement
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $settlement = OwnerSettlement::with(['owner', 'tripSheets.vehicle'])->find($id);
            if (!$settlement) return response()->json(['success' => false, 'message' => 'Not found'], 404);
            
            return response()->json(['success' => true, 'data' => $settlement]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
