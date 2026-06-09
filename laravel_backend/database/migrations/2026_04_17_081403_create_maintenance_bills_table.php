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
        Schema::create('maintenance_bills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transport_id')->constrained('transports')->onDelete('cascade');
            $table->integer('bill_month');
            $table->integer('bill_year');
            $table->integer('gc_count')->default(0);
            $table->decimal('rate', 10, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->string('status')->default('Pending'); // Pending, Paid
            $table->string('razorpay_order_id')->nullable();
            $table->string('razorpay_payment_id')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->unique(['transport_id', 'bill_month', 'bill_year'], 'unique_monthly_bill');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_bills');
    }
};
