<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class RateController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $rates = Rate::with(['consignor', 'destination'])->orderBy('article_type', 'asc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Rates retrieved successfully',
                'data' => $rates,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $rate = Rate::with(['consignor', 'destination'])->find($id);

            if (!$rate) {
                return $this->errorResponse('Rate not found', 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Rate retrieved successfully',
                'data' => $rate,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate(Rate::createRules());
            $rate = Rate::create($validated);
            $rate->load(['consignor', 'destination']);

            return response()->json([
                'success' => true,
                'message' => 'Rate created successfully',
                'data' => $rate,
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
            $rate = Rate::find($id);

            if (!$rate) {
                return $this->errorResponse('Rate not found', 404);
            }

            $validated = $request->validate(Rate::updateRules($id));
            $rate->update($validated);
            $rate->load(['consignor', 'destination']);

            return response()->json([
                'success' => true,
                'message' => 'Rate updated successfully',
                'data' => $rate->fresh(),
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
            $rate = Rate::find($id);

            if (!$rate) {
                return $this->errorResponse('Rate not found', 404);
            }

            $rate->delete();

            return response()->json([
                'success' => true,
                'message' => 'Rate deleted successfully',
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

            $rates = Rate::with(['consignor', 'destination'])
                ->where('article_type', 'like', "%{$query}%")
                ->orWhereHas('consignor', function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                      ->orWhere('code', 'like', "%{$query}%");
                })
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Search results',
                'data' => $rates,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function getByConsignor(int $consignorId): JsonResponse
    {
        try {
            $rates = Rate::with(['consignor', 'destination'])
                ->where('consignor_id', $consignorId)
                ->where('is_active', true)
                ->orderBy('article_type', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Rates retrieved successfully',
                'data' => $rates,
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
