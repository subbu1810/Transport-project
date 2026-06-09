<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OwnerSettlement extends Model
{
    protected $fillable = [
        'owner_id',
        'settlement_number',
        'from_date',
        'to_date',
        'total_earnings',
        'total_advances',
        'other_deductions',
        'driver_pending_deduction',
        'net_payable',
        'payment_date',
        'payment_method',
        'payment_reference',
        'status',
        'remarks',
    ];

    public function owner()
    {
        return $this->belongsTo(VehicleOwner::class, 'owner_id');
    }

    public function tripSheets()
    {
        return $this->hasMany(TripSheet::class, 'settlement_id');
    }
}
