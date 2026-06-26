<?php

use App\Http\Middleware\ForceJsonResponse;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\CheckOwnership;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware) {

        // CORS must be the very first middleware — before everything else
        $middleware->prepend(\Illuminate\Http\Middleware\HandleCors::class);

        // Force JSON on all API responses
        $middleware->api(prepend: [
            ForceJsonResponse::class,
        ]);

        // Named aliases
        $middleware->alias([
            'auth.jwt'  => \Tymon\JWTAuth\Http\Middleware\Authenticate::class,
            'role'      => RoleMiddleware::class,
            'ownership' => CheckOwnership::class,
        ]);

        // Disable rate limiting (causes 429 on free tier with multiple requests)
        $middleware->throttleApi('60,1'); // 60 requests per minute

    })
    ->withExceptions(function (Exceptions $exceptions) {

        $exceptions->renderable(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });

        $exceptions->renderable(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => class_basename($e->getModel()) . ' not found.'], 404);
            }
        });

        $exceptions->renderable(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
            }
        });

        $exceptions->renderable(function (\Tymon\JWTAuth\Exceptions\TokenExpiredException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Token has expired.'], 401);
            }
        });

        $exceptions->renderable(function (\Tymon\JWTAuth\Exceptions\TokenInvalidException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Token is invalid.'], 401);
            }
        });

    })->create();
