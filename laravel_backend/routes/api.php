<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\StateController;
use App\Http\Controllers\Api\DistrictController;
use App\Http\Controllers\Api\TalukController;
use App\Http\Controllers\Api\DestinationController;
use App\Http\Controllers\Api\ConsignorController;
use App\Http\Controllers\Api\ConsigneeController;
use App\Http\Controllers\Api\RateController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\BunkController;
use App\Http\Controllers\Api\TransportController;
use App\Http\Controllers\Api\LookupController;
use App\Http\Controllers\Api\BranchDestinationMappingController;
use App\Http\Controllers\Api\WaybillController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ConsignorReceiptController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\AccountHeadController;
use App\Http\Controllers\Api\CashBookEntryController;
use App\Http\Controllers\Api\DayBookClosingController;
use App\Http\Controllers\Api\TripSheetController;
use App\Http\Controllers\Api\RouteController;
use App\Http\Controllers\Api\ScreenAssignmentController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\AckBundleController;
use App\Http\Controllers\Api\OwnerSettlementController;
use App\Http\Controllers\Api\FuelManagementController;
use App\Http\Controllers\Api\MaintenanceController;
use App\Http\Controllers\Api\BackupController;

/* |-------------------------------------------------------------------------- | API Routes |-------------------------------------------------------------------------- | | Here is where you can register API routes for your application. These | routes are loaded by the RouteServiceProvider and all of them will | be assigned to the "api" middleware group. Make something great! | */

