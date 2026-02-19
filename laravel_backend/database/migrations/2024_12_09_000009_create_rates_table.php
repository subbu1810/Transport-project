<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consignor_id')->constrained('consignors')->onDelete('cascade');
            $table->string('article_type', 50);
            $table->decimal('freight_charges', 10, 2);
            $table->decimal('handling_charges', 10, 2);
            $table->decimal('dd_charges', 10, 2);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('article_type');
            $table->index('consignor_id');
            $table->unique(['consignor_id', 'article_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rates');
    }
};
