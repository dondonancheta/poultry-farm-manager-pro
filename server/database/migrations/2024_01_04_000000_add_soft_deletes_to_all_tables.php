<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = [
        'users',
        'breeds',
        'buildings',
        'flock_batches',
        'egg_collections',
        'feed_stocks',
        'feed_issuances',
        'feed_types',
        'mortality_logs',
        'medicines',
        'medicine_stocks',
        'treatments',
        'vaccinations',
        'sales',
        'sale_items',
        'customers',
        'suppliers',
        'notifications',
        'system_settings',
        'damaged_egg_reports',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'deleted_at')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->softDeletes();
                });
            }
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'deleted_at')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropSoftDeletes();
                });
            }
        }
    }
};
