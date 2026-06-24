<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class EggCollectionTest extends TestCase
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
            'arrival_date' => now()->subDays(20)->format('Y-m-d'),
            'initial_count' => 10000, 'current_count' => 9800, 'status' => 'Active',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $worker     = User::factory()->create(['role' => 'worker',     'status' => 'active']);
        $supervisor = User::factory()->create(['role' => 'supervisor', 'status' => 'active']);

        $this->workerToken     = auth('api')->login($worker);
        $this->supervisorToken = auth('api')->login($supervisor);
    }

    // ── POST /api/egg-collections ──────────────────────────────────────────────

    public function test_worker_can_submit_egg_collection(): void
    {
        $response = $this->withToken($this->workerToken)->postJson('/api/egg-collections', [
            'flock_batch_id'  => 1,
            'building_id'     => 1,
            'collection_date' => now()->format('Y-m-d'),
            'collection_time' => '06:30:00',
            'total_collected' => 1080,
            'good_eggs'       => 1065,
            'cracked'         => 10,
            'dirty'           => 5,
            'spoiled'         => 0,
            'rejected'        => 0,
            'sizes'           => ['large' => 600, 'medium' => 300, 'small' => 100, 'extra_large' => 60, 'jumbo' => 20],
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('egg_collections', [
            'flock_batch_id' => 1,
            'total_collected' => 1080,
        ]);
    }

    public function test_egg_collection_validates_required_fields(): void
    {
        $response = $this->withToken($this->workerToken)->postJson('/api/egg-collections', []);
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['flock_batch_id', 'building_id', 'collection_date', 'total_collected']);
    }

    public function test_collection_total_must_be_positive(): void
    {
        $response = $this->withToken($this->workerToken)->postJson('/api/egg-collections', [
            'flock_batch_id'  => 1,
            'building_id'     => 1,
            'collection_date' => now()->format('Y-m-d'),
            'collection_time' => '06:30',
            'total_collected' => -10,
            'good_eggs'       => 0,
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['total_collected']);
    }

    // ── GET /api/egg-collections ───────────────────────────────────────────────

    public function test_supervisor_can_list_egg_collections(): void
    {
        $response = $this->withToken($this->supervisorToken)->getJson('/api/egg-collections');
        $response->assertStatus(200)->assertJsonStructure(['data']);
    }

    public function test_worker_cannot_list_all_egg_collections(): void
    {
        $response = $this->withToken($this->workerToken)->getJson('/api/egg-collections');
        $response->assertStatus(403);
    }

    // ── POST /api/egg-collections/{id}/verify ─────────────────────────────────

    public function test_supervisor_can_verify_egg_collection(): void
    {
        DB::table('egg_collections')->insert([
            'flock_batch_id'  => 1,
            'building_id'     => 1,
            'collector_id'    => 1,
            'collection_date' => now()->subDay()->format('Y-m-d'),
            'collection_time' => '06:30:00',
            'total_collected' => 1080,
            'good_eggs'       => 1065,
            'cracked'         => 10,
            'dirty'           => 5,
            'spoiled'         => 0,
            'rejected'        => 0,
            'sizes'           => '{}',
            'verified_status' => 'pending',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        $response = $this->withToken($this->supervisorToken)
                         ->postJson('/api/egg-collections/1/verify');

        $response->assertStatus(200);
        $this->assertDatabaseHas('egg_collections', ['id' => 1, 'verified_status' => 'verified']);
    }
}
