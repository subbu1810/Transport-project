<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rate extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'rates';

    protected $fillable = [
        'consignor_id',
        'article_type',
        'freight_charges',
        'handling_charges',
        'dd_charges',
        'is_active',
    ];

    protected $casts = [
        'freight_charges' => 'decimal:2',
        'handling_charges' => 'decimal:2',
        'dd_charges' => 'decimal:2',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public static function createRules(): array
    {
        return [
            'consignor_id' => 'required|integer|exists:consignors,id',
            'article_type' => 'required|string|max:50',
            'freight_charges' => 'required|numeric|min:0',
            'handling_charges' => 'required|numeric|min:0',
            'dd_charges' => 'required|numeric|min:0',
            'is_active' => 'nullable|boolean',
        ];
    }

    public static function updateRules(int $id): array
    {
        return [
            'consignor_id' => 'nullable|integer|exists:consignors,id',
            'article_type' => 'nullable|string|max:50',
            'freight_charges' => 'nullable|numeric|min:0',
            'handling_charges' => 'nullable|numeric|min:0',
            'dd_charges' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean',
        ];
    }

    public function consignor()
    {
        return $this->belongsTo(Consignor::class);
    }
}
