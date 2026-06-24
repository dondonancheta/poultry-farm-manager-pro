<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class HealthTest extends TestCase
{
    use RefreshDatabase;

    private string $supervisorToken;
    private string $adminToken;

    protected function setUp(): void
    {
        parent::setUp();

        DB::table('suppliers')->insert([
            'name' => 'VetCare PH', 'category' => 'Medicine',
            'active' => true, 'rating' => 5,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('medicines')->insert([
            'name' => 'Newcastle Vaccine', 'type' => 'Vaccine',
            'active_ingredient' => 'Live La Sota', 'withdrawal_days' => 0,
            'storage_temp' => '2-8°C', 'supplier_id' => 1, 'active' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);
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
            'arrival_date' => now()->subDays(15)->format('Y-m-d'),
            'initial_count' => 10000, 'current_count' => 9800, 'status' => 'Active',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $supervisor = User::factory()->create(['role' => 'supervisor', 'status' => 'active']);
        $admin      = User::factory()->create(['role' => 'admin',      'status' => 'active']);

        $this->supervisorToken = auth('api')->login($supervisor);
        $this->adminToken      = auth('api')->login($admin);
    }

    public function test_supervisor_can_list_medicines(): void
    {
        $response = $this->withToken($this->supervisorToken)->getJson('/api/medicines');
        $response->assertStatus(200)
                 ->assertJsonStructure(['data'])
                 ->assertJsonFragment(['name' => 'Newcastle Vaccine']);
    }

    public function test_supervisor_can_list_vaccinations(): void
    {
        $response = $this->withToken($this->supervisorToken)->getJson('/api/vaccinations');
        $response->assertStatus(200)->assertJsonStructure(['data']);
    }

    public function test_supervisor_can_schedule_vaccination(): void
    {
        $response = $this->withToken($this->supervisorToken)->postJson('/api/vaccinations', [
            'flock_batch_id' => 1,
            'vaccine_name'   => 'Newcastle Stage 1',
            'scheduled_date' => now()->addDays(3)->format('Y-m-d'),
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('vaccinations', [
            'flock_batch_id' => 1,
            'vaccine_name'   => 'Newcastle Stage 1',
        ]);
    }

    public function test_supervisor_can_mark_vaccination_done(): void
    {
        DB::table('vaccinations')->insert([
            'flock_batch_id' => 1, 'vaccine_name' => 'Gumboro',
            'scheduled_date' => now()->subDay()->format('Y-m-d'),
            'status' => 'scheduled',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $response = $this->withToken($this->supervisorToken)
                         ->postJson('/api/vaccinations/1/complete', [
                             'administered_by' => 'Maria Santos',
                             'batch_no'        => 'GU-2024-001',
                         ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('vaccinations', ['id' => 1, 'status' => 'completed']);
    }

    public function test_supervisor_can_log_treatment(): void
    {
        $response = $this->withToken($this->supervisorToken)->postJson('/api/treatments', [
            'flock_batch_id' => 1,
            'medicine_id'    => 1,
            'dosage_ml'      => 5.0,
            'duration_days'  => 3,
            'birds_treated'  => 100,
            'diagnosis'      => 'Suspected respiratory issue',
        ]);

        $response->assertStatus(201);
    }

    public function test_admin_can_add_medicine(): void
    {
        $response = $this->withToken($this->adminToken)->postJson('/api/medicines', [
            'name'              => 'Tetracycline 500mg',
            'type'              => 'Antibiotic',
            'active_ingredient' => 'Oxytetracycline',
            'withdrawal_days'   => 7,
            'storage_temp'      => '15-25°C',
        ]);

        $response->assertStatus(201);
    }
}
