<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class FeedTest extends TestCase
{
    use RefreshDatabase;

    private string $workerToken;
    private string $supervisorToken;

    protected function setUp(): void
    {
        parent::setUp();

        DB::table('buildings')->insert([
            'name' => 'Alpha-1', 'type' => 'layer', 'capacity' => 15000,
            'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('breeds')->insert([
            'name' => 'Cobb 500', 'type' => 'broiler', 'origin' => 'USA',
            'avg_fcr' => 1.35, 'peak_prod_age' => 35, 'active' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('flock_batches')->insert([
            'batch_code' => 'B-TEST-001', 'breed_id' => 1, 'building_id' => 1,
            'arrival_date' => now()->subDays(10)->format('Y-m-d'),
            'initial_count' => 10000, 'current_count' => 9800, 'status' => 'Active',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('suppliers')->insert([
            'name' => 'AgriFeeds Corp', 'category' => 'Feed',
            'active' => true, 'rating' => 5,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('feed_types')->insert([
            'name' => 'Layer Mash', 'category' => 'layer',
            'age_from' => 18, 'age_to' => 99, 'price_per_kg' => 25.00,
            'active' => true, 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('feed_stocks')->insert([
            'feed_type_id' => 1, 'supplier_id' => 1,
            'batch_number' => 'TEST-001',
            'quantity_kg' => 5000.00, 'price_per_kg' => 25.00,
            'received_date' => now()->format('Y-m-d'),
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $worker     = User::factory()->create(['role' => 'worker',     'status' => 'active']);
        $supervisor = User::factory()->create(['role' => 'supervisor', 'status' => 'active']);

        $this->workerToken     = auth('api')->login($worker);
        $this->supervisorToken = auth('api')->login($supervisor);
    }

    // ── GET /api/feed-stock ────────────────────────────────────────────────────

    public function test_supervisor_can_view_feed_stock(): void
    {
        $response = $this->withToken($this->supervisorToken)->getJson('/api/feed-stock');
        $response->assertStatus(200)->assertJsonStructure(['data']);
    }

    public function test_worker_cannot_view_feed_stock(): void
    {
        $response = $this->withToken($this->workerToken)->getJson('/api/feed-stock');
        $response->assertStatus(403);
    }

    // ── POST /api/feed-issuance ────────────────────────────────────────────────

    public function test_worker_can_log_feed_issuance(): void
    {
        $response = $this->withToken($this->workerToken)->postJson('/api/feed-issuance', [
            'feed_stock_id'  => 1,
            'flock_batch_id' => 1,
            'building_id'    => 1,
            'quantity_kg'    => 450.00,
            'session'        => 'Morning',
        ]);

        $response->assertStatus(201);

        // Stock should be decremented
        $this->assertDatabaseHas('feed_stocks', [
            'id'          => 1,
            'quantity_kg' => 4550.00,
        ]);
    }

    public function test_feed_issuance_validates_session(): void
    {
        $response = $this->withToken($this->workerToken)->postJson('/api/feed-issuance', [
            'feed_stock_id'  => 1,
            'flock_batch_id' => 1,
            'building_id'    => 1,
            'quantity_kg'    => 100,
            'session'        => 'InvalidSession',
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['session']);
    }

    // ── POST /api/feed-receiving ───────────────────────────────────────────────

    public function test_supervisor_can_receive_feed_delivery(): void
    {
        $response = $this->withToken($this->supervisorToken)->postJson('/api/feed-receiving', [
            'feed_type_id'  => 1,
            'supplier_id'   => 1,
            'quantity_kg'   => 2000,
            'price_per_kg'  => 25.00,
            'received_date' => now()->format('Y-m-d'),
        ]);

        $response->assertStatus(201);
    }

    // ── GET /api/feed/fcr ──────────────────────────────────────────────────────

    public function test_can_get_fcr_data(): void
    {
        $response = $this->withToken($this->supervisorToken)->getJson('/api/feed/fcr');
        $response->assertStatus(200)->assertJsonStructure(['by_batch']);
    }
}
