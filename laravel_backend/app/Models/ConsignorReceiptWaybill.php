<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsignorReceiptWaybill extends Model
{
    use HasFactory;

    protected $fillable = [
        'consignor_receipt_id',
        'waybill_id',
        'amount',
    ];

    public function receipt()
    {
        return $this->belongsTo(ConsignorReceipt::class, 'consignor_receipt_id');
    }

    public function waybill()
    {
        return $this->belongsTo(Waybill::class);
    }
}
