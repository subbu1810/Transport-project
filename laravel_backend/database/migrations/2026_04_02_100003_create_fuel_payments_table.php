<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('fuel_payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_number')->unique();
            $table->date('payment_date');
            
            // Relationships
            $table->foreignId('bunk_id')->constrained('bunks');
            $table->foreignId('fuel_bill_id')->nullable()->constrained('fuel_bills')->onDelete('SET NULL');
            
            $table->decimal('amount', 12, 2);
            $table->string('mode_of_payment'); // CASH, CHEQUE, UPI, TRANSFER
            $table->string('reference_no')->nullable(); // Check number, Transaction ID
            
            $table->string('remarks')->nullable();
            
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('created_by')->nullable()->constrained('admins');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('fuel_payments');
    }
};
