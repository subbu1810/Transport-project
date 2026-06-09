<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $table = 'roles';

    protected $fillable = [
        'name',
        'description',
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
            'name' => 'required|string|max:50|unique:roles,name',
            'description' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ];
    }

    public static function updateRules(int $id): array
    {
        return [
            'name' => "nullable|string|max:50|unique:roles,name,{$id}",
            'description' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ];
    }
}
