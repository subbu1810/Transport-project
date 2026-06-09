<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('consignors', 'branch_id')) {
            Schema::table('consignors', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->after('destination_id')->constrained('branches')->onDelete('set null');
                $table->index('branch_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('consignors', 'branch_id')) {
            Schema::table('consignors', function (Blueprint $table) {
                $table->dropForeign(['branch_id']);
                $table->dropColumn('branch_id');
            });
        }
    }
};
