<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transports', function (Blueprint $table) {
            $table->id();
            $table->string('transport_code', 20)->unique();
            $table->string('transport_name', 100);
            $table->string('gst_number', 20)->nullable();
            $table->text('address');
            $table->string('mobile', 20)->nullable();
            $table->string('bank_name', 100)->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('transport_code');
            $table->index('transport_name');
            $table->index('gst_number');
            $table->index('mobile');
            $table->index('bank_name');
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transports');
    }
};
