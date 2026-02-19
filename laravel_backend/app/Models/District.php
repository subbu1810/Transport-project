<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class District extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'districts';

    protected $fillable = [
        'state_id',
        'name',
        'code',
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
            'state_id' => 'required|integer|exists:states,id',
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
        ];
    }

    public static function updateRules(int $id): array
    {
        return [
            'state_id' => 'nullable|integer|exists:states,id',
            'name' => 'nullable|string|max:100',
            'code' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
        ];
    }

    public function state()
    {
        return $this->belongsTo(State::class);
    }
}
