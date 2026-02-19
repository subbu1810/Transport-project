<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TripSheet;
use App\Models\Waybill;
use App\Models\Vehicle;
use App\Models\Branch;
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
                $waybillCount->where('branch_id', $branchId);
                // Vehicles and branches are usually global but could be filtered if needed
            }

            $recentTrips = TripSheet::with(['vehicle', 'dispatchBranch', 'destinationBranch'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => [
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
                        [
                            'label' => 'Branches',
                            'value' => number_format($branchCount->count()),
                            'icon' => 'MapPin',
                            'color' => 'text-orange-500',
                            'iconBg' => 'bg-orange-500'
                        ],
                    ],
                    'recent_trips' => $recentTrips
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
