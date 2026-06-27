// ── Health check (public) ──────────────────────────────────────────────────
// ── Handle CORS preflight OPTIONS requests ────────────────────────────────────
Route::options('{any}', function() {
    return response()->json('OK', 200);
})->where('any', '.*');

Route::get('health', fn() => response()->json(['status' => 'ok', 'time' => now()]));

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

/*
|--------------------------------------------------------------------------
| PoultryFarm Pro — API Routes
|--------------------------------------------------------------------------
| Auth:  JWT Bearer token via auth.jwt middleware
| Roles: admin | manager | supervisor | worker
|
| Role access:
|   worker     → own data only (egg collection, feed log, mortality)
|   supervisor → verify entries, view all production, health records
|   manager    → analytics, reports, sales, profitability
|   admin      → everything + user management + system settings
*/

// ── Public (no auth required) ──────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('login',          [AuthController::class, 'login']);
    Route::post('refresh',        [AuthController::class, 'refresh']);
    Route::post('forgot-password',[AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

// ── Authenticated (all roles) ──────────────────────────────────────────────
Route::middleware('auth.jwt')->group(function () {

    // ── Auth ────────────────────────────────────────────────────────────
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me',      [AuthController::class, 'me']);

    // ── Notifications (all roles — filtered by role server-side) ────────
    Route::get('notifications',          [NotificationController::class, 'index']);
    Route::post('notifications/read',    [NotificationController::class, 'markRead']);
    Route::post('notifications/read-all',[NotificationController::class, 'markAllRead']);

    // ── Dashboard ───────────────────────────────────────────────────────
    // All roles can see their dashboard KPIs (filtered by role)
    Route::get('dashboard/kpis',     [DashboardController::class, 'kpis']);
    Route::get('dashboard/activity', [DashboardController::class, 'activity']);

    // ── Flock Batches (supervisor+) ─────────────────────────────────────
    Route::middleware('role:admin,manager,supervisor')->group(function () {
        Route::get('flock-batches/{id}/performance', [FlockBatchController::class, 'performance']);
        Route::apiResource('flock-batches', FlockBatchController::class);
    });

    // ── Egg Production ──────────────────────────────────────────────────
    // Workers: POST (submit collection)
    Route::post('egg-collections', [EggCollectionController::class, 'store']);

    // Supervisor+: view, verify, flag, summary
    Route::middleware('role:admin,manager,supervisor')->group(function () {
        Route::get('egg-collections',         [EggCollectionController::class, 'index']);
        Route::get('egg-collections/summary', [EggCollectionController::class, 'summary']);
        Route::get('egg-collections/{id}',    [EggCollectionController::class, 'show']);
        Route::put('egg-collections/{id}',    [EggCollectionController::class, 'update']);
        Route::delete('egg-collections/{id}', [EggCollectionController::class, 'destroy']);
        Route::post('egg-collections/{id}/verify', [EggCollectionController::class, 'verify']);
        Route::post('egg-collections/{id}/flag',   [EggCollectionController::class, 'flag']);
    });

    // Egg inventory (supervisor+)
    Route::middleware('role:admin,manager,supervisor')->group(function () {
        Route::get('egg-inventory',            [InventoryController::class, 'eggStock']);
        Route::get('egg-inventory/movements',  [InventoryController::class, 'eggMovements']);
    });

    // Damaged eggs (all roles can report, supervisor+ can view list)
    Route::post('damaged-eggs', [InventoryController::class, 'reportDamage']);
    Route::middleware('role:admin,manager,supervisor')->get('damaged-eggs', [InventoryController::class, 'damagedList']);

    // ── Feed Management ─────────────────────────────────────────────────
    // Workers: submit feed log
    Route::post('feed-issuance',  [FeedController::class, 'issue']);

    // Supervisor+: stock levels, receiving, FCR
    Route::middleware('role:admin,manager,supervisor')->group(function () {
        Route::get('feed-stock',      [FeedController::class, 'stock']);
        Route::post('feed-receiving', [FeedController::class, 'receive']);
        Route::get('feed/fcr',        [FeedController::class, 'fcr']);
        Route::get('feed-issuance',   [FeedController::class, 'issuanceList']);
    });

    // ── Mortality ───────────────────────────────────────────────────────
    // Workers: submit mortality log
    Route::post('mortality-logs', [MortalityController::class, 'store']);

    // Supervisor+: view list
    Route::middleware('role:admin,manager,supervisor')->get('mortality-logs', [MortalityController::class, 'index']);

    // ── Health & Medicine (supervisor+) ─────────────────────────────────
    Route::middleware('role:admin,manager,supervisor')->group(function () {
        Route::get('medicines',                          [HealthController::class, 'medicines']);
        Route::get('treatments',                         [HealthController::class, 'treatments']);
        Route::post('treatments',                        [HealthController::class, 'logTreatment']);
        Route::get('treatments/active-withdrawal',       [HealthController::class, 'activeWithdrawals']);
        Route::get('vaccinations',                       [HealthController::class, 'vaccinations']);
        Route::post('vaccinations',                      [HealthController::class, 'scheduleVaccination']);
        Route::put('vaccinations/{id}',                  [HealthController::class, 'updateVaccination']);
        Route::post('vaccinations/{id}/complete',        [HealthController::class, 'markVaccinationDone']);
    });

    // Admin: add/update medicine stock
    Route::middleware('role:admin')->group(function () {
        Route::post('medicines', [HealthController::class, 'addMedicine']);
        Route::put('medicines/{id}', [HealthController::class, 'updateMedicine']);
    });

    // ── Inventory & Alerts (supervisor+) ────────────────────────────────
    Route::middleware('role:admin,manager,supervisor')->group(function () {
        Route::get('inventory',        [InventoryController::class, 'index']);
        Route::get('inventory/alerts', [InventoryController::class, 'alerts']);
    });

    // ── Sales & Customers (manager+) ────────────────────────────────────
    Route::middleware('role:admin,manager')->group(function () {
        Route::get('sales/{id}/invoice', [SalesController::class, 'invoice']);
        Route::post('sales/{id}/mark-paid', [SalesController::class, 'markPaid']);
        Route::apiResource('sales',     SalesController::class);
        Route::apiResource('customers', SalesController::class)->names([
            'index'   => 'customers.index',
            'store'   => 'customers.store',
            'show'    => 'customers.show',
            'update'  => 'customers.update',
            'destroy' => 'customers.destroy',
        ]);
    });

    // ── Analytics & Reports (manager+) ──────────────────────────────────
    Route::middleware('role:admin,manager')->group(function () {
        Route::get('analytics/production',    [AnalyticsController::class, 'production']);
        Route::get('analytics/fcr',           [AnalyticsController::class, 'fcr']);
        Route::get('analytics/mortality',     [AnalyticsController::class, 'mortality']);
        Route::get('analytics/buildings',     [AnalyticsController::class, 'buildings']);
        Route::get('analytics/profitability', [AnalyticsController::class, 'profitability']);

        Route::post('reports',                [ReportController::class, 'generate']);
        Route::get('reports/{jobId}',         [ReportController::class, 'status']);
        Route::get('reports/{jobId}/download',[ReportController::class, 'download']);
    });

    // ── Farm & Buildings (manager+) ─────────────────────────────────────
    Route::middleware('role:admin,manager,supervisor')->group(function () {
        Route::get('farm/buildings', [FarmController::class, 'index']);
    });
    Route::middleware('role:admin')->group(function () {
        Route::put('farm/buildings/{id}', [FarmController::class, 'update']);
    });

    // ── Admin Only ───────────────────────────────────────────────────────
    Route::middleware('role:admin')->group(function () {

        // User management
        Route::post('users/{id}/toggle-status',  [UserController::class, 'toggleStatus']);
        Route::post('users/{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::apiResource('users', UserController::class);

        // System settings
        Route::get('system-settings', [SystemSettingsController::class, 'index']);
        Route::put('system-settings', [SystemSettingsController::class, 'update']);

        // Master data
        Route::apiResource('master-data/breeds',      MasterDataController::class)->parameters(['breeds'     => 'id'])->names('md.breeds');
        Route::apiResource('master-data/feed-types',  MasterDataController::class)->parameters(['feed-types' => 'id'])->names('md.feed-types');
        Route::apiResource('master-data/suppliers',   MasterDataController::class)->parameters(['suppliers'  => 'id'])->names('md.suppliers');
        Route::apiResource('master-data/customers',   MasterDataController::class)->parameters(['customers'  => 'id'])->names('md.customers-master');
        Route::apiResource('master-data/medicines',   MasterDataController::class)->parameters(['medicines'  => 'id'])->names('md.medicines-master');
    });

});
