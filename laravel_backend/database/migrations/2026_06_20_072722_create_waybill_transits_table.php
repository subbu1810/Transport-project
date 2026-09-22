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
        Schema::create('waybill_transits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('waybill_id')->constrained('waybills')->onDelete('cascade');
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('trip_sheet_id')->nullable()->constrained('trip_sheets')->onDelete('set null');
            $table->string('status', 50); // BOOKED, DISPATCHED, INWARDED, DELIVERED
            $table->string('remarks', 255)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('waybill_transits');
    }
};
