<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->insertOrIgnore([
            // ── Admin ──────────────────────────────────────────────────────
            [
                'name'          => 'System Administrator',
                'email'         => 'admin1@admin.com',
                'password'      => Hash::make('admin1'),
                'role'          => 'admin',
                'status'        => 'active',
                'building'      => null,
                'phone'         => '09171000001',
                'last_login_at' => now(),
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            // ── Managers ───────────────────────────────────────────────────
            [
                'name'          => 'Rodrigo Dela Cruz',
                'email'         => 'manager1@manager.com',
                'password'      => Hash::make('manager1'),
                'role'          => 'manager',
                'status'        => 'active',
                'building'      => null,
                'phone'         => '09171000002',
                'last_login_at' => now()->subHours(2),
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'name'          => 'Elena Mercado',
                'email'         => 'manager2@manager.com',
                'password'      => Hash::make('manager2'),
                'role'          => 'manager',
                'status'        => 'active',
                'building'      => null,
                'phone'         => '09171000003',
                'last_login_at' => now()->subDays(1),
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            // ── Supervisors ────────────────────────────────────────────────
            [
                'name'          => 'Maria Santos',
                'email'         => 'supervisor1@supervisor.com',
                'password'      => Hash::make('supervisor1'),
                'role'          => 'supervisor',
                'status'        => 'active',
                'building'      => 'Alpha-1',
                'phone'         => '09281000001',
                'last_login_at' => now()->subHours(1),
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'name'          => 'Pedro Reyes',
                'email'         => 'supervisor2@supervisor.com',
                'password'      => Hash::make('supervisor2'),
                'role'          => 'supervisor',
                'status'        => 'active',
                'building'      => 'Beta-2',
                'phone'         => '09281000002',
                'last_login_at' => now()->subHours(3),
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'name'          => 'Carlos Bautista',
                'email'         => 'supervisor3@supervisor.com',
                'password'      => Hash::make('supervisor3'),
                'role'          => 'supervisor',
                'status'        => 'active',
                'building'      => 'Delta-1',
                'phone'         => '09281000003',
                'last_login_at' => now()->subDays(2),
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            // ── Workers ────────────────────────────────────────────────────
            [
                'name'          => 'Juan dela Cruz',
                'email'         => 'worker1@worker.com',
                'password'      => Hash::make('worker1'),
                'role'          => 'worker',
                'status'        => 'active',
                'building'      => 'Alpha-1',
                'phone'         => '09391000001',
                'last_login_at' => now()->subMinutes(30),
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'name'          => 'Rosa Mendoza',
                'email'         => 'worker2@worker.com',
                'password'      => Hash::make('worker2'),
                'role'          => 'worker',
                'status'        => 'active',
                'building'      => 'Beta-2',
                'phone'         => '09391000002',
                'last_login_at' => now()->subHours(4),
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'name'          => 'Ben Cruz',
                'email'         => 'worker3@worker.com',
                'password'      => Hash::make('worker3'),
                'role'          => 'worker',
                'status'        => 'active',
                'building'      => 'Alpha-2',
                'phone'         => '09391000003',
                'last_login_at' => now()->subDays(1),
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'name'          => 'Tess Santos',
                'email'         => 'worker4@worker.com',
                'password'      => Hash::make('worker4'),
                'role'          => 'worker',
                'status'        => 'inactive',
                'building'      => 'Gamma-3',
                'phone'         => '09391000004',
                'last_login_at' => now()->subWeeks(2),
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
        ]);

        $this->command->info('✓ Users seeded (9 users: 1 admin, 2 managers, 3 supervisors, 4 workers)');
    }
}
