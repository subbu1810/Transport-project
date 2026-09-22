<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EwayBillConfiguration extends Model
{
    use HasFactory;

    protected $fillable = [
        'transport_id',
        'provider',
        'credentials',
        'is_active',
    ];

    protected $casts = [
        'credentials' => 'encrypted:array',
        'is_active' => 'boolean',
    ];

    public function transport()
    {
        return $this->belongsTo(Transport::class);
    }
}
