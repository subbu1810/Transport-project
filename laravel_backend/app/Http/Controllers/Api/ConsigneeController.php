<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consignee;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ConsigneeController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $consignees = Consignee::with(['destination.taluk.district.state'])->orderBy('name', 'asc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Consignees retrieved successfully',
                'data' => $consignees,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $consignee = Consignee::with(['destination.taluk.district.state'])->find($id);

            if (!$consignee) {
                return $this->errorResponse('Consignee not found', 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Consignee retrieved successfully',
                'data' => $consignee,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate(Consignee::createRules());
            $consignee = Consignee::create($validated);
            $consignee->load(['destination.taluk.district.state']);

            return response()->json([
                'success' => true,
                'message' => 'Consignee created successfully',
                'data' => $consignee,
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
            $consignee = Consignee::find($id);

            if (!$consignee) {
                return $this->errorResponse('Consignee not found', 404);
            }

            $validated = $request->validate(Consignee::updateRules($id));
            $consignee->update($validated);
            $consignee->load(['destination.taluk.district.state']);

            return response()->json([
                'success' => true,
                'message' => 'Consignee updated successfully',
                'data' => $consignee->fresh(),
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
            $consignee = Consignee::find($id);

            if (!$consignee) {
                return $this->errorResponse('Consignee not found', 404);
            }

            $consignee->delete();

            return response()->json([
                'success' => true,
                'message' => 'Consignee deleted successfully',
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

            $consignees = Consignee::with(['destination.taluk.district.state']);

            if ($searchBy === 'code') {
                $consignees = $consignees->where('code', 'like', "%{$query}%");
            } else {
                $consignees = $consignees->where('name', 'like', "%{$query}%")
                    ->orWhere('code', 'like', "%{$query}%")
                    ->orWhere('gst_number', 'like', "%{$query}%")
                    ->orWhere('address', 'like', "%{$query}%")
                    ->orWhere('mobile_number', 'like', "%{$query}%");
            }

            $consignees = $consignees->get();

            return response()->json([
                'success' => true,
                'message' => 'Search results',
                'data' => $consignees,
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
