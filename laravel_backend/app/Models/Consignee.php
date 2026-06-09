<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Consignee extends Model
{
    use HasFactory;

    protected $table = 'consignees';

    protected $fillable = [
        'name',
        'code',
        'gst_number',
        'address',
        'land_number',
        'mobile_number',
        'destination_id',
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
            'code' => 'nullable|string|max:20|unique:consignees,code',
            'gst_number' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'land_number' => 'nullable|string|max:20',
            'mobile_number' => 'nullable|string|max:20',
            'destination_id' => 'required|integer|exists:destinations,id',
            'branch_id' => 'required|integer|exists:branches,id',
            'is_active' => 'nullable|boolean',
        ];
    }

    public static function updateRules(int $id): array
    {
        return [
            'name' => 'nullable|string|max:100',
            'code' => "nullable|string|max:20|unique:consignees,code,{$id}",
            'gst_number' => "nullable|string|max:20",
            'address' => 'nullable|string|max:255',
            'land_number' => 'nullable|string|max:20',
            'mobile_number' => 'nullable|string|max:20',
            'destination_id' => 'nullable|integer|exists:destinations,id',
            'branch_id' => 'required|integer|exists:branches,id',
            'is_active' => 'nullable|boolean',
        ];
    }

    public function destination()
    {
        return $this->belongsTo(Destination::class);
    }

    public function taluk()
    {
        return $this->destination()->get()->first()?->taluk();
    }

    public function district()
    {
        return $this->taluk()?->get()->first()?->district();
    }

    public function state()
    {
        return $this->district()?->get()->first()?->state();
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
