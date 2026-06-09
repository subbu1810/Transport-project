<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class BranchController extends Controller
{
    /**
     * Get all branches.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            $branches = Branch::orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Branches retrieved successfully',
                'data' => $branches,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Get branch by ID.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $branch = Branch::find($id);

            if (!$branch) {
                return $this->errorResponse('Branch not found', 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Branch retrieved successfully',
                'data' => $branch,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Create a new branch.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate input
            $validated = $request->validate(Branch::createRules());

            // Create branch
            $branch = Branch::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Branch created successfully',
                'data' => $branch,
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
     * Update a branch.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $branch = Branch::find($id);

            if (!$branch) {
                return $this->errorResponse('Branch not found', 404);
            }

            // Validate input
            $validated = $request->validate(Branch::updateRules($id));

            // Update branch
            $branch->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Branch updated successfully',
                'data' => $branch->fresh(),
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
     * Delete a branch.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $branch = Branch::find($id);

            if (!$branch) {
                return $this->errorResponse('Branch not found', 404);
            }

            // Check if branch has related records
            if ($reason = $branch->getDeletionBlockingReason()) {
                return $this->errorResponse($reason, 400);
            }

            $branch->delete();

            return response()->json([
                'success' => true,
                'message' => 'Branch deleted successfully',
                'data' => null,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Search branches.
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

            $branches = Branch::search($query)->get();

            return response()->json([
                'success' => true,
                'message' => 'Search results',
                'data' => $branches,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Get active branches.
     *
     * @return JsonResponse
     */
    public function active(): JsonResponse
    {
        try {
            $branches = Branch::active()->orderBy('branch_name', 'asc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Active branches retrieved successfully',
                'data' => $branches,
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
