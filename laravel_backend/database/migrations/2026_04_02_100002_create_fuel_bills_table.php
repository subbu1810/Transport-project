<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('fuel_bills', function (Blueprint $table) {
            $table->id();
            $table->string('bill_number');
            $table->date('bill_date');
            
            // Relationship to Bunk
            $table->foreignId('bunk_id')->constrained('bunks');
            
            $table->decimal('total_amount', 12, 2);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->decimal('balance_amount', 12, 2);
            
            $table->string('remarks')->nullable();
            $table->enum('status', ['PENDING', 'PARTIAL', 'PAID', 'CANCELLED'])->default('PENDING');
            
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('created_by')->nullable()->constrained('admins');
            $table->timestamps();
            
            // A bill can cover multiple tokens, so we'll need a linking table too if complex.
            // For now, let's keep it simple with possible reference field.
        });

        // Add fuel_bill_id to fuel_tokens to link them
        Schema::table('fuel_tokens', function (Blueprint $table) {
            $table->foreignId('fuel_bill_id')->nullable()->constrained('fuel_bills')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('fuel_tokens', function (Blueprint $table) {
            $table->dropForeign(['fuel_bill_id']);
            $table->dropColumn('fuel_bill_id');
        });
        Schema::dropIfExists('fuel_bills');
    }
};
