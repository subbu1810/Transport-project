<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Garuda ERP — Privacy Policy (required for Google Play Store)
Route::get('/privacy-policy', function () {
    return view('privacy-policy');
});

// Storage Bypass for Shared Hosting (MilesWeb)
Route::get('storage/{path}', function ($path) {
    $filePath = storage_path('app/public/' . $path);
    if (!file_exists($filePath)) abort(404);
    return response()->file($filePath);
})->where('path', '.*');
