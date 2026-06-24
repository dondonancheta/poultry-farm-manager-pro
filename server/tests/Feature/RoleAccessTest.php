<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests that role-based access control works correctly.
 * Each role should only access their permitted endpoints.
 */
class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    private function tokenFor(string $role): string
    {
        $user = User::factory()->create(['role' => $role, 'status' => 'active']);
        return auth('api')->login($user);
    }

    // ── Admin-only endpoints ───────────────────────────────────────────────────

    public function test_only_admin_can_list_users(): void
    {
        $this->withToken($this->tokenFor('admin'))      ->getJson('/api/users')->assertStatus(200);
        $this->withToken($this->tokenFor('manager'))    ->getJson('/api/users')->assertStatus(403);
        $this->withToken($this->tokenFor('supervisor')) ->getJson('/api/users')->assertStatus(403);
        $this->withToken($this->tokenFor('worker'))     ->getJson('/api/users')->assertStatus(403);
    }

    public function test_only_admin_can_access_system_settings(): void
    {
        $this->withToken($this->tokenFor('admin'))   ->getJson('/api/system-settings')->assertStatus(200);
        $this->withToken($this->tokenFor('manager')) ->getJson('/api/system-settings')->assertStatus(403);
        $this->withToken($this->tokenFor('worker'))  ->getJson('/api/system-settings')->assertStatus(403);
    }

    // ── Manager-only endpoints ─────────────────────────────────────────────────

    public function test_only_manager_and_above_can_access_analytics(): void
    {
        $this->withToken($this->tokenFor('admin'))      ->getJson('/api/analytics/production')->assertStatus(200);
        $this->withToken($this->tokenFor('manager'))    ->getJson('/api/analytics/production')->assertStatus(200);
        $this->withToken($this->tokenFor('supervisor')) ->getJson('/api/analytics/production')->assertStatus(403);
        $this->withToken($this->tokenFor('worker'))     ->getJson('/api/analytics/production')->assertStatus(403);
    }

    public function test_only_manager_and_above_can_access_sales(): void
    {
        $this->withToken($this->tokenFor('admin'))      ->getJson('/api/sales')->assertStatus(200);
        $this->withToken($this->tokenFor('manager'))    ->getJson('/api/sales')->assertStatus(200);
        $this->withToken($this->tokenFor('supervisor')) ->getJson('/api/sales')->assertStatus(403);
        $this->withToken($this->tokenFor('worker'))     ->getJson('/api/sales')->assertStatus(403);
    }

    // ── Supervisor-level endpoints ─────────────────────────────────────────────

    public function test_supervisor_and_above_can_list_flock_batches(): void
    {
        $this->withToken($this->tokenFor('admin'))      ->getJson('/api/flock-batches')->assertStatus(200);
        $this->withToken($this->tokenFor('manager'))    ->getJson('/api/flock-batches')->assertStatus(200);
        $this->withToken($this->tokenFor('supervisor')) ->getJson('/api/flock-batches')->assertStatus(200);
        $this->withToken($this->tokenFor('worker'))     ->getJson('/api/flock-batches')->assertStatus(403);
    }

    public function test_supervisor_and_above_can_view_egg_collections(): void
    {
        $this->withToken($this->tokenFor('supervisor')) ->getJson('/api/egg-collections')->assertStatus(200);
        $this->withToken($this->tokenFor('worker'))     ->getJson('/api/egg-collections')->assertStatus(403);
    }

    // ── Worker endpoints ───────────────────────────────────────────────────────

    public function test_all_roles_can_submit_egg_collection(): void
    {
        // Workers can POST (submit their own)
        // Just check the endpoint is accessible (will fail validation but not 403)
        $workerToken = $this->tokenFor('worker');
        $response = $this->withToken($workerToken)->postJson('/api/egg-collections', []);
        $response->assertStatus(422); // validation error, not 403
    }

    public function test_all_roles_can_submit_mortality_log(): void
    {
        $workerToken = $this->tokenFor('worker');
        $response = $this->withToken($workerToken)->postJson('/api/mortality-logs', []);
        $response->assertStatus(422); // validation, not 403
    }

    // ── Public endpoints ───────────────────────────────────────────────────────

    public function test_login_endpoint_is_public(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email'    => 'test@test.com',
            'password' => 'password',
        ]);
        $response->assertStatus(401); // auth error, not 403
    }

    public function test_protected_endpoints_require_authentication(): void
    {
        $this->getJson('/api/dashboard/kpis')   ->assertStatus(401);
        $this->getJson('/api/flock-batches')    ->assertStatus(401);
        $this->getJson('/api/sales')            ->assertStatus(401);
        $this->getJson('/api/users')            ->assertStatus(401);
    }
}
