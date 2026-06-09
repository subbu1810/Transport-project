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
        Schema::create('routes', function (Blueprint $table) {
            $table->integer('id', true);
            $table->string('route_name')->unique();
            $table->integer('origin_branch_id')->nullable();
            $table->integer('destination_branch_id')->nullable();
            $table->string('status')->default('ACTIVE');
            $table->timestamps();

            // $table->foreign('origin_branch_id')->references('id')->on('branches');
            // $table->foreign('destination_branch_id')->references('id')->on('branches');
            $table->index('origin_branch_id');
            $table->index('destination_branch_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('routes');
    }
};
