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
            if (!Schema::hasColumn('waybills', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('remarks');
                $table->foreign('created_by')->references('id')->on('admins');
            }
            if (!Schema::hasColumn('waybills', 'booking_clerk')) {
                $table->string('booking_clerk')->nullable()->after('created_by');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('waybills', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn(['created_by', 'booking_clerk']);
        });
    }
};
