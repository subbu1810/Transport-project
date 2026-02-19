<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Rate;
use App\Models\Consignor;

class RateSeeder extends Seeder
{
    public function run(): void
    {
        // Get the first consignor (assuming it exists)
        $consignor = Consignor::first();
        
        if (!$consignor) {
            $this->command->warn('No consignors found. Please run ConsignorSeeder first.');
            return;
        }

        $rates = [
            [
                'consignor_id' => $consignor->id,
                'article_type' => 'Documents',
                'freight_charges' => 50.00,
                'handling_charges' => 10.00,
                'dd_charges' => 25.00,
                'is_active' => true,
            ],
            [
                'consignor_id' => $consignor->id,
                'article_type' => 'Small Parcel',
                'freight_charges' => 100.00,
                'handling_charges' => 20.00,
                'dd_charges' => 50.00,
                'is_active' => true,
            ],
            [
                'consignor_id' => $consignor->id,
                'article_type' => 'Medium Package',
                'freight_charges' => 250.00,
                'handling_charges' => 35.00,
                'dd_charges' => 75.00,
                'is_active' => true,
            ],
            [
                'consignor_id' => $consignor->id,
                'article_type' => 'Large Box',
                'freight_charges' => 500.00,
                'handling_charges' => 50.00,
                'dd_charges' => 100.00,
                'is_active' => true,
            ],
            [
                'consignor_id' => $consignor->id,
                'article_type' => 'Heavy Cargo',
                'freight_charges' => 1000.00,
                'handling_charges' => 100.00,
                'dd_charges' => 200.00,
                'is_active' => true,
            ],
            [
                'consignor_id' => $consignor->id,
                'article_type' => 'Electronics',
                'freight_charges' => 300.00,
                'handling_charges' => 40.00,
                'dd_charges' => 80.00,
                'is_active' => true,
            ],
            [
                'consignor_id' => $consignor->id,
                'article_type' => 'Fragile Items',
                'freight_charges' => 400.00,
                'handling_charges' => 60.00,
                'dd_charges' => 120.00,
                'is_active' => true,
            ],
            [
                'consignor_id' => $consignor->id,
                'article_type' => 'Liquid Items',
                'freight_charges' => 350.00,
                'handling_charges' => 45.00,
                'dd_charges' => 90.00,
                'is_active' => true,
            ],
            [
                'consignor_id' => $consignor->id,
                'article_type' => 'Perishable Goods',
                'freight_charges' => 450.00,
                'handling_charges' => 70.00,
                'dd_charges' => 140.00,
                'is_active' => true,
            ],
            [
                'consignor_id' => $consignor->id,
                'article_type' => 'Industrial Equipment',
                'freight_charges' => 1500.00,
                'handling_charges' => 200.00,
                'dd_charges' => 300.00,
                'is_active' => true,
            ],
        ];

        foreach ($rates as $rate) {
            Rate::updateOrCreate(
                [
                    'consignor_id' => $rate['consignor_id'],
                    'article_type' => $rate['article_type']
                ],
                $rate
            );
        }

        $this->command->info('Rate seeder completed successfully!');
    }
}
