<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsignorReceipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'receipt_no',
        'branch_id',
        'consignor_id',
        'transaction_date',
        'total_amount',
        'created_by',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function consignor()
    {
        return $this->belongsTo(Consignor::class);
    }

    public function creator()
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(ConsignorReceiptWaybill::class);
    }

    public function waybills()
    {
        return $this->belongsToMany(Waybill::class, 'consignor_receipt_waybills')
                    ->withPivot('amount')
                    ->withTimestamps();
    }
}
