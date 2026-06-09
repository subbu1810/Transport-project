<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class VehicleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Vehicle::with(['branch', 'lastTrip']);

            if ($request->has('branch_id') && $request->branch_id !== 'All' && $request->branch_id !== '') {
                $branchId = (int)$request->branch_id;
                
                $query->where(function($q) use ($branchId) {
                    // 1. Vehicle is available if it has NO active trip (un-acknowledged) where THIS branch is the sender
                    $q->whereDoesntHave('lastTrip', function($lq) use ($branchId) {
                        $lq->whereNull('ack_date')
                           ->where('dispatch_branch_id', $branchId);
                    });
                });
            }

            $vehicles = $query->orderBy('vehicle_number', 'asc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Vehicles retrieved successfully',
                'data' => $vehicles,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $vehicle = Vehicle::with('branch')->find($id);

            if (!$vehicle) {
                return $this->errorResponse('Vehicle not found', 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Vehicle retrieved successfully',
                'data' => $vehicle,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate(Vehicle::createRules());
            
            // Format dates properly
            if (isset($validated['insurance_upto'])) {
                $validated['insurance_upto'] = date('Y-m-d', strtotime($validated['insurance_upto']));
            }
            if (isset($validated['rc_valid_from'])) {
                $validated['rc_valid_from'] = date('Y-m-d', strtotime($validated['rc_valid_from']));
            }
            if (isset($validated['rc_valid_to'])) {
                $validated['rc_valid_to'] = date('Y-m-d', strtotime($validated['rc_valid_to']));
            }
            
            $vehicle = Vehicle::create($validated);
            $vehicle->load('branch');

            return response()->json([
                'success' => true,
                'message' => 'Vehicle created successfully',
                'data' => $vehicle,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $vehicle = Vehicle::find($id);

            if (!$vehicle) {
                return $this->errorResponse('Vehicle not found', 404);
            }

            $validated = $request->validate(Vehicle::updateRules($id));
            
            // Format dates properly
            if (isset($validated['insurance_upto'])) {
                $validated['insurance_upto'] = date('Y-m-d', strtotime($validated['insurance_upto']));
            }
            if (isset($validated['rc_valid_from'])) {
                $validated['rc_valid_from'] = date('Y-m-d', strtotime($validated['rc_valid_from']));
            }
            if (isset($validated['rc_valid_to'])) {
                $validated['rc_valid_to'] = date('Y-m-d', strtotime($validated['rc_valid_to']));
            }
            
            $vehicle->update($validated);
            $vehicle->load('branch');

            return response()->json([
                'success' => true,
                'message' => 'Vehicle updated successfully',
                'data' => $vehicle->fresh(),
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $vehicle = Vehicle::find($id);

            if (!$vehicle) {
                return $this->errorResponse('Vehicle not found', 404);
            }

            $vehicle->delete();

            return response()->json([
                'success' => true,
                'message' => 'Vehicle deleted successfully',
                'data' => null,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function search(Request $request): JsonResponse
    {
        try {
            $query = $request->query('q');

            if (!$query) {
                return $this->errorResponse('Search query is required', 400);
            }

            $queryObj = Vehicle::with('branch');

            if ($request->has('branch_id') && $request->branch_id !== 'All' && $request->branch_id !== '') {
                $queryObj->where('branch_id', $request->branch_id);
            }

            $vehicles = $queryObj->where(function(\Illuminate\Database\Eloquent\Builder $q) use ($query) {
                    $q->where('vehicle_number', 'like', "%{$query}%")
                      ->orWhere('owner_name', 'like', "%{$query}%")
                      ->orWhere('phone', 'like', "%{$query}%")
                      ->orWhere('vehicle_status', 'like', "%{$query}%");
                })
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Search results',
                'data' => $vehicles,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function getByBranch(int $branchId): JsonResponse
    {
        try {
            $vehicles = Vehicle::with('branch')
                ->where('branch_id', $branchId)
                ->where('is_active', true)
                ->orderBy('vehicle_number', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Vehicles retrieved successfully',
                'data' => $vehicles,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function getByStatus(string $status): JsonResponse
    {
        try {
            $vehicles = Vehicle::with('branch')
                ->where('vehicle_status', strtoupper($status))
                ->where('is_active', true)
                ->orderBy('vehicle_number', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Vehicles retrieved successfully',
                'data' => $vehicles,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    private function errorResponse(string $message, int $statusCode): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
        ], $statusCode);
    }
}
