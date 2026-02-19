<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lookup;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class LookupController extends Controller
{
    /**
     * Get all lookups.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            $lookups = Lookup::orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Lookups retrieved successfully',
                'data' => $lookups,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Get lookup by ID.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $lookup = Lookup::find($id);

            if (!$lookup) {
                return $this->errorResponse('Lookup not found', 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Lookup retrieved successfully',
                'data' => $lookup,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Create a new lookup.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'type' => 'required|string|max:255',
                'code' => 'required|string|max:255',
                'value' => 'required|string|max:255',
                'is_active' => 'boolean',
            ]);

            $lookup = Lookup::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Lookup created successfully',
                'data' => $lookup,
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

    /**
     * Update a lookup.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $lookup = Lookup::find($id);

            if (!$lookup) {
                return $this->errorResponse('Lookup not found', 404);
            }

            $validated = $request->validate([
                'type' => 'sometimes|required|string|max:255',
                'code' => 'sometimes|required|string|max:255',
                'value' => 'sometimes|required|string|max:255',
                'is_active' => 'sometimes|boolean',
            ]);

            $lookup->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Lookup updated successfully',
                'data' => $lookup->fresh(),
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

    /**
     * Delete a lookup.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $lookup = Lookup::find($id);

            if (!$lookup) {
                return $this->errorResponse('Lookup not found', 404);
            }

            $lookup->delete();

            return response()->json([
                'success' => true,
                'message' => 'Lookup deleted successfully',
                'data' => null,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Search lookups.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $query = $request->query('q');

            if (!$query) {
                return $this->errorResponse('Search query is required', 400);
            }

            $lookups = Lookup::where('type', 'like', "%{$query}%")
                ->orWhere('code', 'like', "%{$query}%")
                ->orWhere('value', 'like', "%{$query}%")
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Search results',
                'data' => $lookups,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Return error response.
     *
     * @param string $message
     * @param int $statusCode
     * @return JsonResponse
     */
    private function errorResponse(string $message, int $statusCode): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
        ], $statusCode);
    }
}
