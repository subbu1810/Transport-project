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
            $table->date('verification_date')->nullable()->after('total_kms');
            $table->foreignId('verified_by')->nullable()->constrained('admins')->after('verification_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trip_sheets', function (Blueprint $table) {
            $table->dropForeign(['verified_by']);
            $table->dropColumn(['verification_date', 'verified_by']);
        });
    }
};
