<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $admins = Admin::orderBy('created_at', 'desc')->get();
            $branches = Branch::all()->keyBy('branch_code');

            // Map Admin data to match expected User structure for frontend
            $data = $admins->map(function ($admin) use ($branches) {
                // Try to find branch_id using branch_code
                $branch = $branches->get($admin->branch_code);
                $branchId = $branch ? $branch->id : null;

                return [
                    'id' => $admin->id,
                    'username' => $admin->name, // Admin uses 'name' which is Full Name
                    'full_name' => $admin->name,
                    'email' => $admin->email,
                    'role' => $admin->role,
                    'branch_id' => $branchId,
                    'is_active' => $admin->is_active,
                    'phone' => $admin->phone_number,
                    'address' => $admin->address,
                    
                    // Mimic the 'branch' relation object
                    'branch' => [
                        'id' => $branchId,
                        'branch_name' => $admin->branch_name,
                        'branch_code' => $admin->branch_code,
                    ],

                    'created_at' => $admin->created_at,
                    'updated_at' => $admin->updated_at,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Users retrieved successfully',
                'data' => $data,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $admin = Admin::find($id);

            if (!$admin) {
                return $this->errorResponse('User not found', 404);
            }

            // Find branch_id
            $branch = Branch::where('branch_code', $admin->branch_code)->first();
            $branchId = $branch ? $branch->id : null;

            $data = [
                'id' => $admin->id,
                'username' => $admin->name,
                'full_name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
                'branch_id' => $branchId,
                'is_active' => $admin->is_active,
                'phone' => $admin->phone_number,
                'address' => $admin->address,
                'branch' => [
                    'id' => $branchId,
                    'branch_name' => $admin->branch_name,
                    'branch_code' => $admin->branch_code,
                ],
                'created_at' => $admin->created_at,
                'updated_at' => $admin->updated_at,
            ];

            return response()->json([
                'success' => true,
                'message' => 'User retrieved successfully',
                'data' => $data,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'full_name' => 'required|string|max:255',
                'email' => 'required|email|unique:admins,email',
                'password' => 'required|string|min:6',
                'branch_id' => 'required|exists:branches,id',
                'role' => 'required|string',
                'phone' => 'nullable|string',
                'address' => 'nullable|string',
                'is_active' => 'boolean'
            ]);

            // Fetch Branch details
            $branch = Branch::findOrFail($validated['branch_id']);
            
            // Construct Branch Address
            $branchAddress = $branch->address;
            if ($branch->city) $branchAddress .= ', ' . $branch->city;
            if ($branch->state) $branchAddress .= ', ' . $branch->state;
            if ($branch->pincode) $branchAddress .= ' - ' . $branch->pincode;

            // Create Admin
            $admin = new Admin();
            $admin->name = $validated['full_name'];
            $admin->email = $validated['email'];
            $admin->password = $validated['password']; // setPasswordAttribute handles hashing
            $admin->role = $validated['role'];
            $admin->phone_number = $validated['phone'] ?? null;
            $admin->address = $validated['address'] ?? null;
            $admin->is_active = $validated['is_active'] ?? true;
            
            // Branch Details
            $admin->branch_code = $branch->branch_code;
            $admin->branch_name = $branch->branch_name;
            $admin->branch_address = $branchAddress;
            $admin->branch_email = $branch->email;
            $admin->branch_phone = $branch->phone;

            $admin->save();

            // Format response to match User structure
            $data = $admin->toArray();
            $data['full_name'] = $admin->name;
            $data['username'] = $admin->name;
            $data['branch_id'] = $branch->id;
            $data['branch'] = $branch;

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data' => $data,
            ], 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $admin = Admin::find($id);

            if (!$admin) {
                return $this->errorResponse('User not found', 404);
            }

            $validated = $request->validate([
                'full_name' => 'required|string|max:255',
                'email' => 'required|email|unique:admins,email,' . $id,
                'password' => 'nullable|string|min:6',
                'branch_id' => 'required|exists:branches,id',
                'role' => 'required|string',
                'phone' => 'nullable|string',
                'address' => 'nullable|string',
                'is_active' => 'boolean'
            ]);

            // Fetch Branch details if changed or needed
            $branch = Branch::findOrFail($validated['branch_id']);
            
            // Construct Branch Address
            $branchAddress = $branch->address;
            if ($branch->city) $branchAddress .= ', ' . $branch->city;
            if ($branch->state) $branchAddress .= ', ' . $branch->state;
            if ($branch->pincode) $branchAddress .= ' - ' . $branch->pincode;

            $admin->name = $validated['full_name'];
            $admin->email = $validated['email'];
            if (!empty($validated['password'])) {
                $admin->password = $validated['password'];
            }
            $admin->role = $validated['role'];
            $admin->phone_number = $validated['phone'] ?? null;
            $admin->address = $validated['address'] ?? null;
            $admin->is_active = $validated['is_active'] ?? true;
            
            // Update Branch Details
            $admin->branch_code = $branch->branch_code;
            $admin->branch_name = $branch->branch_name;
            $admin->branch_address = $branchAddress;
            $admin->branch_email = $branch->email;
            $admin->branch_phone = $branch->phone;

            $admin->save();

            // Format response
            $data = $admin->toArray();
            $data['full_name'] = $admin->name;
            $data['username'] = $admin->name;
            $data['branch_id'] = $branch->id;
            $data['branch'] = $branch;

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $data,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $admin = Admin::find($id);

            if (!$admin) {
                return $this->errorResponse('User not found', 404);
            }

            $admin->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully',
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

            $admins = Admin::where('name', 'like', "%{$query}%")
                ->orWhere('email', 'like', "%{$query}%")
                ->orWhere('role', 'like', "%{$query}%")
                ->orWhere('branch_name', 'like', "%{$query}%")
                ->get();

            // Need to map branches for search results as well
            $branches = Branch::all()->keyBy('branch_code');

            $data = $admins->map(function ($admin) use ($branches) {
                $branch = $branches->get($admin->branch_code);
                $branchId = $branch ? $branch->id : null;

                return [
                    'id' => $admin->id,
                    'username' => $admin->name,
                    'full_name' => $admin->name,
                    'email' => $admin->email,
                    'role' => $admin->role,
                    'branch_id' => $branchId,
                    'is_active' => $admin->is_active,
                    'phone' => $admin->phone_number,
                    'address' => $admin->address,
                    'branch' => [
                        'id' => $branchId,
                        'branch_name' => $admin->branch_name,
                        'branch_code' => $admin->branch_code,
                    ],
                    'created_at' => $admin->created_at,
                    'updated_at' => $admin->updated_at,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Search results',
                'data' => $data,
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
