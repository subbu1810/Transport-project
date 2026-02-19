<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transport extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'transports';

    protected $fillable = [
        'transport_code',
        'transport_name',
        'gst_number',
        'address',
        'mobile',
        'bank_name',
        'branch_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public static function createRules(): array
    {
        return [
            'transport_code' => 'required|string|max:20|unique:transports,transport_code',
            'transport_name' => 'required|string|max:100',
            'gst_number' => 'nullable|string|max:20',
            'address' => 'required|string|max:255',
            'mobile' => 'nullable|string|max:20',
            'bank_name' => 'nullable|string|max:100',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'is_active' => 'nullable|boolean',
        ];
    }

    public static function updateRules(int $id): array
    {
        return [
            'transport_code' => "nullable|string|max:20|unique:transports,transport_code,{$id}",
            'transport_name' => 'nullable|string|max:100',
            'gst_number' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'mobile' => 'nullable|string|max:20',
            'bank_name' => 'nullable|string|max:100',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'is_active' => 'nullable|boolean',
        ];
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function getTransportNameAttribute($value)
    {
        return strtoupper($value);
    }

    public function setTransportNameAttribute($value)
    {
        $this->attributes['transport_name'] = strtoupper($value);
    }

    public function getTransportCodeAttribute($value)
    {
        return strtoupper($value);
    }

    public function setTransportCodeAttribute($value)
    {
        $this->attributes['transport_code'] = strtoupper($value);
    }
}
