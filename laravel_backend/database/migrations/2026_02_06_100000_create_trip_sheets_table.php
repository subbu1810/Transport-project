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
        if (!Schema::hasTable('trip_sheets')) {
            Schema::create('trip_sheets', function (Blueprint $table) {
                $table->id();
                $table->string('trip_number', 50)->unique();
                $table->date('trip_date');
                $table->foreignId('vehicle_id')->constrained('vehicles');
                $table->foreignId('driver_id')->constrained('drivers');
                $table->string('owner_name', 100)->nullable();
                $table->date('dispatch_date')->nullable();
                $table->foreignId('dispatch_branch_id')->nullable()->constrained('branches');
                $table->foreignId('destination_branch_id')->nullable()->constrained('branches');
                $table->decimal('advance_amount', 12, 2)->nullable();
                $table->string('lr_number', 50)->nullable();
                $table->string('cr_number', 50)->nullable();
                $table->string('indent_number', 50)->nullable();
                $table->string('trip_remarks', 255)->nullable();
                $table->enum('status', ['PENDING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'])->default('PENDING');
                $table->date('ack_date')->nullable();
                $table->string('ack_remarks', 255)->nullable();
                $table->foreignId('created_by')->nullable()->constrained('admins');
                $table->timestamps();

                $table->index('trip_number');
                $table->index('trip_date');
            });
        }

        if (!Schema::hasTable('trip_sheet_details')) {
            Schema::create('trip_sheet_details', function (Blueprint $table) {
                $table->id();
                $table->foreignId('trip_sheet_id')->constrained('trip_sheets')->onDelete('cascade');
                $table->foreignId('waybill_id')->constrained('waybills');
                $table->timestamps();

                $table->unique(['trip_sheet_id', 'waybill_id'], 'unique_trip_waybill');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trip_sheet_details');
        Schema::dropIfExists('trip_sheets');
    }
};
