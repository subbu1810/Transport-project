<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('vehicle_number', 20)->unique();
            $table->string('owner_name', 100);
            $table->string('phone', 20)->nullable();
            $table->date('insurance_upto')->nullable();
            $table->string('vehicle_status', 20);
            $table->date('rc_valid_from')->nullable();
            $table->date('rc_valid_to')->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('vehicle_number');
            $table->index('owner_name');
            $table->index('phone');
            $table->index('vehicle_status');
            $table->index('insurance_upto');
            $table->index('rc_valid_to');
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
