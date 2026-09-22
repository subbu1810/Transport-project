<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        // WhatsApp webhook routes — loaded separately, isolated from main app
        then: function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/whatsapp.php'));
        },
    )
    ->withMiddleware(function ($middleware) {
        // Middleware configuration
    })
    ->withExceptions(function ($exceptions) {
        // Exception handling
    })
    ->create();
