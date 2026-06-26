<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_origins' => array_filter([
        'http://localhost:4200',
        'http://localhost:3000',
        env('FRONTEND_URL'),
        env('FRONTEND_URL_PREVIEW'),
    ]),

    // Allow ALL Render preview/deploy URLs for this project automatically
    'allowed_origins_patterns' => [
        '#^https://.*\.onrender\.com$#',
        '#^https://.*\.vercel\.app$#',
    ],

    'allowed_methods' => ['*'],

    'allowed_headers' => ['*'],

    'exposed_headers' => [
        'Content-Disposition',
        'Content-Length',
    ],

    'max_age' => 7200,

    'supports_credentials' => true,

];
