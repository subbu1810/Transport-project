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
        // 1. Drop foreign key on trip_sheets table
        Schema::table('trip_sheets', function (Blueprint $table) {
            // Check if foreign key exists before dropping
            // Generally safest to use try/catch or DB::select to check, but Laravel's dropForeign handles string naming.
            try {
                $table->dropForeign(['created_by']);
            } catch (\Exception $e) {
                // If it doesn't exist by array name, try the conventional string name
                try {
                    $table->dropForeign('trip_sheets_created_by_foreign');
                } catch (\Exception $e2) {
                    // Ignore if it doesn't exist
                }
            }
        });

        // 2. Drop the users table
        Schema::dropIfExists('users');

        // 3. Add new foreign key on trip_sheets pointing to admins
        Schema::table('trip_sheets', function (Blueprint $table) {
            $table->foreign('created_by')->references('id')->on('admins')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Drop foreign key to admins
        Schema::table('trip_sheets', function (Blueprint $table) {
            try {
                $table->dropForeign(['created_by']);
            } catch (\Exception $e) {
                // Ignore
            }
        });

        // 2. Re-create users table (minimal structure for rollback)
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('username')->unique();
                $table->string('email')->unique();
                $table->string('password');
                $table->timestamps();
            });
        }

        // 3. Restore foreign key to users
        Schema::table('trip_sheets', function (Blueprint $table) {
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }
};
