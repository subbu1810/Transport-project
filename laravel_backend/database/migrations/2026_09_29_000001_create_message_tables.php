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
        if (!Schema::hasTable('message_templates')) {
            Schema::create('message_templates', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('type')->default('custom'); // waybill, dispatch, delivery, payment, reminder, custom
                $table->string('channel')->default('whatsapp'); // whatsapp, sms, all
                $table->text('body');
                $table->string('language')->default('en');
                $table->string('status')->default('active'); // active, inactive
                $table->unsignedBigInteger('branch_id')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('message_logs')) {
            Schema::create('message_logs', function (Blueprint $table) {
                $table->id();
                $table->string('channel')->default('whatsapp'); // whatsapp, sms
                $table->string('recipient_name')->nullable();
                $table->string('phone');
                $table->string('message_type')->default('custom');
                $table->unsignedBigInteger('template_id')->nullable();
                $table->text('message_body');
                $table->string('status')->default('sent'); // sent, delivered, read, failed
                $table->string('external_id')->nullable(); // Meta message id
                $table->text('error_message')->nullable();
                $table->unsignedBigInteger('branch_id')->nullable();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('message_logs');
        Schema::dropIfExists('message_templates');
    }
};
