<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RouteStop extends Model
{
    protected $table = 'route_stops';
    protected $fillable = ['route_id', 'taluk_id', 'stop_sequence'];
    protected $appends = ['branch_id'];

    public function route(): BelongsTo
    {
        return $this->belongsTo(Route::class);
    }

    public function taluk(): BelongsTo
    {
        return $this->belongsTo(Taluk::class, 'taluk_id');
    }

    // Backward compatibility for legacy branch-based reports
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Taluk::class, 'taluk_id');
    }

    public function getBranchIdAttribute()
    {
        return $this->taluk_id;
    }
}
