<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScreenAssignment;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ScreenAssignmentController extends Controller
{
    /**
     * Get all screen assignments for a specific admin
     */
    public function getByAdmin($adminId)
    {
        $admin = Admin::find($adminId);
        
        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Admin not found'
            ], 404);
        }

        // If superadmin, return all available screens
        if ($admin->role === 'superadmin') {
            return response()->json([
                'success' => true,
                'message' => 'Superadmin has access to all screens',
                'data' => $this->getAllAvailableScreens(),
                'is_superadmin' => true
            ]);
        }

        // For regular admin, get assigned screens
        $assignments = ScreenAssignment::where('admin_id', $adminId)
            ->where('is_active', true)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $assignments,
            'is_superadmin' => false
        ]);
    }

    /**
     * Assign screens to an admin
     */
    public function assignScreens(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'admin_id' => 'required|exists:admins,id',
            'screens' => 'required|array',
            'screens.*.screen_path' => 'required|string',
            'screens.*.screen_name' => 'required|string',
            'screens.*.category' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $admin = Admin::find($request->admin_id);

        // Don't allow screen assignment for superadmin
        if ($admin->role === 'superadmin') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot assign screens to superadmin. Superadmin has access to all screens.'
            ], 400);
        }

        // Delete existing assignments permanently to avoid unique constraint violation with soft deletes
        ScreenAssignment::where('admin_id', $request->admin_id)->forceDelete();

        // Create new assignments
        foreach ($request->screens as $screen) {
            ScreenAssignment::create([
                'admin_id' => $request->admin_id,
                'screen_path' => $screen['screen_path'],
                'screen_name' => $screen['screen_name'],
                'category' => $screen['category'] ?? null,
                'is_active' => true,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Screens assigned successfully'
        ]);
    }

    /**
     * Get all available screens in the system
     */
    public function getAllScreens()
    {
        return response()->json([
            'success' => true,
            'data' => $this->getAllAvailableScreens()
        ]);
    }

    /**
     * Helper method to get all available screens
     */
    private function getAllAvailableScreens()
    {
        return [
            [
                'category' => 'Administrator',
                'screens' => [
                    ['path' => '/branch-master', 'name' => 'Branch Master'],
                    ['path' => '/user-details', 'name' => 'User Details'],
                    ['path' => '/role-details', 'name' => 'Role Details'],
                    ['path' => '/role-assignment', 'name' => 'Role Assignment'],
                    ['path' => '/screen-assignment', 'name' => 'Screen Assignment'],
                    ['path' => '/manage-logo', 'name' => 'Manage Logo'],
                ]
            ],
            [
                'category' => 'Masters',
                'screens' => [
                    ['path' => '/lookup-master', 'name' => 'Lookup Master'],
                    ['path' => '/state-master', 'name' => 'State Master'],
                    ['path' => '/district-master', 'name' => 'District Master'],
                    ['path' => '/taluk-master', 'name' => 'Taluk Master'],
                    ['path' => '/destination', 'name' => 'Destination'],
                    ['path' => '/from-to-address', 'name' => 'From To Address'],
                    ['path' => '/consignor-master', 'name' => 'Consignor Master'],
                    ['path' => '/consignee-master', 'name' => 'Consignee Master'],
                    ['path' => '/rate-details', 'name' => 'Rate Details'],
                    ['path' => '/gc-details', 'name' => 'GC Details'],
                    ['path' => '/driver-details', 'name' => 'Driver Details'],
                    ['path' => '/vehicle-details', 'name' => 'Vehicle Details'],
                    ['path' => '/bunk-details', 'name' => 'Bunk Details'],
                    ['path' => '/transport-master', 'name' => 'Transport Master'],
                ]
            ],
            [
                'category' => 'Way Bill',
                'screens' => [
                    ['path' => '/gc-entry', 'name' => 'GC Entry'],
                    ['path' => '/gc-modify', 'name' => 'GC Modify'],
                    ['path' => '/gc-track', 'name' => 'GC Track'],
                    ['path' => '/receive-gc-ack', 'name' => 'Receive GC Ack'],
                    ['path' => '/gc-print', 'name' => 'GC Print'],
                    ['path' => '/gc-report', 'name' => 'GC Report'],
                    ['path' => '/waybill-admin-edit', 'name' => 'WayBill Admin/Edit'],
                ]
            ],
            [
                'category' => 'Accounts',
                'screens' => [
                    ['path' => '/head-details', 'name' => 'Head Details'],
                    ['path' => '/head-assign-details', 'name' => 'Head Assign Details'],
                    ['path' => '/cash-book-details', 'name' => 'Cash Book Details'],
                    ['path' => '/cash-book-report', 'name' => 'Cash Book Report'],
                ]
            ],
            [
                'category' => 'Inward Way Bill',
                'screens' => [
                    ['path' => '/bulk-gc-inward', 'name' => 'Bulk GC Inward'],
                    ['path' => '/receive-inward', 'name' => 'Receive Inward'],
                    ['path' => '/inward-gc-ack', 'name' => 'Inward GC Ack'],
                    ['path' => '/inward-report', 'name' => 'Inward Report'],
                ]
            ],
            [
                'category' => 'Trip Sheet',
                'screens' => [
                    ['path' => '/trip-sheet-entry', 'name' => 'Trip Sheet Entry'],
                    ['path' => '/trip-sheet-ack', 'name' => 'Trip Sheet Ack'],
                    ['path' => '/trip-sheet-report', 'name' => 'Trip Sheet Report'],
                    ['path' => '/trip-sheet-verification', 'name' => 'Trip Sheet Verification'],
                    ['path' => '/trip-sheet-alert', 'name' => 'Trip Sheet Alert'],
                    ['path' => '/trip-sheet-payment', 'name' => 'Trip Sheet Payment'],
                ]
            ],
        ];
    }
}
