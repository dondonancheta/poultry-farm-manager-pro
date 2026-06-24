<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        $today    = Carbon::today();
        $worker1  = 7;  // Juan dela Cruz
        $worker2  = 8;  // Rosa Mendoza
        $supv1    = 4;  // Maria Santos

        // ── Egg collections (last 14 days) ────────────────────────────────
        $collections = [];
        for ($d = 13; $d >= 0; $d--) {
            $date = $today->copy()->subDays($d)->format('Y-m-d');
            $time = '06:30:00';

            // Batch 1 — Alpha-1
            $b1 = $this->eggSizes(1080 + rand(-60, 80));
            $collections[] = [
                'flock_batch_id'  => 1,
                'building_id'     => 1,
                'collector_id'    => $worker1,
                'collection_date' => $date,
                'collection_time' => $time,
                'sizes'           => json_encode($b1['sizes']),
                'total_collected' => $b1['total'],
                'good_eggs'       => $b1['good'],
                'cracked'         => rand(2, 15),
                'dirty'           => rand(1, 8),
                'spoiled'         => rand(0, 3),
                'rejected'        => rand(0, 2),
                'notes'           => null,
                'verified_status' => $d > 2 ? 'verified' : 'pending',
                'verified_by'     => $d > 2 ? $supv1 : null,
                'verified_at'     => $d > 2 ? now()->subDays($d - 1) : null,
                'created_at'      => now()->subDays($d),
                'updated_at'      => now()->subDays($d),
            ];

            // Batch 2 — Beta-2
            if ($d <= 18) {
                $b2 = $this->eggSizes(1320 + rand(-100, 120));
                $collections[] = [
                    'flock_batch_id'  => 2,
                    'building_id'     => 4,
                    'collector_id'    => $worker2,
                    'collection_date' => $date,
                    'collection_time' => '07:00:00',
                    'sizes'           => json_encode($b2['sizes']),
                    'total_collected' => $b2['total'],
                    'good_eggs'       => $b2['good'],
                    'cracked'         => rand(3, 18),
                    'dirty'           => rand(1, 10),
                    'spoiled'         => rand(0, 4),
                    'rejected'        => rand(0, 3),
                    'notes'           => null,
                    'verified_status' => $d > 2 ? 'verified' : 'pending',
                    'verified_by'     => $d > 2 ? $supv1 : null,
                    'verified_at'     => $d > 2 ? now()->subDays($d - 1) : null,
                    'created_at'      => now()->subDays($d),
                    'updated_at'      => now()->subDays($d),
                ];
            }
        }

        DB::table('egg_collections')->insert($collections);

        // ── Mortality logs ────────────────────────────────────────────────
        DB::table('mortality_logs')->insertOrIgnore([
            [
                'flock_batch_id'  => 1,
                'building_id'     => 1,
                'recorded_by'     => $worker1,
                'count'           => 2,
                'cause'           => 'Natural',
                'location'        => 'North row',
                'symptoms'        => null,
                'disposal_method' => 'Burial',
                'severity'        => 'normal',
                'recorded_at'     => now()->subDays(5),
                'created_at'      => now()->subDays(5),
                'updated_at'      => now()->subDays(5),
            ],
            [
                'flock_batch_id'  => 5,
                'building_id'     => 2,
                'recorded_by'     => 9, // Ben Cruz
                'count'           => 7,
                'cause'           => 'Disease',
                'location'        => 'South section',
                'symptoms'        => 'Respiratory distress, lethargy, reduced appetite',
                'disposal_method' => 'Incineration',
                'severity'        => 'elevated',
                'recorded_at'     => now()->subDays(2),
                'created_at'      => now()->subDays(2),
                'updated_at'      => now()->subDays(2),
            ],
            [
                'flock_batch_id'  => 2,
                'building_id'     => 4,
                'recorded_by'     => $worker2,
                'count'           => 1,
                'cause'           => 'Natural',
                'location'        => null,
                'symptoms'        => null,
                'disposal_method' => 'Burial',
                'severity'        => 'normal',
                'recorded_at'     => now()->subDays(8),
                'created_at'      => now()->subDays(8),
                'updated_at'      => now()->subDays(8),
            ],
        ]);

        $this->command->info('✓ Production data seeded (14 days of egg collections + mortality logs)');
    }

    private function eggSizes(int $total): array
    {
        $large      = (int) ($total * 0.52);
        $medium     = (int) ($total * 0.25);
        $extra      = (int) ($total * 0.10);
        $small      = (int) ($total * 0.08);
        $jumbo      = $total - $large - $medium - $extra - $small;
        $good       = $total - rand(5, 20);
        return [
            'total' => $total,
            'good'  => $good,
            'sizes' => [
                'large'       => $large,
                'medium'      => $medium,
                'extra_large' => $extra,
                'small'       => $small,
                'jumbo'       => max(0, $jumbo),
            ],
        ];
    }
}
