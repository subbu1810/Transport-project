<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = [
            [
                'branch_code' => 'SINDH',
                'branch_name' => 'Sindh Branch',
                'address' => '123 Main Street',
                'city' => 'Karachi',
                'state' => 'Sindh',
                'pincode' => '75000',
                'phone' => '02135678901',
                'email' => 'sindh@transport.com',
                'is_active' => true,
            ],
            [
                'branch_code' => 'PUNJ',
                'branch_name' => 'Punjab Branch',
                'address' => '456 Liberty Road',
                'city' => 'Lahore',
                'state' => 'Punjab',
                'pincode' => '54000',
                'phone' => '04235678901',
                'email' => 'punjab@transport.com',
                'is_active' => true,
            ],
            [
                'branch_code' => 'KPK',
                'branch_name' => 'KPK Branch',
                'address' => '789 Peshawar Road',
                'city' => 'Peshawar',
                'state' => 'KPK',
                'pincode' => '25000',
                'phone' => '09135678901',
                'email' => 'kpk@transport.com',
                'is_active' => true,
            ],
            [
                'branch_code' => 'BALO',
                'branch_name' => 'Balochistan Branch',
                'address' => '321 Quetta Street',
                'city' => 'Quetta',
                'state' => 'Balochistan',
                'pincode' => '87000',
                'phone' => '08135678901',
                'email' => 'balochistan@transport.com',
                'is_active' => true,
            ],
            [
                'branch_code' => 'GB',
                'branch_name' => 'Gilgit-Baltistan Branch',
                'address' => '654 Mountain Road',
                'city' => 'Gilgit',
                'state' => 'Gilgit-Baltistan',
                'pincode' => '15100',
                'phone' => '05811234567',
                'email' => 'gb@transport.com',
                'is_active' => false,
            ],
        ];

        foreach ($branches as $branch) {
            Branch::create($branch);
        }
    }
}
