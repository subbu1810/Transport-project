<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class TransportController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $transports = Transport::with('branch')->orderBy('transport_name', 'asc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Transports retrieved successfully',
                'data' => $transports,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $transport = Transport::with('branch')->find($id);

            if (!$transport) {
                return $this->errorResponse('Transport not found', 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Transport retrieved successfully',
                'data' => $transport,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate(Transport::createRules());
            
            $transport = Transport::create($validated);
            $transport->load('branch');

            return response()->json([
                'success' => true,
                'message' => 'Transport created successfully',
                'data' => $transport,
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
            $transport = Transport::find($id);

            if (!$transport) {
                return $this->errorResponse('Transport not found', 404);
            }

            $validated = $request->validate(Transport::updateRules($id));
            
            $transport->update($validated);
            $transport->load('branch');

            return response()->json([
                'success' => true,
                'message' => 'Transport updated successfully',
                'data' => $transport->fresh(),
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
            $transport = Transport::find($id);

            if (!$transport) {
                return $this->errorResponse('Transport not found', 404);
            }

            $transport->delete();

            return response()->json([
                'success' => true,
                'message' => 'Transport deleted successfully',
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
            $searchBy = $request->query('search_by', 'transport_name');

            if (!$query) {
                return $this->errorResponse('Search query is required', 400);
            }

            $transports = Transport::with('branch');

            if ($searchBy === 'transport_code') {
                $transports = $transports->where('transport_code', 'like', "%{$query}%");
            } else {
                $transports = $transports->where('transport_name', 'like', "%{$query}%");
            }

            $transports = $transports->orWhere('gst_number', 'like', "%{$query}%")
                ->orWhere('address', 'like', "%{$query}%")
                ->orWhere('mobile', 'like', "%{$query}%")
                ->orWhere('bank_name', 'like', "%{$query}%")
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Search results',
                'data' => $transports,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function getByBranch(int $branchId): JsonResponse
    {
        try {
            $transports = Transport::with('branch')
                ->where('branch_id', $branchId)
                ->where('is_active', true)
                ->orderBy('transport_name', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Transports retrieved successfully',
                'data' => $transports,
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
