<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('trip_sheets', function (Blueprint $table) {
            $table->decimal('total_freight', 12, 2)->nullable()->after('ack_remarks');
            $table->decimal('total_collection', 12, 2)->nullable()->after('total_freight');
            $table->decimal('less_paid_driver', 12, 2)->nullable()->after('total_collection');
            $table->decimal('balance_at_office', 12, 2)->nullable()->after('less_paid_driver');
            $table->decimal('total_kms', 10, 2)->nullable()->after('balance_at_office');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trip_sheets', function (Blueprint $table) {
            $table->dropColumn([
                'total_freight',
                'total_collection',
                'less_paid_driver',
                'balance_at_office',
                'total_kms'
            ]);
        });
    }
};
