<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('bunks', function (Blueprint $table) {
            $table->string('account_number')->nullable()->after('bunk_remarks');
            $table->string('ifsc_code')->nullable()->after('account_number');
            $table->string('bank_name')->nullable()->after('ifsc_code');
            $table->string('bank_branch')->nullable()->after('bank_name');
            $table->string('upi_id')->nullable()->after('bank_branch');
            $table->decimal('opening_balance', 12, 2)->default(0)->after('upi_id');
        });
    }

    public function down()
    {
        Schema::table('bunks', function (Blueprint $table) {
            $table->dropColumn(['account_number', 'ifsc_code', 'bank_name', 'bank_branch', 'upi_id', 'opening_balance']);
        });
    }
};
