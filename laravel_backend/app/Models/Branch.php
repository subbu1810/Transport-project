<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Branch extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'branches';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'branch_code',
        'branch_name',
        'address',
        'city',
        'state',
        'pincode',
        'phone',
        'email',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'deleted_at',
    ];

    /**
     * Get the validation rules for creating a branch.
     *
     * @return array
     */
    public static function createRules(): array
    {
        return [
            'branch_code' => 'required|string|max:50|unique:branches,branch_code',
            'branch_name' => 'required|string|max:100',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:50',
            'state' => 'nullable|string|max:50',
            'pincode' => 'nullable|string|max:10',
            'phone' => 'nullable|string|max:20|regex:/^[0-9\-\+\(\)\s]{7,20}$/',
            'email' => 'nullable|email|max:100',
            'is_active' => 'nullable|boolean',
        ];
    }

    /**
     * Get the validation rules for updating a branch.
     *
     * @param int $id
     * @return array
     */
    public static function updateRules(int $id): array
    {
        return [
            'branch_code' => "nullable|string|max:50|unique:branches,branch_code,{$id}",
            'branch_name' => 'nullable|string|max:100',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:50',
            'state' => 'nullable|string|max:50',
            'pincode' => 'nullable|string|max:10',
            'phone' => 'nullable|string|max:20|regex:/^[0-9\-\+\(\)\s]{7,20}$/',
            'email' => 'nullable|email|max:100',
            'is_active' => 'nullable|boolean',
        ];
    }

    /**
     * Scope to get only active branches.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to search branches.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $search
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where('branch_code', 'like', "%{$search}%")
                     ->orWhere('branch_name', 'like', "%{$search}%")
                     ->orWhere('city', 'like', "%{$search}%")
                     ->orWhere('state', 'like', "%{$search}%");
    }

    /**
     * Check if branch has related records.
     *
     * @return bool
     */
    public function hasRelatedRecords(): bool
    {
        // Check only for tables that exist in the current schema
        $relatedTables = ['admins', 'drivers', 'vehicles', 'consignors', 'trip_sheets', 'inward_waybills', 'cash_book_entries'];

        foreach ($relatedTables as $table) {
            try {
                if (\Schema::hasTable($table)) {
                    $column = ($table === 'admins') ? 'branch_code' : 'branch_id';
                    $value = ($table === 'admins') ? $this->branch_code : $this->id;
                    
                    if (\DB::table($table)->where($column, $value)->exists()) {
                        return true;
                    }
                }
            } catch (\Exception $e) {
                // Table or column doesn't exist, continue
                continue;
            }
        }

        return false;
    }

    /**
     * Get related users.
     */
    public function users()
    {
        return $this->hasMany(Admin::class, 'branch_code', 'branch_code');
    }

    /**
     * Get related drivers.
     */
    public function drivers()
    {
        return $this->hasMany(Driver::class);
    }

    /**
     * Get related vehicles.
     */
    public function vehicles()
    {
        return $this->hasMany(Vehicle::class);
    }

    /**
     * Get related consignors.
     */
    public function consignors()
    {
        return $this->hasMany(Consignor::class);
    }

    /**
     * Get related trip sheets.
     */
    public function tripSheets()
    {
        return $this->hasMany(TripSheet::class);
    }

    /**
     * Get related cash book entries.
     */
    public function cashBookEntries()
    {
        return $this->hasMany(CashBookEntry::class);
    }
}
