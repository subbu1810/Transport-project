<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Destination;
use App\Models\Taluk;
use App\Models\District;
use App\Models\State;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class DestinationController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $destinations = Destination::with(['taluk.district.state'])->orderBy('city_name', 'asc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Destinations retrieved successfully',
                'data' => $destinations,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $destination = Destination::with(['taluk.district.state'])->find($id);

            if (!$destination) {
                return $this->errorResponse('Destination not found', 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Destination retrieved successfully',
                'data' => $destination,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate(Destination::createRules());
            $destination = Destination::create($validated);
            $destination->load(['taluk.district.state']);

            return response()->json([
                'success' => true,
                'message' => 'Destination created successfully',
                'data' => $destination,
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
            $destination = Destination::find($id);

            if (!$destination) {
                return $this->errorResponse('Destination not found', 404);
            }

            $validated = $request->validate(Destination::updateRules($id));
            $destination->update($validated);
            $destination->load(['taluk.district.state']);

            return response()->json([
                'success' => true,
                'message' => 'Destination updated successfully',
                'data' => $destination->fresh(),
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
            $destination = Destination::find($id);

            if (!$destination) {
                return $this->errorResponse('Destination not found', 404);
            }

            $destination->delete();

            return response()->json([
                'success' => true,
                'message' => 'Destination deleted successfully',
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

            $destinations = Destination::with(['taluk.district.state'])
                ->where('city_name', 'like', "%{$query}%")
                ->orWhereHas('taluk', function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%");
                })
                ->orWhereHas('taluk.district', function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%");
                })
                ->orWhereHas('taluk.district.state', function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%");
                })
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Search results',
                'data' => $destinations,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function getByTaluk(int $talukId): JsonResponse
    {
        try {
            $destinations = Destination::with(['taluk.district.state'])
                ->where('taluk_id', $talukId)
                ->where('is_active', true)
                ->orderBy('city_name', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Destinations retrieved successfully',
                'data' => $destinations,
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
