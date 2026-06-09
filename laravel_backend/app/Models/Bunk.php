<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bunk extends Model
{
    use HasFactory;

    protected $table = 'bunks';

    protected $fillable = [
        'bunk_remarks',
        'account_number',
        'ifsc_code',
        'bank_name',
        'bank_branch',
        'upi_id',
        'opening_balance',
        'branch_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function fuelTokens()
    {
        return $this->hasMany(FuelToken::class);
    }

    public function fuelBills()
    {
        return $this->hasMany(FuelBill::class);
    }

    public function fuelPayments()
    {
        return $this->hasMany(FuelPayment::class);
    }

    public static function createRules(): array
    {
        return [
            'bunk_name' => 'required|string|max:100',
            'bunk_address' => 'required|string|max:255',
            'tin_number' => 'nullable|string|max:20',
            'bunk_land' => 'nullable|string|max:20',
            'bunk_mobile' => 'nullable|string|max:20',
            'bunk_remarks' => 'nullable|string|max:500',
            'branch_id' => 'nullable|exists:branches,id',
            'is_active' => 'nullable|boolean',
        ];
    }

    public static function updateRules(int $id): array
    {
        return [
            'bunk_name' => 'nullable|string|max:100',
            'bunk_address' => 'nullable|string|max:255',
            'tin_number' => 'nullable|string|max:20',
            'bunk_land' => 'nullable|string|max:20',
            'bunk_mobile' => 'nullable|string|max:20',
            'bunk_remarks' => 'nullable|string|max:500',
            'branch_id' => 'nullable|exists:branches,id',
            'is_active' => 'nullable|boolean',
        ];
    }
}
