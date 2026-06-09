<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('fuel_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('token_number')->unique();
            $table->date('token_date');
            
            // Relationships
            $table->foreignId('bunk_id')->constrained('bunks');
            $table->foreignId('vehicle_id')->constrained('vehicles');
            $table->foreignId('driver_id')->constrained('drivers');
            $table->foreignId('trip_sheet_id')->nullable()->constrained('trip_sheets')->onDelete('set null');
            
            $table->decimal('quantity', 10, 2); // Liters
            $table->decimal('rate', 10, 2)->nullable();
            $table->decimal('amount', 12, 2);
            
            $table->string('remarks')->nullable();
            $table->enum('status', ['ISSUED', 'BILLED', 'CANCELLED'])->default('ISSUED');
            
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('created_by')->nullable()->constrained('admins');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('fuel_tokens');
    }
};
