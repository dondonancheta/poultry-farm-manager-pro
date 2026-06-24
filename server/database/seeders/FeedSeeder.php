<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FeedSeeder extends Seeder
{
    public function run(): void
    {
        $today = Carbon::today();

        // ── Feed stocks (current inventory) ───────────────────────────────
        DB::table('feed_stocks')->insertOrIgnore([
            [
                'feed_type_id'  => 1, // Starter Mix A
                'supplier_id'   => 1, // AgriFeeds Corp
                'batch_number'  => 'AF-2024-0312',
                'quantity_kg'   => 4200.00,
                'price_per_kg'  => 28.50,
                'received_date' => $today->copy()->subDays(8)->format('Y-m-d'),
                'expiry_date'   => $today->copy()->addMonths(3)->format('Y-m-d'),
                'notes'         => 'January delivery — standard batch',
                'created_at'    => now()->subDays(8),
                'updated_at'    => now()->subDays(8),
            ],
            [
                'feed_type_id'  => 2, // Starter Mix B
                'supplier_id'   => 1,
                'batch_number'  => 'AF-2024-0313',
                'quantity_kg'   => 1800.00,
                'price_per_kg'  => 26.00,
                'received_date' => $today->copy()->subDays(8)->format('Y-m-d'),
                'expiry_date'   => $today->copy()->addMonths(3)->format('Y-m-d'),
                'notes'         => null,
                'created_at'    => now()->subDays(8),
                'updated_at'    => now()->subDays(8),
            ],
            [
                'feed_type_id'  => 3, // Grower Pellets A
                'supplier_id'   => 2, // PrimeFeed Ltd
                'batch_number'  => 'PF-2024-0215',
                'quantity_kg'   => 3100.00,
                'price_per_kg'  => 24.00,
                'received_date' => $today->copy()->subDays(15)->format('Y-m-d'),
                'expiry_date'   => $today->copy()->addMonths(4)->format('Y-m-d'),
                'notes'         => null,
                'created_at'    => now()->subDays(15),
                'updated_at'    => now()->subDays(15),
            ],
            [
                'feed_type_id'  => 4, // Finisher Crumbles
                'supplier_id'   => 2,
                'batch_number'  => 'PF-2024-0201',
                'quantity_kg'   => 950.00, // Low stock — alert
                'price_per_kg'  => 22.50,
                'received_date' => $today->copy()->subDays(20)->format('Y-m-d'),
                'expiry_date'   => $today->copy()->addMonths(2)->format('Y-m-d'),
                'notes'         => 'Low stock — reorder required',
                'created_at'    => now()->subDays(20),
                'updated_at'    => now()->subDays(20),
            ],
            [
                'feed_type_id'  => 5, // Layer Mash Premium
                'supplier_id'   => 3, // NutriPro
                'batch_number'  => 'NP-2024-0118',
                'quantity_kg'   => 2750.00,
                'price_per_kg'  => 25.00,
                'received_date' => $today->copy()->subDays(5)->format('Y-m-d'),
                'expiry_date'   => $today->copy()->addMonths(3)->format('Y-m-d'),
                'notes'         => null,
                'created_at'    => now()->subDays(5),
                'updated_at'    => now()->subDays(5),
            ],
        ]);

        // ── Feed issuances (last 7 days) ───────────────────────────────────
        $issuances = [];
        $sessions  = ['Morning', 'Noon', 'Afternoon'];
        for ($d = 6; $d >= 0; $d--) {
            $date = $today->copy()->subDays($d);
            // Alpha-1 — morning + afternoon
            $issuances[] = [
                'feed_stock_id'   => 5, // Layer Mash
                'flock_batch_id'  => 1,
                'building_id'     => 1,
                'issued_by'       => 7, // Juan
                'quantity_kg'     => 450.00,
                'session'         => 'Morning',
                'issued_at'       => $date->copy()->setTime(6, 30),
                'notes'           => null,
                'created_at'      => $date->copy()->setTime(6, 30),
                'updated_at'      => $date->copy()->setTime(6, 30),
            ];
            $issuances[] = [
                'feed_stock_id'   => 5,
                'flock_batch_id'  => 1,
                'building_id'     => 1,
                'issued_by'       => 7,
                'quantity_kg'     => 420.00,
                'session'         => 'Afternoon',
                'issued_at'       => $date->copy()->setTime(15, 0),
                'notes'           => null,
                'created_at'      => $date->copy()->setTime(15, 0),
                'updated_at'      => $date->copy()->setTime(15, 0),
            ];
            // Beta-2 — morning
            if ($d <= 18) {
                $issuances[] = [
                    'feed_stock_id'   => 5,
                    'flock_batch_id'  => 2,
                    'building_id'     => 4,
                    'issued_by'       => 8, // Rosa
                    'quantity_kg'     => 520.00,
                    'session'         => 'Morning',
                    'issued_at'       => $date->copy()->setTime(7, 0),
                    'notes'           => null,
                    'created_at'      => $date->copy()->setTime(7, 0),
                    'updated_at'      => $date->copy()->setTime(7, 0),
                ];
            }
        }

        DB::table('feed_issuances')->insert($issuances);

        $this->command->info('✓ Feed data seeded (5 stock entries + 7 days of issuances)');
    }
}
