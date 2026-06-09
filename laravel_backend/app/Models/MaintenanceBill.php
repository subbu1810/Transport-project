<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaintenanceBill extends Model
{
    use HasFactory;

    protected $fillable = [
        'transport_id',
        'branch_id',
        'bill_month',
        'bill_year',
        'gc_count',
        'rate',
        'total_amount',
        'status',
        'razorpay_order_id',
        'razorpay_payment_id',
        'paid_at',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    protected $casts = [
        'paid_at' => 'datetime',
        'rate' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function transport()
    {
        return $this->belongsTo(Transport::class);
    }
}
