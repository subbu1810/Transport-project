<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'branch_id',
        'auditable_type',
        'auditable_id',
        'gc_number',
        'action',
        'old_values',
        'new_values',
        'remarks',
        'ip_address',
    ];

    protected $casts = [
        'old_values' => 'json',
        'new_values' => 'json',
    ];

    public function user()
    {
        return $this->belongsTo(Admin::class, 'user_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function auditable()
    {
        return $this->morphTo();
    }

    public static function record($model, $action, $oldValues = null, $newValues = null, $gcNumber = null, $remarks = null, $branchId = null)
    {
        return self::create([
            'user_id' => request()->user()?->id ?? (request()->has('admin_id') ? request()->admin_id : (request()->has('inward_by') ? request()->inward_by : null)),
            'branch_id' => $branchId ?: (request()->header('X-Branch-Id') ?: ($model->origin_branch_id ?? $model->branch_id ?? null)),
            'auditable_type' => get_class($model),
            'auditable_id' => $model->id,
            'gc_number' => $gcNumber ?? $model->gc_number ?? null,
            'action' => $action,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'remarks' => $remarks,
            'ip_address' => request()->ip(),
        ]);
    }
}
