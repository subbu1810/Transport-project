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
        Schema::create('screen_assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('admin_id');
            $table->string('screen_path'); // e.g., '/gc-entry', '/trip-sheet-entry'
            $table->string('screen_name'); // e.g., 'GC Entry', 'Trip Sheet Entry'
            $table->string('category')->nullable(); // e.g., 'Way Bill', 'Trip Sheet', 'Masters'
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('admin_id')->references('id')->on('admins')->onDelete('cascade');
            $table->unique(['admin_id', 'screen_path']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('screen_assignments');
    }
};
