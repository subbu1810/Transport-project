<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WaybillTransit extends Model
{
    protected $fillable = [
        'waybill_id',
        'branch_id',
        'trip_sheet_id',
        'status',
        'remarks',
    ];

    public function waybill()
    {
        return $this->belongsTo(Waybill::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function tripSheet()
    {
        return $this->belongsTo(TripSheet::class);
    }
}
