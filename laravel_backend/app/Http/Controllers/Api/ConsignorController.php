<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consignor;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ConsignorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Consignor::with(['district', 'taluk', 'destination', 'branch']);

            if ($request->has('branch_id') && $request->branch_id !== 'All' && $request->branch_id !== '') {
                $query->where('branch_id', $request->branch_id);
            }

            $consignors = $query->orderBy('name', 'asc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Consignors retrieved successfully',
                'data' => $consignors,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $consignor = Consignor::with(['district', 'taluk', 'destination'])->find($id);

            if (!$consignor) {
                return $this->errorResponse('Consignor not found', 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Consignor retrieved successfully',
                'data' => $consignor,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate(Consignor::createRules());
            
            if (empty($validated['code'])) {
                $validated['code'] = 'CON-' . strtoupper(substr(uniqid(), -8));
            }

            $consignor = Consignor::create($validated);


            return response()->json([
                'success' => true,
                'message' => 'Consignor created successfully',
                'data' => $consignor,
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
            $consignor = Consignor::find($id);

            if (!$consignor) {
                return $this->errorResponse('Consignor not found', 404);
            }

            $validated = $request->validate(Consignor::updateRules($id));
            $consignor->update($validated);


            return response()->json([
                'success' => true,
                'message' => 'Consignor updated successfully',
                'data' => $consignor->load(['district', 'taluk', 'destination']),
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
            $consignor = Consignor::find($id);

            if (!$consignor) {
                return $this->errorResponse('Consignor not found', 404);
            }

            $consignor->delete();

            return response()->json([
                'success' => true,
                'message' => 'Consignor deleted successfully',
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
            $searchBy = $request->query('type', 'name');

            if (!$query) {
                return $this->errorResponse('Search query is required', 400);
            }

            $consignors = Consignor::query();

            if ($request->has('branch_id') && $request->branch_id !== 'All' && $request->branch_id !== '') {
                $consignors->where('branch_id', $request->branch_id);
            }

            if ($searchBy === 'code') {
                $consignors->where('code', 'like', "%{$query}%");
            } else {
                $consignors->where(function(\Illuminate\Database\Eloquent\Builder $q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                      ->orWhere('code', 'like', "%{$query}%")
                      ->orWhere('tin_number', 'like', "%{$query}%")
                      ->orWhere('gst_number', 'like', "%{$query}%");
                });
            }

            $consignors = $consignors->with(['district', 'taluk', 'destination', 'branch'])->get();

            return response()->json([
                'success' => true,
                'message' => 'Search results',
                'data' => $consignors,
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
