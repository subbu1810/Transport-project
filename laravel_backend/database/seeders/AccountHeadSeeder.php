<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AccountHead;

class AccountHeadSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Simple wipe and reload to ensure new transaction_type field is populated
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        AccountHead::truncate();
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $heads = [
            [
                'name' => 'PAYMENT_RECEIVED_AGAINST_BOOKING_OF_GOODS',
                'description' => 'PAYMENT_RECEIVED_AGAINST_BOOKING_OF_GOODS',
                'transaction_type' => 'CREDIT',
                'status' => 'Active'
            ],
            [
                'name' => 'DISCOUNT_AGAINST_BOOKED_GC',
                'description' => 'DISCOUNT_AGAINST_BOOKED_GC',
                'transaction_type' => 'DEBIT',
                'status' => 'Active'
            ],
            [
                'name' => 'ADVANCE_AGAINST_BOOKED_GC',
                'description' => 'ADVANCE_AGAINST_BOOKED_GC',
                'transaction_type' => 'CREDIT',
                'status' => 'Active'
            ],
            [
                'name' => 'OPENING_BALANCE',
                'description' => 'CASH_RECEIVED_FROM_OPENING_BALANCE',
                'transaction_type' => 'CREDIT',
                'status' => 'Active'
            ],
            [
                'name' => 'HAMALI_EXPENSES',
                'description' => 'CASH PAID TO HAMALI EXPENSES',
                'transaction_type' => 'DEBIT',
                'status' => 'Active'
            ],
            [
                'name' => 'MEALS_EXPENSES',
                'description' => 'CASH PAID TO MEALS EXPENSES FOR THE DAY',
                'transaction_type' => 'DEBIT',
                'status' => 'Active'
            ],
            [
                'name' => 'OFFICE_EXPENSES',
                'description' => 'CASH PAID TO OFFICE EXPENSES',
                'transaction_type' => 'DEBIT',
                'status' => 'Active'
            ],
            [
                'name' => 'VEHICLE_FREIGHTCHARGES_(SGRL_VECHILE)',
                'description' => 'CASH PAID TO VEHICLE FREIGHT CHARGES(SGRL VECHILE ONLY)',
                'transaction_type' => 'DEBIT',
                'status' => 'Active'
            ],
            [
                'name' => 'HAND_LOAN',
                'description' => 'CASH RECEIVED FROM HAND LOAN AS ON',
                'transaction_type' => 'CREDIT',
                'status' => 'Active'
            ],
            [
                'name' => 'FREIGHT_EXPENSES',
                'description' => 'FREIGHT EXPENSES AS ON',
                'transaction_type' => 'DEBIT',
                'status' => 'Active'
            ],
            [
                'name' => 'BAD_DELETE_EXPENSES',
                'description' => 'CASH PAID TO BAD DETETE EXPENSES AS ON',
                'transaction_type' => 'DEBIT',
                'status' => 'Active'
            ],
            [
                'name' => 'CLOSING_BALANCE',
                'description' => 'DAYBOOK CLOSING BALANCE',
                'transaction_type' => 'DEBIT',
                'status' => 'Active'
            ],
        ];

        foreach ($heads as $head) {
            AccountHead::create($head);
        }
    }
}
