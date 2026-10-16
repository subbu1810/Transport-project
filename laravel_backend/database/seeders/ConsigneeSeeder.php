<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Consignee;
use App\Models\Destination;
use App\Models\Branch;

class ConsigneeSeeder extends Seeder
{
    public function run(): void
    {
        $defaultBranch = Branch::first();
        $branchId = $defaultBranch ? $defaultBranch->id : 1;

        $consigneesData = [
            [
                'name' => 'Bharat Hardware & Tools Corporation',
                'code' => 'CNS001',
                'gst_number' => '29AABCB1111E1Z5',
                'address' => 'Shop No. 12, APMC Yard, Yeshwanthpur',
                'destination_name' => 'Yeshwanthpur',
                'land_number' => '08023371122',
                'mobile_number' => '9845112233',
                'is_active' => true,
            ],
            [
                'name' => 'Silicon Valley Electronics Distributorship',
                'code' => 'CNS002',
                'gst_number' => '29AAACS2222F1Z4',
                'address' => 'Tower B, Phase 1, Electronic City',
                'destination_name' => 'Electronic City',
                'land_number' => '08028523344',
                'mobile_number' => '9886223344',
                'is_active' => true,
            ],
            [
                'name' => 'Chamundi Commercial Enterprises',
                'code' => 'CNS003',
                'gst_number' => '29AAACC3333G1Z3',
                'address' => 'No. 45, Santhepet Main Market, Mysuru',
                'destination_name' => 'Mysuru City Central',
                'land_number' => '08212423344',
                'mobile_number' => '9448334455',
                'is_active' => true,
            ],
            [
                'name' => 'Malabar Marine & Logistics Hub',
                'code' => 'CNS004',
                'gst_number' => '29AAACM4444H1Z2',
                'address' => 'Wharf Road, New Mangalore Port Trust Area',
                'destination_name' => 'Mangalore Port / Wharf',
                'land_number' => '08242445566',
                'mobile_number' => '9844445566',
                'is_active' => true,
            ],
            [
                'name' => 'North Karnataka Agro Traders',
                'code' => 'CNS005',
                'gst_number' => '29AAACN5555J1Z1',
                'address' => 'Grain Market Road, Hubli Central',
                'destination_name' => 'Hubli Central Market',
                'land_number' => '08362335566',
                'mobile_number' => '9741556677',
                'is_active' => true,
            ],
            [
                'name' => 'Kaveri Retailers & Wholesalers',
                'code' => 'CNS006',
                'gst_number' => '33AAACK6666K1Z9',
                'address' => '78, Cross Cut Road, Gandhipuram, Coimbatore',
                'destination_name' => 'Coimbatore City Market',
                'land_number' => '04222446677',
                'mobile_number' => '9842667788',
                'is_active' => true,
            ],
            [
                'name' => 'Metro Fasteners & Industrial Supplies',
                'code' => 'CNS007',
                'gst_number' => '27AAACM7777L1Z8',
                'address' => 'Gala 14, MIDC Industrial Area, Bhosari, Pune',
                'destination_name' => 'Bhosari MIDC',
                'land_number' => '02027127788',
                'mobile_number' => '9822778899',
                'is_active' => true,
            ],
            [
                'name' => 'Precision Spares & Engineering Store',
                'code' => 'CNS008',
                'gst_number' => '29AAACP8888M1Z7',
                'address' => 'Plot 88, Jigani 1st Phase Industrial Area',
                'destination_name' => 'Jigani Industrial Area',
                'land_number' => '08027828899',
                'mobile_number' => '9900889900',
                'is_active' => true,
            ],
            [
                'name' => 'Deccan Electricals & Lighting Hub',
                'code' => 'CNS009',
                'gst_number' => '36AAACD1111N1Z6',
                'address' => 'Ranigunj Market Road, Secunderabad',
                'destination_name' => 'Sanath Nagar Industrial Estate',
                'land_number' => '04027711223',
                'mobile_number' => '9849112233',
                'is_active' => true,
            ],
            [
                'name' => 'Royal Textiles & Furnishings',
                'code' => 'CNS010',
                'gst_number' => '33AAACR2222P1Z5',
                'address' => 'Kumaran Road, Tiruppur',
                'destination_name' => 'Tiruppur Cotton Hub',
                'land_number' => '04212233445',
                'mobile_number' => '9843223344',
                'is_active' => true,
            ],
        ];

        $fallbackDestination = Destination::first();

        foreach ($consigneesData as $data) {
            $destination = Destination::where('city_name', $data['destination_name'])->first() ?? $fallbackDestination;

            if (!$destination) {
                $this->command->error("No destination found for consignee {$data['name']}. Please run DestinationSeeder first.");
                return;
            }

            Consignee::updateOrCreate(
                ['code' => $data['code']],
                [
                    'name' => $data['name'],
                    'gst_number' => $data['gst_number'],
                    'address' => $data['address'],
                    'land_number' => $data['land_number'],
                    'mobile_number' => $data['mobile_number'],
                    'destination_id' => $destination->id,
                    'branch_id' => $branchId,
                    'is_active' => $data['is_active'],
                ]
            );
        }

        $this->command->info('Consignee seeder completed successfully! (' . count($consigneesData) . ' consignees seeded)');
    }
}
