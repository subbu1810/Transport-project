<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TripSheet;
use App\Models\TripSheetDetail;
use App\Models\Waybill;
use App\Models\Branch;
use App\Models\CashBookEntry;
use App\Models\AccountHead;
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
            $query = TripSheet::with(['vehicle', 'driver', 'dispatchBranch', 'destinationBranch', 'alertBranchData', 'waybills', 'ackBranch', 'ackByAdmin', 'route.stops.branch']);

            if ($request->filled('from_date')) {
                $query->whereDate('trip_date', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('trip_date', '<=', $request->to_date);
            }
            if ($request->filled('branch_id')) {
                $query->where('dispatch_branch_id', $request->branch_id);
            }
            
            // Filter by trip_type if provided (supports comma-separated list)
            if ($request->filled('trip_type')) {
                $types = explode(',', $request->trip_type);
                // Special handling for 'REGULAR' which is often used interchangeably with 'INTERSTATE'
                if (in_array('REGULAR', $types) && !in_array('INTERSTATE', $types)) {
                    $types[] = 'INTERSTATE';
                }
                $query->whereIn('trip_type', $types);
            }

            // Optional: Filter by status if provided
            if ($request->has('status')) {
                $query->where('status', $request->status);
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
            $query = TripSheet::with([
                'vehicle', 'driver', 'dispatchBranch', 'destinationBranch', 'alertBranchData', 
                'waybills.destination', 'waybills.destination.taluk',
                'waybills.destination.branchMappings.branch',
                'route.stops.branch'
            ])
                ->whereNull('ack_date');
            
            if ($request->has('branch_id') && !empty($request->branch_id)) {
                $branchId = $request->branch_id;
                $query->where(function ($q) use ($branchId) {
                    $q->where('destination_branch_id', $branchId)
                      ->orWhere('alert_branch', $branchId)
                      ->orWhereHas('route.stops', function($sq) use ($branchId) {
                          $sq->where('branch_id', $branchId);
                      });
                });
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
            $query = TripSheet::with(['vehicle', 'driver', 'dispatchBranch', 'destinationBranch', 'alertBranchData', 'waybills.consignee', 'waybills.destination', 'route.stops.branch'])
                ->where('status', '!=', 'VERIFIED');

            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('trip_number', 'like', "%{$search}%")
                      ->orWhereHas('vehicle', function($v) use ($search) {
                          $v->where('vehicle_number', 'like', "%{$search}%");
                      });
                });
            } else {
                if ($request->has('branch_id') && !empty($request->branch_id)) {
                    $branchId = $request->branch_id;
                    $query->where(function($q) use ($branchId) {
                        $q->where('dispatch_branch_id', $branchId)
                          ->orWhere('destination_branch_id', $branchId)
                          ->orWhere('ack_branch_id', $branchId)
                          ->orWhere('alert_branch', $branchId);
                    });
                }

                if ($request->has('from_date')) {
                    $query->whereDate('trip_date', '>=', $request->from_date);
                }
                if ($request->has('to_date')) {
                    $query->whereDate('trip_date', '<=', $request->to_date);
                }
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
     * Verify a trip sheet and record To Pay collections.
     */
    public function verify(Request $request, $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $tripSheet = TripSheet::with(['waybills', 'dispatchBranch'])->find($id);
            if (!$tripSheet) {
                return response()->json(['success' => false, 'message' => 'Trip Sheet not found'], 404);
            }

            $validated = $request->validate([
                'verification_date'    => 'required|date',
                'verified_by'          => 'required|exists:admins,id',
                'topay_collected'      => 'nullable|numeric|min:0',
                'topay_payment_mode'   => 'nullable|string',
                'verification_remarks' => 'nullable|string',
                'delivered_gc_ids'     => 'nullable|array',
                'delivered_gc_ids.*'   => 'exists:waybills,id',
                'branch_id'            => 'nullable|exists:branches,id',
                'opening_km'           => 'nullable|numeric',
                'closing_km'           => 'nullable|numeric',
                'total_kms'            => 'nullable|numeric',
                'rate_per_km'          => 'nullable|numeric',
                'total_freight'        => 'nullable|numeric',
                'less_paid_driver'     => 'nullable|numeric',
                'balance_at_office'    => 'nullable|numeric',
            ]);

            // Auto-acknowledge if not already done
            if (!$tripSheet->ack_date) {
                $tripSheet->update([
                    'ack_date' => $validated['verification_date'] ?? now(),
                    'ack_branch_id' => $validated['branch_id'] ?? null,
                    'ack_by' => $validated['verified_by'] ?? null,
                    'ack_timestamp' => now(),
                    'status' => 'DELIVERED'
                ]);
            }

            // Branch Authorization Check (Skip for Superadmin)
            // Removed restrictive origin-only check to allow unified Ack/Verify flow
            $isAdmin = $request->header('X-User-Role') === 'superadmin' || (auth()->user() && auth()->user()->role === 'superadmin');
            if (!$isAdmin && $request->filled('branch_id')) {
                $userBranchId = $request->branch_id;
                // Allow verification by origin, destination, or alert branch
                if ($tripSheet->dispatch_branch_id != $userBranchId && 
                    $tripSheet->destination_branch_id != $userBranchId && 
                    $tripSheet->alert_branch != $userBranchId) {
                    return response()->json([
                        'success' => false, 
                        'message' => 'Unauthorized: Only participating branches can verify this trip.'
                    ], 403);
                }
            }

            // --- 1. Filter GCs based on Admin selection ---
            $deliveredIds = $validated['delivered_gc_ids'] ?? [];
            $toPayWaybills = $tripSheet->waybills->filter(function($wb) use ($deliveredIds) {
                return strtolower($wb->account_type) === 'topay' && in_array($wb->id, $deliveredIds);
            });

            $expectedTopay = $toPayWaybills->sum(fn($wb) => (float)($wb->grand_total ?? $wb->total_amount ?? 0));
            $actualCollected = (float)($validated['topay_collected'] ?? 0);

            // --- 2. Create Cash Book CREDIT entry if any amount collected ---
            if ($actualCollected > 0) {
                $accountHead = AccountHead::firstOrCreate(
                    ['name' => 'To Pay Collections'],
                    [
                        'description'      => 'Cash collected from consignees for To Pay GCs',
                        'transaction_type' => 'CREDIT',
                        'status'           => 'active',
                    ]
                );

                $voucherNo = 'TCP-' . $tripSheet->trip_number . '-' . date('His');

                CashBookEntry::create([
                    'voucher_no'          => $voucherNo,
                    'transaction_date'    => $validated['verification_date'],
                    'transaction_type'    => 'CREDIT',
                    'account_head_id'     => $accountHead->id,
                    'amount'              => $actualCollected,
                    'branch_id'           => $validated['branch_id'] ?? $tripSheet->dispatch_branch_id,
                    'paid_to_receive_from'=> $tripSheet->driver?->name ?? 'Driver',
                    'mode_of_pay'         => $validated['topay_payment_mode'] ?? 'CASH',
                    'remarks'             => 'To Pay collection from Trip ' . $tripSheet->trip_number
                                          . ' | Selected GCs: ' . count($deliveredIds)
                                          . ' | Expected: ₹' . number_format($expectedTopay, 2)
                                          . ' | Collected: ₹' . number_format($actualCollected, 2)
                                          . ($expectedTopay > $actualCollected
                                              ? ' | SHORTFALL: ₹' . number_format($expectedTopay - $actualCollected, 2)
                                              : ''),
                ]);
            }

            // --- 2b. Create Cash Book DEBIT entry for Driver Payout if any ---
            $driverPayout = (float)($validated['less_paid_driver'] ?? 0);
            if ($driverPayout > 0) {
                $payoutHead = AccountHead::firstOrCreate(
                    ['name' => 'Driver Payout'],
                    ['transaction_type' => 'DEBIT', 'status' => 'active', 'description' => 'Final payment to driver at destination']
                );

                CashBookEntry::create([
                    'voucher_no'          => 'PAY-' . $tripSheet->trip_number . '-' . date('His'),
                    'transaction_date'    => $validated['verification_date'],
                    'transaction_type'    => 'DEBIT',
                    'account_head_id'     => $payoutHead->id,
                    'amount'              => $driverPayout,
                    'branch_id'           => $validated['branch_id'] ?? $tripSheet->dispatch_branch_id,
                    'paid_to_receive_from'=> $tripSheet->driver?->name ?? 'Driver',
                    'mode_of_pay'         => $validated['topay_payment_mode'] ?? 'CASH',
                    'remarks'             => 'Final driver payout for Trip ' . $tripSheet->trip_number
                                          . ' recorded during verification.',
                ]);
            }

            // --- 3. Update Status and Payment for ALL Selected GCs ---
            $allWaybills = $tripSheet->waybills;
            foreach ($allWaybills as $wb) {
                if (in_array($wb->id, $deliveredIds)) {
                    $updateData = [
                        'status'         => 'DELIVERED',
                        'deliver_status' => 'DELIVERED',
                        'delivered_at'   => now(),
                        'delivered_branch_id' => $tripSheet->destination_branch_id,
                    ];

                    // For To-Pay GCs, also record the payment
                    if (strtolower($wb->account_type) === 'topay') {
                        $updateData['amount_paid'] = $wb->grand_total ?? $wb->total_amount ?? 0;
                        $updateData['payment_method'] = $validated['topay_payment_mode'] ?? 'CASH';
                    }

                    $wb->update($updateData);
                }
            }

            // --- 4. Update Trip Sheet as VERIFIED AND Update Vehicle Location ---
            $shortfall = max(0, $expectedTopay - $actualCollected);
            $tripSheet->update([
                'verification_date'    => $validated['verification_date'],
                'verified_by'          => $validated['verified_by'],
                'status'               => 'VERIFIED',
                'opening_km'           => $validated['opening_km'] ?? $tripSheet->opening_km,
                'closing_km'           => $validated['closing_km'] ?? $tripSheet->closing_km,
                'total_kms'            => $validated['total_kms'] ?? $tripSheet->total_kms,
                'rate_per_km'          => $validated['rate_per_km'] ?? $tripSheet->rate_per_km,
                'total_freight'        => $validated['total_freight'] ?? $tripSheet->total_freight,
                'total_collection'     => $actualCollected,
                'less_paid_driver'     => $validated['less_paid_driver'] ?? $tripSheet->less_paid_driver,
                'balance_at_office'    => $validated['balance_at_office'] ?? $tripSheet->balance_at_office,
                'driver_pending_amount'=> $shortfall,
                'ack_remarks'          => ($tripSheet->ack_remarks ? $tripSheet->ack_remarks . ' | ' : '') . 
                                         ($validated['verification_remarks'] ?? '')
                                         . ($shortfall > 0 ? ' | To Pay Shortfall: ₹' . number_format($shortfall, 2) : ''),
            ]);

            // Handover: Vehicle's home location is now the destination branch
            if ($tripSheet->vehicle) {
                $tripSheet->vehicle->update(['branch_id' => $tripSheet->destination_branch_id]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Trip Sheet verified. ' . ($actualCollected > 0
                    ? 'To Pay collection of ₹' . number_format($actualCollected, 2) . ' recorded in Cash Book.'
                    : 'No To Pay amount recorded.'),
                'data' => [
                    'trip_sheet'       => $tripSheet,
                    'topay_expected'   => $expectedTopay,
                    'topay_collected'  => $actualCollected,
                    'shortfall'        => $shortfall,
                    'gcs_paid'         => $toPayWaybills->count(),
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function checkVehicleAvailability(Request $request, $vehicleId): JsonResponse
    {
        try {
            $requestingBranchId = $request->query('requesting_branch_id');
            
            // Find the most recent trip that is NOT yet ACKNOWLEDGED
            $activeTrip = TripSheet::with(['dispatchBranch'])
                ->where('vehicle_id', $vehicleId)
                ->whereNull('ack_date')
                ->orderBy('id', 'desc')
                ->first();

            if ($activeTrip) {
                // If it's a LOCAL trip, it's strictly locked for that branch until it returns (Ack)
                if ($activeTrip->trip_type === 'LOCAL') {
                     if ($requestingBranchId && (int)$activeTrip->dispatch_branch_id === (int)$requestingBranchId) {
                         return response()->json([
                             'success' => true,
                             'available' => false,
                             'message' => "Vehicle is currently out on a Local Trip ({$activeTrip->trip_number}). It must return and be Acknowledged before starting a new trip."
                         ]);
                     }
                }

                // Rule: Locked ONLY for the booking branch (dispatch_branch_id) during transit
                if ($requestingBranchId && (int)$activeTrip->dispatch_branch_id === (int)$requestingBranchId) {
                    return response()->json([
                        'success' => true,
                        'available' => false,
                        'message' => "Vehicle is currently in transit (Trip {$activeTrip->trip_number}). As the booking branch, you must wait for acknowledgment at the destination before using it again."
                    ]);
                }
                
                // For other branches, it's available even if in transit (pre-booking)
                return response()->json([
                    'success' => true,
                    'available' => true,
                    'message' => "Vehicle is arriving from {$activeTrip->dispatchBranch?->branch_name}. Ready for onward/future booking."
                ]);
            }

            // Fallback: If no transit trips (all trips are Acknowledged), it is available for everyone.
            return response()->json([
                'success' => true,
                'available' => true
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get trip sheets for a specific alert branch.
     */
    public function getAlerts(Request $request): JsonResponse
    {
        try {
            $query = TripSheet::with([
                'vehicle', 'driver', 'dispatchBranch', 'destinationBranch', 'alertBranchData', 
                'waybills.consignor', 'waybills.consignee', 'waybills.destination'
            ])->whereNotNull('alert_branch')
                ->whereNull('ack_date')           // Show BEFORE it is acknowledged (arrival)
                ->where('status', 'DISPATCHED');   // Trip must be in transit

            // Filter by alert branch (the branch that should see the alert)
            if ($request->filled('branch_id')) {
                $query->where('alert_branch', $request->branch_id);
            }

            if ($request->filled('from_date')) {
                $query->whereDate('trip_date', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('trip_date', '<=', $request->to_date);
            }

            $tripSheets = $query->orderBy('ack_date', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $tripSheets
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function acknowledge(Request $request, $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $tripSheet = TripSheet::with(['vehicle', 'driver'])->find($id);
            if (!$tripSheet) {
                return response()->json(['success' => false, 'message' => 'Trip Sheet not found'], 404);
            }

            $validated = $request->validate([
                'ack_date' => 'required|date',
                'ack_remarks' => 'nullable|string',
                'opening_km' => 'nullable|numeric',
                'branch_id' => 'nullable|exists:branches,id',
            ]);

            // Branch Authorization Check (Skip for Superadmin)
            $isAdmin = $request->header('X-User-Role') === 'superadmin' || (auth()->user() && auth()->user()->role === 'superadmin');
            if (!$isAdmin && $request->filled('branch_id')) {
                $userBranchId = (int)$request->branch_id;
                $isStopInRoute = $tripSheet->route ? $tripSheet->route->stops()->where('branch_id', $userBranchId)->exists() : false;
                
                if ($tripSheet->destination_branch_id != $userBranchId && $tripSheet->alert_branch != $userBranchId && !$isStopInRoute) {
                    return response()->json([
                        'success' => false, 
                        'message' => 'Unauthorized: Only participating branches in this route can acknowledge this arrival.'
                    ], 403);
                }
            }

            $tripSheet->update(array_merge($validated, [
                'status' => 'DELIVERED',
                'ack_branch_id' => $validated['branch_id'] ?? null,
                'ack_by' => $request->user_id ?? (auth()->id() ?? null),
                'ack_timestamp' => now()
            ]));

            // --- 2. Update Vehicle's physical location immediately ---
            if ($tripSheet->vehicle) {
                $tripSheet->vehicle->update([
                    'branch_id' => $validated['branch_id'] ?? $tripSheet->destination_branch_id
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Trip Sheet acknowledged and financial entries posted to Cash Book',
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
                'alert_branch' => 'nullable|integer',
                'mode_of_pay' => 'nullable|string',
                'advance_amount' => 'nullable|numeric',
                'opening_km' => 'nullable|numeric',
                'route_id' => 'nullable|exists:routes,id',
                'gc_ids' => 'required|array|min:1',
                'gc_ids.*' => 'exists:waybills,id'
            ]);
            
            // Check for any active (unacknowledged) trips for this vehicle
            $activeTrip = TripSheet::where('vehicle_id', $validated['vehicle_id'])
                ->whereNull('ack_date')
                ->orderBy('id', 'desc')
                ->first();
                
            if ($activeTrip) {
                $requestingBranchId = (int)($validated['dispatch_branch_id'] ?? 0);
                
                // Rule: Block only the booking branch (dispatch_branch_id) during transit
                if ((int)$activeTrip->dispatch_branch_id === $requestingBranchId) {
                    return response()->json([
                        'success' => false,
                        'message' => "Vehicle is currently in transit for Trip {$activeTrip->trip_number}. As the booking branch, you cannot book it again until it is Acknowledged at its destination."
                    ], 422);
                }
            }

            // Auto-calculate destination branch based on max GC count if not provided
            $destinationBranchId = $validated['destination_branch_id'] ?? null;
            if (!$destinationBranchId) {
                $branchCounts = [];
                $waybillsForCount = Waybill::with('destination.branchMappings')->whereIn('id', $validated['gc_ids'])->get();
                foreach ($waybillsForCount as $wb) {
                    $mapping = $wb->destination?->branchMappings?->first();
                    if ($mapping) {
                        $bId = $mapping->branch_id;
                        $branchCounts[$bId] = ($branchCounts[$bId] ?? 0) + 1;
                    }
                }
                if (!empty($branchCounts)) {
                    arsort($branchCounts); // Sort in descending order to get the max
                    $destinationBranchId = array_key_first($branchCounts);
                }
            }

            // 1. Create trip sheet with a temporary unique number
            $tripSheet = TripSheet::create(array_merge($validated, [
                'trip_number' => 'TS-TMP-' . uniqid(),
                'status' => 'DISPATCHED',
                'trip_type' => $request->trip_type ?? 'INTERSTATE',
                'created_by' => $request->user_id ?? null,
                'destination_branch_id' => $destinationBranchId
            ]));

            // 2. Generate permanent sequence using the latest trip number for that branch
            $branchCode = 'XX';
            if (!empty($validated['dispatch_branch_id'])) {
                $branch = Branch::find($validated['dispatch_branch_id']);
                if ($branch && $branch->branch_code) {
                    $branchCode = strtoupper($branch->branch_code);
                }
            }

            // Find the highest existing trip number for this branch
            $fullPrefix = $branchCode . 'TS';
            $lastTrip = TripSheet::where('dispatch_branch_id', $validated['dispatch_branch_id'])
                ->where('trip_number', 'LIKE', $fullPrefix . '%')
                ->where('id', '!=', $tripSheet->id)
                ->orderByRaw('LENGTH(trip_number) DESC')
                ->orderBy('trip_number', 'DESC')
                ->first();

            $nextNum = 1;
            if ($lastTrip) {
                $lastNumStr = str_replace($fullPrefix, '', $lastTrip->trip_number);
                if (is_numeric($lastNumStr)) {
                    $nextNum = intval($lastNumStr) + 1;
                } else {
                    $nextNum = TripSheet::where('dispatch_branch_id', $validated['dispatch_branch_id'])->count();
                }
            }

            // Uniqueness safety loop
            $finalTripNumber = $fullPrefix . $nextNum;
            while (TripSheet::where('trip_number', $finalTripNumber)->exists()) {
                $nextNum++;
                $finalTripNumber = $fullPrefix . $nextNum;
            }

            $tripSheet->update(['trip_number' => $finalTripNumber]);

            foreach ($validated['gc_ids'] as $waybillId) {
                TripSheetDetail::create([
                    'trip_sheet_id' => $tripSheet->id,
                    'waybill_id' => $waybillId
                ]);
                
                // Update waybill status
                $newStatus = ($tripSheet->trip_type === 'LOCAL') ? 'LOCAL_TRIP' : 'DISPATCHED';
                Waybill::where('id', $waybillId)->update(['status' => $newStatus]);

                \App\Models\WaybillTransit::create([
                    'waybill_id' => $waybillId,
                    'branch_id' => $validated['dispatch_branch_id'] ?? 1, // Fallback to 1 if not provided, though it should be
                    'trip_sheet_id' => $tripSheet->id,
                    'status' => 'DISPATCHED',
                    'remarks' => "Dispatched via Trip Sheet {$finalTripNumber}",
                ]);
            }

            // --- 3. Removed: Post Driver Advance to Cash Book (DEBIT) as per user request ---

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
            $tripSheet = TripSheet::with(['vehicle', 'driver', 'dispatchBranch', 'destinationBranch', 'alertBranchData', 'waybills.articles', 'waybills.consignor', 'waybills.consignee', 'waybills.destination', 'route.stops.branch'])->find($id);

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
            $tripSheet = TripSheet::with(['vehicle', 'driver', 'dispatchBranch', 'destinationBranch', 'waybills.articles', 'waybills.consignor', 'waybills.consignee', 'waybills.destination', 'route.stops.branch'])
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

            // 🔒 Verified trip sheets cannot be edited
            if ($tripSheet->verification_date) {
                return response()->json([
                    'success' => false,
                    'message' => 'This Trip Sheet has been VERIFIED and is locked. Verified records cannot be modified.'
                ], 403);
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
                'alert_branch' => 'nullable|integer',
                'ack_remarks' => 'nullable|string',
                'opening_km' => 'nullable|numeric',
                'gc_ids' => 'nullable|array',
                'gc_ids.*' => 'exists:waybills,id'
            ]);

            // Auto-calculate destination branch based on max GC count if not explicitly set
            $destinationBranchId = $validated['destination_branch_id'] ?? $tripSheet->destination_branch_id;
            if (isset($validated['gc_ids'])) {
                $branchCounts = [];
                $waybillsForCount = Waybill::with('destination.branchMappings')->whereIn('id', $validated['gc_ids'])->get();
                foreach ($waybillsForCount as $wb) {
                    $mapping = $wb->destination?->branchMappings?->first();
                    if ($mapping) {
                        $bId = $mapping->branch_id;
                        $branchCounts[$bId] = ($branchCounts[$bId] ?? 0) + 1;
                    }
                }
                if (!empty($branchCounts)) {
                    arsort($branchCounts);
                    $destinationBranchId = array_key_first($branchCounts);
                }
            }
            $validated['destination_branch_id'] = $destinationBranchId;

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
                    $newStatus = ($tripSheet->trip_type === 'LOCAL') ? 'LOCAL_TRIP' : 'DISPATCHED';
                    Waybill::where('id', $waybillId)->update(['status' => $newStatus]);
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
