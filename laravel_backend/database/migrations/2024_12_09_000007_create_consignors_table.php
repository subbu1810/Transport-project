<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consignors', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 20)->unique();
            $table->string('tin_number', 20)->nullable()->unique();
            $table->string('gst_number', 20)->nullable()->unique();
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('name');
            $table->index('code');
            $table->index('tin_number');
            $table->index('gst_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consignors');
    }
};
