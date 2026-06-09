<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Route;
use App\Models\RouteStop;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class RouteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Route::with(['originBranch', 'destinationTaluk', 'stops.taluk']);
        
        if ($request->has('origin_branch_id')) {
            $query->where('origin_branch_id', $request->origin_branch_id);
        }

        $routes = $query->get();
        return response()->json(['success' => true, 'data' => $routes]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'route_name'             => 'required|string|unique:routes,route_name',
            'origin_branch_id'      => 'nullable|exists:branches,id',
            'destination_taluk_id' => 'nullable|exists:taluks,id',
            'stops'                 => 'required|array|min:1',
            'stops.*.taluk_id'     => 'required|exists:taluks,id',
            'stops.*.stop_sequence' => 'required|integer',
        ]);

        try {
            DB::beginTransaction();

            $route = Route::create([
                'route_name'             => $validated['route_name'],
                'origin_branch_id'      => $validated['origin_branch_id'],
                'destination_taluk_id' => $validated['destination_taluk_id'],
            ]);

            foreach ($validated['stops'] as $stop) {
                RouteStop::create([
                    'route_id'      => $route->id,
                    'taluk_id'     => $stop['taluk_id'],
                    'stop_sequence' => $stop['stop_sequence'],
                ]);
            }

            DB::commit();
            return response()->json(['success' => true, 'data' => $route->load('stops.taluk')], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function show($id): JsonResponse
    {
        $route = Route::with(['originBranch', 'destinationTaluk', 'stops.taluk'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $route]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $route = Route::findOrFail($id);
        $validated = $request->validate([
            'route_name'             => 'required|string|unique:routes,route_name,' . $id,
            'origin_branch_id'      => 'nullable|exists:branches,id',
            'destination_taluk_id' => 'nullable|exists:taluks,id',
            'status'                => 'string',
            'stops'                 => 'required|array|min:1',
            'stops.*.taluk_id'     => 'required|exists:taluks,id',
            'stops.*.stop_sequence' => 'required|integer',
        ]);

        try {
            DB::beginTransaction();

            $route->update([
                'route_name'             => $validated['route_name'],
                'origin_branch_id'      => $validated['origin_branch_id'],
                'destination_taluk_id' => $validated['destination_taluk_id'],
                'status'                => $validated['status'] ?? $route->status,
            ]);

            // Clear old stops and recreate
            RouteStop::where('route_id', $route->id)->delete();
            foreach ($validated['stops'] as $stop) {
                RouteStop::create([
                    'route_id'      => $route->id,
                    'taluk_id'     => $stop['taluk_id'],
                    'stop_sequence' => $stop['stop_sequence'],
                ]);
            }

            DB::commit();
            return response()->json(['success' => true, 'data' => $route->load('stops.taluk')]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        $route = Route::findOrFail($id);
        $route->delete();
        return response()->json(['success' => true, 'message' => 'Route deleted successfully']);
    }

    public function getProfitability(Request $request): JsonResponse
    {
        try {
            $query = Route::with(['stops.branch', 'tripSheets' => function($q) use ($request) {
                if ($request->filled('from_date')) {
                    $q->whereDate('trip_date', '>=', $request->from_date);
                }
                if ($request->filled('to_date')) {
                    $q->whereDate('trip_date', '<=', $request->to_date);
                }
                $q->with('waybills');
            }]);

            if ($request->filled('route_id')) {
                $query->where('id', $request->route_id);
            }

            $routes = $query->get();

            $stats = $routes->map(function($route) {
                $trips = $route->tripSheets;
                $totalTrips = $trips->count();
                $totalIncome = 0;
                $totalExpense = 0;

                foreach ($trips as $trip) {
                    // Income is sum of all GCs on the trip
                    $totalIncome += $trip->waybills->sum(fn($wb) => (float)($wb->grand_total ?? $wb->total_amount ?? 0));
                    
                    // Expenses: Advance + Less Paid (Driver settlements)
                    $totalExpense += (float)($trip->advance_amount ?? 0);
                    $totalExpense += (float)($trip->less_paid_driver ?? 0);
                }

                $profit = $totalIncome - $totalExpense;

                return [
                    'id' => $route->id,
                    'route_name' => $route->route_name,
                    'total_trips' => $totalTrips,
                    'total_income' => $totalIncome,
                    'total_expense' => $totalExpense,
                    'profit' => $profit,
                    'profit_margin' => $totalIncome > 0 ? ($profit / $totalIncome) * 100 : 0,
                    'average_profit_per_trip' => $totalTrips > 0 ? $profit / $totalTrips : 0,
                    'stops' => $route->stops->map(fn($s) => $s->taluk?->taluk_name)
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
