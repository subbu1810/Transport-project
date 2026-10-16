<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\State;
use App\Models\District;

class DistrictSeeder extends Seeder
{
    public function run(): void
    {
        $districtsByState = [
            'KA' => [
                ['name' => 'Bengaluru Urban', 'code' => 'BEN'],
                ['name' => 'Mysuru', 'code' => 'MYS'],
                ['name' => 'Belagavi', 'code' => 'BEL'],
                ['name' => 'Dakshina Kannada', 'code' => 'DKN'],
                ['name' => 'Dharwad', 'code' => 'DHW'],
                ['name' => 'Tumakuru', 'code' => 'TUM'],
                ['name' => 'Shivamogga', 'code' => 'SHV'],
                ['name' => 'Ballari', 'code' => 'BAL'],
                ['name' => 'Udupi', 'code' => 'UDP'],
                ['name' => 'Hassan', 'code' => 'HSN'],
                ['name' => 'Kalaburagi', 'code' => 'KLB'],
                ['name' => 'Mandya', 'code' => 'MDY'],
            ],
            'TN' => [
                ['name' => 'Chennai', 'code' => 'CHN'],
                ['name' => 'Coimbatore', 'code' => 'CBE'],
                ['name' => 'Madurai', 'code' => 'MDU'],
                ['name' => 'Salem', 'code' => 'SLM'],
                ['name' => 'Tiruchirappalli', 'code' => 'TRP'],
                ['name' => 'Tiruppur', 'code' => 'TPR'],
                ['name' => 'Erode', 'code' => 'ERD'],
                ['name' => 'Kanchipuram', 'code' => 'KCP'],
            ],
            'MH' => [
                ['name' => 'Mumbai City', 'code' => 'MMC'],
                ['name' => 'Mumbai Suburban', 'code' => 'MMS'],
                ['name' => 'Pune', 'code' => 'PUN'],
                ['name' => 'Thane', 'code' => 'THN'],
                ['name' => 'Nagpur', 'code' => 'NGP'],
                ['name' => 'Nashik', 'code' => 'NSK'],
                ['name' => 'Kolhapur', 'code' => 'KLP'],
                ['name' => 'Aurangabad', 'code' => 'AUR'],
            ],
            'AP' => [
                ['name' => 'Visakhapatnam', 'code' => 'VSP'],
                ['name' => 'Krishna', 'code' => 'KRI'],
                ['name' => 'Guntur', 'code' => 'GNT'],
                ['name' => 'Chittoor', 'code' => 'CHT'],
                ['name' => 'Nellore', 'code' => 'NLR'],
                ['name' => 'East Godavari', 'code' => 'EGD'],
            ],
            'TS' => [
                ['name' => 'Hyderabad', 'code' => 'HYD'],
                ['name' => 'Medchal-Malkajgiri', 'code' => 'MDM'],
                ['name' => 'Rangareddy', 'code' => 'RRD'],
                ['name' => 'Sangareddy', 'code' => 'SRD'],
                ['name' => 'Warangal', 'code' => 'WGL'],
            ],
            'KL' => [
                ['name' => 'Ernakulam', 'code' => 'EKM'],
                ['name' => 'Kozhikode', 'code' => 'KKD'],
                ['name' => 'Thiruvananthapuram', 'code' => 'TVM'],
                ['name' => 'Thrissur', 'code' => 'TSR'],
                ['name' => 'Palakkad', 'code' => 'PLK'],
                ['name' => 'Kollam', 'code' => 'KLM'],
            ],
            'GJ' => [
                ['name' => 'Ahmedabad', 'code' => 'AHM'],
                ['name' => 'Surat', 'code' => 'SUR'],
                ['name' => 'Vadodara', 'code' => 'VAD'],
                ['name' => 'Rajkot', 'code' => 'RJK'],
            ],
            'DL' => [
                ['name' => 'Central Delhi', 'code' => 'CDL'],
                ['name' => 'South Delhi', 'code' => 'SDL'],
                ['name' => 'North Delhi', 'code' => 'NDL'],
            ],
            'GA' => [
                ['name' => 'North Goa', 'code' => 'NGO'],
                ['name' => 'South Goa', 'code' => 'SGO'],
            ],
        ];

        $totalCount = 0;

        foreach ($districtsByState as $stateCode => $districts) {
            $state = State::where('code', $stateCode)->first();

            if (!$state) {
                $this->command->warn("State with code {$stateCode} not found, skipping its districts.");
                continue;
            }

            foreach ($districts as $districtData) {
                District::updateOrCreate(
                    [
                        'state_id' => $state->id,
                        'name' => $districtData['name'],
                    ],
                    [
                        'code' => $districtData['code'],
                        'is_active' => true,
                    ]
                );
                $totalCount++;
            }
        }

        $this->command->info("District seeder completed successfully! ({$totalCount} districts seeded)");
    }
}
