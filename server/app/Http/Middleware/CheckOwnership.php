<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * CheckOwnership
 *
 * Ensures workers can only access/modify their own records.
 * Managers and above bypass this check.
 *
 * Usage:
 *   Route::middleware('ownership:collector_id')->...
 *   Route::middleware('ownership:recorded_by')->...
 */
class CheckOwnership
{
    public function handle(Request $request, Closure $next, string $ownerColumn = 'user_id'): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Managers and above can access any record
        $bypass = ['admin', 'manager', 'supervisor'];
        if (in_array($user->role, $bypass, true)) {
            return $next($request);
        }

        // For workers: inject their user_id as a query filter
        // so they only see their own records
        $request->merge([$ownerColumn => $user->id]);

        return $next($request);
    }
}
