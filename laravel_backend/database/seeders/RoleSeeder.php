<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        Role::create([
            'name' => 'SUPERADMIN',
            'description' => 'Administrator with full access',
            'is_active' => true,
        ]);

        Role::create([
            'name' => 'BILL_USER',
            'description' => 'User for billing operations',
            'is_active' => true,
        ]);

        Role::create([
            'name' => 'USERS',
            'description' => 'Regular user role',
            'is_active' => true,
        ]);

        Role::create([
            'name' => 'ACCOUNT_ADMIN',
            'description' => 'Account administrator',
            'is_active' => true,
        ]);

        Role::create([
            'name' => 'BLY_MAIN_ADMIN',
            'description' => 'Main Branch Admin',
            'is_active' => true,
        ]);
    }
}
