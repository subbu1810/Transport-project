<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DayBookClosing extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'closing_date',
        'opening_balance',
        'credit_total',
        'debit_total',
        'closing_balance',
        'remarks',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
