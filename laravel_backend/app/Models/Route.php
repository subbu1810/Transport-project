<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Route extends Model
{
    protected $fillable = ['route_name', 'origin_branch_id', 'destination_taluk_id', 'status'];
    protected $appends = ['destination_branch_id'];
    
    public function stops(): HasMany
    {
        return $this->hasMany(RouteStop::class)->orderBy('stop_sequence');
    }

    public function originBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'origin_branch_id');
    }

    public function destinationTaluk(): BelongsTo
    {
        return $this->belongsTo(Taluk::class, 'destination_taluk_id');
    }

    // Backward compatibility aliases
    public function destinationBranch(): BelongsTo
    {
        return $this->belongsTo(Taluk::class, 'destination_taluk_id');
    }

    public function getDestinationBranchIdAttribute()
    {
        return $this->destination_taluk_id;
    }

    public function tripSheets(): HasMany
    {
        return $this->hasMany(TripSheet::class);
    }
}
