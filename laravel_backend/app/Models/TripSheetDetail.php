<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TripSheetDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'trip_sheet_id',
        'waybill_id'
    ];

    public function tripSheet()
    {
        return $this->belongsTo(TripSheet::class);
    }

    public function waybill()
    {
        return $this->belongsTo(Waybill::class);
    }
}
