<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Driver;
use App\Models\Branch;

class DriverSeeder extends Seeder
{
    public function run(): void
    {
        // Get the first branch (assuming it exists)
        $branch = Branch::first();
        
        if (!$branch) {
            $this->command->warn('No branches found. Please run BranchSeeder first.');
            return;
        }

        $drivers = [
            [
                'name' => 'NAGARAJ',
                'dl_number' => 'DL2525',
                'dl_type' => 'MCWG',
                'phone' => '9901529990',
                'date_of_birth' => '1985-03-15',
                'date_of_issue' => '2010-06-20',
                'valid_till' => '2030-06-19',
                'address' => '123 Main Street, Bangalore',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'name' => 'SHEKAR',
                'dl_number' => 'DL252',
                'dl_type' => 'MCWG',
                'phone' => '9535344979',
                'date_of_birth' => '1982-08-22',
                'date_of_issue' => '2008-11-10',
                'valid_till' => '2028-11-09',
                'address' => '456 Park Avenue, Bangalore',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'name' => 'RAMESH',
                'dl_number' => 'DL2522',
                'dl_type' => 'TRNS',
                'phone' => '9535586042',
                'date_of_birth' => '1978-12-05',
                'date_of_issue' => '2005-03-15',
                'valid_till' => '2025-03-14',
                'address' => '789 Industrial Area, Bangalore',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'name' => 'RAMU',
                'dl_number' => 'DL252',
                'dl_type' => 'TRNS',
                'phone' => '9876543212',
                'date_of_birth' => '1990-05-18',
                'date_of_issue' => '2015-09-01',
                'valid_till' => '2035-08-31',
                'address' => '321 Commercial Street, Bangalore',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'name' => 'VENUABHJU',
                'dl_number' => 'DL25',
                'dl_type' => 'TRNS',
                'phone' => '8971111390',
                'date_of_birth' => '1988-07-30',
                'date_of_issue' => '2013-12-20',
                'valid_till' => '2033-12-19',
                'address' => '654 Transport Nagar, Bangalore',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'name' => 'SHIVAKUMAR',
                'dl_number' => 'DL25236',
                'dl_type' => 'TRNS',
                'phone' => '9876543213',
                'date_of_birth' => '1975-02-14',
                'date_of_issue' => '2002-04-10',
                'valid_till' => '2022-04-09',
                'address' => '987 Logistics Hub, Bangalore',
                'branch_id' => $branch->id,
                'is_active' => false,
            ],
            [
                'name' => 'SUKESH',
                'dl_number' => 'DL2638',
                'dl_type' => 'MCWG',
                'phone' => '9876543214',
                'date_of_birth' => '1992-11-25',
                'date_of_issue' => '2017-06-15',
                'valid_till' => '2037-06-14',
                'address' => '147 Freight Complex, Bangalore',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'name' => 'ALHA BAKSHI',
                'dl_number' => 'DL985',
                'dl_type' => 'MCWG',
                'phone' => '7676815595',
                'date_of_birth' => '1980-09-08',
                'date_of_issue' => '2006-01-25',
                'valid_till' => '2026-01-24',
                'address' => '258 Cargo Terminal, Bangalore',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'name' => 'K. BASVARAAJU',
                'dl_number' => 'DL2523',
                'dl_type' => 'TRNS',
                'phone' => '8088219874',
                'date_of_birth' => '1986-04-12',
                'date_of_issue' => '2011-08-30',
                'valid_till' => '2031-08-29',
                'address' => '369 Warehouse Road, Bangalore',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'name' => 'REDDY',
                'dl_number' => 'DL65655',
                'dl_type' => 'MCWG',
                'phone' => '9876543215',
                'date_of_birth' => '1991-06-20',
                'date_of_issue' => '2016-10-05',
                'valid_till' => '2036-10-04',
                'address' => '741 Transport Center, Bangalore',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
        ];

        foreach ($drivers as $driver) {
            Driver::updateOrCreate(
                ['dl_number' => $driver['dl_number']],
                $driver
            );
        }

        $this->command->info('Driver seeder completed successfully!');
    }
}
