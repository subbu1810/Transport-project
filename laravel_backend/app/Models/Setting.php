<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected static function booted()
    {
        static::updated(function ($setting) {
            // If the value changed and it was a file path, purge the old one
            if ($setting->isDirty('value') && in_array($setting->key, ['logo_path', 'upi_qr_path'])) {
                $oldValue = $setting->getOriginal('value');
                if ($oldValue) {
                    \App\Helpers\ImageHelper::purge($oldValue);
                }
            }
        });

        static::deleted(function ($setting) {
            if (in_array($setting->key, ['logo_path', 'upi_qr_path']) && $setting->value) {
                \App\Helpers\ImageHelper::purge($setting->value);
            }
        });
    }

    protected $fillable = [
        'key',
        'value'
    ];
}
