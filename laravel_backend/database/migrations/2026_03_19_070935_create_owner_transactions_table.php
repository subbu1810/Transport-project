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
        Schema::create('owner_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('vehicle_owners');
            $table->foreignId('trip_sheet_id')->nullable()->constrained('trip_sheets')->onDelete('set null');
            $table->date('transaction_date');
            $table->enum('transaction_type', ['CREDIT', 'DEBIT']); // CREDIT is earning, DEBIT is advance
            $table->decimal('amount', 15, 2);
            $table->string('description', 255);
            $table->string('reference_no', 100)->nullable();
            $table->foreignId('settlement_id')->nullable()->constrained('owner_settlements')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('owner_transactions');
    }
};
