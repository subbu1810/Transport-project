<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    protected static function booted()
    {
        static::deleting(function ($vehicle) {
            $tripCount = \DB::table('trip_sheets')->where('vehicle_id', $vehicle->id)->count();
            if ($tripCount > 0) {
                throw new \Exception("Cannot delete: This vehicle is associated with {$tripCount} trip sheets.");
            }
        });
    }

    protected $table = 'vehicles';

    protected $fillable = [
        'vehicle_number',
        'owner_id',
        'owner_name',
        'rate_per_km',
        'phone',
        'insurance_upto',
        'vehicle_status',
        'rc_valid_from',
        'rc_valid_to',
        'branch_id',
        'is_active',
    ];

    protected $casts = [
        'insurance_upto' => 'date',
        'rc_valid_from' => 'date',
        'rc_valid_to' => 'date',
        'is_active' => 'boolean',
        'rate_per_km' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public static function createRules(): array
    {
        return [
            'vehicle_number' => 'required|string|max:20|unique:vehicles,vehicle_number',
            'owner_name' => 'required|string|max:100',
            'rate_per_km' => 'nullable|numeric|min:0',
            'phone' => 'nullable|string|max:20',
            'insurance_upto' => 'nullable|date',
            'vehicle_status' => 'required|string|max:20',
            'rc_valid_from' => 'nullable|date',
            'rc_valid_to' => 'nullable|date|after_or_equal:rc_valid_from',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'is_active' => 'nullable|boolean',
        ];
    }

    public static function updateRules(int $id): array
    {
        return [
            'vehicle_number' => "nullable|string|max:20|unique:vehicles,vehicle_number,{$id}",
            'owner_name' => 'nullable|string|max:100',
            'rate_per_km' => 'nullable|numeric|min:0',
            'phone' => 'nullable|string|max:20',
            'insurance_upto' => 'nullable|date',
            'vehicle_status' => 'nullable|string|max:20',
            'rc_valid_from' => 'nullable|date',
            'rc_valid_to' => 'nullable|date|after_or_equal:rc_valid_from',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'is_active' => 'nullable|boolean',
        ];
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function isInsuranceExpired(): bool
    {
        return $this->insurance_upto && $this->insurance_upto->isPast();
    }

    public function isRCExpired(): bool
    {
        return $this->rc_valid_to && $this->rc_valid_to->isPast();
    }

    public function getInsuranceStatusAttribute(): string
    {
        if (!$this->insurance_upto) return 'Unknown';
        return $this->isInsuranceExpired() ? 'Expired' : 'Valid';
    }

    public function getRCStatusAttribute(): string
    {
        if (!$this->rc_valid_to) return 'Unknown';
        return $this->isRCExpired() ? 'Expired' : 'Valid';
    }

    public function getVehicleStatusDisplayAttribute(): string
    {
        return match($this->vehicle_status) {
            'AVAILABLE' => 'Available',
            'NOT_AVAILABLE' => 'Not Available',
            'MAINTENANCE' => 'Under Maintenance',
            'OUT_OF_SERVICE' => 'Out of Service',
            default => $this->vehicle_status,
        };
    }

    public function lastTrip()
    {
        return $this->hasOne(TripSheet::class, 'vehicle_id')->latestOfMany();
    }
}
