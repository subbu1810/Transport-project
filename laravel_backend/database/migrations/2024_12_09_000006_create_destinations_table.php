<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('destinations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('taluk_id')->constrained('taluks')->onDelete('cascade');
            $table->string('city_name', 100);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('city_name');
            $table->unique(['taluk_id', 'city_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('destinations');
    }
};
