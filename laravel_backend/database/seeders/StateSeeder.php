<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\State;

class StateSeeder extends Seeder
{
    public function run(): void
    {
        $states = [
            ['name' => 'KARNATAKA', 'code' => 'KA', 'is_active' => true],
            ['name' => 'TAMIL NADU', 'code' => 'TN', 'is_active' => true],
            ['name' => 'MAHARASHTRA', 'code' => 'MH', 'is_active' => true],
            ['name' => 'ANDHRA PRADESH', 'code' => 'AP', 'is_active' => true],
            ['name' => 'TELANGANA', 'code' => 'TS', 'is_active' => true],
            ['name' => 'KERALA', 'code' => 'KL', 'is_active' => true],
            ['name' => 'GUJARAT', 'code' => 'GJ', 'is_active' => true],
            ['name' => 'RAJASTHAN', 'code' => 'RJ', 'is_active' => true],
            ['name' => 'UTTAR PRADESH', 'code' => 'UP', 'is_active' => true],
            ['name' => 'DELHI', 'code' => 'DL', 'is_active' => true],
            ['name' => 'GOA', 'code' => 'GA', 'is_active' => true],
            ['name' => 'MADHYA PRADESH', 'code' => 'MP', 'is_active' => true],
            ['name' => 'WEST BENGAL', 'code' => 'WB', 'is_active' => true],
            ['name' => 'HARYANA', 'code' => 'HR', 'is_active' => true],
            ['name' => 'PUNJAB', 'code' => 'PB', 'is_active' => true],
        ];

        foreach ($states as $state) {
            State::updateOrCreate(
                ['code' => $state['code']],
                $state
            );
        }

        $this->command->info('State seeder completed successfully! (' . count($states) . ' states seeded)');
    }
}
