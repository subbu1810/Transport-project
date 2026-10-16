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
        if (!Schema::hasTable('whatsapp_integrations')) {
            Schema::create('whatsapp_integrations', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('tenant_id')->index();
                $table->string('business_id')->nullable()->index();
                $table->string('waba_id')->nullable()->index();
                $table->string('phone_number_id')->nullable()->index();
                $table->string('display_phone_number')->nullable();
                $table->string('business_name')->nullable();
                $table->text('access_token_encrypted')->nullable();
                $table->string('token_type')->default('Bearer');
                $table->string('status')->default('connected'); // connected, disconnected, expired, error
                $table->string('meta_app_id')->nullable();
                $table->timestamp('webhook_verified_at')->nullable();
                $table->json('raw_metadata')->nullable();
                $table->timestamp('connected_at')->nullable();
                $table->timestamps();

                // Multi-tenant unique index: one active integration per tenant
                $table->unique(['tenant_id'], 'unique_tenant_whatsapp_integration');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_integrations');
    }
};
