<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Taluk;
use App\Models\District;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class TalukController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $taluks = Taluk::with(['district.state'])->orderBy('name', 'asc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Taluks retrieved successfully',
                'data' => $taluks,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $taluk = Taluk::with(['district.state'])->find($id);

            if (!$taluk) {
                return $this->errorResponse('Taluk not found', 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Taluk retrieved successfully',
                'data' => $taluk,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate(Taluk::createRules());
            $taluk = Taluk::create($validated);
            $taluk->load(['district.state']);

            return response()->json([
                'success' => true,
                'message' => 'Taluk created successfully',
                'data' => $taluk,
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
            $taluk = Taluk::find($id);

            if (!$taluk) {
                return $this->errorResponse('Taluk not found', 404);
            }

            $validated = $request->validate(Taluk::updateRules($id));
            $taluk->update($validated);
            $taluk->load(['district.state']);

            return response()->json([
                'success' => true,
                'message' => 'Taluk updated successfully',
                'data' => $taluk->fresh(),
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
            $taluk = Taluk::find($id);

            if (!$taluk) {
                return $this->errorResponse('Taluk not found', 404);
            }

            $taluk->delete();

            return response()->json([
                'success' => true,
                'message' => 'Taluk deleted successfully',
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

            $taluks = Taluk::with(['district.state'])
                ->where('name', 'like', "%{$query}%")
                ->orWhere('code', 'like', "%{$query}%")
                ->orWhereHas('district', function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%");
                })
                ->orWhereHas('district.state', function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%");
                })
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Search results',
                'data' => $taluks,
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
