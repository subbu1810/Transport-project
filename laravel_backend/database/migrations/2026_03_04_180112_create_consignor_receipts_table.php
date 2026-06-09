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
        Schema::create('consignor_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_no')->unique();
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('consignor_id')->constrained('consignors')->onDelete('cascade');
            $table->date('transaction_date');
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->foreignId('created_by')->nullable()->constrained('admins')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consignor_receipts');
    }
};
