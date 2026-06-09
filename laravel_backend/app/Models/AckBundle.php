<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AckBundle extends Model
{
    use HasFactory;

    protected $fillable = [
        'bundle_number',
        'bundle_date',
        'branch_id',
        'status',
        'remarks',
        'created_by',
    ];

    protected $casts = [
        'bundle_date' => 'date',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function waybills()
    {
        return $this->hasMany(Waybill::class);
    }

    public function creator()
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }
}