// Public API routes
Route::prefix('v1')->group(function () {
    // Dashboard routes
    Route::get('dashboard/stats', [DashboardController::class , 'getStats']);
    Route::get('dashboard/booking-dispatch-stats', [DashboardController::class , 'getBookingDispatchStats']);
    Route::get('dashboard/profit-loss-stats', [DashboardController::class , 'getProfitLossStats']);

    // Branch search (must come before apiResource)
    Route::get('branches/search', [BranchController::class , 'search']);

    // Active branches (must come before apiResource)
    Route::get('branches/active', [BranchController::class , 'active']);

    // Branch routes
    Route::apiResource('branches', BranchController::class);

    // User search (must come before apiResource)
    Route::get('users/search', [UserController::class , 'search']);

    // User routes
    Route::apiResource('users', UserController::class);

    // Role search (must come before apiResource)
    Route::get('roles/search', [RoleController::class , 'search']);

    // Role routes
    Route::apiResource('roles', RoleController::class);

    // State search (must come before apiResource)
    Route::get('states/search', [StateController::class , 'search']);

    // State routes
    Route::apiResource('states', StateController::class);

    // District search (must come before apiResource)
    Route::get('districts/search', [DistrictController::class , 'search']);
    Route::get('districts/state/{stateId}', [DistrictController::class , 'getByState']);

    // District routes
    Route::apiResource('districts', DistrictController::class);

    // Taluk search (must come before apiResource)
    Route::get('taluks/search', [TalukController::class , 'search']);
    Route::get('taluks/district/{districtId}', [TalukController::class , 'getByDistrict']);

    // Taluk routes
    Route::apiResource('taluks', TalukController::class);

    // Destination search (must come before apiResource)
    Route::get('destinations/search', [DestinationController::class , 'search']);
    Route::get('destinations/taluk/{talukId}', [DestinationController::class , 'getByTaluk']);

    // Destination routes
    Route::apiResource('destinations', DestinationController::class);

    // Consignor search (must come before apiResource)
    Route::get('consignors/search', [ConsignorController::class , 'search']);

    // Consignor routes
    Route::apiResource('consignors', ConsignorController::class);

    // Consignee search (must come before apiResource)
    Route::get('consignees/search', [ConsigneeController::class , 'search']);

    // Consignee routes
    Route::apiResource('consignees', ConsigneeController::class);

    // Rate search (must come before apiResource)
    Route::get('rates/search', [RateController::class , 'search']);
    Route::get('rates/consignor/{consignorId}', [RateController::class , 'getByConsignor']);

    // Rate routes
    Route::apiResource('rates', RateController::class);

    // Driver search (must come before apiResource)
    Route::get('drivers/search', [DriverController::class , 'search']);
    Route::get('drivers/branch/{branchId}', [DriverController::class , 'getByBranch']);

    // Driver routes
    Route::apiResource('drivers', DriverController::class);

    // Vehicle search (must come before apiResource)
    Route::get('vehicles/search', [VehicleController::class , 'search']);
    Route::get('vehicles/branch/{branchId}', [VehicleController::class , 'getByBranch']);
    Route::get('vehicles/status/{status}', [VehicleController::class , 'getByStatus']);

    // Vehicle routes
    Route::apiResource('vehicles', VehicleController::class);

    // Bunk search (must come before apiResource)
    Route::get('bunks/search', [BunkController::class , 'search']);
    Route::get('bunks/branch/{branchId}', [BunkController::class , 'getByBranch']);

    // Bunk routes
    Route::apiResource('bunks', BunkController::class);

    // Transport search (must come before apiResource)
    Route::get('transports/search', [TransportController::class , 'search']);
    Route::get('transports/branch/{branchId}', [TransportController::class , 'getByBranch']);

    // Transport routes
    Route::apiResource('transports', TransportController::class);

    // Employee routes
    Route::apiResource('employees', EmployeeController::class);

    // Per-transport logo management
    Route::post('transports/{id}/logo', [TransportController::class , 'uploadLogo']);
    Route::delete('transports/{id}/logo', [TransportController::class , 'deleteLogo']);

    // Lookup search
    Route::get('lookups/search', [LookupController::class , 'search']);

    // Lookup routes
    Route::apiResource('lookups', LookupController::class);

    // Branch Destination Mapping routes
    Route::get('branch-destination-mappings', [BranchDestinationMappingController::class , 'index']);
    Route::post('branch-destination-mappings', [BranchDestinationMappingController::class , 'store']);
    Route::get('branch-destination-mappings/branch/{branchId}', [BranchDestinationMappingController::class , 'getAssignedByBranch']);

    // Waybill routes
    Route::get('waybills/search/{gcNumber}', [WaybillController::class , 'searchByGcNumber']);
    Route::get('waybills/init-data', [WaybillController::class , 'initData']);
    Route::apiResource('waybills', WaybillController::class);
    Route::post('waybills/{id}/upload-pod', [WaybillController::class, 'uploadPod']);

    // Admin login route (must come before apiResource)
    Route::post('admins/login', [AdminController::class , 'login']);
    Route::post('admins/change-password', [AdminController::class , 'changePassword']);
    Route::apiResource('admins', AdminController::class);
    Route::apiResource('account-heads', AccountHeadController::class);
    Route::get('cash-book/report', [CashBookEntryController::class , 'getReport']);
    Route::get('cash-book/headwise-report', [CashBookEntryController::class , 'getHeadwiseReport']);
    Route::apiResource('cash-book', CashBookEntryController::class);
    Route::get('day-book-closings/opening-balance', [DayBookClosingController::class , 'getOpeningBalance']);
    Route::apiResource('day-book-closings', DayBookClosingController::class);

    // Settings routes
    Route::get('settings/all', [SettingsController::class , 'getAllSettings']);
    Route::get('settings/{key}', [SettingsController::class , 'getSetting']);
    // For logo management
    Route::post('settings/logo', [SettingsController::class , 'updateLogo']);
    Route::delete('settings/logo', [SettingsController::class , 'deleteLogo']);
    // For UPI management
    Route::post('settings/upi-details', [SettingsController::class , 'updateUPIDetails']);
    Route::post('settings/upi-qr', [SettingsController::class , 'updateQR']);
    Route::delete('settings/upi-qr', [SettingsController::class , 'deleteQR']);
    
    // Backup routes
    Route::get('settings/backup/status', [BackupController::class, 'status']);
    Route::post('settings/backup/toggle', [BackupController::class, 'toggle']);
    Route::post('backups/manual', [BackupController::class, 'manual']);
    Route::get('backups', [BackupController::class, 'index']);
    Route::get('backups/download', [BackupController::class, 'download']);

    // Waybill routes
    Route::get('waybills/awaiting-ack/{branchCode}', [WaybillController::class , 'getAwaitingAck']);
    Route::post('waybills/submit-ack', [WaybillController::class , 'submitAck']);
    Route::post('waybills/bulk-inward', [WaybillController::class , 'bulkInward']);
    Route::post('waybills/receive-payment', [WaybillController::class , 'receivePayment']);
    Route::post('waybills/bulk-receive-payment', [WaybillController::class , 'bulkReceivePayment']);
    Route::get('reports/payment-pending', [WaybillController::class , 'getPaymentPendingReport']);
    Route::post('waybills/update-delivery-status', [WaybillController::class , 'updateDeliveryStatus']);
    Route::get('reports/delivery-status', [WaybillController::class , 'getDeliveryStatusReport']);
    Route::get('reports/pending-pod', [WaybillController::class , 'getPendingPodReport']);
    Route::get('reports/inward-status', [WaybillController::class , 'getInwardStatusReport']);
    Route::get('reports/ack-status', [WaybillController::class , 'getAckStatusReport']);
    Route::get('reports/balance-sheet', [WaybillController::class , 'getBalanceSheetReport']);
    Route::get('reports/consignor-history', [WaybillController::class , 'getConsignorHistoryReport']);
    Route::post('waybills/{id}/cancel', [WaybillController::class , 'cancel']);
    Route::put('waybills/{id}', [WaybillController::class , 'update']);

    // Consignor Receipts
    Route::get('consignor-receipts', [ConsignorReceiptController::class , 'index']);
    Route::post('consignor-receipts/generate', [ConsignorReceiptController::class , 'generateReceipt']);
    Route::get('consignor-receipts/{receiptNo}', [ConsignorReceiptController::class , 'show']);
    Route::put('consignor-receipts/{id}', [ConsignorReceiptController::class , 'updateReceipt']);
    Route::delete('consignor-receipts/{id}', [ConsignorReceiptController::class , 'deleteReceipt']);

    // ACK Bundles
    Route::get('ack-bundles', [AckBundleController::class , 'index']);
    Route::post('ack-bundles', [AckBundleController::class , 'store']);
    Route::get('ack-bundles/awaiting', [AckBundleController::class , 'getAwaitingBundle']);
    Route::get('ack-bundles/search', [AckBundleController::class , 'searchByBundleNumber']);
    Route::get('ack-bundles/{id}', [AckBundleController::class , 'show']);


    // Screen Assignment routes
    Route::get('screen-assignments/admin/{adminId}', [ScreenAssignmentController::class , 'getByAdmin']);
    Route::get('screen-assignments/all-screens', [ScreenAssignmentController::class , 'getAllScreens']);
    Route::post('screen-assignments/assign', [ScreenAssignmentController::class , 'assignScreens']);

    // Trip Sheet routes
    Route::get('trip-sheets/awaiting-ack', [TripSheetController::class , 'getAwaitingAck']);
    Route::get('trip-sheets/awaiting-verification', [TripSheetController::class , 'getAwaitingVerification']);
    Route::get('trip-sheets/alerts', [TripSheetController::class , 'getAlerts']);
    Route::get('trip-sheets/check-vehicle/{vehicleId}', [TripSheetController::class , 'checkVehicleAvailability']);
    Route::post('trip-sheets/{id}/acknowledge', [TripSheetController::class , 'acknowledge']);
    Route::post('trip-sheets/{id}/verify', [TripSheetController::class , 'verify']);
    Route::get('trip-sheets/search/{tripNumber}', [TripSheetController::class , 'searchByTripNumber']);
    Route::apiResource('trip-sheets', TripSheetController::class);
    Route::get('routes/profitability', [RouteController::class, 'getProfitability']);
    Route::apiResource('routes', RouteController::class);

    // Local Trip routes
    Route::post('local-trips', [TripSheetController::class , 'store']);
    Route::put('local-trips/{tripNumber}', [TripSheetController::class , 'update']);
    Route::get('reports/user-history', [WaybillController::class , 'getUserHistoryReport']);
    Route::get('audit-logs', [\App\Http\Controllers\Api\AuditLogController::class , 'index']);

    // Owner Settlement routes
    Route::get('owner-settlements/pending', [OwnerSettlementController::class , 'getPendingSettlements']);
    Route::get('owner-settlements/pending-trips/{ownerName}', [OwnerSettlementController::class , 'getOwnerPendingTrips']);
    Route::apiResource('owner-settlements', OwnerSettlementController::class);

    // Fuel Management routes
    Route::prefix('fuel')->group(function () {
        Route::get('init-data', [FuelManagementController::class, 'getInitData']);
        Route::get('tokens', [FuelManagementController::class, 'indexTokens']);
        Route::post('tokens', [FuelManagementController::class, 'storeToken']);
        
        Route::get('bills', [FuelManagementController::class, 'indexBills']);
        Route::post('bills', [FuelManagementController::class, 'storeBill']);
        
        Route::get('payments', [FuelManagementController::class, 'indexPayments']);
        Route::post('payments', [FuelManagementController::class, 'storePayment']);
        Route::get('ledger', [FuelManagementController::class, 'getBunkLedger']);
        Route::get('reports/bunk-ledger', [FuelManagementController::class, 'getBunkLedger']);
    });

    // Maintenance Billing routes
    Route::prefix('maintenance')->group(function () {
        Route::get('pending-bill', [MaintenanceController::class, 'getPendingBill']);
        Route::post('generate-bill', [MaintenanceController::class, 'generateBill']);
        Route::get('bills', [MaintenanceController::class, 'index']);
        Route::post('orders/{id}', [MaintenanceController::class, 'createOrder']);
        Route::post('verify-payment', [MaintenanceController::class, 'verifyPayment']);
    });
});

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
    'success' => true,
    'message' => 'API is running',
    'timestamp' => now()->format('Y-m-d H:i:s'),
    ]);
});

// Fallback route
Route::fallback(function () {
    return response()->json([
    'success' => false,
    'message' => 'Endpoint not found',
    'timestamp' => now()->format('Y-m-d H:i:s'),
    ], 404);
});
// TEMPORARY: Hit this once on production to fix the storage link and permissions
Route::get('fix-storage-link', function () {
    try {
        // 1. Re-create the storage symlink
        $storagePath = storage_path('app/public');
        $publicPath = public_path('storage');

        if (file_exists($publicPath)) {
            if (is_link($publicPath)) {
                unlink($publicPath);
            }
            else {
                // If it's a real folder blocking the link, rename it
                rename($publicPath, $publicPath . '_backup_' . time());
            }
        }

        // Use PHP's symlink function directly
        symlink($storagePath, $publicPath);

        // 2. Fix permissions recursively (755 for folders, 644 for files)
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($storagePath));
        foreach ($iterator as $item) {
            chmod($item, $item->isDir() ? 0755 : 0644);
        }

        return "Storage link fixed and permissions updated!";
    }
    catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});

Route::get('fix-passwords', function() {
    try {
        \App\Models\Admin::whereNull('password_string')->update(['password_string' => 'admin123']);
        return "Passwords initialized to 'admin123' for all existing users.";
    } catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});
