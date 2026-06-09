<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VehicleOwner extends Model
{
    protected $fillable = [
        'owner_name',
        'phone',
        'pan_number',
        'bank_name',
        'account_number',
        'ifsc_code',
        'default_rate_per_km',
        'is_active',
    ];

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class, 'owner_id');
    }

    public function settlements()
    {
        return $this->hasMany(OwnerSettlement::class, 'owner_id');
    }
}
