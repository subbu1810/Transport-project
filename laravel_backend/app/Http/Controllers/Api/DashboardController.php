<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TripSheet;
use App\Models\Waybill;
use App\Models\Vehicle;
use App\Models\Branch;
use App\Models\CashBookEntry;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function getStats(Request $request): JsonResponse
    {
        try {
            $branchId = $request->get('branch_id');

            $tripCount = TripSheet::query();
            $waybillCount = Waybill::query();
            $vehicleCount = Vehicle::query();
            $branchCount = Branch::query();

            if ($branchId) {
                $tripCount->where('dispatch_branch_id', $branchId);
                $waybillCount->where('origin_branch_id', $branchId);
            }

            $recentTripsQuery = TripSheet::with(['vehicle', 'dispatchBranch', 'destinationBranch', 'alertBranchData']);
            if ($branchId) {
                $recentTripsQuery->where('dispatch_branch_id', $branchId)
                               ->orWhere('destination_branch_id', $branchId);
            }
            $recentTrips = $recentTripsQuery->orderBy('trip_date', 'desc')->limit(10)->get();

            $incomingAlertsQuery = TripSheet::with(['vehicle', 'driver', 'dispatchBranch', 'destinationBranch', 'alertBranchData'])
                ->whereNotNull('alert_branch')
                ->whereNull('ack_date');
            
            if ($branchId) {
                $incomingAlertsQuery->where('alert_branch', $branchId)
                                    ->where('dispatch_branch_id', '!=', $branchId); // Don't show your own outgoing trips
            }
            $incomingAlerts = $incomingAlertsQuery->orderBy('trip_date', 'asc')->get();

            // 1. Stock at Warehouse (Status INWARDED but not DELIVERED)
            $warehouseStockQuery = Waybill::where('status', 'INWARDED');
            if ($branchId) {
                $warehouseStockQuery->where('inward_branch_id', $branchId);
            }
            $warehouseStockCount = $warehouseStockQuery->count();

            // 3. Pending POD Registry (Status DELIVERED but no delivery_proof)
            $pendingPodQuery = Waybill::where('status', 'DELIVERED')
                ->where(function($q) {
                    $q->whereNull('delivery_proof')->orWhere('delivery_proof', '');
                });
            if ($branchId) {
                $pendingPodQuery->where('delivered_branch_id', $branchId);
            }
            $pendingPodCount = $pendingPodQuery->count();

            // 4. Top 5 Consignors Leaderboard
            $topConsignorsQuery = Waybill::selectRaw('consignor_id, SUM(grand_total) as total_value, COUNT(*) as wb_count')
                ->groupBy('consignor_id')
                ->orderByDesc('total_value')
                ->limit(5)
                ->with('consignor');
            if ($branchId) {
                $topConsignorsQuery->where('origin_branch_id', $branchId);
            }
            $topConsignors = $topConsignorsQuery->get();

            $stats = [
                [
                    'label' => 'Warehouse Stock',
                    'value' => number_format($warehouseStockCount),
                    'icon' => 'LayoutGrid',
                    'color' => 'text-indigo-500',
                    'iconBg' => 'bg-indigo-500'
                ],
                [
                    'label' => 'Pending PODs',
                    'value' => number_format($pendingPodCount),
                    'icon' => 'FileSearch',
                    'color' => 'text-rose-500',
                    'iconBg' => 'bg-rose-500'
                ],
                [
                    'label' => 'Total Trips',
                    'value' => number_format($tripCount->count()),
                    'icon' => 'Truck',
                    'color' => 'text-blue-500',
                    'iconBg' => 'bg-blue-500'
                ],
                [
                    'label' => 'Total Waybills',
                    'value' => number_format($waybillCount->count()),
                    'icon' => 'FileText',
                    'color' => 'text-green-500',
                    'iconBg' => 'bg-green-500'
                ],
                [
                    'label' => 'Total Vehicles',
                    'value' => number_format($vehicleCount->count()),
                    'icon' => 'Truck',
                    'color' => 'text-purple-500',
                    'iconBg' => 'bg-purple-500'
                ],
            ];

            // If branch admin, or if there are alerts, add a special alert card
            if ($incomingAlerts->count() > 0) {
                array_unshift($stats, [
                    'label' => 'Incoming Trips',
                    'value' => number_format($incomingAlerts->count()),
                    'icon' => 'TrendingUp',
                    'color' => 'text-red-500',
                    'iconBg' => 'bg-red-500'
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'recent_trips' => $recentTrips,
                    'incoming_alerts' => $incomingAlerts,
                    'top_consignors' => $topConsignors
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getBookingDispatchStats(Request $request): JsonResponse
    {
        try {
            $fromDate = $request->get('from_date');
            $toDate = $request->get('to_date');
            $branchId = $request->get('branch_id');

            if (!$fromDate || !$toDate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dates are required'
                ], 400);
            }

            // Fetch all booking data in one go
            $bookingData = Waybill::selectRaw('bill_date, COUNT(*) as count, SUM(grand_total) as amount')
                ->whereBetween('bill_date', [$fromDate, $toDate])
                ->when($branchId, fn($q) => $q->where('origin_branch_id', $branchId))
                ->groupBy('bill_date')
                ->get()
                ->keyBy('bill_date');

            // Fetch all inward data in one go
            $inwardData = Waybill::selectRaw('DATE(inward_at) as date, COUNT(*) as count, SUM(grand_total) as amount')
                ->whereBetween('inward_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59'])
                ->when($branchId, fn($q) => $q->where('inward_branch_id', $branchId))
                ->groupBy('date')
                ->get()
                ->keyBy('date');

            $dailyStats = [];
            $currentTimestamp = strtotime($fromDate);
            $lastTimestamp = strtotime($toDate);

            while ($currentTimestamp <= $lastTimestamp) {
                $dateStr = date('Y-m-d', $currentTimestamp);
                $displayDate = date('d M', $currentTimestamp);

                $booking = $bookingData->get($dateStr);
                $inward = $inwardData->get($dateStr);

                $dailyStats[] = [
                    'date' => $displayDate,
                    'bookings' => $booking->count ?? 0,
                    'inwards' => $inward->count ?? 0,
                    'booking_amount' => (float)($booking->amount ?? 0),
                    'inward_amount' => (float)($inward->amount ?? 0)
                ];

                $currentTimestamp = strtotime('+1 day', $currentTimestamp);
            }

            $branchStatsQuery = Branch::query();
            if ($branchId) {
                $branchStatsQuery->where('id', $branchId);
            }

            $branchStats = $branchStatsQuery->get()->map(function($branch) use ($fromDate, $toDate) {
                $bookings = Waybill::whereBetween('bill_date', [$fromDate, $toDate])
                    ->where('origin_branch_id', $branch->id);
                
                $inwards = Waybill::whereBetween('inward_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59'])
                    ->where('inward_branch_id', $branch->id);

                return [
                    'branch_name' => $branch->branch_name,
                    'booking_count' => $bookings->count(),
                    'booking_amount' => (float)$bookings->sum('grand_total'),
                    'inward_count' => $inwards->count(),
                    'inward_amount' => (float)$inwards->sum('grand_total')
                ];
            });

            $totals = [
                'bookings' => array_sum(array_column($dailyStats, 'bookings')),
                'inwards' => array_sum(array_column($dailyStats, 'inwards')),
                'booking_amount' => array_sum(array_column($dailyStats, 'booking_amount')),
                'inward_amount' => array_sum(array_column($dailyStats, 'inward_amount'))
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'daily_stats' => $dailyStats,
                    'branch_stats' => $branchStats,
                    'totals' => $totals
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getProfitLossStats(Request $request): JsonResponse
    {
        try {
            $fromDate = $request->get('from_date');
            $toDate = $request->get('to_date');
            $branchId = $request->get('branch_id');

            if (!$fromDate || !$toDate) {
                return response()->json(['success' => false, 'message' => 'Dates are required'], 400);
            }

            // --- INCOME SOURCES ---
            // 1. Waybill Revenue (Accrued) - Excluding Cancelled
            $incomeWaybills = Waybill::selectRaw('bill_date, SUM(grand_total) as amount')
                ->whereBetween('bill_date', [$fromDate, $toDate])
                ->where('status', '!=', 'CANCELLED')
                ->when($branchId, fn($q) => $q->where('origin_branch_id', $branchId))
                ->groupBy('bill_date')->get()->keyBy('bill_date');

            // 2. Other Cash Income (Excluding Waybill settlement entries to avoid double counting)
            // Manual entries like "Old Sale", "Interest", "Asset Sale" etc.
            $incomeCash = CashBookEntry::selectRaw('transaction_date, SUM(amount) as amount')
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->where('transaction_type', 'CREDIT')
                // Exclude auto-generated receipts for waybills
                ->where('voucher_no', 'NOT LIKE', 'BK-%')
                ->where('voucher_no', 'NOT LIKE', 'PAY-%')
                ->where('voucher_no', 'NOT LIKE', 'DLV-%')
                ->where('voucher_no', 'NOT LIKE', 'BLK-%')
                ->where('voucher_no', 'NOT LIKE', 'TCP-%')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->groupBy('transaction_date')->get()->keyBy('transaction_date');

            // --- EXPENSE SOURCES ---
            // 1. Trip Operating Costs (Advances)
            $expenseTrips = TripSheet::selectRaw('trip_date, SUM(advance_amount) as amount')
                ->whereBetween('trip_date', [$fromDate, $toDate])
                ->where('status', '!=', 'CANCELLED')
                ->when($branchId, fn($q) => $q->where('dispatch_branch_id', $branchId))
                ->groupBy('trip_date')->get()->keyBy('trip_date');

            // 2. Direct Operating & General Overhead Expenses (Excluding Trip Advances already counted)
            $expenseCash = CashBookEntry::selectRaw('transaction_date, SUM(amount) as amount')
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->where('transaction_type', 'DEBIT')
                // Exclude trip advances to avoid double counting
                ->where('voucher_no', 'NOT LIKE', 'ADV-%')
                // Exclude cancellation reversals (already handled by excluding CANCELLED waybills)
                ->where('voucher_no', 'NOT LIKE', 'CN-%')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->groupBy('transaction_date')->get()->keyBy('transaction_date');

            $dailyTrend = [];
            $currentTimestamp = strtotime($fromDate);
            $lastTimestamp = strtotime($toDate);

            while ($currentTimestamp <= $lastTimestamp) {
                $dateStr = date('Y-m-d', $currentTimestamp);
                $displayDate = date('d M', $currentTimestamp);

                $i1 = (float)($incomeWaybills->get($dateStr)->amount ?? 0);
                $i2 = (float)($incomeCash->get($dateStr)->amount ?? 0);
                $e1 = (float)($expenseTrips->get($dateStr)->amount ?? 0);
                $e2 = (float)($expenseCash->get($dateStr)->amount ?? 0);

                $dailyTrend[] = [
                    'date' => $displayDate,
                    'income' => $i1 + $i2,
                    'expense' => $e1 + $e2,
                    'profit' => ($i1 + $i2) - ($e1 + $e2)
                ];

                $currentTimestamp = strtotime('+1 day', $currentTimestamp);
            }

            // Summary Totals
            $totalWaybillValue = Waybill::whereBetween('bill_date', [$fromDate, $toDate])
                ->where('status', '!=', 'CANCELLED')
                ->when($branchId, fn($q) => $q->where('origin_branch_id', $branchId))
                ->sum('grand_total');

            $totalOtherIncome = CashBookEntry::whereBetween('transaction_date', [$fromDate, $toDate])
                ->where('transaction_type', 'CREDIT')
                ->where('voucher_no', 'NOT LIKE', 'BK-%')
                ->where('voucher_no', 'NOT LIKE', 'PAY-%')
                ->where('voucher_no', 'NOT LIKE', 'DLV-%')
                ->where('voucher_no', 'NOT LIKE', 'BLK-%')
                ->where('voucher_no', 'NOT LIKE', 'TCP-%')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->sum('amount');
            
            $totalTripExpense = TripSheet::whereBetween('trip_date', [$fromDate, $toDate])
                ->where('status', '!=', 'CANCELLED')
                ->when($branchId, fn($q) => $q->where('dispatch_branch_id', $branchId))
                ->sum('advance_amount');

            $totalOtherExpense = CashBookEntry::whereBetween('transaction_date', [$fromDate, $toDate])
                ->where('transaction_type', 'DEBIT')
                ->where('voucher_no', 'NOT LIKE', 'ADV-%')
                ->where('voucher_no', 'NOT LIKE', 'CN-%')
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->sum('amount');

            return response()->json([
                'success' => true,
                'data' => [
                    'daily_trend' => $dailyTrend,
                    'summary' => [
                        'total_income' => (float)($totalWaybillValue + $totalOtherIncome),
                        'total_expense' => (float)($totalTripExpense + $totalOtherExpense),
                        'net_profit' => (float)(($totalWaybillValue + $totalOtherIncome) - ($totalTripExpense + $totalOtherExpense)),
                        'breakdown' => [
                            'waybill_revenue' => (float)$totalWaybillValue,
                            'other_income' => (float)$totalOtherIncome,
                            'trip_costs' => (float)$totalTripExpense,
                            'general_expenses' => (float)$totalOtherExpense
                        ]
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
