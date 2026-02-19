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
        Schema::create('waybill_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('waybill_id')->constrained('waybills')->onDelete('cascade');
            $table->string('article_type')->nullable(); // lookup code
            $table->integer('no_of_articles')->default(0);
            $table->decimal('rate', 10, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->decimal('handling_rate', 10, 2)->default(0);
            $table->decimal('handling_total', 12, 2)->default(0);
            $table->decimal('freight', 12, 2)->default(0);
            $table->decimal('actual_weight', 10, 2)->default(0);
            $table->decimal('charged_weight', 10, 2)->default(0);
            $table->decimal('amount', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('waybill_articles');
    }
};
