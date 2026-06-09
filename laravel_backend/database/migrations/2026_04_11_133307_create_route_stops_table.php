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
        Schema::create('route_stops', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('route_id');
            $table->integer('branch_id'); // The "Stop"
            $table->integer('stop_sequence'); // 1, 2, 3...
            $table->timestamps();

            // $table->foreign('route_id')->references('id')->on('routes')->onDelete('cascade');
            // $table->foreign('branch_id')->references('id')->on('branches');
            $table->index('route_id');
            $table->index('branch_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('route_stops');
    }
};
