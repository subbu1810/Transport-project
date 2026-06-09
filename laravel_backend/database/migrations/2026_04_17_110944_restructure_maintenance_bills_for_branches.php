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
        // Clean up from the dynamic dates and add branch_id securely
        Schema::table('maintenance_bills', function (Blueprint $table) {
            if (Schema::hasColumn('maintenance_bills', 'from_date')) {
                $table->dropColumn(['from_date', 'to_date']);
            }
            
            if (!Schema::hasColumn('maintenance_bills', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->after('transport_id')->constrained('branches')->onDelete('cascade');
            }

            if (!Schema::hasColumn('maintenance_bills', 'bill_month')) {
                $table->integer('bill_month')->after('branch_id');
                $table->integer('bill_year')->after('bill_month');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('maintenance_bills', function (Blueprint $table) {
            if (Schema::hasColumn('maintenance_bills', 'branch_id')) {
                $table->dropForeign(['branch_id']);
                $table->dropColumn('branch_id');
            }
        });
    }
};
