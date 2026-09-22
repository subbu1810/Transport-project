<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$entries = App\Models\CashBookEntry::where('remarks', 'like', '%SDN436%')->get();
foreach($entries as $e) {
    echo $e->id . ' | ' . $e->transaction_date . ' | ' . $e->remarks . ' | ' . $e->amount . "\n";
}
