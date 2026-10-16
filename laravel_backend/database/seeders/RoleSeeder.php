<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'SUPERADMIN', 'description' => 'Administrator with full access', 'is_active' => true],
            ['name' => 'BILL_USER', 'description' => 'User for billing operations', 'is_active' => true],
            ['name' => 'USERS', 'description' => 'Regular user role', 'is_active' => true],
            ['name' => 'ACCOUNT_ADMIN', 'description' => 'Account administrator', 'is_active' => true],
            ['name' => 'BLY_MAIN_ADMIN', 'description' => 'Main Branch Admin', 'is_active' => true],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['name' => $role['name']],
                $role
            );
        }
    }
}
