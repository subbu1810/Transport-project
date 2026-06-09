<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TripSheet extends Model
{
    use HasFactory;

    protected $fillable = [
        'trip_number',
        'trip_type',
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
        'alert_branch',
        'mode_of_pay',
        'status',
        'ack_date',
        'ack_remarks',
        'ack_branch_id',
        'ack_by',
        'ack_timestamp',
        'total_freight',
        'total_collection',
        'less_paid_driver',
        'balance_at_office',
        'total_kms',
        'opening_km',
        'closing_km',
        'rate_per_km',
        'is_settled',
        'settlement_id',
        'verification_date',
        'verified_by',
        'created_by',
        'route_id'
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

    public function alertBranchData()
    {
        return $this->belongsTo(Branch::class, 'alert_branch');
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

    /**
     * Get the owner name, falling back to the vehicle's owner name if not set.
     */
    public function getOwnerNameAttribute($value)
    {
        return $value ?: ($this->vehicle ? $this->vehicle->owner_name : null);
    }

    public function ackBranch()
    {
        return $this->belongsTo(Branch::class, 'ack_branch_id');
    }

    public function ackByAdmin()
    {
        return $this->belongsTo(Admin::class, 'ack_by');
    }

    public function route()
    {
        return $this->belongsTo(Route::class);
    }
}
