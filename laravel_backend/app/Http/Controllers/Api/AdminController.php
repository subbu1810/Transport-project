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

        // Load transport with logo if transport_id is set
        $transport = null;
        if ($admin->transport_id) {
            $transport = \App\Models\Transport::find($admin->transport_id);
        }

        // Fallback for Superadmin or if no transport is explicitly linked:
        // Try to find any transport record to use as the default company details
        if (!$transport) {
            $transport = \App\Models\Transport::where('is_active', true)->first() 
                      ?? \App\Models\Transport::first();
        }

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'full_name' => $admin->full_name,
                'email' => $admin->email,
                'role' => $admin->role,
                'branch_code' => $admin->branch_code,
                'branch_name' => $admin->branch_name,
                'branch_phone' => $admin->branch_phone,
                'phone_number' => $admin->phone_number,
                'branch_id' => $branchId,
                'transport_name' => $transport?->transport_name ?? $admin->transport_name,
                'transport_address' => $transport?->address ?? $admin->transport_address,
                'transport_phone' => $transport?->phone ?? $admin->transport_phone,
                'transport_mobile' => $transport?->mobile ?? null,
                'transport_id' => $admin->transport_id,
                'transport_gstin' => $transport?->gst_number ?? $admin->gst_number,
                'transport_logo_url' => $transport?->logo_url ?? null,
                'consignor_id' => $admin->consignor_id,
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

        // Fetch Superadmin transport details to implicitly assign
        // Fixed: Look for transport_name not null instead of transport_id
        $superadmin = Admin::where('role', 'superadmin')
            ->whereNotNull('transport_name')
            ->first();
        
        $transportData = [];
        if ($superadmin) {
            $transportData = [
                'transport_id' => $superadmin->transport_id,
                'transport_name' => $superadmin->transport_name,
                'transport_address' => $superadmin->transport_address,
                'transport_phone' => $superadmin->transport_phone,
            ];
        }

        $admin = Admin::create(array_merge($request->all(), $transportData));

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

        if (!$admin->transport_id && !$admin->transport_name) {
            $superadmin = Admin::where('role', 'superadmin')
                ->whereNotNull('transport_name')
                ->first();
            if ($superadmin) {
                $admin->update([
                    'transport_id' => $superadmin->transport_id,
                    'transport_name' => $superadmin->transport_name,
                    'transport_address' => $superadmin->transport_address,
                    'transport_phone' => $superadmin->transport_phone,
                ]);
            }
        }

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

    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'admin_id' => 'required|exists:admins,id',
            'old_password' => 'required|string',
            'new_password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $admin = Admin::find($request->admin_id);

        if (!$admin || !\Illuminate\Support\Facades\Hash::check($request->old_password, $admin->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ], 401);
        }

        $admin->password = $request->new_password;
        $admin->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
    }
}
