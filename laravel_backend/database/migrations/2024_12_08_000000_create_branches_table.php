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
        if (!Schema::hasTable('branches')) {
            Schema::create('branches', function (Blueprint $table) {
                $table->id();
                $table->string('branch_code', 50)->unique();
                $table->string('branch_name', 100);
                $table->string('address', 255)->nullable();
                $table->string('city', 50)->nullable();
                $table->string('taluk', 50)->nullable();
                $table->string('state', 50)->nullable();
                $table->string('pincode', 10)->nullable();
                $table->string('phone', 20)->nullable();
                $table->string('email', 100)->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                // Indexes
                $table->index('branch_code');
                $table->index('branch_name');
                $table->index('city');
                $table->index('is_active');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
