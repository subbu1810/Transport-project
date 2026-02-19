<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bunks', function (Blueprint $table) {
            $table->id();
            $table->string('bunk_name', 100);
            $table->text('bunk_address');
            $table->string('tin_number', 20)->nullable();
            $table->string('bunk_land', 20)->nullable();
            $table->string('bunk_mobile', 20)->nullable();
            $table->text('bunk_remarks')->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('bunk_name');
            $table->index('tin_number');
            $table->index('bunk_land');
            $table->index('bunk_mobile');
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bunks');
    }
};
