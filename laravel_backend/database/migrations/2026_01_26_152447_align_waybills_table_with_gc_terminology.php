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
        // First ensure the table exists (though it should)
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
                $table->string('tax_payable_by')->nullable();
                $table->string('account_type')->nullable();
                $table->decimal('gst_percent', 5, 2)->default(0);
                $table->decimal('gst_amount', 12, 2)->default(0);
                $table->decimal('grand_total', 12, 2)->default(0);
                $table->string('status')->default('PENDING');
                $table->string('deliver_status')->default('PENDING');
                $table->decimal('amount_paid', 12, 2)->default(0);
                $table->string('roading_clerk')->nullable();
                $table->text('remarks')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        } else {
            Schema::table('waybills', function (Blueprint $table) {
                if (Schema::hasColumn('waybills', 'waybill_number')) {
                    $table->renameColumn('waybill_number', 'gc_number');
                }
                if (!Schema::hasColumn('waybills', 'status')) {
                    $table->string('status')->default('PENDING')->after('grand_total');
                }
                if (!Schema::hasColumn('waybills', 'deliver_status')) {
                    $table->string('deliver_status')->default('PENDING')->after('status');
                }
                if (!Schema::hasColumn('waybills', 'amount_paid')) {
                    $table->decimal('amount_paid', 12, 2)->default(0)->after('deliver_status');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('waybills', function (Blueprint $table) {
            if (Schema::hasColumn('waybills', 'gc_number')) {
                $table->renameColumn('gc_number', 'waybill_number');
            }
            $table->dropColumn(['status', 'deliver_status', 'amount_paid']);
        });
    }
};
