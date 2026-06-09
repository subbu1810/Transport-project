<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Taluk extends Model
{
    use HasFactory;

    protected $table = 'taluks';

    protected $fillable = [
        'district_id',
        'name',
        'code',
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
            'district_id' => 'required|integer|exists:districts,id',
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
        ];
    }

    public static function updateRules(int $id): array
    {
        return [
            'district_id' => 'nullable|integer|exists:districts,id',
            'name' => 'nullable|string|max:100',
            'code' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
        ];
    }

    protected $appends = ['branch_name'];

    public function district()
    {
        return $this->belongsTo(District::class);
    }

    public function state()
    {
        return $this->hasOneThrough(State::class, District::class, 'id', 'id', 'district_id', 'state_id');
    }

    public function getBranchNameAttribute()
    {
        return $this->name;
    }
}
