<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\State;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class StateController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $states = State::orderBy('name', 'asc')->get();

            return response()->json([
                'success' => true,
                'message' => 'States retrieved successfully',
                'data' => $states,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $state = State::find($id);

            if (!$state) {
                return $this->errorResponse('State not found', 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'State retrieved successfully',
                'data' => $state,
                            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate(State::createRules());
            $state = State::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'State created successfully',
                'data' => $state,
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
            $state = State::find($id);

            if (!$state) {
                return $this->errorResponse('State not found', 404);
            }

            $validated = $request->validate(State::updateRules($id));
            $state->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'State updated successfully',
                'data' => $state->fresh(),
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
            $state = State::find($id);

            if (!$state) {
                return $this->errorResponse('State not found', 404);
            }

            $state->delete();

            return response()->json([
                'success' => true,
                'message' => 'State deleted successfully',
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

            $states = State::where('name', 'like', "%{$query}%")
                ->orWhere('code', 'like', "%{$query}%")
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Search results',
                'data' => $states,
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
