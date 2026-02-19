<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consignees', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 20)->unique();
            $table->string('gst_number', 20)->nullable()->unique();
            $table->text('address');
            $table->string('land_number', 20)->nullable();
            $table->string('mobile_number', 20);
            $table->foreignId('destination_id')->constrained('destinations')->onDelete('cascade');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('name');
            $table->index('code');
            $table->index('gst_number');
            $table->index('mobile_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consignees');
    }
};
