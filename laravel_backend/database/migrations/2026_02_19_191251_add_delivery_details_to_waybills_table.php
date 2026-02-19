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
        Schema::table('waybills', function (Blueprint $table) {
            $table->timestamp('delivered_at')->nullable()->after('status');
            $table->string('delivered_branch_name')->nullable()->after('delivered_branch_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('waybills', function (Blueprint $table) {
            $table->dropColumn(['delivered_at', 'delivered_branch_name']);
        });
    }
};
