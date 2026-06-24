<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HealthSeeder extends Seeder
{
    public function run(): void
    {
        $today = Carbon::today();

        // ── Medicines ──────────────────────────────────────────────────────
        DB::table('medicines')->insertOrIgnore([
            ['name' => 'Newcastle Vaccine (La Sota)', 'type' => 'Vaccine',    'active_ingredient' => 'Live La Sota',       'withdrawal_days' => 0,  'storage_temp' => '2-8°C',   'supplier_id' => 4, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Gumboro Vaccine (IBD)',       'type' => 'Vaccine',    'active_ingredient' => 'Live IBD virus',     'withdrawal_days' => 0,  'storage_temp' => '2-8°C',   'supplier_id' => 4, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => "Marek's Disease Vaccine",     'type' => 'Vaccine',    'active_ingredient' => 'HVT FC-126',         'withdrawal_days' => 0,  'storage_temp' => '-196°C',  'supplier_id' => 4, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Tetracycline 500mg',          'type' => 'Antibiotic', 'active_ingredient' => 'Oxytetracycline HCl','withdrawal_days' => 7,  'storage_temp' => '15-25°C', 'supplier_id' => 4, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Colistin Sulfate',            'type' => 'Antibiotic', 'active_ingredient' => 'Colistin sulfate',   'withdrawal_days' => 14, 'storage_temp' => '15-25°C', 'supplier_id' => 4, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'B-Complex Vitamins',          'type' => 'Supplement', 'active_ingredient' => 'B1/B2/B6/B12',      'withdrawal_days' => 0,  'storage_temp' => '15-25°C', 'supplier_id' => 5, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Amprolium 20%',               'type' => 'Coccidiostat','active_ingredient' => 'Amprolium',         'withdrawal_days' => 5,  'storage_temp' => '15-25°C', 'supplier_id' => 4, 'active' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Medicine stocks ────────────────────────────────────────────────
        DB::table('medicine_stocks')->insertOrIgnore([
            ['medicine_id' => 1, 'batch_number' => 'NC-2024-001', 'quantity' => 200,  'unit' => 'doses', 'expiry_date' => $today->copy()->addMonths(8)->format('Y-m-d'),  'received_date' => $today->copy()->subDays(30)->format('Y-m-d'), 'unit_cost' => 45.00,  'created_at' => now(), 'updated_at' => now()],
            ['medicine_id' => 2, 'batch_number' => 'GU-2024-001', 'quantity' => 50,   'unit' => 'doses', 'expiry_date' => $today->copy()->addMonths(6)->format('Y-m-d'),  'received_date' => $today->copy()->subDays(20)->format('Y-m-d'), 'unit_cost' => 38.00,  'created_at' => now(), 'updated_at' => now()],
            ['medicine_id' => 3, 'batch_number' => 'MD-2024-001', 'quantity' => 150,  'unit' => 'doses', 'expiry_date' => $today->copy()->addMonths(12)->format('Y-m-d'), 'received_date' => $today->copy()->subDays(10)->format('Y-m-d'), 'unit_cost' => 120.00, 'created_at' => now(), 'updated_at' => now()],
            ['medicine_id' => 4, 'batch_number' => 'TC-2024-010', 'quantity' => 2500, 'unit' => 'ml',    'expiry_date' => $today->copy()->addMonths(18)->format('Y-m-d'), 'received_date' => $today->copy()->subDays(15)->format('Y-m-d'), 'unit_cost' => 1.20,   'created_at' => now(), 'updated_at' => now()],
            ['medicine_id' => 5, 'batch_number' => 'CS-2024-005', 'quantity' => 1000, 'unit' => 'g',     'expiry_date' => $today->copy()->addMonths(24)->format('Y-m-d'), 'received_date' => $today->copy()->subDays(45)->format('Y-m-d'), 'unit_cost' => 2.50,   'created_at' => now(), 'updated_at' => now()],
            ['medicine_id' => 6, 'batch_number' => 'BC-2024-020', 'quantity' => 5000, 'unit' => 'ml',    'expiry_date' => $today->copy()->addMonths(12)->format('Y-m-d'), 'received_date' => $today->copy()->subDays(5)->format('Y-m-d'),  'unit_cost' => 0.80,   'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Treatments ────────────────────────────────────────────────────
        DB::table('treatments')->insertOrIgnore([
            [
                'flock_batch_id'  => 5, // Alpha-2 — high mortality
                'medicine_id'     => 4, // Tetracycline
                'administered_by' => 4, // Maria Santos
                'dosage_ml'       => 10.00,
                'duration_days'   => 5,
                'birds_treated'   => 150,
                'symptoms'        => 'Respiratory distress, reduced feed intake',
                'diagnosis'       => 'Suspected CRD (Chronic Respiratory Disease)',
                'withdrawal_end'  => $today->copy()->addDays(7)->format('Y-m-d'),
                'administered_at' => now()->subDays(2),
                'notes'           => 'Monitor closely. Egg collection from this batch withheld until withdrawal period ends.',
                'created_at'      => now()->subDays(2),
                'updated_at'      => now()->subDays(2),
            ],
            [
                'flock_batch_id'  => 1, // Alpha-1
                'medicine_id'     => 6, // B-Complex
                'administered_by' => 4,
                'dosage_ml'       => 5.00,
                'duration_days'   => 3,
                'birds_treated'   => 12450,
                'symptoms'        => 'Reduced growth rate',
                'diagnosis'       => 'Vitamin B deficiency',
                'withdrawal_end'  => null,
                'administered_at' => now()->subDays(10),
                'notes'           => 'Preventive supplementation.',
                'created_at'      => now()->subDays(10),
                'updated_at'      => now()->subDays(10),
            ],
        ]);

        // ── Vaccinations ──────────────────────────────────────────────────
        DB::table('vaccinations')->insertOrIgnore([
            // Batch 1 vaccinations
            ['flock_batch_id' => 1, 'medicine_id' => 1, 'vaccine_name' => 'Newcastle Stage 1', 'scheduled_date' => $today->copy()->subDays(28)->format('Y-m-d'), 'status' => 'completed', 'completed_date' => $today->copy()->subDays(28)->format('Y-m-d'), 'administered_by' => 'Maria Santos', 'batch_no' => 'NC-2024-001', 'notes' => null, 'created_at' => now()->subDays(28), 'updated_at' => now()->subDays(28)],
            ['flock_batch_id' => 1, 'medicine_id' => 2, 'vaccine_name' => 'Gumboro Stage 1',   'scheduled_date' => $today->copy()->subDays(21)->format('Y-m-d'), 'status' => 'completed', 'completed_date' => $today->copy()->subDays(21)->format('Y-m-d'), 'administered_by' => 'Maria Santos', 'batch_no' => 'GU-2024-001', 'notes' => null, 'created_at' => now()->subDays(21), 'updated_at' => now()->subDays(21)],
            ['flock_batch_id' => 1, 'medicine_id' => 1, 'vaccine_name' => 'Newcastle Stage 2', 'scheduled_date' => $today->copy()->subDays(14)->format('Y-m-d'), 'status' => 'completed', 'completed_date' => $today->copy()->subDays(14)->format('Y-m-d'), 'administered_by' => 'Maria Santos', 'batch_no' => 'NC-2024-001', 'notes' => null, 'created_at' => now()->subDays(14), 'updated_at' => now()->subDays(14)],
            ['flock_batch_id' => 1, 'medicine_id' => 1, 'vaccine_name' => 'Newcastle Stage 3', 'scheduled_date' => $today->copy()->addDays(1)->format('Y-m-d'),  'status' => 'scheduled', 'completed_date' => null, 'administered_by' => null, 'batch_no' => null, 'notes' => 'Due tomorrow', 'created_at' => now(), 'updated_at' => now()],

            // Batch 2 vaccinations
            ['flock_batch_id' => 2, 'medicine_id' => 1, 'vaccine_name' => 'Newcastle Stage 1', 'scheduled_date' => $today->copy()->subDays(14)->format('Y-m-d'), 'status' => 'completed', 'completed_date' => $today->copy()->subDays(14)->format('Y-m-d'), 'administered_by' => 'Pedro Reyes', 'batch_no' => 'NC-2024-001', 'notes' => null, 'created_at' => now()->subDays(14), 'updated_at' => now()->subDays(14)],
            ['flock_batch_id' => 2, 'medicine_id' => 2, 'vaccine_name' => 'Gumboro Stage 2',   'scheduled_date' => $today->copy()->format('Y-m-d'),              'status' => 'completed', 'completed_date' => $today->copy()->format('Y-m-d'),              'administered_by' => 'Pedro Reyes', 'batch_no' => 'GU-2024-001', 'notes' => 'All 15,000 birds vaccinated', 'created_at' => now(), 'updated_at' => now()],

            // Batch 4 — overdue
            ['flock_batch_id' => 4, 'medicine_id' => 3, 'vaccine_name' => "Marek's Disease Stage 2", 'scheduled_date' => $today->copy()->subDays(2)->format('Y-m-d'), 'status' => 'overdue', 'completed_date' => null, 'administered_by' => null, 'batch_no' => null, 'notes' => 'Overdue — schedule immediately', 'created_at' => now()->subDays(5), 'updated_at' => now()->subDays(2)],

            // Batch 5 — upcoming
            ['flock_batch_id' => 5, 'medicine_id' => 1, 'vaccine_name' => 'Newcastle Stage 1', 'scheduled_date' => $today->copy()->subDays(8)->format('Y-m-d'), 'status' => 'completed', 'completed_date' => $today->copy()->subDays(8)->format('Y-m-d'), 'administered_by' => 'Maria Santos', 'batch_no' => 'NC-2024-001', 'notes' => null, 'created_at' => now()->subDays(8), 'updated_at' => now()->subDays(8)],
        ]);

        $this->command->info('✓ Health data seeded (7 medicines, 6 medicine stocks, 2 treatments, 8 vaccinations)');
    }
}
