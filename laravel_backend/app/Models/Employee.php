<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'department',
        'designation',
        'joining_date',
        'salary',
        'is_active',
    ];

    protected $casts = [
        'joining_date' => 'date',
        'salary' => 'decimal:2',
        'is_active' => 'boolean',
    ];
}
