<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Driver extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'drivers';

    protected $fillable = [
        'name',
        'dl_number',
        'dl_type',
        'phone',
        'date_of_birth',
        'date_of_issue',
        'valid_till',
        'address',
        'branch_id',
        'is_active',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'date_of_issue' => 'date',
        'valid_till' => 'date',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public static function createRules(): array
    {
        return [
            'name' => 'required|string|max:100',
            'dl_number' => 'required|string|max:20|unique:drivers,dl_number',
            'dl_type' => 'required|string|max:10',
            'phone' => 'required|string|max:20',
            'date_of_birth' => 'nullable|date',
            'date_of_issue' => 'nullable|date',
            'valid_till' => 'nullable|date|after:date_of_issue',
            'address' => 'nullable|string|max:255',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'is_active' => 'nullable|boolean',
        ];
    }

    public static function updateRules(int $id): array
    {
        return [
            'name' => 'nullable|string|max:100',
            'dl_number' => "nullable|string|max:20|unique:drivers,dl_number,{$id}",
            'dl_type' => 'nullable|string|max:10',
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'date_of_issue' => 'nullable|date',
            'valid_till' => 'nullable|date|after:date_of_issue',
            'address' => 'nullable|string|max:255',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'is_active' => 'nullable|boolean',
        ];
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function getAgeAttribute()
    {
        return $this->date_of_birth ? $this->date_of_birth->age : null;
    }

    public function isLicenseExpired(): bool
    {
        return $this->valid_till && $this->valid_till->isPast();
    }

    public function getLicenseStatusAttribute(): string
    {
        if (!$this->valid_till) return 'Unknown';
        return $this->isLicenseExpired() ? 'Expired' : 'Valid';
    }
}
