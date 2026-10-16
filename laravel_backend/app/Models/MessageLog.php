<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MessageLog extends Model
{
    use HasFactory;

    protected $table = 'message_logs';

    protected $fillable = [
        'channel',
        'recipient_name',
        'phone',
        'message_type',
        'template_id',
        'message_body',
        'status',
        'external_id',
        'error_message',
        'branch_id',
        'user_id',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function template()
    {
        return $this->belongsTo(MessageTemplate::class, 'template_id');
    }
}
