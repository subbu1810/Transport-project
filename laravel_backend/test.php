<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$waybill = \App\Models\Waybill::with('articles')->orderBy('id', 'desc')->first();
echo json_encode($waybill);
