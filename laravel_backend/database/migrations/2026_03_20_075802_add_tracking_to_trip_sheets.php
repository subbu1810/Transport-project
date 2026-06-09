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
            $table->unsignedBigInteger('ack_branch_id')->nullable()->after('ack_remarks')->index();
            $table->unsignedBigInteger('ack_by')->nullable()->after('ack_branch_id')->index();
            $table->timestamp('ack_timestamp')->nullable()->after('ack_by');
            
            $table->foreign('ack_branch_id')->references('id')->on('branches')->onDelete('set null');
            $table->foreign('ack_by')->references('id')->on('admins')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trip_sheets', function (Blueprint $table) {
            $table->dropForeign(['ack_branch_id']);
            $table->dropForeign(['ack_by']);
            $table->dropColumn(['ack_branch_id', 'ack_by', 'ack_timestamp']);
        });
    }
};
