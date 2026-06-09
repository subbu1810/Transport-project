<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rate extends Model
{
    use HasFactory;

    protected $table = 'rates';

    protected $fillable = [
        'consignor_id',
        'destination_id',
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
    ];

    public static function createRules(): array
    {
        return [
            'consignor_id' => 'required|exists:consignors,id',
            'destination_id' => 'required|exists:destinations,id',
            'article_type' => 'required|string|max:50',
            'freight_charges' => 'required|numeric|min:0',
            'handling_charges' => 'required|numeric|min:0',
            'dd_charges' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ];
    }

    public static function updateRules(int $id): array
    {
        return [
            'consignor_id' => 'sometimes|exists:consignors,id',
            'destination_id' => 'sometimes|exists:destinations,id',
            'article_type' => 'sometimes|string|max:50',
            'freight_charges' => 'sometimes|numeric|min:0',
            'handling_charges' => 'sometimes|numeric|min:0',
            'dd_charges' => 'sometimes|numeric|min:0',
            'is_active' => 'boolean',
        ];
    }

    public function consignor()
    {
        return $this->belongsTo(Consignor::class);
    }

    public function destination()
    {
        return $this->belongsTo(Destination::class);
    }
}
