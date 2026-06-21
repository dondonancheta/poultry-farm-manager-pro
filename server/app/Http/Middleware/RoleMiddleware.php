<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * RoleMiddleware
 *
 * Checks that the authenticated user has one of the required roles.
 *
 * Usage in routes/api.php:
 *   Route::middleware('role:admin')->group(...)
 *   Route::middleware('role:admin,manager')->group(...)
 *   Route::middleware('role:admin,manager,supervisor')->group(...)
 *
 * Role hierarchy (highest → lowest):
 *   admin > manager > supervisor > worker
 */
class RoleMiddleware
{
    /**
     * The role hierarchy — each role inherits access from all roles below it.
     * Used by hasMinimumRole() for cleaner route grouping.
     */
    protected array $hierarchy = [
        'admin'      => 4,
        'manager'    => 3,
        'supervisor' => 2,
        'worker'     => 1,
    ];

    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        // Must be authenticated (jwt middleware should already guarantee this,
        // but we guard defensively)
        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Superadmin bypass — 'admin' always gets through
        if ($user->role === 'admin') {
            return $next($request);
        }

        // Check if user's role is in the allowed list
        if (in_array($user->role, $roles, true)) {
            return $next($request);
        }

        return response()->json([
            'message'  => 'Forbidden. Insufficient permissions.',
            'required' => $roles,
            'yours'    => $user->role,
        ], 403);
    }

    /**
     * Helper: check if the user meets a minimum role level.
     * Not used as middleware directly — call from controllers when needed.
     *
     * Example: $this->hasMinimumRole($request->user(), 'supervisor')
     *   returns true for admin, manager, supervisor — false for worker
     */
    public static function hasMinimumRole(mixed $user, string $minimum): bool
    {
        $hierarchy = [
            'admin'      => 4,
            'manager'    => 3,
            'supervisor' => 2,
            'worker'     => 1,
        ];

        $userLevel    = $hierarchy[$user->role]    ?? 0;
        $minimumLevel = $hierarchy[$minimum]        ?? 0;

        return $userLevel >= $minimumLevel;
    }
}
