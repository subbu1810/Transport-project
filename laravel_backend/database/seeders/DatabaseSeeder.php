<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            LookupSeeder::class,
            StateSeeder::class,
            DistrictSeeder::class,
            TalukSeeder::class,
            DestinationSeeder::class,
            ConsignorSeeder::class,
            ConsigneeSeeder::class,
        ]);
    }
}
