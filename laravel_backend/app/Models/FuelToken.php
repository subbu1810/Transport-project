<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FuelToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'token_number',
        'token_date',
        'bunk_id',
        'vehicle_id',
        'driver_id',
        'trip_sheet_id',
        'quantity',
        'rate',
        'amount',
        'remarks',
        'status',
        'branch_id',
        'created_by',
        'fuel_bill_id'
    ];

    public function bunk()
    {
        return $this->belongsTo(Bunk::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function tripSheet()
    {
        return $this->belongsTo(TripSheet::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function fuelBill()
    {
        return $this->belongsTo(FuelBill::class);
    }
}
