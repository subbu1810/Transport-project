<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BranchDestinationMapping extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'destination_id',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function destination()
    {
        return $this->belongsTo(Destination::class);
    }
}
