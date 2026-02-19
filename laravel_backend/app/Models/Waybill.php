<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Waybill extends Model
{
    use HasFactory, SoftDeletes;

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
        'roading_clerk',
        'remarks',
        'delivery_proof',
        'receiver_name',
        'delivered_at',
        'delivered_branch_name',
    ];



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
}
