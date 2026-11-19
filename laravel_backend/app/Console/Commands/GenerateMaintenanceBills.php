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
    protected $signature = 'maintenance:generate-bills {--month=} {--year=} {--rate=} {--transport_id=}';

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
        $customRate = $this->option('rate');
        $transportId = $this->option('transport_id');

        $this->info("Generating bills for Month: $month, Year: $year");

        $query = \App\Models\Transport::where('is_active', true);
        if ($transportId) {
            $query->where('id', $transportId);
        }
        if ($customRate === null) {
            $query->where('maintenance_rate', '>', 0);
        }

        $transports = $query->get();

        if ($transports->isEmpty()) {
            $this->warn("No active transports found with maintenance_rate > 0. Check Transport Master or pass --rate=X.");
            return;
        }

        $generatedCount = 0;

        foreach ($transports as $transport) {
            $rate = ($customRate !== null && (float)$customRate > 0) ? (float)$customRate : (float)$transport->maintenance_rate;
            if ($rate <= 0) {
                $this->warn("Skipping Transport {$transport->transport_name} (ID: {$transport->id}) because rate is 0.");
                continue;
            }

            $branches = \App\Models\Branch::where('is_active', 1)->get();

            foreach ($branches as $branch) {
                // Count GCs originated from this specific branch
                $gcCount = \App\Models\Waybill::whereMonth('created_at', $month)
                    ->whereYear('created_at', $year)
                    ->where('origin_branch_id', $branch->id)
                    ->count();

                if ($gcCount > 0) {
                    $totalAmount = $gcCount * $rate;

                    \App\Models\MaintenanceBill::updateOrCreate(
                        [
                            'transport_id' => $transport->id,
                            'branch_id'    => $branch->id,
                            'bill_month'   => $month,
                            'bill_year'    => $year,
                        ],
                        [
                            'gc_count'     => $gcCount,
                            'rate'         => $rate,
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
