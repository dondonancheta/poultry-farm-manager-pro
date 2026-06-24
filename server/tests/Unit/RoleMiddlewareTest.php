<?php

namespace Tests\Unit;

use App\Http\Middleware\RoleMiddleware;
use App\Models\User;
use PHPUnit\Framework\TestCase;

class RoleMiddlewareTest extends TestCase
{
    // ── hasMinimumRole static helper ──────────────────────────────────────────

    public function test_admin_meets_all_minimum_roles(): void
    {
        $user = new User(['role' => 'admin']);

        $this->assertTrue(RoleMiddleware::hasMinimumRole($user, 'admin'));
        $this->assertTrue(RoleMiddleware::hasMinimumRole($user, 'manager'));
        $this->assertTrue(RoleMiddleware::hasMinimumRole($user, 'supervisor'));
        $this->assertTrue(RoleMiddleware::hasMinimumRole($user, 'worker'));
    }

    public function test_manager_meets_manager_and_below(): void
    {
        $user = new User(['role' => 'manager']);

        $this->assertFalse(RoleMiddleware::hasMinimumRole($user, 'admin'));
        $this->assertTrue(RoleMiddleware::hasMinimumRole($user, 'manager'));
        $this->assertTrue(RoleMiddleware::hasMinimumRole($user, 'supervisor'));
        $this->assertTrue(RoleMiddleware::hasMinimumRole($user, 'worker'));
    }

    public function test_supervisor_meets_supervisor_and_below(): void
    {
        $user = new User(['role' => 'supervisor']);

        $this->assertFalse(RoleMiddleware::hasMinimumRole($user, 'admin'));
        $this->assertFalse(RoleMiddleware::hasMinimumRole($user, 'manager'));
        $this->assertTrue(RoleMiddleware::hasMinimumRole($user, 'supervisor'));
        $this->assertTrue(RoleMiddleware::hasMinimumRole($user, 'worker'));
    }

    public function test_worker_only_meets_worker_role(): void
    {
        $user = new User(['role' => 'worker']);

        $this->assertFalse(RoleMiddleware::hasMinimumRole($user, 'admin'));
        $this->assertFalse(RoleMiddleware::hasMinimumRole($user, 'manager'));
        $this->assertFalse(RoleMiddleware::hasMinimumRole($user, 'supervisor'));
        $this->assertTrue(RoleMiddleware::hasMinimumRole($user, 'worker'));
    }

    public function test_unknown_role_meets_nothing(): void
    {
        $user = new User(['role' => 'unknown']);

        $this->assertFalse(RoleMiddleware::hasMinimumRole($user, 'worker'));
        $this->assertFalse(RoleMiddleware::hasMinimumRole($user, 'admin'));
    }
}
