<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Consignor;
use App\Models\Branch;

class ConsignorSeeder extends Seeder
{
    public function run(): void
    {
        // Get the first branch (assuming it exists)
        $branch = Branch::first();
        
        if (!$branch) {
            $this->command->warn('No branches found. Please run BranchSeeder first.');
            return;
        }

        $consignors = [
            [
                'name' => 'ABC Logistics Pvt Ltd',
                'code' => 'ABC001',
                'tin_number' => '12345678901',
                'gst_number' => '18AABCU1234H1Z0',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'name' => 'XYZ Transport Services',
                'code' => 'XYZ001',
                'tin_number' => '98765432101',
                'gst_number' => '18XYZTR5678H2Z0',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'name' => 'Global Cargo Solutions',
                'code' => 'GLC001',
                'tin_number' => '11111111111',
                'gst_number' => '18GLCGO9999H3Z0',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'name' => 'Swift Delivery Inc',
                'code' => 'SWD001',
                'tin_number' => '22222222222',
                'gst_number' => '18SWDEL1111H4Z0',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'name' => 'Premium Freight Ltd',
                'code' => 'PRM001',
                'tin_number' => '33333333333',
                'gst_number' => '18PRMFR2222H5Z0',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'name' => 'Express Logistics',
                'code' => 'EXP001',
                'tin_number' => '44444444444',
                'gst_number' => '18EXPLG3333H6Z0',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'name' => 'National Transport Co',
                'code' => 'NTC001',
                'tin_number' => '55555555555',
                'gst_number' => '18NTCTR4444H7Z0',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'name' => 'Metro Cargo Services',
                'code' => 'MCS001',
                'tin_number' => '66666666666',
                'gst_number' => '18MCSRV5555H8Z0',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'name' => 'Rapid Delivery Systems',
                'code' => 'RDS001',
                'tin_number' => '77777777777',
                'gst_number' => '18RDSYS6666H9Z0',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'name' => 'Elite Logistics Group',
                'code' => 'ELG001',
                'tin_number' => '88888888888',
                'gst_number' => '18ELGGRP7777H0Z0',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
        ];

        foreach ($consignors as $consignor) {
            Consignor::updateOrCreate(
                ['code' => $consignor['code']],
                $consignor
            );
        }

        $this->command->info('Consignor seeder completed successfully!');
    }
}
