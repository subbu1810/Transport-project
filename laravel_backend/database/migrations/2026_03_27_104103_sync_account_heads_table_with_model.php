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
        Schema::table('account_heads', function (Blueprint $table) {
            if (!Schema::hasColumn('account_heads', 'name')) {
                $table->string('name')->nullable()->after('id');
            }
            if (!Schema::hasColumn('account_heads', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
            if (!Schema::hasColumn('account_heads', 'status')) {
                $table->string('status')->default('Active')->after('transaction_type');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('account_heads', function (Blueprint $table) {
            //
        });
    }
};
