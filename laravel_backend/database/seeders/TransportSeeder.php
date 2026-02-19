<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Transport;
use App\Models\Branch;

class TransportSeeder extends Seeder
{
    public function run(): void
    {
        // Get the first branch (assuming it exists)
        $branch = Branch::first();
        
        if (!$branch) {
            $this->command->warn('No branches found. Please run BranchSeeder first.');
            return;
        }

        $transports = [
            [
                'transport_code' => 'TR001',
                'transport_name' => 'ABC Transport Services',
                'gst_number' => '29AAAPL1234C1ZV',
                'address' => '123 Industrial Area, Hosur, Tamil Nadu - 635126',
                'mobile' => '9876543210',
                'bank_name' => 'State Bank of India',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'transport_code' => 'TR002',
                'transport_name' => 'XYZ Logistics',
                'gst_number' => '29BBBPL5678D2EF',
                'address' => '456 Logistics Park, Bangalore, Karnataka - 560100',
                'mobile' => '9876543211',
                'bank_name' => 'HDFC Bank',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'transport_code' => 'TR003',
                'transport_name' => 'Speed Cargo Movers',
                'gst_number' => '29CCCCP9012E3GH',
                'address' => '789 Transport Nagar, Chennai, Tamil Nadu - 600001',
                'mobile' => '9876543212',
                'bank_name' => 'ICICI Bank',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'transport_code' => 'TR004',
                'transport_name' => 'Royal Transport Co.',
                'gst_number' => '29DDDDP3456F4IJ',
                'address' => '321 Highway Road, Salem, Tamil Nadu - 636001',
                'mobile' => '9876543213',
                'bank_name' => 'Axis Bank',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'transport_code' => 'TR005',
                'transport_name' => 'Global Freight Solutions',
                'gst_number' => '29EEEEP7890G5KL',
                'address' => '654 Export Zone, Coimbatore, Tamil Nadu - 641001',
                'mobile' => '9876543214',
                'bank_name' => 'Bank of Baroda',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'transport_code' => 'TR006',
                'transport_name' => 'Quick Delivery Services',
                'gst_number' => '29FFFFP1234H6MN',
                'address' => '987 Service Center, Madurai, Tamil Nadu - 625001',
                'mobile' => '9876543215',
                'bank_name' => 'Punjab National Bank',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'transport_code' => 'TR007',
                'transport_name' => 'National Carriers Ltd.',
                'gst_number' => '29GGGGP5678I7OP',
                'address' => '147 Transport Complex, Trichy, Tamil Nadu - 620001',
                'mobile' => '9876543216',
                'bank_name' => 'Canara Bank',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'transport_code' => 'TR008',
                'transport_name' => 'Express Cargo Lines',
                'gst_number' => '29HHHHP9012J8QR',
                'address' => '258 Freight Terminal, Vellore, Tamil Nadu - 632001',
                'mobile' => '9876543217',
                'bank_name' => 'Union Bank of India',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'transport_code' => 'TR009',
                'transport_name' => 'Safe Transport Co.',
                'gst_number' => '29IIIIP3456K9ST',
                'address' => '369 Safety Zone, Tirupur, Tamil Nadu - 641001',
                'mobile' => '9876543218',
                'bank_name' => 'Indian Bank',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
            [
                'transport_code' => 'TR010',
                'transport_name' => 'Premium Logistics Pvt. Ltd.',
                'gst_number' => '29JJJJP7890L0UV',
                'address' => '741 Premium Park, Erode, Tamil Nadu - 638001',
                'mobile' => '9876543219',
                'bank_name' => 'Bank of India',
                'branch_id' => $branch->id,
                'is_active' => true,
            ],
        ];

        foreach ($transports as $transport) {
            Transport::updateOrCreate(
                ['transport_code' => $transport['transport_code']],
                $transport
            );
        }

        $this->command->info('Transport seeder completed successfully!');
    }
}
