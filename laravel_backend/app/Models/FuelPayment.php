<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FuelPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_number',
        'payment_date',
        'bunk_id',
        'fuel_bill_id',
        'amount',
        'mode_of_payment',
        'reference_no',
        'remarks',
        'branch_id',
        'created_by'
    ];

    public function bunk()
    {
        return $this->belongsTo(Bunk::class);
    }

    public function bill()
    {
        return $this->belongsTo(FuelBill::class, 'fuel_bill_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
