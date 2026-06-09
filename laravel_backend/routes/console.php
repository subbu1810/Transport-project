<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('maintenance:generate-bills')->monthlyOn(1, '00:00')->onOneServer();

// Auto Backup - Runs weekly, but only if enabled in Settings
Schedule::command('backup:run')->weekly()->when(function () {
    $autoBackup = \App\Models\Setting::where('key', 'auto_backup')->first();
    return $autoBackup && filter_var($autoBackup->value, FILTER_VALIDATE_BOOLEAN);
});
