<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class State extends Model
{
    use HasFactory;

    protected $table = 'states';

    protected $fillable = [
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
            'name' => 'required|string|max:100|unique:states,name',
            'code' => 'required|string|max:10|unique:states,code',
            'is_active' => 'nullable|boolean',
        ];
    }

    public static function updateRules(int $id): array
    {
        return [
            'name' => "nullable|string|max:100|unique:states,name,{$id}",
            'code' => "nullable|string|max:10|unique:states,code,{$id}",
            'is_active' => 'nullable|boolean',
        ];
    }
}
