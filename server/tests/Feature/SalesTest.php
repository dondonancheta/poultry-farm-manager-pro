<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SalesTest extends TestCase
{
    use RefreshDatabase;

    private string $managerToken;
    private string $workerToken;

    protected function setUp(): void
    {
        parent::setUp();

        DB::table('customers')->insert([
            'name' => 'Metro Fresh Market', 'type' => 'wholesale',
            'credit_limit' => 50000, 'balance' => 0, 'active' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $manager = User::factory()->create(['role' => 'manager', 'status' => 'active']);
        $worker  = User::factory()->create(['role' => 'worker',  'status' => 'active']);

        $this->managerToken = auth('api')->login($manager);
        $this->workerToken  = auth('api')->login($worker);
    }

    // ── GET /api/sales ─────────────────────────────────────────────────────────

    public function test_manager_can_list_sales(): void
    {
        $response = $this->withToken($this->managerToken)->getJson('/api/sales');
        $response->assertStatus(200)->assertJsonStructure(['data']);
    }

    public function test_worker_cannot_list_sales(): void
    {
        $response = $this->withToken($this->workerToken)->getJson('/api/sales');
        $response->assertStatus(403);
    }

    // ── POST /api/sales ────────────────────────────────────────────────────────

    public function test_manager_can_create_sale(): void
    {
        $response = $this->withToken($this->managerToken)->postJson('/api/sales', [
            'customer_id'    => 1,
            'sale_date'      => now()->format('Y-m-d'),
            'payment_method' => 'cash',
            'items'          => [
                ['egg_size' => 'large', 'quantity' => 1000, 'unit_price' => 2.50],
                ['egg_size' => 'medium', 'quantity' => 500,  'unit_price' => 2.10],
            ],
            'discount' => 0,
        ]);

        $response->assertStatus(201)->assertJsonStructure(['id', 'invoice_no']);
    }

    public function test_sale_requires_at_least_one_item(): void
    {
        $response = $this->withToken($this->managerToken)->postJson('/api/sales', [
            'customer_id'    => 1,
            'sale_date'      => now()->format('Y-m-d'),
            'payment_method' => 'cash',
            'items'          => [],
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['items']);
    }

    public function test_sale_item_egg_size_must_be_valid(): void
    {
        $response = $this->withToken($this->managerToken)->postJson('/api/sales', [
            'customer_id'    => 1,
            'sale_date'      => now()->format('Y-m-d'),
            'payment_method' => 'cash',
            'items'          => [['egg_size' => 'invalid_size', 'quantity' => 100, 'unit_price' => 2.50]],
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['items.0.egg_size']);
    }

    // ── POST /api/sales/{id}/mark-paid ────────────────────────────────────────

    public function test_manager_can_mark_sale_as_paid(): void
    {
        DB::table('sales')->insert([
            'customer_id' => 1, 'invoice_no' => 'INV-0001',
            'sale_date'   => now()->format('Y-m-d'),
            'payment_method' => 'credit', 'status' => 'pending',
            'subtotal' => 2500, 'discount' => 0, 'total' => 2500,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $response = $this->withToken($this->managerToken)
                         ->postJson('/api/sales/1/mark-paid');

        $response->assertStatus(200);
        $this->assertDatabaseHas('sales', ['id' => 1, 'status' => 'paid']);
    }

    // ── GET /api/customers ─────────────────────────────────────────────────────

    public function test_manager_can_list_customers(): void
    {
        $response = $this->withToken($this->managerToken)->getJson('/api/customers');
        $response->assertStatus(200)->assertJsonStructure(['data']);
    }

    public function test_customer_count_matches_database(): void
    {
        $response = $this->withToken($this->managerToken)->getJson('/api/customers');
        $data = $response->json('data');
        $this->assertCount(1, $data);
    }
}
