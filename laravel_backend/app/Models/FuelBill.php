<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FuelBill extends Model
{
    use HasFactory;

    protected $fillable = [
        'bill_number',
        'bill_date',
        'bunk_id',
        'total_amount',
        'paid_amount',
        'balance_amount',
        'remarks',
        'status',
        'branch_id',
        'created_by'
    ];

    public function bunk()
    {
        return $this->belongsTo(Bunk::class);
    }

    public function tokens()
    {
        return $this->hasMany(FuelToken::class);
    }

    public function payments()
    {
        return $this->hasMany(FuelPayment::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
