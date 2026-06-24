<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class FlockBatchTest extends TestCase
{
    use RefreshDatabase;

    private string $token;
    private User   $supervisor;
    private User   $worker;

    protected function setUp(): void
    {
        parent::setUp();

        DB::table('breeds')->insert([
            'name' => 'Cobb 500', 'type' => 'broiler', 'origin' => 'USA',
            'avg_fcr' => 1.35, 'peak_prod_age' => 35, 'active' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('buildings')->insert([
            'name' => 'Alpha-1', 'type' => 'layer', 'capacity' => 15000,
            'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->supervisor = User::factory()->create(['role' => 'supervisor', 'status' => 'active']);
        $this->worker     = User::factory()->create(['role' => 'worker',     'status' => 'active']);
        $this->token      = auth('api')->login($this->supervisor);
    }

    // ── GET /api/flock-batches ─────────────────────────────────────────────────

    public function test_supervisor_can_list_flock_batches(): void
    {
        $response = $this->withToken($this->token)->getJson('/api/flock-batches');
        $response->assertStatus(200)->assertJsonStructure(['data']);
    }

    public function test_worker_cannot_list_flock_batches(): void
    {
        $workerToken = auth('api')->login($this->worker);
        $response    = $this->withToken($workerToken)->getJson('/api/flock-batches');
        $response->assertStatus(403);
    }

    public function test_unauthenticated_cannot_list_flock_batches(): void
    {
        $response = $this->getJson('/api/flock-batches');
        $response->assertStatus(401);
    }

    // ── POST /api/flock-batches ────────────────────────────────────────────────

    public function test_supervisor_can_create_flock_batch(): void
    {
        $response = $this->withToken($this->token)->postJson('/api/flock-batches', [
            'batch_code'   => 'B-2024-001',
            'breed_id'     => 1,
            'building_id'  => 1,
            'arrival_date' => now()->subDays(5)->format('Y-m-d'),
            'initial_count'=> 12000,
        ]);

        $response->assertStatus(201)
                 ->assertJsonFragment(['batchCode' => 'B-2024-001']);

        $this->assertDatabaseHas('flock_batches', ['batch_code' => 'B-2024-001']);
    }

    public function test_create_flock_batch_validates_required_fields(): void
    {
        $response = $this->withToken($this->token)->postJson('/api/flock-batches', []);
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['batch_code', 'breed_id', 'building_id', 'arrival_date', 'initial_count']);
    }

    // ── GET /api/flock-batches/{id} ────────────────────────────────────────────

    public function test_can_get_single_flock_batch(): void
    {
        DB::table('flock_batches')->insert([
            'batch_code' => 'B-TEST-001', 'breed_id' => 1, 'building_id' => 1,
            'arrival_date' => now()->subDays(10)->format('Y-m-d'),
            'initial_count' => 5000, 'current_count' => 4950, 'status' => 'Active',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $response = $this->withToken($this->token)->getJson('/api/flock-batches/1');
        $response->assertStatus(200)->assertJsonFragment(['batchCode' => 'B-TEST-001']);
    }

    public function test_returns_404_for_nonexistent_batch(): void
    {
        $response = $this->withToken($this->token)->getJson('/api/flock-batches/999');
        $response->assertStatus(404);
    }

    // ── PUT /api/flock-batches/{id} ────────────────────────────────────────────

    public function test_can_update_flock_batch_status(): void
    {
        DB::table('flock_batches')->insert([
            'batch_code' => 'B-TEST-002', 'breed_id' => 1, 'building_id' => 1,
            'arrival_date' => now()->subDays(42)->format('Y-m-d'),
            'initial_count' => 5000, 'current_count' => 4800, 'status' => 'Active',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $response = $this->withToken($this->token)->putJson('/api/flock-batches/1', [
            'status' => 'Harvested',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('flock_batches', ['id' => 1, 'status' => 'Harvested']);
    }
}
