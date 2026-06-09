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
        Schema::table('route_stops', function (Blueprint $table) {
            $table->renameColumn('branch_id', 'taluk_id');
            // Re-add foreign key if needed, or just leave as is if not using strict FKs
            // $table->foreign('taluk_id')->references('id')->on('taluks');
        });

        Schema::table('routes', function (Blueprint $table) {
            $table->renameColumn('destination_branch_id', 'destination_taluk_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('route_stops', function (Blueprint $table) {
            $table->renameColumn('taluk_id', 'branch_id');
        });

        Schema::table('routes', function (Blueprint $table) {
            $table->renameColumn('destination_taluk_id', 'destination_branch_id');
        });
    }
};
