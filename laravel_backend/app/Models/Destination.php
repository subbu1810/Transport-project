<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Destination extends Model
{
    use HasFactory;

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
    ];

    public static function createRules(): array
    {
        return [
            'taluk_id' => 'required|integer|exists:taluks,id',
            'city_name' => 'required|string|max:100|unique:destinations,city_name,NULL,id,taluk_id,' . request()->input('taluk_id'),
            'is_active' => 'nullable|boolean',
        ];
    }

    public static function updateRules(int $id): array
    {
        return [
            'taluk_id' => 'nullable|integer|exists:taluks,id',
            'city_name' => 'nullable|string|max:100|unique:destinations,city_name,' . $id . ',id,taluk_id,' . request()->input('taluk_id'),
            'is_active' => 'nullable|boolean',
        ];
    }

    public function taluk()
    {
        return $this->belongsTo(Taluk::class);
    }

    public function district()
    {
        return $this->taluk()?->get()->first()?->district();
    }

    public function state()
    {
        return $this->district()?->get()->first()?->state();
    }

    public function branchMappings()
    {
        return $this->hasMany(BranchDestinationMapping::class);
    }
}
