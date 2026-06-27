<?php

use App\Http\Middleware\ForceJsonResponse;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\CheckOwnership;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware) {

        // CORS must be absolute first — handles OPTIONS preflight
        $middleware->prepend(HandleCors::class);

        // Force JSON responses for all API routes
        $middleware->api(prepend: [
            ForceJsonResponse::class,
        ]);

        // Named middleware aliases
        $middleware->alias([
            'auth.jwt'  => \Tymon\JWTAuth\Http\Middleware\Authenticate::class,
            'role'      => RoleMiddleware::class,
            'ownership' => CheckOwnership::class,
        ]);

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
