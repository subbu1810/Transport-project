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
        Schema::create('ack_bundles', function (Blueprint $table) {
            $table->id();
            $table->string('bundle_number', 50)->unique();
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->date('bundle_date');
            $table->foreignId('created_by')->constrained('admins')->onDelete('cascade');
            $table->string('status', 20)->default('CREATED'); // CREATED, SENT, RECEIVED
            $table->string('remarks', 255)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('bundle_number');
            $table->index('branch_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ack_bundles');
    }
};
