<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashBookEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'voucher_no',
        'transaction_date',
        'transaction_type',
        'account_head_id',
        'amount',
        'branch_id',
        'paid_to_receive_from',
        'mode_of_pay',
        'dd_cheque_no',
        'dd_cheque_date',
        'drawn_on_bank',
        'authorised_by',
        'paid_by_received_by',
        'remarks',
        'is_closing_entry',
    ];

    public function accountHead()
    {
        return $this->belongsTo(AccountHead::class, 'account_head_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
