<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FlockBatchController;
use App\Http\Controllers\EggCollectionController;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\MortalityController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\MasterDataController;
use App\Http\Controllers\SystemSettingsController;
use App\Http\Controllers\FarmController;
use App\Http\Controllers\NotificationController;

// ── Health check (public) ─────────────────────────────────────────────────────
Route::get('health', fn() => response()->json(['status' => 'ok', 'time' => now()]));

// ── Public auth routes ────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('login',           [AuthController::class, 'login']);
    Route::post('refresh',         [AuthController::class, 'refresh']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password',  [AuthController::class, 'resetPassword']);
});

// ── Authenticated routes ───────────────────────────────────────────────────────
Route::middleware('auth.jwt')->group(function () {

    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me',      [AuthController::class, 'me']);

    Route::get('notifications',           [NotificationController::class, 'index']);
    Route::post('notifications/read',     [NotificationController::class, 'markRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);

    Route::get('dashboard/kpis',     [DashboardController::class, 'kpis']);
    Route::get('dashboard/activity', [DashboardController::class, 'activity']);

    Route::middleware('role:admin,manager,supervisor')->group(function () {
        Route::get('flock-batches/{id}/performance', [FlockBatchController::class, 'performance']);
        Route::apiResource('flock-batches', FlockBatchController::class);
    });

    Route::post('egg-collections', [EggCollectionController::class, 'store']);

    Route::middleware('role:admin,manager,supervisor')->group(function () {
        Route::get('egg-collections',           [EggCollectionController::class, 'index']);
        Route::get('egg-collections/summary',   [EggCollectionController::class, 'summary']);
        Route::get('egg-collections/{id}',      [EggCollectionController::class, 'show']);
        Route::put('egg-collections/{id}',      [EggCollectionController::class, 'update']);
        Route::delete('egg-collections/{id}',   [EggCollectionController::class, 'destroy']);
        Route::post('egg-collections/{id}/verify', [EggCollectionController::class, 'verify']);
        Route::post('egg-collections/{id}/flag',   [EggCollectionController::class, 'flag']);
        Route::get('egg-inventory',             [InventoryController::class, 'eggStock']);
        Route::get('egg-inventory/movements',   [InventoryController::class, 'eggMovements']);
    });

    Route::post('damaged-eggs', [InventoryController::class, 'reportDamage']);
    Route::middleware('role:admin,manager,supervisor')->get('damaged-eggs', [InventoryController::class, 'damagedList']);

    Route::post('feed-issuance', [FeedController::class, 'issue']);
    Route::middleware('role:admin,manager,supervisor')->group(function () {
        Route::get('feed-stock',     [FeedController::class, 'stock']);
        Route::post('feed-receiving',[FeedController::class, 'receive']);
        Route::get('feed/fcr',       [FeedController::class, 'fcr']);
        Route::get('feed-issuance',  [FeedController::class, 'issuanceList']);
    });

    Route::post('mortality-logs', [MortalityController::class, 'store']);
    Route::middleware('role:admin,manager,supervisor')->get('mortality-logs', [MortalityController::class, 'index']);

    Route::middleware('role:admin,manager,supervisor')->group(function () {
        Route::get('medicines',                   [HealthController::class, 'medicines']);
        Route::get('treatments',                  [HealthController::class, 'treatments']);
        Route::post('treatments',                 [HealthController::class, 'logTreatment']);
        Route::get('treatments/active-withdrawal',[HealthController::class, 'activeWithdrawals']);
        Route::get('vaccinations',                [HealthController::class, 'vaccinations']);
        Route::post('vaccinations',               [HealthController::class, 'scheduleVaccination']);
        Route::put('vaccinations/{id}',           [HealthController::class, 'updateVaccination']);
        Route::post('vaccinations/{id}/complete', [HealthController::class, 'markVaccinationDone']);
    });

    Route::middleware('role:admin')->group(function () {
        Route::post('medicines',    [HealthController::class, 'addMedicine']);
        Route::put('medicines/{id}',[HealthController::class, 'updateMedicine']);
    });

    Route::middleware('role:admin,manager,supervisor')->group(function () {
        Route::get('inventory',        [InventoryController::class, 'index']);
        Route::get('inventory/alerts', [InventoryController::class, 'alerts']);
    });

    Route::middleware('role:admin,manager')->group(function () {
        Route::get('sales/{id}/invoice',  [SalesController::class, 'invoice']);
        Route::post('sales/{id}/mark-paid',[SalesController::class, 'markPaid']);
        Route::apiResource('sales',       SalesController::class);
        Route::get('customers',           [SalesController::class, 'customers']);
        Route::post('customers',          [SalesController::class, 'storeCustomer']);
        Route::put('customers/{id}',      [SalesController::class, 'updateCustomer']);
    });

    Route::middleware('role:admin,manager')->group(function () {
        Route::get('analytics/production',   [AnalyticsController::class, 'production']);
        Route::get('analytics/fcr',          [AnalyticsController::class, 'fcr']);
        Route::get('analytics/mortality',    [AnalyticsController::class, 'mortality']);
        Route::get('analytics/buildings',    [AnalyticsController::class, 'buildings']);
        Route::get('analytics/profitability',[AnalyticsController::class, 'profitability']);
        Route::post('reports',               [ReportController::class, 'generate']);
        Route::get('reports/{jobId}',        [ReportController::class, 'status']);
        Route::get('reports/{jobId}/download',[ReportController::class, 'download']);
    });

    Route::middleware('role:admin,manager,supervisor')->get('farm/buildings', [FarmController::class, 'index']);

    Route::middleware('role:admin')->group(function () {
        Route::put('farm/buildings/{id}',        [FarmController::class, 'update']);
        Route::post('users/{id}/toggle-status',  [UserController::class, 'toggleStatus']);
        Route::post('users/{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::apiResource('users',              UserController::class);
        Route::get('system-settings',            [SystemSettingsController::class, 'index']);
        Route::put('system-settings',            [SystemSettingsController::class, 'update']);
        Route::get('master-data/breeds',         [MasterDataController::class, 'getBreeds']);
        Route::post('master-data/breeds',        [MasterDataController::class, 'createBreed']);
        Route::put('master-data/breeds/{id}',    [MasterDataController::class, 'updateBreed']);
        Route::delete('master-data/breeds/{id}', [MasterDataController::class, 'deleteBreed']);
        Route::get('master-data/feed-types',     [MasterDataController::class, 'getFeedTypes']);
        Route::post('master-data/feed-types',    [MasterDataController::class, 'createFeedType']);
        Route::put('master-data/feed-types/{id}',[MasterDataController::class, 'updateFeedType']);
        Route::get('master-data/suppliers',      [MasterDataController::class, 'getSuppliers']);
        Route::post('master-data/suppliers',     [MasterDataController::class, 'createSupplier']);
        Route::put('master-data/suppliers/{id}', [MasterDataController::class, 'updateSupplier']);
        Route::get('master-data/customers',      [MasterDataController::class, 'getCustomers']);
        Route::get('master-data/medicines',      [MasterDataController::class, 'getMedicines']);
    });
});
