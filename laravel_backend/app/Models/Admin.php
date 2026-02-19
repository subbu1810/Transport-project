<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Hash;

class Admin extends Model
{
    use HasFactory, SoftDeletes;
    protected $table = 'admins';

    protected $fillable = [
        'name',
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
        'is_active',
    ];

    protected $hidden = [
        'password',
    ];

    // Auto-hash password
    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = Hash::make($value);
    }
}
