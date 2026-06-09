<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

class Admin extends Model
{
    use HasFactory;
    protected $table = 'admins';

    protected $fillable = [
        'name',
        'full_name',
        'phone_number',
        'email',
        'address',
        'role',
        'password',
        'branch_code',
        'branch_name',
        'branch_address',
        'branch_email',
        'branch_phone',
        'transport_name',
        'transport_address',
        'transport_phone',
        'transport_id',
        'consignor_id',
        'is_active',
        'password_string',
    ];

    protected $hidden = [
        'password',
    ];

    // Auto-hash password
    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = Hash::make($value);
        $this->attributes['password_string'] = $value;
    }

    public function transport()
    {
        return $this->belongsTo(Transport::class);
    }

    public function consignor()
    {
        return $this->belongsTo(Consignor::class);
    }
}
