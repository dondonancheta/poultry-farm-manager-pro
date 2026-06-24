<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SalesSeeder extends Seeder
{
    public function run(): void
    {
        $today = Carbon::today();

        // ── Customers ──────────────────────────────────────────────────────
        DB::table('customers')->insertOrIgnore([
            ['name' => 'Metro Fresh Market',      'type' => 'wholesale',  'contact' => 'Ana Lim',      'phone' => '09171111111', 'email' => 'ana@metro.ph',      'credit_limit' => 50000.00, 'balance' => 12000.00, 'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Sunrise Supermarket',     'type' => 'wholesale',  'contact' => 'Ben Cruz',     'phone' => '09282222222', 'email' => 'ben@sunrise.ph',    'credit_limit' => 30000.00, 'balance' => 5000.00,  'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Casa Manila Restaurant',  'type' => 'restaurant', 'contact' => 'Chef Reyes',   'phone' => '09393333333', 'email' => 'chef@casa.ph',      'credit_limit' => 20000.00, 'balance' => 8000.00,  'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Green Market Retailer',   'type' => 'retail',     'contact' => 'Tess Santos',  'phone' => '09454444444', 'email' => 'tess@green.ph',     'credit_limit' => 10000.00, 'balance' => 0.00,     'active' => true,  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'FarmGate Direct',         'type' => 'retail',     'contact' => 'Mike Delos',   'phone' => '09565555555', 'email' => 'mike@farmgate.ph',  'credit_limit' => 5000.00,  'balance' => 2500.00,  'active' => true,  'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Sales ──────────────────────────────────────────────────────────
        DB::table('sales')->insertOrIgnore([
            [
                'invoice_no'        => 'INV-1038',
                'customer_id'       => 1, // Metro Fresh
                'sale_date'         => $today->copy()->subDays(8)->format('Y-m-d'),
                'payment_method'    => 'credit',
                'status'            => 'overdue',
                'subtotal'          => 25000.00,
                'discount'          => 0.00,
                'total'             => 25000.00,
                'notes'             => null,
                'created_at'        => now()->subDays(8),
                'updated_at'        => now()->subDays(8),
            ],
            [
                'invoice_no'        => 'INV-1039',
                'customer_id'       => 3, // Casa Manila
                'sale_date'         => $today->copy()->subDays(5)->format('Y-m-d'),
                'payment_method'    => 'bank_transfer',
                'status'            => 'paid',
                'subtotal'          => 9000.00,
                'discount'          => 500.00,
                'total'             => 8500.00,
                'notes'             => 'Monthly standing order',
                'created_at'        => now()->subDays(5),
                'updated_at'        => now()->subDays(5),
            ],
            [
                'invoice_no'        => 'INV-1040',
                'customer_id'       => 3, // Casa Manila
                'sale_date'         => $today->copy()->subDays(3)->format('Y-m-d'),
                'payment_method'    => 'credit',
                'status'            => 'pending',
                'subtotal'          => 7500.00,
                'discount'          => 0.00,
                'total'             => 7500.00,
                'notes'             => null,
                'created_at'        => now()->subDays(3),
                'updated_at'        => now()->subDays(3),
            ],
            [
                'invoice_no'        => 'INV-1041',
                'customer_id'       => 2, // Sunrise
                'sale_date'         => $today->copy()->subDays(1)->format('Y-m-d'),
                'payment_method'    => 'bank_transfer',
                'status'            => 'paid',
                'subtotal'          => 12500.00,
                'discount'          => 0.00,
                'total'             => 12500.00,
                'notes'             => null,
                'created_at'        => now()->subDays(1),
                'updated_at'        => now()->subDays(1),
            ],
            [
                'invoice_no'        => 'INV-1042',
                'customer_id'       => 1, // Metro Fresh
                'sale_date'         => $today->format('Y-m-d'),
                'payment_method'    => 'cash',
                'status'            => 'paid',
                'subtotal'          => 24200.00,
                'discount'          => 200.00,
                'total'             => 24000.00,
                'notes'             => 'Large order — discounted',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
        ]);

        // ── Sale line items ────────────────────────────────────────────────
        DB::table('sale_items')->insertOrIgnore([
            // INV-1038
            ['sale_id' => 1, 'egg_size' => 'large',  'quantity' => 10000, 'unit_price' => 2.50, 'subtotal' => 25000.00, 'created_at' => now(), 'updated_at' => now()],
            // INV-1039
            ['sale_id' => 2, 'egg_size' => 'extra_large', 'quantity' => 2500, 'unit_price' => 3.00, 'subtotal' => 7500.00, 'created_at' => now(), 'updated_at' => now()],
            ['sale_id' => 2, 'egg_size' => 'jumbo',   'quantity' => 500,  'unit_price' => 3.50, 'subtotal' => 1750.00, 'created_at' => now(), 'updated_at' => now()],
            // INV-1040
            ['sale_id' => 3, 'egg_size' => 'extra_large', 'quantity' => 2500, 'unit_price' => 3.00, 'subtotal' => 7500.00, 'created_at' => now(), 'updated_at' => now()],
            // INV-1041
            ['sale_id' => 4, 'egg_size' => 'large',   'quantity' => 5000, 'unit_price' => 2.50, 'subtotal' => 12500.00, 'created_at' => now(), 'updated_at' => now()],
            // INV-1042
            ['sale_id' => 5, 'egg_size' => 'large',   'quantity' => 8000, 'unit_price' => 2.50, 'subtotal' => 20000.00, 'created_at' => now(), 'updated_at' => now()],
            ['sale_id' => 5, 'egg_size' => 'medium',  'quantity' => 2000, 'unit_price' => 2.10, 'subtotal' => 4200.00,  'created_at' => now(), 'updated_at' => now()],
        ]);

        $this->command->info('✓ Sales data seeded (5 customers, 5 invoices, 7 line items)');
    }
}
