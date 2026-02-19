<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Bunk;
use App\Models\Branch;

class BunkSeeder extends Seeder
{
    public function run(): void
    {
        // Get the first branch (assuming it exists)
        $branch = Branch::first();
        
        if (!$branch) {
            $this->command->warn('No branches found. Please run BranchSeeder first.');
            return;
        }

        $bunks = [
            [
                'bunk_name' => 'Reliance Petroleum',
                'bunk_address' => '123 Hosur Road, Bangalore, Karnataka - 560029',
                'tin_number' => '29587458963',
                'bunk_land' => '080-23456789',
                'bunk_mobile' => '9876543210',
                'bunk_remarks' => 'Credit facility available for regular customers',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'bunk_name' => 'Indian Oil Petrol Pump',
                'bunk_address' => '456 Silk Board, Hosur Main Road, Bangalore - 560068',
                'tin_number' => '29587458964',
                'bunk_land' => '080-23456790',
                'bunk_mobile' => '9876543211',
                'bunk_remarks' => '24/7 service available with digital payment options',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'bunk_name' => 'HPCL Fuel Station',
                'bunk_address' => '789 Electronic City Phase 1, Bangalore - 560100',
                'tin_number' => '29587458965',
                'bunk_land' => '080-23456791',
                'bunk_mobile' => '9876543212',
                'bunk_remarks' => 'Corporate fuel cards accepted',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'bunk_name' => 'Bharat Petroleum',
                'bunk_address' => '321 Marathahalli Bridge, Bangalore - 560037',
                'tin_number' => '29587458966',
                'bunk_land' => '080-23456792',
                'bunk_mobile' => '9876543213',
                'bunk_remarks' => 'Loyalty program available',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'bunk_name' => 'Shell Fuel Station',
                'bunk_address' => '654 Koramangala 5th Block, Bangalore - 560095',
                'tin_number' => '29587458967',
                'bunk_land' => '080-23456793',
                'bunk_mobile' => '9876543214',
                'bunk_remarks' => 'Premium fuel available',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'bunk_name' => 'Essar Petrol Pump',
                'bunk_address' => '987 Whitefield Main Road, Bangalore - 560066',
                'tin_number' => '29587458968',
                'bunk_land' => '080-23456794',
                'bunk_mobile' => '9876543215',
                'bunk_remarks' => 'Fuel delivery service available for bulk orders',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'bunk_name' => 'BPCL Petrol Station',
                'bunk_address' => '147 Bannerghatta Road, Bangalore - 560076',
                'tin_number' => '29587458969',
                'bunk_land' => '080-23456795',
                'bunk_mobile' => '9876543216',
                'bunk_remarks' => 'Vehicle service center attached',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'bunk_name' => 'Gulf Fuel Station',
                'bunk_address' => '258 Jayanagar 4th Block, Bangalore - 560041',
                'tin_number' => '29587458970',
                'bunk_land' => '080-23456796',
                'bunk_mobile' => '9876543217',
                'bunk_remarks' => 'CNG and diesel available',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
        ];

        foreach ($bunks as $bunk) {
            Bunk::updateOrCreate(
                ['bunk_name' => $bunk['bunk_name']],
                $bunk
            );
        }

        $this->command->info('Bunk seeder completed successfully!');
    }
}
