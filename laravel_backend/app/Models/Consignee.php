<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Consignee extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'consignees';

    protected $fillable = [
        'name',
        'code',
        'gst_number',
        'address',
        'land_number',
        'mobile_number',
        'destination_id',
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
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:20|unique:consignees,code',
            'gst_number' => 'nullable|string|max:20|unique:consignees,gst_number',
            'address' => 'required|string|max:255',
            'land_number' => 'nullable|string|max:20',
            'mobile_number' => 'required|string|max:20',
            'destination_id' => 'required|integer|exists:destinations,id',
            'is_active' => 'nullable|boolean',
        ];
    }

    public static function updateRules(int $id): array
    {
        return [
            'name' => 'nullable|string|max:100',
            'code' => "nullable|string|max:20|unique:consignees,code,{$id}",
            'gst_number' => "nullable|string|max:20|unique:consignees,gst_number,{$id}",
            'address' => 'nullable|string|max:255',
            'land_number' => 'nullable|string|max:20',
            'mobile_number' => 'nullable|string|max:20',
            'destination_id' => 'nullable|integer|exists:destinations,id',
            'is_active' => 'nullable|boolean',
        ];
    }

    public function destination()
    {
        return $this->belongsTo(Destination::class);
    }

    public function taluk()
    {
        return $this->hasOneThrough(Taluk::class, Destination::class, 'id', 'id', 'destination_id', 'taluk_id');
    }

    public function district()
    {
        return $this->hasOneThrough(District::class, [Destination::class, Taluk::class], ['id', 'taluk_id'], ['destination_id', 'district_id']);
    }

    public function state()
    {
        return $this->hasOneThrough(State::class, [Destination::class, Taluk::class, District::class], ['id', 'taluk_id', 'district_id'], ['destination_id', 'taluk_id', 'state_id']);
    }
}
