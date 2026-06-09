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
                    ['path' => '/screen-assignment', 'name' => 'Screen Assignment'],
                    ['path' => '/manage-logo', 'name' => 'Manage Logo'],
                    ['path' => '/manage-upi', 'name' => 'Manage UPI'],
                    ['path' => '/employee-management', 'name' => 'Employee Management'],
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
                    ['path' => '/consignor-master', 'name' => 'Consignor Master'],
                    ['path' => '/consignee-master', 'name' => 'Consignee Master'],
                    ['path' => '/rate-details', 'name' => 'Rate Details'],
                    ['path' => '/bunk-details', 'name' => 'Bunk Details'],
                    ['path' => '/transport-master', 'name' => 'Transport Master'],
                    ['path' => '/route-master', 'name' => 'Route Master'],
                ]
            ],
            [
                'category' => 'Vehicle Management',
                'screens' => [
                    ['path' => '/vehicle-details', 'name' => 'Vehicle Details'],
                    ['path' => '/driver-details', 'name' => 'Driver Details'],
                    ['path' => '/settlement-history', 'name' => 'Settlement History'],
                    ['path' => '/owner-settlement', 'name' => 'Owner Settlement'],
                    ['path' => '/maintenance-billing', 'name' => 'Maintenance Billing'],
                ]
            ],
            [
                'category' => 'Fuel Management',
                'screens' => [
                    ['path' => '/fuel-token-entry', 'name' => 'Fuel Token Entry'],
                    ['path' => '/bunk-bill-entry', 'name' => 'Bunk Bill Entry'],
                    ['path' => '/bunk-payment-entry', 'name' => 'Bunk Payment Entry'],
                    ['path' => '/bunk-ledger-report', 'name' => 'Bunk Ledger Report'],
                ]
            ],
            [
                'category' => 'Way Bill',
                'screens' => [
                    ['path' => '/gc-entry', 'name' => 'GC Entry'],
                    ['path' => '/gc-modify', 'name' => 'GC Modify'],
                    ['path' => '/gc-track', 'name' => 'GC Track'],
                    ['path' => '/waybill-track', 'name' => 'Waybill Track'],
                    ['path' => '/gc-print', 'name' => 'GC Print'],
                    ['path' => '/gc-report', 'name' => 'GC Report'],
                    ['path' => '/waybill-admin-edit', 'name' => 'WayBill Admin/Edit'],
                ]
            ],
            [
                'category' => 'Accounts',
                'screens' => [
                    ['path' => '/head-details', 'name' => 'Head Details'],
                    ['path' => '/cash-book-details', 'name' => 'Cash Book Details'],
                    ['path' => '/cash-book-report', 'name' => 'Cash Book Report'],
                ]
            ],
            [
                'category' => 'Inward Way Bill',
                'screens' => [
                    ['path' => '/bulk-gc-inward', 'name' => 'Bulk GC Inward'],
                    ['path' => '/receive-inward', 'name' => 'Receive Inward'],
                    ['path' => '/inward-report', 'name' => 'Inward Report'],
                ]
            ],
            [
                'category' => 'Trip Sheet',
                'screens' => [
                    ['path' => '/trip-sheet-entry', 'name' => 'Trip Sheet Entry'],
                    ['path' => '/local-trip-entry', 'name' => 'Local Trip Entry'],
                    ['path' => '/route-trip-entry', 'name' => 'Route Trip Entry'],
                    ['path' => '/trip-sheet-ack', 'name' => 'Trip Sheet Ack'],
                    ['path' => '/trip-sheet-report', 'name' => 'Trip Sheet Report'],
                    ['path' => '/local-trip-report', 'name' => 'Local Trip Report'],
                    ['path' => '/trip-sheet-alert', 'name' => 'Trip Sheet Alert'],
                    ['path' => '/trip-sheet-payment', 'name' => 'Trip Sheet Payment'],
                ]
            ],
            [
                'category' => 'Update Delivery',
                'screens' => [
                    ['path' => '/update-delivery', 'name' => 'Update Delivery'],
                    ['path' => '/upload-pod', 'name' => 'Upload POD'],
                    ['path' => '/delivered-gc-report', 'name' => 'Delivered GC Report'],
                    ['path' => '/undelivered-gc-report', 'name' => 'Undelivered GC Report'],
                    ['path' => '/cancelled-gc-report', 'name' => 'Cancelled GC Report'],
                    ['path' => '/rto-report', 'name' => 'RTO Report'],
                    ['path' => '/pending-pod-report', 'name' => 'Pending POD Report'],
                ]
            ],
            [
                'category' => 'Consignor Report',
                'screens' => [
                    ['path' => '/consignor-report-prepare', 'name' => 'Consignor Report Prepare'],
                    ['path' => '/consignor-report-view', 'name' => 'Consignor Report View'],
                    ['path' => '/consignor-report-reports', 'name' => 'Consignor Report Reports'],
                ]
            ],
            [
                'category' => 'ACK Report Bundle',
                'screens' => [
                    ['path' => '/generate-ack-report-id', 'name' => 'Generate Ack Report ID'],
                    ['path' => '/ack-report-id-view', 'name' => 'Ack Report ID View'],
                    ['path' => '/ack-report-bundle', 'name' => 'Ack ID Report'],
                ]
            ],
            [
                'category' => 'Receive Payment',
                'screens' => [
                    ['path' => '/gc-wise-receive', 'name' => 'GC Wise Receive'],
                    ['path' => '/consignor-wise-receive', 'name' => 'Consignor Wise Receive'],
                    ['path' => '/consignor-wise-receive-without-id', 'name' => 'Consignor Wise Receive Without ID'],
                    ['path' => '/payment-pending-report', 'name' => 'Payment Pending Report'],
                ]
            ],
            [
                'category' => 'Reports',
                'screens' => [
                    ['path' => '/waybill-report', 'name' => 'Waybill Report'],
                    ['path' => '/waybill-track-report', 'name' => 'Waybill Track Report'],
                    ['path' => '/dispatch-pending-report', 'name' => 'Dispatch Pending Report'],
                    ['path' => '/audit-log-info', 'name' => 'Audit Log Info'],
                    ['path' => '/inward-status-report', 'name' => 'Inward Status Report'],
                    ['path' => '/ack-status-report', 'name' => 'Ack Status Report'],
                    ['path' => '/headwise-report', 'name' => 'HeadWise Report'],
                    ['path' => '/balance-sheet', 'name' => 'Balance Sheet'],
                    ['path' => '/booking-and-dispatch', 'name' => 'Booking And Dispatch'],
                    ['path' => '/profit-and-loss-report', 'name' => 'Profit And Loss Report'],
                    ['path' => '/consignor-history-report', 'name' => 'Consignor History Report'],
                    ['path' => '/user-history-details', 'name' => 'User History Details'],
                    ['path' => '/waybill-tally-report', 'name' => 'WayBill Tally Report'],
                    ['path' => '/income-expense-report', 'name' => 'Income/Expense Report'],
                    ['path' => '/trip-sheet-tally-report', 'name' => 'Trip Sheet Tally Report'],
                    ['path' => '/trip-sheet-report-reports', 'name' => 'Trip Sheet Report Reports'],
                    ['path' => '/route-analytics', 'name' => 'Route Analytics'],
                ]
            ],
            [
                'category' => 'Security Settings',
                'screens' => [
                    ['path' => '/app-workflow', 'name' => 'Application Flow'],
                    ['path' => '/change-password', 'name' => 'Change Password'],
                    ['path' => '/gc-format-print', 'name' => 'GC Format Print/Download'],
                ]
            ],
            [
                'category' => 'Support',
                'screens' => [
                    ['path' => '/technical-support', 'name' => 'Technical Support'],
                ]
            ]
        ];
    }
}
