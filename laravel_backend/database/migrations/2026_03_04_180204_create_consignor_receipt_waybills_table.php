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
        Schema::create('consignor_receipt_waybills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consignor_receipt_id')->constrained('consignor_receipts')->onDelete('cascade');
            $table->foreignId('waybill_id')->constrained('waybills')->onDelete('cascade');
            $table->decimal('amount', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consignor_receipt_waybills');
    }
};
