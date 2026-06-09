<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trip_sheets', function (Blueprint $table) {
            if (!Schema::hasColumn('trip_sheets', 'mode_of_pay')) {
                $table->string('mode_of_pay')->nullable()->after('alert_branch');
            }
            if (!Schema::hasColumn('trip_sheets', 'total_freight')) {
                $table->decimal('total_freight', 10, 2)->nullable()->after('ack_timestamp');
            }
            if (!Schema::hasColumn('trip_sheets', 'total_collection')) {
                $table->decimal('total_collection', 10, 2)->nullable()->after('total_freight');
            }
            if (!Schema::hasColumn('trip_sheets', 'less_paid_driver')) {
                $table->decimal('less_paid_driver', 10, 2)->nullable()->after('total_collection');
            }
            if (!Schema::hasColumn('trip_sheets', 'settlement_id')) {
                $table->unsignedBigInteger('settlement_id')->nullable()->after('is_settled');
            }
            if (!Schema::hasColumn('trip_sheets', 'verification_date')) {
                $table->date('verification_date')->nullable()->after('settlement_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('trip_sheets', function (Blueprint $table) {
            $table->dropColumn([
                'mode_of_pay',
                'total_freight',
                'total_collection',
                'less_paid_driver',
                'settlement_id',
                'verification_date'
            ]);
        });
    }
};
