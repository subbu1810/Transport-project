<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Consignee;
use App\Models\Destination;

class ConsigneeSeeder extends Seeder
{
    public function run(): void
    {
        // Get the first destination (assuming it exists)
        $destination = Destination::first();
        
        if (!$destination) {
            $this->command->warn('No destinations found. Please run DestinationSeeder first.');
            return;
        }

        $consignees = [
            [
                'name' => 'ABC Manufacturing Ltd',
                'code' => 'CNS001',
                'gst_number' => '18ABCMN1234H1Z0',
                'address' => '123 Industrial Area, Phase 1',
                'land_number' => '08012345678',
                'mobile_number' => '9876543210',
                'destination_id' => $destination->id,
                'is_active' => true,
            ],
            [
                'name' => 'XYZ Trading Company',
                'code' => 'CNS002',
                'gst_number' => '18XYZTR5678H2Z0',
                'address' => '456 Commercial Street, Building A',
                'land_number' => '08087654321',
                'mobile_number' => '9876543211',
                'destination_id' => $destination->id,
                'is_active' => true,
            ],
            [
                'name' => 'Global Exporters Pvt Ltd',
                'code' => 'CNS003',
                'gst_number' => '18GLBEX9999H3Z0',
                'address' => '789 Export Zone, Sector 5',
                'land_number' => '08011223344',
                'mobile_number' => '9876543212',
                'destination_id' => $destination->id,
                'is_active' => true,
            ],
            [
                'name' => 'Swift Logistics Solutions',
                'code' => 'CNS004',
                'gst_number' => '18SWFTL1111H4Z0',
                'address' => '321 Logistics Park, Block C',
                'land_number' => '08055667788',
                'mobile_number' => '9876543213',
                'destination_id' => $destination->id,
                'is_active' => true,
            ],
            [
                'name' => 'Premium Industries',
                'code' => 'CNS005',
                'gst_number' => '18PRMIN2222H5Z0',
                'address' => '654 Industrial Estate, Unit 7',
                'land_number' => '08099887766',
                'mobile_number' => '9876543214',
                'destination_id' => $destination->id,
                'is_active' => true,
            ],
            [
                'name' => 'Express Delivery Services',
                'code' => 'CNS006',
                'gst_number' => '18EXPDL3333H6Z0',
                'address' => '987 Service Center, Main Road',
                'land_number' => '08044556677',
                'mobile_number' => '9876543215',
                'destination_id' => $destination->id,
                'is_active' => true,
            ],
            [
                'name' => 'National Transport Corp',
                'code' => 'CNS007',
                'gst_number' => '18NTTRP4444H7Z0',
                'address' => '147 Transport Hub, Gate 2',
                'land_number' => '08033445566',
                'mobile_number' => '9876543216',
                'destination_id' => $destination->id,
                'is_active' => true,
            ],
            [
                'name' => 'Metro Cargo Solutions',
                'code' => 'CNS008',
                'gst_number' => '18MTCRG5555H8Z0',
                'address' => '258 Metro Complex, Floor 3',
                'land_number' => '08022334455',
                'mobile_number' => '9876543217',
                'destination_id' => $destination->id,
                'is_active' => true,
            ],
            [
                'name' => 'Rapid Delivery Systems',
                'code' => 'CNS009',
                'gst_number' => '18RPDDL6666H9Z0',
                'address' => '369 Rapid Lane, Street 4',
                'land_number' => '08011223344',
                'mobile_number' => '9876543218',
                'destination_id' => $destination->id,
                'is_active' => true,
            ],
            [
                'name' => 'Elite Logistics Group',
                'code' => 'CNS010',
                'gst_number' => '18ELTLG7777H0Z0',
                'address' => '741 Elite Tower, Suite 10',
                'land_number' => '08000112233',
                'mobile_number' => '9876543219',
                'destination_id' => $destination->id,
                'is_active' => true,
            ],
        ];

        foreach ($consignees as $consignee) {
            Consignee::updateOrCreate(
                ['code' => $consignee['code']],
                $consignee
            );
        }

        $this->command->info('Consignee seeder completed successfully!');
    }
}
