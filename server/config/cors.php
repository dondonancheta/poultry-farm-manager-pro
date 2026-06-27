<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_methods' => ['*'],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Content-Disposition', 'Content-Length'],

    'max_age' => 7200,

    // Must be false when allowed_origins is '*'
    'supports_credentials' => false,

];
