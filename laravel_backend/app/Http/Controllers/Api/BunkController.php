<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bunk;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class BunkController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $bunks = Bunk::with('branch')->orderBy('bunk_name', 'asc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Bunks retrieved successfully',
                'data' => $bunks,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $bunk = Bunk::with('branch')->find($id);

            if (!$bunk) {
                return $this->errorResponse('Bunk not found', 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Bunk retrieved successfully',
                'data' => $bunk,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate(Bunk::createRules());
            
            $bunk = Bunk::create($validated);
            $bunk->load('branch');

            return response()->json([
                'success' => true,
                'message' => 'Bunk created successfully',
                'data' => $bunk,
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
            $bunk = Bunk::find($id);

            if (!$bunk) {
                return $this->errorResponse('Bunk not found', 404);
            }

            $validated = $request->validate(Bunk::updateRules($id));
            
            $bunk->update($validated);
            $bunk->load('branch');

            return response()->json([
                'success' => true,
                'message' => 'Bunk updated successfully',
                'data' => $bunk->fresh(),
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
            $bunk = Bunk::find($id);

            if (!$bunk) {
                return $this->errorResponse('Bunk not found', 404);
            }

            $bunk->delete();

            return response()->json([
                'success' => true,
                'message' => 'Bunk deleted successfully',
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

            $bunks = Bunk::with('branch')
                ->where('bunk_name', 'like', "%{$query}%")
                ->orWhere('bunk_address', 'like', "%{$query}%")
                ->orWhere('tin_number', 'like', "%{$query}%")
                ->orWhere('bunk_land', 'like', "%{$query}%")
                ->orWhere('bunk_mobile', 'like', "%{$query}%")
                ->orWhere('bunk_remarks', 'like', "%{$query}%")
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Search results',
                'data' => $bunks,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function getByBranch(int $branchId): JsonResponse
    {
        try {
            $bunks = Bunk::with('branch')
                ->where('branch_id', $branchId)
                ->where('is_active', true)
                ->orderBy('bunk_name', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Bunks retrieved successfully',
                'data' => $bunks,
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
