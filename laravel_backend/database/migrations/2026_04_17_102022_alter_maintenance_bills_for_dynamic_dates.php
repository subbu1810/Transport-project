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
        Schema::table('maintenance_bills', function (Blueprint $table) {
            $table->dropForeign(['transport_id']);
            $table->dropUnique('unique_monthly_bill');
            $table->dropColumn(['bill_month', 'bill_year']);
            
            $table->dateTime('from_date')->after('transport_id')->nullable();
            $table->dateTime('to_date')->after('from_date')->nullable();
            
            $table->foreign('transport_id')->references('id')->on('transports')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('maintenance_bills', function (Blueprint $table) {
            $table->dropForeign(['transport_id']);
            $table->dropColumn(['from_date', 'to_date']);
            
            $table->integer('bill_month')->nullable();
            $table->integer('bill_year')->nullable();
            
            $table->unique(['transport_id', 'bill_month', 'bill_year'], 'unique_monthly_bill');
            $table->foreign('transport_id')->references('id')->on('transports')->onDelete('cascade');
        });
    }
};
