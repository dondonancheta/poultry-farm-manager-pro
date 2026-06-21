<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * ForceJsonResponse
 *
 * Forces all API responses to be JSON.
 * Prevents Laravel from returning HTML error pages to the Angular client.
 * Register in bootstrap/app.php for the /api prefix.
 */
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');
        return $next($request);
    }
}
