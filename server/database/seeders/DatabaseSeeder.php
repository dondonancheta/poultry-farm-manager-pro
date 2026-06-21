<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the PoultryFarm Pro demo database.
     *
     * Run: php artisan migrate:fresh --seed
     */
    public function run(): void
    {
        $this->command->info('');
        $this->command->info('🐔 PoultryFarm Pro — Seeding Demo Data');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        $this->call([
            UserSeeder::class,         // Users (admin, managers, supervisors, workers)
            MasterDataSeeder::class,   // Buildings, breeds, feed types, suppliers
            FlockSeeder::class,        // Flock batches (5 batches)
            ProductionSeeder::class,   // Egg collections (14 days) + mortality logs
            FeedSeeder::class,         // Feed stocks + 7 days of issuances
            HealthSeeder::class,       // Medicines, stocks, treatments, vaccinations
            SalesSeeder::class,        // Customers + 5 sales invoices
            SystemSeeder::class,       // Farm settings, thresholds, egg prices
        ]);

        $this->command->info('');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('✅ Demo data ready! Login credentials:');
        $this->command->info('');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Admin',      'admin1@admin.com',           'admin1'],
                ['Manager',    'manager1@manager.com',       'manager1'],
                ['Manager',    'manager2@manager.com',       'manager2'],
                ['Supervisor', 'supervisor1@supervisor.com', 'supervisor1'],
                ['Supervisor', 'supervisor2@supervisor.com', 'supervisor2'],
                ['Supervisor', 'supervisor3@supervisor.com', 'supervisor3'],
                ['Worker',     'worker1@worker.com',         'worker1'],
                ['Worker',     'worker2@worker.com',         'worker2'],
                ['Worker',     'worker3@worker.com',         'worker3'],
            ]
        );
        $this->command->info('');
    }
}
