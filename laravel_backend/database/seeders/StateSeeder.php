<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\State;

class StateSeeder extends Seeder
{
    public function run(): void
    {
        State::create([
            'name' => 'KARNATAKA',
            'code' => 'KA',
            'is_active' => true,
        ]);

        State::create([
            'name' => 'MAHARASHTRA',
            'code' => 'MH',
            'is_active' => true,
        ]);

        State::create([
            'name' => 'TAMIL NADU',
            'code' => 'TN',
            'is_active' => true,
        ]);

        State::create([
            'name' => 'ANDHRA PRADESH',
            'code' => 'AP',
            'is_active' => true,
        ]);

        State::create([
            'name' => 'KERALA',
            'code' => 'KL',
            'is_active' => true,
        ]);

        State::create([
            'name' => 'UTTAR PRADESH',
            'code' => 'UP',
            'is_active' => true,
        ]);

        State::create([
            'name' => 'RAJASTHAN',
            'code' => 'RJ',
            'is_active' => true,
        ]);

        State::create([
            'name' => 'GUJARAT',
            'code' => 'GJ',
            'is_active' => true,
        ]);
    }
}
