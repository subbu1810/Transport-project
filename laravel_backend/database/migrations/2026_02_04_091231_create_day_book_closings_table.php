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
        Schema::create('day_book_closings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
            $table->date('closing_date');
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->decimal('credit_total', 15, 2)->default(0);
            $table->decimal('debit_total', 15, 2)->default(0);
            $table->decimal('closing_balance', 15, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->unique(['branch_id', 'closing_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('day_book_closings');
    }
};
