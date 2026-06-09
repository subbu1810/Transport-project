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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('emp_id')->unique();
            $table->string('first_name');
            $table->string('last_name')->nullable();
            $table->string('designation')->nullable();
            $table->string('phone_number', 20)->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->date('date_of_joining')->nullable();
            $table->decimal('base_salary', 15, 2)->default(0);
            $table->string('salary_type')->default('MONTHLY'); // MONTHLY, DAILY, WEEKLY
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('emp_id');
            $table->index('first_name');
            $table->index('branch_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
