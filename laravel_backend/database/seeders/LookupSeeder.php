<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Lookup;

class LookupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $lookups = [
            // Article Types
            ['type' => 'ARTICLE_TYPE', 'code' => 'BAGS', 'value' => 'Bags', 'is_active' => true],
            ['type' => 'ARTICLE_TYPE', 'code' => 'BOXES', 'value' => 'Boxes', 'is_active' => true],
            ['type' => 'ARTICLE_TYPE', 'code' => 'CASES', 'value' => 'Cases', 'is_active' => true],
            ['type' => 'ARTICLE_TYPE', 'code' => 'DRUMS', 'value' => 'Drums', 'is_active' => true],
            ['type' => 'ARTICLE_TYPE', 'code' => 'MACHINERY', 'value' => 'Machinery', 'is_active' => true],
            ['type' => 'ARTICLE_TYPE', 'code' => 'ROLLS', 'value' => 'Rolls', 'is_active' => true],
            ['type' => 'ARTICLE_TYPE', 'code' => 'BUNDLES', 'value' => 'Bundles', 'is_active' => true],

            // Waybill Delivery Status
            ['type' => 'WAYBILL_DELR_STATUS', 'code' => 'IN_TRANSIT', 'value' => 'In Transit', 'is_active' => true],
            ['type' => 'WAYBILL_DELR_STATUS', 'code' => 'DELIVERED', 'value' => 'Delivered', 'is_active' => true],
            ['type' => 'WAYBILL_DELR_STATUS', 'code' => 'RETURNED', 'value' => 'Returned', 'is_active' => true],
            ['type' => 'WAYBILL_DELR_STATUS', 'code' => 'MISSING', 'value' => 'Missing', 'is_active' => true],
            ['type' => 'WAYBILL_DELR_STATUS', 'code' => 'CANCELLED', 'value' => 'Cancelled', 'is_active' => true],

            // Freight Payment Types
            ['type' => 'FREIGHT_ACT_TYPE', 'code' => 'ACCOUNT', 'value' => 'To Account', 'is_active' => true],
            ['type' => 'FREIGHT_ACT_TYPE', 'code' => 'PAID', 'value' => 'Paid', 'is_active' => true],
            ['type' => 'FREIGHT_ACT_TYPE', 'code' => 'TOPAY', 'value' => 'To Pay', 'is_active' => true],

            // Tax Paid By
            ['type' => 'TAX_PAYED_BY', 'code' => 'TRANSPORTER', 'value' => 'Transporter', 'is_active' => true],
            ['type' => 'TAX_PAYED_BY', 'code' => 'CONSIGNEE', 'value' => 'Consignee', 'is_active' => true],
            ['type' => 'TAX_PAYED_BY', 'code' => 'CONSIGNOR', 'value' => 'Consignor', 'is_active' => true],

            // Trip Status
            ['type' => 'TRIP_STATUS', 'code' => 'PENDING', 'value' => 'Pending', 'is_active' => true],
            ['type' => 'TRIP_STATUS', 'code' => 'DISPATCHED', 'value' => 'Dispatched', 'is_active' => true],
            ['type' => 'TRIP_STATUS', 'code' => 'DELIVERED', 'value' => 'Delivered', 'is_active' => true],
            ['type' => 'TRIP_STATUS', 'code' => 'CANCELLED', 'value' => 'Cancelled', 'is_active' => true],
        ];

        foreach ($lookups as $lookup) {
            Lookup::updateOrCreate(
                ['type' => $lookup['type'], 'code' => $lookup['code']],
                ['value' => $lookup['value'], 'is_active' => $lookup['is_active']]
            );
        }
    }
}
