<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaybillDeliveryAttempt extends Model
{
    use HasFactory;

    protected $table = 'waybill_delivery_attempts';

    protected $fillable = [
        'gc_number',
        'status',
        'reason',
        'branch_id',
        'branch_name',
    ];

    public function waybill()
    {
        return $this->belongsTo(Waybill::class, 'gc_number', 'gc_number');
    }
}
