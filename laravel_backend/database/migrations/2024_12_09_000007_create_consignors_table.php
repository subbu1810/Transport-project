<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('consignors')) {
            Schema::create('consignors', function (Blueprint $table) {
                $table->id();
                $table->string('name', 100);
                $table->text('address')->nullable();
                $table->string('code', 20)->unique();
                $table->string('tin_number', 20)->nullable();
                $table->string('gst_number', 20)->nullable();
                
                $table->foreignId('district_id')->nullable()->constrained('districts')->onDelete('set null');
                $table->foreignId('taluk_id')->nullable()->constrained('taluks')->onDelete('set null');
                $table->foreignId('destination_id')->nullable()->constrained('destinations')->onDelete('set null');
                
                $table->string('pin_code', 20)->nullable();
                $table->string('mobile_no', 20)->nullable();
                $table->string('land_no', 20)->nullable();
                $table->string('freight_account', 50)->nullable();
                $table->string('service_tax', 50)->nullable();
                $table->decimal('stationary_charges', 10, 2)->nullable();
                $table->text('remarks')->nullable();
                
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->index('name');
                $table->index('code');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('consignors');
    }
};
