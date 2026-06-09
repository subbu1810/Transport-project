<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Waybill;
use App\Models\Branch;
use App\Models\Destination;
use App\Models\Consignor;
use App\Models\Consignee;
use Illuminate\Support\Str;

class WaybillDummySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = Branch::all();
        $destinations = Destination::all();
        $consignors = Consignor::all();
        $consignees = Consignee::all();

        if ($branches->isEmpty() || $destinations->isEmpty() || $consignors->isEmpty() || $consignees->isEmpty()) {
            return;
        }

        for ($i = 1; $i <= 100; $i++) {
            $origin = $branches->random();
            $dest = $destinations->random();
            $consignor = $consignors->random();
            $consignee = $consignees->random();

            Waybill::create([
                'gc_number' => 'DUMMY-' . strtoupper(Str::random(4)) . $i . '-' . time(),
                'bill_date' => now()->subDays(rand(0, 30))->format('Y-m-d'),
                'origin_branch_id' => $origin->id,
                'destination_id' => $dest->id,
                'consignor_id' => $consignor->id,
                'consignee_id' => $consignee->id,
                'article_desc' => 'Dummy Box ' . $i,
                'total_articles' => rand(1, 10),
                'freight_amount' => rand(100, 1000),
                'total_amount' => rand(100, 1000),
                'grand_total' => rand(100, 1000),
                'invoice_no' => 'INV-' . rand(1000, 9999),
                'account_type' => ['PAID', 'TO PAY', 'TBB', 'FOC'][rand(0, 3)],
                'status' => 'Booked',
                'booking_clerk' => 'System Generate'
            ]);
        }
    }
}
