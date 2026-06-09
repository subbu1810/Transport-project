<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaybillPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'waybill_id',
        'paid_amount',
        'discount',
        'payment_date',
        'mode_of_pay',
        'receipt_no',
        'remarks',
        'branch_id',
        'created_by',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'paid_amount' => 'decimal:2',
        'discount' => 'decimal:2',
    ];

    public function waybill()
    {
        return $this->belongsTo(Waybill::class);
    }

    public function creator()
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }
}
