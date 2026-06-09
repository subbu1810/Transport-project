<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateMaintenanceBills extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'maintenance:generate-bills {--month=} {--year=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate monthly maintenance bills for all transports based on GC counts';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $month = $this->option('month') ?: now()->subMonth()->month;
        $year = $this->option('year') ?: now()->subMonth()->year;

        $this->info("Generating bills for Month: $month, Year: $year");

        $transports = \App\Models\Transport::where('is_active', true)
                        ->where('maintenance_rate', '>', 0)
                        ->get();

        $generatedCount = 0;

        foreach ($transports as $transport) {
            $branches = \App\Models\Branch::where('is_active', 1)->get();

            foreach ($branches as $branch) {
                // Count GCs originated from this specific branch
                $gcCount = \App\Models\Waybill::whereMonth('created_at', $month)
                    ->whereYear('created_at', $year)
                    ->where('origin_branch_id', $branch->id)
                    ->count();

                if ($gcCount > 0) {
                    $totalAmount = $gcCount * $transport->maintenance_rate;

                    \App\Models\MaintenanceBill::updateOrCreate(
                        [
                            'transport_id' => $transport->id,
                            'branch_id'    => $branch->id,
                            'bill_month'   => $month,
                            'bill_year'    => $year,
                        ],
                        [
                            'gc_count'     => $gcCount,
                            'rate'         => $transport->maintenance_rate,
                            'total_amount' => $totalAmount,
                            'status'       => 'Pending'
                        ]
                    );
                    
                    $generatedCount++;
                }
            }
        }

        $this->info("Successfully generated $generatedCount bills.");
    }
}
