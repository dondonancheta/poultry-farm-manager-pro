<?php

/**
 * CORS Configuration — PoultryFarm Pro
 *
 * Controls which origins, methods, and headers are allowed
 * to make cross-origin requests to this Laravel API.
 *
 * Development:  Angular dev server at http://localhost:4200
 * Production:   Your Vercel deployment URL
 *
 * Set FRONTEND_URL in your .env file — see .env.example
 */
return [

    /*
    |--------------------------------------------------------------------------
    | Paths — apply CORS only to API routes
    |--------------------------------------------------------------------------
    */
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins
    |--------------------------------------------------------------------------
    | List every frontend origin that may call this API.
    | In production, replace with your exact Vercel URL.
    | Never use '*' in production with credentials: true.
    */
    'allowed_origins' => array_filter([
        'http://localhost:4200',          // Angular dev server
        'http://localhost:3000',          // Alt dev port
        env('FRONTEND_URL'),              // Production Vercel URL  e.g. https://poultry-farm-pro.vercel.app
        env('FRONTEND_URL_PREVIEW'),      // Vercel preview deployments (optional)
    ]),

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins Patterns (regex)
    |--------------------------------------------------------------------------
    | Matches all Vercel preview URLs for this project automatically.
    */
    'allowed_origins_patterns' => [
        '#^https://poultry-farm-pro.*\.vercel\.app$#',
    ],

    /*
    |--------------------------------------------------------------------------
    | Allowed Methods
    |--------------------------------------------------------------------------
    */
    'allowed_methods' => [
        'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS',
    ],

    /*
    |--------------------------------------------------------------------------
    | Allowed Headers
    |--------------------------------------------------------------------------
    */
    'allowed_headers' => [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-CSRF-Token',
    ],

    /*
    |--------------------------------------------------------------------------
    | Exposed Headers
    |--------------------------------------------------------------------------
    | Content-Disposition is required for file download (reports).
    */
    'exposed_headers' => [
        'Content-Disposition',
        'Content-Length',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
    ],

    /*
    |--------------------------------------------------------------------------
    | Preflight cache (seconds) — 2 hours
    |--------------------------------------------------------------------------
    */
    'max_age' => 7200,

    /*
    |--------------------------------------------------------------------------
    | Credentials — MUST be true for JWT Authorization header
    |--------------------------------------------------------------------------
    */
    'supports_credentials' => true,

];
