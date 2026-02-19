<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vehicle;
use App\Models\Branch;

class VehicleSeeder extends Seeder
{
    public function run(): void
    {
        // Get the first branch (assuming it exists)
        $branch = Branch::first();
        
        if (!$branch) {
            $this->command->warn('No branches found. Please run BranchSeeder first.');
            return;
        }

        $vehicles = [
            [
                'vehicle_number' => 'KA3SC3949',
                'owner_name' => 'NAGARAJ',
                'phone' => '9901529990',
                'insurance_upto' => '2025-01-31',
                'vehicle_status' => 'AVAILABLE',
                'rc_valid_from' => '2025-01-01',
                'rc_valid_to' => '2025-01-01',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'vehicle_number' => 'KA3SC1986',
                'owner_name' => 'SGPL',
                'phone' => '0',
                'insurance_upto' => '2025-01-30',
                'vehicle_status' => 'NOT_AVAILABLE',
                'rc_valid_from' => '2025-01-05',
                'rc_valid_to' => '2025-01-31',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'vehicle_number' => 'KA3SC2569',
                'owner_name' => 'RAVI',
                'phone' => '9535586042',
                'insurance_upto' => '2025-01-05',
                'vehicle_status' => 'NOT_AVAILABLE',
                'rc_valid_from' => '2025-01-05',
                'rc_valid_to' => '2025-01-31',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'vehicle_number' => 'KA3SB2286',
                'owner_name' => 'RAMU',
                'phone' => '8105415775',
                'insurance_upto' => '2025-01-09',
                'vehicle_status' => 'AVAILABLE',
                'rc_valid_from' => '2025-01-05',
                'rc_valid_to' => '2025-02-07',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'vehicle_number' => 'KA3SC3231',
                'owner_name' => 'RAJ SAB',
                'phone' => '0',
                'insurance_upto' => '2017-04-20',
                'vehicle_status' => 'AVAILABLE',
                'rc_valid_from' => '2017-04-25',
                'rc_valid_to' => '2017-04-27',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'vehicle_number' => 'KA3SC2636',
                'owner_name' => 'VENUABHJU',
                'phone' => '0',
                'insurance_upto' => '2025-01-06',
                'vehicle_status' => 'NOT_AVAILABLE',
                'rc_valid_from' => '2025-01-07',
                'rc_valid_to' => '2025-01-07',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'vehicle_number' => 'KA3SB7277',
                'owner_name' => 'PRASMADA',
                'phone' => '0',
                'insurance_upto' => '2026-01-01',
                'vehicle_status' => 'NOT_AVAILABLE',
                'rc_valid_from' => '2025-01-05',
                'rc_valid_to' => '2026-01-28',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'vehicle_number' => 'KA2SA7826',
                'owner_name' => 'ALHA BAKSHI',
                'phone' => '0',
                'insurance_upto' => '2026-01-30',
                'vehicle_status' => 'NOT_AVAILABLE',
                'rc_valid_from' => '2025-01-07',
                'rc_valid_to' => '2025-01-31',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'vehicle_number' => 'KA3SC3179',
                'owner_name' => 'SHIVA RAJU',
                'phone' => '0',
                'insurance_upto' => '2025-01-07',
                'vehicle_status' => 'AVAILABLE',
                'rc_valid_from' => '2025-01-07',
                'rc_valid_to' => '2025-02-03',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'vehicle_number' => 'KA3SC8233',
                'owner_name' => 'REDDY',
                'phone' => '0',
                'insurance_upto' => '2025-01-31',
                'vehicle_status' => 'AVAILABLE',
                'rc_valid_from' => '2025-01-22',
                'rc_valid_to' => '2026-01-30',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'vehicle_number' => 'KA17D5995',
                'owner_name' => 'MADHU',
                'phone' => '0',
                'insurance_upto' => '2025-02-20',
                'vehicle_status' => 'AVAILABLE',
                'rc_valid_from' => '2021-12-27',
                'rc_valid_to' => '2030-04-30',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
        ];

        foreach ($vehicles as $vehicle) {
            Vehicle::updateOrCreate(
                ['vehicle_number' => $vehicle['vehicle_number']],
                $vehicle
            );
        }

        $this->command->info('Vehicle seeder completed successfully!');
    }
}
