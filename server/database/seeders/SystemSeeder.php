<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemSeeder extends Seeder
{
    public function run(): void
    {
        // ── System Settings ────────────────────────────────────────────────
        DB::table('system_settings')->insertOrIgnore([
            // Farm info
            ['key' => 'farm_name',            'value' => 'GreenValley Poultry Farm',    'group' => 'farm',    'created_at' => now(), 'updated_at' => now()],
            ['key' => 'farm_address',         'value' => 'Barangay Maligaya, Lipa City, Batangas 4217', 'group' => 'farm', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'farm_phone',           'value' => '043-123-4567',               'group' => 'farm',    'created_at' => now(), 'updated_at' => now()],
            ['key' => 'farm_email',           'value' => 'admin@greenvalley.farm',     'group' => 'farm',    'created_at' => now(), 'updated_at' => now()],
            ['key' => 'farm_manager',         'value' => 'Rodrigo Dela Cruz',          'group' => 'farm',    'created_at' => now(), 'updated_at' => now()],
            ['key' => 'farm_established',     'value' => '2018',                       'group' => 'farm',    'created_at' => now(), 'updated_at' => now()],
            // Alert thresholds
            ['key' => 'mortality_threshold',  'value' => '2',                          'group' => 'alerts',  'created_at' => now(), 'updated_at' => now()],
            ['key' => 'fcr_threshold',        'value' => '1.6',                        'group' => 'alerts',  'created_at' => now(), 'updated_at' => now()],
            ['key' => 'feed_low_threshold',   'value' => '1000',                       'group' => 'alerts',  'created_at' => now(), 'updated_at' => now()],
            ['key' => 'feed_critical_threshold','value' => '500',                      'group' => 'alerts',  'created_at' => now(), 'updated_at' => now()],
            ['key' => 'medicine_low_threshold','value' => '100',                       'group' => 'alerts',  'created_at' => now(), 'updated_at' => now()],
            // Egg prices
            ['key' => 'egg_price_small',      'value' => '1.80',                       'group' => 'pricing', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'egg_price_medium',     'value' => '2.10',                       'group' => 'pricing', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'egg_price_large',      'value' => '2.50',                       'group' => 'pricing', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'egg_price_extra_large','value' => '3.00',                       'group' => 'pricing', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'egg_price_jumbo',      'value' => '3.50',                       'group' => 'pricing', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $this->command->info('✓ System settings seeded (farm info, alert thresholds, egg prices)');
    }
}
