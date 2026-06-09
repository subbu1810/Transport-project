<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScreenAssignment extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'admin_id',
        'screen_path',
        'screen_name',
        'category',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function admin()
    {
        return $this->belongsTo(Admin::class);
    }
}
