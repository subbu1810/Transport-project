<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'username' => 'naveen',
            'email' => 'naveen@transport.com',
            'password' => Hash::make('Naveen@123'),
            'branch_id' => 1,
            'role' => 'SUPERADMIN',
            'is_active' => true,
        ]);

        User::create([
            'username' => 'pradeep',
            'email' => 'pradeep@transport.com',
            'password' => Hash::make('Pradeep@123'),
            'branch_id' => 1,
            'role' => 'SUPERADMIN',
            'is_active' => true,
        ]);

        User::create([
            'username' => 'ravi',
            'email' => 'ravi@transport.com',
            'password' => Hash::make('Ravi@123'),
            'branch_id' => 2,
            'role' => 'ADMIN',
            'is_active' => true,
        ]);

        User::create([
            'username' => 'john',
            'email' => 'john@transport.com',
            'password' => Hash::make('John@123'),
            'branch_id' => 3,
            'role' => 'USER',
            'is_active' => true,
        ]);

        User::create([
            'username' => 'sarah',
            'email' => 'sarah@transport.com',
            'password' => Hash::make('Sarah@123'),
            'branch_id' => 4,
            'role' => 'USER',
            'is_active' => false,
        ]);
    }
}
