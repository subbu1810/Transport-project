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
        Schema::dropIfExists('gc_articles');
        Schema::dropIfExists('gcs');
        Schema::dropIfExists('from_to_addresses');
        Schema::dropIfExists('pincodes');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No easy way to restore dropped tables without data, so we leave it empty or recreate schema if needed.
        // Usually, cleanup migrations are one-way.
    }
};
