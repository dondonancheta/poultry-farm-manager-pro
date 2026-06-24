<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ── POST /api/auth/login ───────────────────────────────────────────────────

    public function test_login_with_valid_credentials_returns_token(): void
    {
        User::factory()->create([
            'email'    => 'admin1@admin.com',
            'password' => Hash::make('admin1'),
            'role'     => 'admin',
            'status'   => 'active',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'admin1@admin.com',
            'password' => 'admin1',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']]);
    }

    public function test_login_with_wrong_password_returns_401(): void
    {
        User::factory()->create([
            'email'    => 'admin1@admin.com',
            'password' => Hash::make('admin1'),
            'role'     => 'admin',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'admin1@admin.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_with_nonexistent_email_returns_401(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email'    => 'notfound@test.com',
            'password' => 'password',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_with_inactive_user_returns_403(): void
    {
        User::factory()->create([
            'email'    => 'inactive@test.com',
            'password' => Hash::make('password'),
            'role'     => 'worker',
            'status'   => 'inactive',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'inactive@test.com',
            'password' => 'password',
        ]);

        $response->assertStatus(403);
    }

    public function test_login_validation_requires_email(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'password' => 'admin1',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    // ── POST /api/auth/logout ──────────────────────────────────────────────────

    public function test_logout_invalidates_token(): void
    {
        $user  = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $token = auth('api')->login($user);

        $response = $this->withToken($token)->postJson('/api/auth/logout');

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Successfully logged out']);
    }

    public function test_logout_without_token_returns_401(): void
    {
        $response = $this->postJson('/api/auth/logout');
        $response->assertStatus(401);
    }

    // ── GET /api/auth/me ───────────────────────────────────────────────────────

    public function test_me_returns_authenticated_user(): void
    {
        $user  = User::factory()->create(['role' => 'manager', 'status' => 'active']);
        $token = auth('api')->login($user);

        $response = $this->withToken($token)->getJson('/api/auth/me');

        $response->assertStatus(200)
                 ->assertJsonFragment(['email' => $user->email, 'role' => 'manager']);
    }

    public function test_me_without_token_returns_401(): void
    {
        $response = $this->getJson('/api/auth/me');
        $response->assertStatus(401);
    }
}
