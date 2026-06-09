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
        if (!Schema::hasTable('account_heads')) {
            Schema::create('account_heads', function (Blueprint $table) {
                $table->id();
                $table->string('head_name', 100);
                $table->string('head_code', 50)->nullable()->unique();
                $table->enum('transaction_type', ['DEBIT', 'CREDIT'])->default('DEBIT');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('account_heads');
    }
};
