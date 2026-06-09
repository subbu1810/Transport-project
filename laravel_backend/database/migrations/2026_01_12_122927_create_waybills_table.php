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
        if (!Schema::hasTable('waybills')) {
            Schema::create('waybills', function (Blueprint $table) {
                $table->id();
                $table->string('gc_number')->unique();
                $table->date('bill_date');
                $table->foreignId('origin_branch_id')->constrained('branches');
                $table->foreignId('destination_id')->constrained('destinations');
                $table->foreignId('consignor_id')->constrained('consignors');
                $table->foreignId('consignee_id')->constrained('consignees');
                
                $table->string('article_desc')->nullable();
                $table->integer('total_articles')->default(0);
                
                $table->decimal('freight_amount', 12, 2)->default(0);
                $table->decimal('dd_charges', 12, 2)->default(0);
                $table->decimal('handling_charges', 12, 2)->default(0);
                $table->decimal('stationary_charges', 12, 2)->default(0);
                $table->decimal('total_amount', 12, 2)->default(0);
                
                $table->string('invoice_no')->nullable();
                $table->decimal('declared_value', 12, 2)->default(0);
                $table->string('eway_bill_no')->nullable();
                
                $table->string('tax_payable_by')->nullable(); // lookup code
                $table->string('account_type')->nullable(); // lookup code
                
                $table->decimal('gst_percent', 5, 2)->default(0);
                $table->decimal('gst_amount', 12, 2)->default(0);
                $table->decimal('grand_total', 12, 2)->default(0);
                
                $table->string('status')->default('Booked');
                $table->string('deliver_status')->nullable();
                $table->decimal('amount_paid', 12, 2)->default(0);
                $table->decimal('discount', 12, 2)->default(0);

                // Delivery details
                $table->timestamp('delivered_at')->nullable();
                $table->foreignId('delivered_branch_id')->nullable()->constrained('branches');
                $table->string('delivered_branch_name')->nullable();
                $table->string('receiver_name')->nullable();
                $table->string('delivery_proof')->nullable();
                $table->string('payment_method')->nullable();

                // Inward details
                $table->timestamp('inward_at')->nullable();
                $table->foreignId('inward_branch_id')->nullable()->constrained('branches');
                $table->string('inward_branch_name')->nullable();
                $table->string('inward_by')->nullable();

                // Clerk info
                $table->unsignedBigInteger('clerk_id')->nullable();
                $table->string('clerk_name')->nullable();

                // Ack Bundle
                $table->unsignedBigInteger('ack_bundle_id')->nullable();
                
                $table->text('remarks')->nullable();
                
                $table->timestamps();
                $table->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('waybills');
    }
};
