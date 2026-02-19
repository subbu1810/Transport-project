<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TripSheet extends Model
{
    use HasFactory;

    protected $fillable = [
        'trip_number',
        'trip_date',
        'vehicle_id',
        'driver_id',
        'owner_name',
        'dispatch_date',
        'dispatch_branch_id',
        'destination_branch_id',
        'advance_amount',
        'lr_number',
        'cr_number',
        'indent_number',
        'trip_remarks',
        'status',
        'ack_date',
        'ack_remarks',
        'total_freight',
        'total_collection',
        'less_paid_driver',
        'balance_at_office',
        'total_kms',
        'verification_date',
        'verified_by',
        'created_by'
    ];

    protected $casts = [
        'advance_amount' => 'float',
        'total_freight' => 'float',
        'total_collection' => 'float',
        'less_paid_driver' => 'float',
        'balance_at_office' => 'float',
        'total_kms' => 'float',
        'trip_date' => 'date',
        'dispatch_date' => 'date',
        'ack_date' => 'date',
        'verification_date' => 'date',
    ];

    public function verifier()
    {
        return $this->belongsTo(Admin::class, 'verified_by');
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function dispatchBranch()
    {
        return $this->belongsTo(Branch::class, 'dispatch_branch_id');
    }

    public function destinationBranch()
    {
        return $this->belongsTo(Branch::class, 'destination_branch_id');
    }

    public function creator()
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }

    public function details()
    {
        return $this->hasMany(TripSheetDetail::class);
    }

    public function waybills()
    {
        return $this->belongsToMany(Waybill::class, 'trip_sheet_details', 'trip_sheet_id', 'waybill_id');
    }
}
