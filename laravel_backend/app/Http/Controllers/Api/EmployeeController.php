<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EmployeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Employee::with('branch');

            if ($request->has('branch_id') && $request->branch_id !== 'All') {
                $query->where('branch_id', $request->branch_id);
            }

            if ($request->has('q')) {
                $search = $request->q;
                $query->where(function(\Illuminate\Database\Eloquent\Builder $q) use ($search) {
                    $q->where('emp_id', 'like', "%{$search}%")
                      ->orWhere('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('designation', 'like', "%{$search}%");
                });
            }

            $employees = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $employees,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'emp_id' => 'required|unique:employees,emp_id',
                'first_name' => 'required|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'designation' => 'nullable|string|max:255',
                'phone_number' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'address' => 'nullable|string',
                'date_of_joining' => 'nullable|date',
                'base_salary' => 'nullable|numeric',
                'salary_type' => 'nullable|string',
                'branch_id' => 'nullable|exists:branches,id',
                'is_active' => 'boolean',
            ]);

            $employee = Employee::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Employee created successfully',
                'data' => $employee->load('branch'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $employee = Employee::with('branch')->find($id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $employee,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $employee = Employee::find($id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found',
                ], 404);
            }

            $validated = $request->validate([
                'emp_id' => 'required|unique:employees,emp_id,' . $id,
                'first_name' => 'required|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'designation' => 'nullable|string|max:255',
                'phone_number' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'address' => 'nullable|string',
                'date_of_joining' => 'nullable|date',
                'base_salary' => 'nullable|numeric',
                'salary_type' => 'nullable|string',
                'branch_id' => 'nullable|exists:branches,id',
                'is_active' => 'boolean',
            ]);

            $employee->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Employee updated successfully',
                'data' => $employee->load('branch'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $employee = Employee::find($id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found',
                ], 404);
            }

            $employee->delete();

            return response()->json([
                'success' => true,
                'message' => 'Employee deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
