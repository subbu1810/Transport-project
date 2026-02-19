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
        Schema::create('cash_book_entries', function (Blueprint $table) {
            $table->id();
            $table->string('voucher_no')->unique();
            $table->date('transaction_date');
            $table->enum('transaction_type', ['CREDIT', 'DEBIT']);
            $table->foreignId('account_head_id')->constrained('account_heads')->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
            $table->string('paid_to_receive_from')->nullable();
            $table->string('mode_of_pay')->default('Cash');
            $table->string('dd_cheque_no')->nullable();
            $table->date('dd_cheque_date')->nullable();
            $table->string('drawn_on_bank')->nullable();
            $table->string('authorised_by')->nullable();
            $table->string('paid_by_received_by')->nullable();
            $table->text('remarks')->nullable();
            $table->boolean('is_closing_entry')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_book_entries');
    }
};
