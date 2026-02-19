<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bunk extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'bunks';

    protected $fillable = [
        'bunk_name',
        'bunk_address',
        'tin_number',
        'bunk_land',
        'bunk_mobile',
        'bunk_remarks',
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
            'bunk_name' => 'required|string|max:100',
            'bunk_address' => 'required|string|max:255',
            'tin_number' => 'nullable|string|max:20',
            'bunk_land' => 'nullable|string|max:20',
            'bunk_mobile' => 'nullable|string|max:20',
            'bunk_remarks' => 'nullable|string|max:500',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'is_active' => 'nullable|boolean',
        ];
    }

    public static function updateRules(int $id): array
    {
        return [
            'bunk_name' => 'nullable|string|max:100',
            'bunk_address' => 'nullable|string|max:255',
            'tin_number' => 'nullable|string|max:20',
            'bunk_land' => 'nullable|string|max:20',
            'bunk_mobile' => 'nullable|string|max:20',
            'bunk_remarks' => 'nullable|string|max:500',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'is_active' => 'nullable|boolean',
        ];
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function getBunkNameAttribute($value)
    {
        return strtoupper($value);
    }

    public function setBunkNameAttribute($value)
    {
        $this->attributes['bunk_name'] = strtoupper($value);
    }
}
