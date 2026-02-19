<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Destination extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'destinations';

    protected $fillable = [
        'taluk_id',
        'city_name',
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
            'taluk_id' => 'required|integer|exists:taluks,id',
            'city_name' => 'required|string|max:100',
            'is_active' => 'nullable|boolean',
        ];
    }

    public static function updateRules(int $id): array
    {
        return [
            'taluk_id' => 'nullable|integer|exists:taluks,id',
            'city_name' => 'nullable|string|max:100',
            'is_active' => 'nullable|boolean',
        ];
    }

    public function taluk()
    {
        return $this->belongsTo(Taluk::class);
    }

    public function district()
    {
        return $this->hasOneThrough(District::class, Taluk::class, 'id', 'id', 'taluk_id', 'district_id');
    }

    public function state()
    {
        return $this->hasOneThrough(State::class, [Taluk::class, District::class], ['id', 'district_id'], ['taluk_id', 'state_id']);
    }

    public function branchMappings()
    {
        return $this->hasMany(BranchDestinationMapping::class);
    }
}
