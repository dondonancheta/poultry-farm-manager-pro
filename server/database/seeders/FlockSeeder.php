<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FlockSeeder extends Seeder
{
    public function run(): void
    {
        $today = Carbon::today();

        DB::table('flock_batches')->insertOrIgnore([
            [
                'batch_code'            => 'B-2024-001',
                'breed_id'              => 1, // Cobb 500
                'building_id'           => 1, // Alpha-1
                'arrival_date'          => $today->copy()->subDays(32),
                'source_farm'           => 'GreenValley Hatchery',
                'initial_count'         => 12800,
                'current_count'         => 12450,
                'purchase_cost_per_hen' => 85.00,
                'status'                => 'Active',
                'notes'                 => 'Good health on arrival. Standard vaccination protocol started.',
                'created_at'            => now(),
                'updated_at'            => now(),
            ],
            [
                'batch_code'            => 'B-2024-002',
                'breed_id'              => 2, // Ross 308
                'building_id'           => 4, // Beta-2
                'arrival_date'          => $today->copy()->subDays(18),
                'source_farm'           => 'SunFarm Hatchery',
                'initial_count'         => 15200,
                'current_count'         => 15000,
                'purchase_cost_per_hen' => 90.00,
                'status'                => 'Active',
                'notes'                 => 'Premium batch. Gumboro vaccination completed.',
                'created_at'            => now(),
                'updated_at'            => now(),
            ],
            [
                'batch_code'            => 'B-2024-003',
                'breed_id'              => 1, // Cobb 500
                'building_id'           => 5, // Gamma-3
                'arrival_date'          => $today->copy()->subDays(89),
                'source_farm'           => 'GreenValley Hatchery',
                'initial_count'         => 18000,
                'current_count'         => 0,
                'purchase_cost_per_hen' => 82.00,
                'status'                => 'Harvested',
                'notes'                 => 'Harvested on schedule. Excellent FCR of 1.52.',
                'created_at'            => now(),
                'updated_at'            => now(),
            ],
            [
                'batch_code'            => 'B-2024-004',
                'breed_id'              => 3, // Hubbard
                'building_id'           => 6, // Delta-1
                'arrival_date'          => $today->copy()->subDays(5),
                'source_farm'           => 'PrimeBirds Inc',
                'initial_count'         => 10200,
                'current_count'         => 10200,
                'purchase_cost_per_hen' => 95.00,
                'status'                => 'Active',
                'notes'                 => 'New arrivals. Marek\'s vaccination overdue — schedule immediately.',
                'created_at'            => now(),
                'updated_at'            => now(),
            ],
            [
                'batch_code'            => 'B-2024-005',
                'breed_id'              => 2, // Ross 308
                'building_id'           => 2, // Alpha-2
                'arrival_date'          => $today->copy()->subDays(12),
                'source_farm'           => 'SunFarm Hatchery',
                'initial_count'         => 15000,
                'current_count'         => 14850,
                'purchase_cost_per_hen' => 88.00,
                'status'                => 'Active',
                'notes'                 => 'High FCR detected — review feed schedule. Monitor closely.',
                'created_at'            => now(),
                'updated_at'            => now(),
            ],
        ]);

        $this->command->info('✓ Flock batches seeded (5 batches: 4 active, 1 harvested)');
    }
}
