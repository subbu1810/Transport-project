<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Consignor extends Model
{
    use HasFactory;

    protected $table = 'consignors';

    protected $fillable = [
        'name',
        'code',
        'tin_number',
        'gst_number',
        'address',
        'district_id',
        'taluk_id',
        'destination_id',
        'pin_code',
        'mobile_no',
        'land_no',
        'freight_account',
        'service_tax',
        'stationary_charges',
        'remarks',
        'branch_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public static function createRules(): array
    {
        return [
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:20|unique:consignors,code',
            'tin_number' => 'nullable|string|max:20|unique:consignors,tin_number',
            'gst_number' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'district_id' => 'nullable|integer|exists:districts,id',
            'taluk_id' => 'nullable|integer|exists:taluks,id',
            'destination_id' => 'nullable|integer|exists:destinations,id',
            'pin_code' => 'nullable|string|max:20',
            'mobile_no' => 'nullable|string|max:20',
            'land_no' => 'nullable|string|max:20',
            'freight_account' => 'nullable|string|max:50',
            'service_tax' => 'nullable|string|max:50',
            'stationary_charges' => 'nullable|numeric',
            'remarks' => 'nullable|string',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'is_active' => 'nullable|boolean',
        ];
    }

    public static function updateRules(int $id): array
    {
        return [
            'name' => 'nullable|string|max:100',
            'code' => "nullable|string|max:20|unique:consignors,code,{$id}",
            'tin_number' => "nullable|string|max:20|unique:consignors,tin_number,{$id}",
            'gst_number' => "nullable|string|max:20",
            'address' => 'nullable|string',
            'district_id' => 'nullable|integer|exists:districts,id',
            'taluk_id' => 'nullable|integer|exists:taluks,id',
            'destination_id' => 'nullable|integer|exists:destinations,id',
            'pin_code' => 'nullable|string|max:20',
            'mobile_no' => 'nullable|string|max:20',
            'land_no' => 'nullable|string|max:20',
            'freight_account' => 'nullable|string|max:50',
            'service_tax' => 'nullable|string|max:50',
            'stationary_charges' => 'nullable|numeric',
            'remarks' => 'nullable|string',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'is_active' => 'nullable|boolean',
        ];
    }

    public function district()
    {
        return $this->belongsTo(District::class);
    }

    public function taluk()
    {
        return $this->belongsTo(Taluk::class);
    }

    public function destination()
    {
        return $this->belongsTo(Destination::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
