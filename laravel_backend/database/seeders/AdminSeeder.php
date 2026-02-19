<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing admins (optional - remove if you want to keep existing data)
        // DB::table('admins')->truncate();

        // Insert Super Admin
        DB::table('admins')->insert([
            'name' => 'Subbu',
            'email' => 'subbu@transport.com',
            'phone_number' => '9876543210',
            'address' => 'Head Office',
            'role' => 'superadmin',
            'password' => Hash::make('admin123'),
            'branch_code' => 'HO',
            'branch_name' => 'Head Office',
            'branch_address' => 'Main Branch Address',
            'branch_email' => 'headoffice@transport.com',
            'branch_phone' => '9876543210',
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Insert Admin
        DB::table('admins')->insert([
            'name' => 'guru',
            'email' => 'guru@transport.com',
            'phone_number' => '9876543211',
            'address' => 'Branch Office',
            'role' => 'admin',
            'password' => Hash::make('admin123'),
            'branch_code' => 'BR01',
            'branch_name' => 'Branch Office 01',
            'branch_address' => 'Branch Office Address',
            'branch_email' => 'branch01@transport.com',
            'branch_phone' => '9876543211',
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        echo "Admin users seeded successfully!\n";
        echo "Superadmin - Username: Subbu, Password: admin123\n";
        echo "Admin - Username: guru, Password: admin123\n";
    }
}
