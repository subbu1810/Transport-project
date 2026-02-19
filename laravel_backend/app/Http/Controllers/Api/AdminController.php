<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    public function index()
    {
        $admins = Admin::all();
        return response()->json([
            'success' => true,
            'data' => $admins
        ]);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Find admin by name
        $admin = Admin::where('name', $request->name)->first();

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Verify password
        if (!\Illuminate\Support\Facades\Hash::check($request->password, $admin->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Check if admin is active
        if (!$admin->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Account is inactive. Please contact administrator.'
            ], 403);
        }

        // Fetch branch id if branch_code exists
        $branchId = null;
        if ($admin->branch_code) {
            $branch = \App\Models\Branch::where('branch_code', $admin->branch_code)->first();
            if ($branch) {
                $branchId = $branch->id;
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
                'branch_code' => $admin->branch_code,
                'branch_name' => $admin->branch_name,
                'branch_id' => $branchId,
                'transport_name' => $admin->transport_name,
                'transport_address' => $admin->transport_address,
                'transport_phone' => $admin->transport_phone,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:admins,email',
            'password' => 'required|string|min:6',
            'transport_name' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $admin = Admin::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Admin created successfully',
            'data' => $admin
        ]);
    }

    public function show($id)
    {
        $admin = Admin::find($id);
        if (!$admin) {
            return response()->json(['success' => false, 'message' => 'Admin not found'], 404);
        }
        return response()->json(['success' => true, 'data' => $admin]);
    }

    public function update(Request $request, $id)
    {
        $admin = Admin::find($id);
        if (!$admin) {
            return response()->json(['success' => false, 'message' => 'Admin not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:admins,email,' . $id,
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $admin->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Admin updated successfully',
            'data' => $admin
        ]);
    }

    public function destroy($id)
    {
        $admin = Admin::find($id);
        if (!$admin) {
            return response()->json(['success' => false, 'message' => 'Admin not found'], 404);
        }
        $admin->delete();
        return response()->json(['success' => true, 'message' => 'Admin deleted successfully']);
    }
}
