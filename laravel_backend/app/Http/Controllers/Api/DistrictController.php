<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\District;
use App\Models\State;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class DistrictController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $districts = District::with('state')->orderBy('name', 'asc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Districts retrieved successfully',
                'data' => $districts,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $district = District::with('state')->find($id);

            if (!$district) {
                return $this->errorResponse('District not found', 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'District retrieved successfully',
                'data' => $district,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate(District::createRules());
            $district = District::create($validated);
            $district->load('state');

            return response()->json([
                'success' => true,
                'message' => 'District created successfully',
                'data' => $district,
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
            $district = District::find($id);

            if (!$district) {
                return $this->errorResponse('District not found', 404);
            }

            $validated = $request->validate(District::updateRules($id));
            $district->update($validated);
            $district->load('state');

            return response()->json([
                'success' => true,
                'message' => 'District updated successfully',
                'data' => $district->fresh(),
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
            $district = District::find($id);

            if (!$district) {
                return $this->errorResponse('District not found', 404);
            }

            $district->delete();

            return response()->json([
                'success' => true,
                'message' => 'District deleted successfully',
                'data' => null,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function getByState(int $stateId): JsonResponse
    {
        try {
            $districts = District::with('state')
                ->where('state_id', $stateId)
                ->where('is_active', true)
                ->orderBy('name', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Districts retrieved successfully',
                'data' => $districts,
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

            $districts = District::with('state')
                ->where('name', 'like', "%{$query}%")
                ->orWhere('code', 'like', "%{$query}%")
                ->orWhereHas('state', function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%");
                })
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Search results',
                'data' => $districts,
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
