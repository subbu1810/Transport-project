import { queryOne } from '../database/db.js';

export async function apiKeyAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const customHeader = req.headers['x-api-key'];

    let apiKey = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7).trim();
    } else if (customHeader) {
      apiKey = customHeader.trim();
    }

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing API Key. Provide "Authorization: Bearer <API_KEY>" or "X-API-KEY" header.',
      });
    }

    const tenant = await queryOne(
      `SELECT t.*, w.balance, w.currency, w.low_balance_threshold
       FROM tenants t
       LEFT JOIN wallets w ON w.tenant_id = t.id
       WHERE t.api_key = ?`,
      [apiKey]
    );

    if (!tenant) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid API Key.',
      });
    }

    if (tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Tenant account is currently ${tenant.status}. Please contact support.`,
      });
    }

    // Attach tenant to request (including customer's dedicated Meta credentials if present)
    req.tenant = {
      id: tenant.id,
      name: tenant.name,
      appType: tenant.app_type,
      apiKey: tenant.api_key,
      perMsgRate: parseFloat(tenant.per_msg_rate),
      walletBalance: parseFloat(tenant.balance || 0),
      currency: tenant.currency || 'INR',
      lowBalanceThreshold: parseFloat(tenant.low_balance_threshold || 50),
      displayPhoneNumber: tenant.display_phone_number,
      phoneNumberId: tenant.phone_number_id,
      accessToken: tenant.meta_access_token,
      wabaId: tenant.waba_id,
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error during authentication.',
    });
  }
}
