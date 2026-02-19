<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class DriverController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $drivers = Driver::with('branch')->orderBy('name', 'asc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Drivers retrieved successfully',
                'data' => $drivers,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $driver = Driver::with('branch')->find($id);

            if (!$driver) {
                return $this->errorResponse('Driver not found', 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Driver retrieved successfully',
                'data' => $driver,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate(Driver::createRules());
            
            // Format dates properly
            if (isset($validated['date_of_birth'])) {
                $validated['date_of_birth'] = date('Y-m-d', strtotime($validated['date_of_birth']));
            }
            if (isset($validated['date_of_issue'])) {
                $validated['date_of_issue'] = date('Y-m-d', strtotime($validated['date_of_issue']));
            }
            if (isset($validated['valid_till'])) {
                $validated['valid_till'] = date('Y-m-d', strtotime($validated['valid_till']));
            }
            
            $driver = Driver::create($validated);
            $driver->load('branch');

            return response()->json([
                'success' => true,
                'message' => 'Driver created successfully',
                'data' => $driver,
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
            $driver = Driver::find($id);

            if (!$driver) {
                return $this->errorResponse('Driver not found', 404);
            }

            $validated = $request->validate(Driver::updateRules($id));
            
            // Format dates properly
            if (isset($validated['date_of_birth'])) {
                $validated['date_of_birth'] = date('Y-m-d', strtotime($validated['date_of_birth']));
            }
            if (isset($validated['date_of_issue'])) {
                $validated['date_of_issue'] = date('Y-m-d', strtotime($validated['date_of_issue']));
            }
            if (isset($validated['valid_till'])) {
                $validated['valid_till'] = date('Y-m-d', strtotime($validated['valid_till']));
            }
            
            $driver->update($validated);
            $driver->load('branch');

            return response()->json([
                'success' => true,
                'message' => 'Driver updated successfully',
                'data' => $driver->fresh(),
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
            $driver = Driver::find($id);

            if (!$driver) {
                return $this->errorResponse('Driver not found', 404);
            }

            $driver->delete();

            return response()->json([
                'success' => true,
                'message' => 'Driver deleted successfully',
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

            $drivers = Driver::with('branch')
                ->where('name', 'like', "%{$query}%")
                ->orWhere('dl_number', 'like', "%{$query}%")
                ->orWhere('phone', 'like', "%{$query}%")
                ->orWhere('dl_type', 'like', "%{$query}%")
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Search results',
                'data' => $drivers,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function getByBranch(int $branchId): JsonResponse
    {
        try {
            $drivers = Driver::with('branch')
                ->where('branch_id', $branchId)
                ->where('is_active', true)
                ->orderBy('name', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Drivers retrieved successfully',
                'data' => $drivers,
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
