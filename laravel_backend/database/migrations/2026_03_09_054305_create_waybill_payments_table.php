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
        Schema::create('waybill_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('waybill_id')->constrained()->onDelete('cascade');
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('discount', 15, 2)->default(0);
            $table->date('payment_date');
            $table->string('mode_of_pay')->nullable();
            $table->string('receipt_no')->nullable(); // Can store Report ID or internal receipt no
            $table->string('remarks')->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches');
            $table->foreignId('created_by')->nullable()->constrained('admins');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('waybill_payments');
    }
};
