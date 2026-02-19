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
        Schema::table('admins', function (Blueprint $table) {
            $table->string('transport_name')->nullable()->after('name');
            $table->text('transport_address')->nullable()->after('transport_name');
            $table->string('transport_phone')->nullable()->after('transport_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn(['transport_name', 'transport_address', 'transport_phone']);
        });
    }
};
