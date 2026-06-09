<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

try {
    $tables = DB::select('SHOW TABLES');
    $dbName = DB::getDatabaseName();
    $prop = "Tables_in_" . $dbName;
    
    echo "Tables in database $dbName:\n";
    foreach ($tables as $table) {
        echo "- " . $table->$prop . "\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
