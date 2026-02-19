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
        Schema::table('bunks', function (Blueprint $table) {
            // Drop old indexes if they exist
            $table->dropIndex(['bank_land']);
            $table->dropIndex(['bank_mobile']);
            
            // Rename columns
            $table->renameColumn('bank_land', 'bunk_land');
            $table->renameColumn('bank_mobile', 'bunk_mobile');
            $table->renameColumn('bank_remarks', 'bunk_remarks');
            
            // Add new indexes
            $table->index('bunk_land');
            $table->index('bunk_mobile');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bunks', function (Blueprint $table) {
            // Drop new indexes
            $table->dropIndex(['bunk_land']);
            $table->dropIndex(['bunk_mobile']);
            
            // Rename columns back
            $table->renameColumn('bunk_land', 'bank_land');
            $table->renameColumn('bunk_mobile', 'bank_mobile');
            $table->renameColumn('bunk_remarks', 'bank_remarks');
            
            // Add old indexes back
            $table->index('bank_land');
            $table->index('bank_mobile');
        });
    }
};
