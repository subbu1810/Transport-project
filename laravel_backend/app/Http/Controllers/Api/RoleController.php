<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $roles = Role::orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Roles retrieved successfully',
                'data' => $roles,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $role = Role::find($id);

            if (!$role) {
                return $this->errorResponse('Role not found', 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Role retrieved successfully',
                'data' => $role,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate(Role::createRules());
            $role = Role::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Role created successfully',
                'data' => $role,
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
            $role = Role::find($id);

            if (!$role) {
                return $this->errorResponse('Role not found', 404);
            }

            $validated = $request->validate(Role::updateRules($id));
            $role->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Role updated successfully',
                'data' => $role->fresh(),
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
            $role = Role::find($id);

            if (!$role) {
                return $this->errorResponse('Role not found', 404);
            }

            $role->delete();

            return response()->json([
                'success' => true,
                'message' => 'Role deleted successfully',
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

            $roles = Role::where('name', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%")
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Search results',
                'data' => $roles,
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
