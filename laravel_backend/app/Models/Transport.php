<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transport extends Model
{
    use HasFactory;

    protected static function booted()
    {
        static::deleted(function ($transport) {
            if ($transport->logo_path) {
                \App\Helpers\ImageHelper::purge($transport->logo_path);
            }
        });
    }

    protected $table = 'transports';

    protected $fillable = [
        'transport_code',
        'transport_name',
        'gst_number',
        'address',
        'mobile',
        'phone',
        'email',
        'website',
        'bank_name',
        'branch_id',
        'is_active',
        'logo_path',
        'maintenance_rate',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
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
            'maintenance_rate' => 'nullable|numeric|min:0',
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
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'website' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:100',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'is_active' => 'nullable|boolean',
            'maintenance_rate' => 'nullable|numeric|min:0',
        ];
    }

    public function getLogoUrlAttribute(): ?string
    {
        if ($this->logo_path) {
            return url('storage/' . $this->logo_path);
        }
        return null;
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
