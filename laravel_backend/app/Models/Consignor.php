<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Consignor extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'consignors';

    protected $fillable = [
        'name',
        'code',
        'tin_number',
        'gst_number',
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
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:20|unique:consignors,code',
            'tin_number' => 'nullable|string|max:20|unique:consignors,tin_number',
            'gst_number' => 'nullable|string|max:20|unique:consignors,gst_number',
            'branch_id' => 'required|integer|exists:branches,id',
            'is_active' => 'nullable|boolean',
        ];
    }

    public static function updateRules(int $id): array
    {
        return [
            'name' => 'nullable|string|max:100',
            'code' => "nullable|string|max:20|unique:consignors,code,{$id}",
            'tin_number' => "nullable|string|max:20|unique:consignors,tin_number,{$id}",
            'gst_number' => "nullable|string|max:20|unique:consignors,gst_number,{$id}",
            'branch_id' => 'nullable|integer|exists:branches,id',
            'is_active' => 'nullable|boolean',
        ];
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
