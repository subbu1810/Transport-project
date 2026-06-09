<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Waybill extends Model
{
    use HasFactory;

    protected static function booted()
    {
        static::deleting(function ($waybill) {
            // 1. Purge Image File
            if ($waybill->delivery_proof) {
                \App\Helpers\ImageHelper::purge($waybill->delivery_proof);
            }

            // 2. Delete Delivery Attempts (These use gc_number, not ID)
            \Illuminate\Support\Facades\DB::table('waybill_delivery_attempts')
                ->where('gc_number', $waybill->gc_number)
                ->delete();

            // 3. Clear Trip Sheet Associations (Manually since DB doesn't cascade)
            \Illuminate\Support\Facades\DB::table('trip_sheet_details')
                ->where('waybill_id', $waybill->id)
                ->delete();
                
            // NOTE: WaybillArticles and WaybillPayments are handled by Database level Cascade Delete
        });
    }

    protected $fillable = [
        'gc_number',
        'bill_date',
        'origin_branch_id',
        'destination_id',
        'consignor_id',
        'consignee_id',
        'article_desc',
        'total_articles',
        'freight_amount',
        'dd_charges',
        'handling_charges',
        'stationary_charges',
        'total_amount',
        'invoice_no',
        'declared_value',
        'eway_bill_no',
        'tax_payable_by',
        'account_type',
        'gst_percent',
        'gst_amount',
        'grand_total',
        'status',
        'deliver_status',
        'amount_paid',
        'delivered_branch_id',
        'remarks',
        'delivery_proof',
        'receiver_name',
        'delivered_at',
        'delivered_branch_name',
        'payment_method',
        'inward_branch_id',
        'inward_at',
        'inward_by',
        'discount',
        'ack_bundle_id',
        'created_by',
        'booking_clerk',
    ];

    protected $appends = ['actual_weight', 'charged_weight'];

    public function getActualWeightAttribute()
    {
        return $this->articles->sum('actual_weight');
    }

    public function getChargedWeightAttribute()
    {
        return $this->articles->sum('charged_weight');
    }

    public function ackBundle()
    {
        return $this->belongsTo(AckBundle::class, 'ack_bundle_id');
    }

    public function articles()
    {
        return $this->hasMany(WaybillArticle::class);
    }

    public function originBranch()
    {
        return $this->belongsTo(Branch::class, 'origin_branch_id');
    }

    public function deliveredBranch()
    {
        return $this->belongsTo(Branch::class, 'delivered_branch_id');
    }

    public function inwardBranch()
    {
        return $this->belongsTo(Branch::class, 'inward_branch_id');
    }

    public function inwardBy()
    {
        return $this->belongsTo(Admin::class, 'inward_by');
    }

    public function destination()
    {
        return $this->belongsTo(Destination::class);
    }

    public function consignor()
    {
        return $this->belongsTo(Consignor::class);
    }

    public function consignee()
    {
        return $this->belongsTo(Consignee::class);
    }

    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }

    public function tripSheets()
    {
        return $this->belongsToMany(TripSheet::class, 'trip_sheet_details', 'waybill_id', 'trip_sheet_id');
    }

    public function payments()
    {
        return $this->hasMany(WaybillPayment::class);
    }

    public function deliveryAttempts()
    {
        return $this->hasMany(WaybillDeliveryAttempt::class, 'gc_number', 'gc_number')->orderBy('created_at', 'desc');
    }

    public function consignorReceipts()
    {
        return $this->belongsToMany(ConsignorReceipt::class, 'consignor_receipt_waybills');
    }
}
