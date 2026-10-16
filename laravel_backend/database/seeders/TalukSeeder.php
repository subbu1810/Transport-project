<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\District;
use App\Models\Taluk;

class TalukSeeder extends Seeder
{
    public function run(): void
    {
        $taluksByDistrict = [
            'Bengaluru Urban' => [
                ['name' => 'Bengaluru North', 'code' => 'BLR-N'],
                ['name' => 'Bengaluru South', 'code' => 'BLR-S'],
                ['name' => 'Bengaluru East', 'code' => 'BLR-E'],
                ['name' => 'Anekal', 'code' => 'ANK'],
                ['name' => 'Yelahanka', 'code' => 'YLH'],
            ],
            'Mysuru' => [
                ['name' => 'Mysuru Taluk', 'code' => 'MYS-T'],
                ['name' => 'Nanjangud', 'code' => 'NJG'],
                ['name' => 'Hunsur', 'code' => 'HNR'],
                ['name' => 'T Narasipura', 'code' => 'TNP'],
            ],
            'Dakshina Kannada' => [
                ['name' => 'Mangaluru', 'code' => 'MNG'],
                ['name' => 'Bantwal', 'code' => 'BTW'],
                ['name' => 'Puttur', 'code' => 'PTR'],
            ],
            'Belagavi' => [
                ['name' => 'Belagavi Taluk', 'code' => 'BGM-T'],
                ['name' => 'Chikkodi', 'code' => 'CKD'],
                ['name' => 'Gokak', 'code' => 'GKK'],
            ],
            'Dharwad' => [
                ['name' => 'Hubballi', 'code' => 'HBL'],
                ['name' => 'Dharwad Taluk', 'code' => 'DHW-T'],
            ],
            'Tumakuru' => [
                ['name' => 'Tumakuru Taluk', 'code' => 'TUM-T'],
                ['name' => 'Tiptur', 'code' => 'TPR'],
                ['name' => 'Kunigal', 'code' => 'KNG'],
            ],
            'Shivamogga' => [
                ['name' => 'Shivamogga Taluk', 'code' => 'SHV-T'],
                ['name' => 'Bhadravati', 'code' => 'BDV'],
                ['name' => 'Sagar', 'code' => 'SGR'],
            ],
            'Chennai' => [
                ['name' => 'Guindy', 'code' => 'GND'],
                ['name' => 'Ambattur', 'code' => 'AMB'],
                ['name' => 'Tondiarpet', 'code' => 'TND'],
                ['name' => 'Mylapore', 'code' => 'MYL'],
            ],
            'Coimbatore' => [
                ['name' => 'Coimbatore South', 'code' => 'CBE-S'],
                ['name' => 'Coimbatore North', 'code' => 'CBE-N'],
                ['name' => 'Pollachi', 'code' => 'POL'],
            ],
            'Tiruppur' => [
                ['name' => 'Tiruppur Taluk', 'code' => 'TPR-T'],
                ['name' => 'Avinashi', 'code' => 'AVN'],
            ],
            'Salem' => [
                ['name' => 'Salem Taluk', 'code' => 'SLM-T'],
                ['name' => 'Attur', 'code' => 'ATR'],
            ],
            'Mumbai Suburban' => [
                ['name' => 'Andheri', 'code' => 'AND'],
                ['name' => 'Kurla', 'code' => 'KRL'],
                ['name' => 'Borivali', 'code' => 'BOR'],
            ],
            'Mumbai City' => [
                ['name' => 'Mumbai City Taluk', 'code' => 'MMC-T'],
                ['name' => 'Colaba', 'code' => 'CLB'],
            ],
            'Pune' => [
                ['name' => 'Pune City', 'code' => 'PNC-T'],
                ['name' => 'Haveli', 'code' => 'HAV'],
                ['name' => 'Khed', 'code' => 'KHD'],
            ],
            'Thane' => [
                ['name' => 'Thane Taluk', 'code' => 'THN-T'],
                ['name' => 'Bhiwandi', 'code' => 'BHW'],
                ['name' => 'Kalyan', 'code' => 'KLN'],
            ],
            'Visakhapatnam' => [
                ['name' => 'Visakhapatnam Urban', 'code' => 'VSU'],
                ['name' => 'Gajuwaka', 'code' => 'GJW'],
                ['name' => 'Anakapalle', 'code' => 'AKP'],
            ],
            'Krishna' => [
                ['name' => 'Vijayawada Urban', 'code' => 'VJA-U'],
                ['name' => 'Machilipatnam', 'code' => 'MTM'],
            ],
            'Hyderabad' => [
                ['name' => 'Secunderabad', 'code' => 'SCB'],
                ['name' => 'Charminar', 'code' => 'CHM'],
                ['name' => 'Khairatabad', 'code' => 'KHB'],
            ],
            'Rangareddy' => [
                ['name' => 'Serilingampally', 'code' => 'SLP'],
                ['name' => 'Rajendranagar', 'code' => 'RJN'],
            ],
            'Ernakulam' => [
                ['name' => 'Kanayannur / Kochi', 'code' => 'KOC'],
                ['name' => 'Aluva', 'code' => 'ALV'],
            ],
            'Ahmedabad' => [
                ['name' => 'Ahmedabad City', 'code' => 'AHM-C'],
                ['name' => 'Daskroi', 'code' => 'DSK'],
            ],
        ];

        $totalCount = 0;

        foreach ($taluksByDistrict as $districtName => $taluks) {
            $district = District::where('name', $districtName)->first();

            if (!$district) {
                $this->command->warn("District {$districtName} not found, skipping its taluks.");
                continue;
            }

            foreach ($taluks as $talukData) {
                Taluk::updateOrCreate(
                    [
                        'district_id' => $district->id,
                        'name' => $talukData['name'],
                    ],
                    [
                        'code' => $talukData['code'],
                        'is_active' => true,
                    ]
                );
                $totalCount++;
            }
        }

        $this->command->info("Taluk seeder completed successfully! ({$totalCount} taluks seeded)");
    }
}
