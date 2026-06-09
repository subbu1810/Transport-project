<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Waybill;

$count = Waybill::count();
echo "Total Waybills: " . $count . "\n";

$latest = Waybill::orderBy('bill_date', 'desc')->first();
if ($latest) {
    echo "Latest Waybill Date: " . $latest->bill_date . "\n";
    echo "Latest Waybill GC: " . $latest->gc_number . "\n";
} else {
    echo "No Waybills found.\n";
}

$branches = App\Models\Branch::all();
foreach ($branches as $branch) {
    $c = Waybill::where('origin_branch_id', $branch->id)->count();
    echo "Branch {$branch->branch_name} (ID: {$branch->id}) has $c bookings.\n";
}
