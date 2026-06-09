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
        Schema::table('trip_sheets', function (Blueprint $table) {
            $table->integer('route_id')->nullable()->after('destination_branch_id');
            $table->index('route_id');
            // $table->foreign('route_id')->references('id')->on('routes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trip_sheets', function (Blueprint $table) {
            $table->dropForeign(['route_id']);
            $table->dropColumn('route_id');
        });
    }
};
