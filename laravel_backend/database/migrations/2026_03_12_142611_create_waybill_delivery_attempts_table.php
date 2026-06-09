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
        Schema::create('waybill_delivery_attempts', function (Blueprint $table) {
            $table->id();
            $table->string('gc_number');
            $table->string('status');
            $table->string('reason');
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->string('branch_name')->nullable();
            $table->timestamps();

            // Setup relationship if waybills start using IDs, but commonly gc_number is used as reference
            // $table->foreign('gc_number')->references('gc_number')->on('waybills')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('waybill_delivery_attempts');
    }
};
