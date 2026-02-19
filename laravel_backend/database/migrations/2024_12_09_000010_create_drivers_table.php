<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('dl_number', 20)->unique();
            $table->string('dl_type', 10);
            $table->string('phone', 20);
            $table->date('date_of_birth')->nullable();
            $table->date('date_of_issue')->nullable();
            $table->date('valid_till')->nullable();
            $table->text('address')->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('name');
            $table->index('dl_number');
            $table->index('phone');
            $table->index('branch_id');
            $table->index('valid_till');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};
