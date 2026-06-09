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
        if (!Schema::hasTable('admins')) {
            Schema::create('admins', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('full_name')->nullable();
                $table->string('phone_number')->nullable();
                $table->string('email')->unique(); // Gmail ID
                $table->text('address')->nullable();
                $table->string('role')->nullable();
                $table->string('password');
                
                // Transport details
                $table->unsignedBigInteger('transport_id')->nullable();
                $table->string('transport_name')->nullable();
                $table->text('transport_address')->nullable();
                $table->string('transport_phone')->nullable();
                
                // Branch details
                $table->string('branch_code')->nullable();
                $table->string('branch_name')->nullable();
                $table->text('branch_address')->nullable();
                $table->string('branch_email')->nullable();
                $table->string('branch_phone')->nullable();
                
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
        Schema::dropIfExists('admins');
    }
};
