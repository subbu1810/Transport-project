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
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\AccountHeadController;
use App\Http\Controllers\Api\CashBookEntryController;
use App\Http\Controllers\Api\DayBookClosingController;
use App\Http\Controllers\Api\TripSheetController;
use App\Http\Controllers\Api\ScreenAssignmentController;
use App\Http\Controllers\Api\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public API routes
Route::prefix('v1')->group(function () {
    // Dashboard routes
    Route::get('dashboard/stats', [DashboardController::class, 'getStats']);

    // Branch search (must come before apiResource)
    Route::get('branches/search', [BranchController::class, 'search']);
    
    // Active branches (must come before apiResource)
    Route::get('branches/active', [BranchController::class, 'active']);
    
    // Branch routes
    Route::apiResource('branches', BranchController::class);

    // User search (must come before apiResource)
    Route::get('users/search', [UserController::class, 'search']);
    
    // User routes
    Route::apiResource('users', UserController::class);

    // Role search (must come before apiResource)
    Route::get('roles/search', [RoleController::class, 'search']);
    
    // Role routes
    Route::apiResource('roles', RoleController::class);

    // State search (must come before apiResource)
    Route::get('states/search', [StateController::class, 'search']);
    
    // State routes
    Route::apiResource('states', StateController::class);

    // District search (must come before apiResource)
    Route::get('districts/search', [DistrictController::class, 'search']);
    
    // District routes
    Route::apiResource('districts', DistrictController::class);

    // Taluk search (must come before apiResource)
    Route::get('taluks/search', [TalukController::class, 'search']);
    
    // Taluk routes
    Route::apiResource('taluks', TalukController::class);

    // Destination search (must come before apiResource)
    Route::get('destinations/search', [DestinationController::class, 'search']);
    Route::get('destinations/taluk/{talukId}', [DestinationController::class, 'getByTaluk']);
    
    // Destination routes
    Route::apiResource('destinations', DestinationController::class);

    // Consignor search (must come before apiResource)
    Route::get('consignors/search', [ConsignorController::class, 'search']);
    
    // Consignor routes
    Route::apiResource('consignors', ConsignorController::class);

    // Consignee search (must come before apiResource)
    Route::get('consignees/search', [ConsigneeController::class, 'search']);
    
    // Consignee routes
    Route::apiResource('consignees', ConsigneeController::class);

    // Rate search (must come before apiResource)
    Route::get('rates/search', [RateController::class, 'search']);
    Route::get('rates/consignor/{consignorId}', [RateController::class, 'getByConsignor']);
    
    // Rate routes
    Route::apiResource('rates', RateController::class);

    // Driver search (must come before apiResource)
    Route::get('drivers/search', [DriverController::class, 'search']);
    Route::get('drivers/branch/{branchId}', [DriverController::class, 'getByBranch']);
    
    // Driver routes
    Route::apiResource('drivers', DriverController::class);

    // Vehicle search (must come before apiResource)
    Route::get('vehicles/search', [VehicleController::class, 'search']);
    Route::get('vehicles/branch/{branchId}', [VehicleController::class, 'getByBranch']);
    Route::get('vehicles/status/{status}', [VehicleController::class, 'getByStatus']);
    
    // Vehicle routes
    Route::apiResource('vehicles', VehicleController::class);

    // Bunk search (must come before apiResource)
    Route::get('bunks/search', [BunkController::class, 'search']);
    Route::get('bunks/branch/{branchId}', [BunkController::class, 'getByBranch']);
    
    // Bunk routes
    Route::apiResource('bunks', BunkController::class);

    // Transport search (must come before apiResource)
    Route::get('transports/search', [TransportController::class, 'search']);
    Route::get('transports/branch/{branchId}', [TransportController::class, 'getByBranch']);
    
    // Transport routes
    Route::apiResource('transports', TransportController::class);

    // Lookup search
    Route::get('lookups/search', [LookupController::class, 'search']);
    
    // Lookup routes
    Route::apiResource('lookups', LookupController::class);

    // Branch Destination Mapping routes
    Route::get('branch-destination-mappings', [BranchDestinationMappingController::class, 'index']);
    Route::post('branch-destination-mappings', [BranchDestinationMappingController::class, 'store']);
    Route::get('branch-destination-mappings/branch/{branchId}', [BranchDestinationMappingController::class, 'getAssignedByBranch']);

    // Waybill routes
    Route::apiResource('waybills', WaybillController::class);
    
    // Admin login route (must come before apiResource)
    Route::post('admins/login', [AdminController::class, 'login']);
    Route::apiResource('admins', AdminController::class);
    Route::apiResource('account-heads', AccountHeadController::class);
    Route::apiResource('cash-book', CashBookEntryController::class);
    Route::apiResource('day-book-closings', DayBookClosingController::class);

    // Settings routes
    Route::get('settings/{key}', [SettingsController::class, 'getSetting']);
    // For logo management
    Route::post('settings/logo', [SettingsController::class, 'updateLogo']);
    // For deleting logo
    Route::delete('settings/logo', [SettingsController::class, 'deleteLogo']);

    // Waybill routes
    Route::get('waybills/search/{gcNumber}', [WaybillController::class, 'searchByGcNumber']);
    Route::get('waybills/awaiting-ack/{branchCode}', [WaybillController::class, 'getAwaitingAck']);
    Route::post('waybills/submit-ack', [WaybillController::class, 'submitAck']);
    Route::post('waybills/bulk-inward', [WaybillController::class, 'bulkInward']);
    Route::post('waybills/update-delivery-status', [WaybillController::class, 'updateDeliveryStatus']);
    Route::get('reports/delivery-status', [WaybillController::class, 'getDeliveryStatusReport']);
    Route::put('waybills/{id}', [WaybillController::class, 'update']);



    // Screen Assignment routes
    Route::get('screen-assignments/admin/{adminId}', [ScreenAssignmentController::class, 'getByAdmin']);
    Route::get('screen-assignments/all-screens', [ScreenAssignmentController::class, 'getAllScreens']);
    Route::post('screen-assignments/assign', [ScreenAssignmentController::class, 'assignScreens']);

    // Trip Sheet routes
    Route::get('trip-sheets/awaiting-ack', [TripSheetController::class, 'getAwaitingAck']);
    Route::get('trip-sheets/awaiting-verification', [TripSheetController::class, 'getAwaitingVerification']);
    Route::post('trip-sheets/{id}/acknowledge', [TripSheetController::class, 'acknowledge']);
    Route::post('trip-sheets/{id}/verify', [TripSheetController::class, 'verify']);
    Route::apiResource('trip-sheets', TripSheetController::class);
    Route::get('trip-sheets/search/{tripNumber}', [TripSheetController::class, 'searchByTripNumber']);
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
