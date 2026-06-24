<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // ── Buildings ──────────────────────────────────────────────────────
        DB::table('buildings')->insertOrIgnore([
            ['name' => 'Alpha-1', 'type' => 'layer',   'capacity' => 15000, 'status' => 'active',   'supervisor_id' => 4, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Alpha-2', 'type' => 'broiler', 'capacity' => 15000, 'status' => 'active',   'supervisor_id' => 4, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Beta-1',  'type' => 'layer',   'capacity' => 12000, 'status' => 'inactive', 'supervisor_id' => 5, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Beta-2',  'type' => 'layer',   'capacity' => 12000, 'status' => 'active',   'supervisor_id' => 5, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Gamma-3', 'type' => 'broiler', 'capacity' => 18000, 'status' => 'active',   'supervisor_id' => null, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Delta-1', 'type' => 'breeder', 'capacity' => 10000, 'status' => 'active',   'supervisor_id' => 6, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Breeds ─────────────────────────────────────────────────────────
        DB::table('breeds')->insertOrIgnore([
            ['name' => 'Cobb 500',     'type' => 'broiler', 'origin' => 'USA',      'avg_fcr' => 1.35, 'peak_prod_age' => 35, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Ross 308',     'type' => 'broiler', 'origin' => 'Scotland', 'avg_fcr' => 1.38, 'peak_prod_age' => 33, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Hubbard',      'type' => 'dual',    'origin' => 'France',   'avg_fcr' => 1.45, 'peak_prod_age' => 40, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Arbor Acres',  'type' => 'broiler', 'origin' => 'USA',      'avg_fcr' => 1.40, 'peak_prod_age' => 36, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Lohmann Brown','type' => 'layer',   'origin' => 'Germany',  'avg_fcr' => 2.10, 'peak_prod_age' => 28, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Feed Types ─────────────────────────────────────────────────────
        DB::table('feed_types')->insertOrIgnore([
            ['name' => 'Starter Mix (Type A)',    'category' => 'starter',  'age_from' => 0,  'age_to' => 14, 'price_per_kg' => 28.50, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Starter Mix (Type B)',    'category' => 'starter',  'age_from' => 0,  'age_to' => 14, 'price_per_kg' => 26.00, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Grower Pellets (Type A)', 'category' => 'grower',   'age_from' => 15, 'age_to' => 28, 'price_per_kg' => 24.00, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Finisher Crumbles',       'category' => 'finisher', 'age_from' => 29, 'age_to' => 42, 'price_per_kg' => 22.50, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Layer Mash (Premium)',    'category' => 'layer',    'age_from' => 18, 'age_to' => 99, 'price_per_kg' => 25.00, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Layer Pellets (Standard)','category' => 'layer',    'age_from' => 18, 'age_to' => 99, 'price_per_kg' => 22.00, 'active' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Suppliers ──────────────────────────────────────────────────────
        DB::table('suppliers')->insertOrIgnore([
            ['name' => 'AgriFeeds Corp',       'category' => 'Feed',     'contact' => 'Juan Reyes',     'phone' => '09171234567', 'email' => 'juan@agrifeeds.ph',   'address' => 'Malolos, Bulacan',    'rating' => 5, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'PrimeFeed Ltd',        'category' => 'Feed',     'contact' => 'Maria Cruz',     'phone' => '09281234567', 'email' => 'maria@primefeed.ph',   'address' => 'San Fernando, Pampanga','rating' => 4, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'NutriPro Supplies',    'category' => 'Feed',     'contact' => 'Pedro Santos',   'phone' => '09391234567', 'email' => 'pedro@nutripro.ph',   'address' => 'Bacoor, Cavite',      'rating' => 4, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'VetCare PH',           'category' => 'Medicine', 'contact' => 'Dr. Bautista',  'phone' => '09451234567', 'email' => 'vet@vetcare.ph',       'address' => 'Ermita, Manila',      'rating' => 5, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'FarmCo Direct',        'category' => 'Mixed',    'contact' => 'Rosa Mendoza',   'phone' => '09551234567', 'email' => 'rosa@farmco.ph',       'address' => 'Calamba, Laguna',     'rating' => 3, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'GreenValley Hatchery', 'category' => 'Chicks',   'contact' => 'Tony Villanueva','phone' => '09661234567', 'email' => 'tony@gvhatchery.ph',   'address' => 'Lipa, Batangas',      'rating' => 5, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
        ]);

        $this->command->info('✓ Master data seeded (buildings, breeds, feed types, suppliers)');
    }
}
