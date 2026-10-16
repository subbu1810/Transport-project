<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class WhatsAppIntegration extends Model
{
    use HasFactory;

    protected $table = 'whatsapp_integrations';

    protected $fillable = [
        'tenant_id',
        'business_id',
        'waba_id',
        'phone_number_id',
        'display_phone_number',
        'business_name',
        'access_token_encrypted',
        'token_type',
        'status',
        'meta_app_id',
        'webhook_verified_at',
        'raw_metadata',
        'connected_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     * Security: NEVER expose encrypted or raw tokens to the frontend API.
     */
    protected $hidden = [
        'access_token_encrypted',
    ];

    protected $casts = [
        'raw_metadata' => 'array',
        'webhook_verified_at' => 'datetime',
        'connected_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Automatically encrypt access token when setting
     */
    public function setAccessTokenAttribute(?string $value): void
    {
        if (!empty($value)) {
            $this->attributes['access_token_encrypted'] = Crypt::encryptString($value);
        } else {
            $this->attributes['access_token_encrypted'] = null;
        }
    }

    /**
     * Decrypt and return the access token securely
     */
    public function getDecryptedAccessToken(): ?string
    {
        if (empty($this->access_token_encrypted)) {
            return null;
        }

        try {
            return Crypt::decryptString($this->access_token_encrypted);
        } catch (\Exception $e) {
            // Check if it was stored in plaintext as fallback
            Log::warning('WhatsAppIntegration: decrypt failed, checking plaintext fallback: ' . $e->getMessage());
            return $this->access_token_encrypted;
        }
    }

    /**
     * Relationship to Transport / Tenant
     */
    public function transport()
    {
        return $this->belongsTo(Transport::class, 'tenant_id');
    }
}
