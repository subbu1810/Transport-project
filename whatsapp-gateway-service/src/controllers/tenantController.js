import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, transaction } from '../database/db.js';
import { config } from '../config/index.js';

export class TenantController {
  /**
   * Register a new customer / business with their own Dedicated Meta Phone Number ID
   */
  static async registerTenant(req, res) {
    try {
      const {
        name,
        app_type = 'custom', // 'transport', 'restaurant', 'gym'
        per_msg_rate = config.billing.defaultPerMessageRate,
        initial_balance = 100.00,
        display_phone_number = null,
        phone_number_id = null,
        meta_access_token = null,
        waba_id = null,
      } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Customer / Business name is required.' });
      }

      const apiKey = `gw_live_${app_type.substring(0, 5)}_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
      const apiSecret = `sec_live_${uuidv4().replace(/-/g, '')}`;

      const newTenant = await transaction(async (trx) => {
        const insertRes = await trx.query(
          `INSERT INTO tenants (name, app_type, api_key, api_secret, per_msg_rate, display_phone_number, phone_number_id, meta_access_token, waba_id, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
          [name, app_type, apiKey, apiSecret, per_msg_rate, display_phone_number, phone_number_id, meta_access_token, waba_id]
        );

        const tenantId = insertRes.insertId;

        // Initialize wallet
        await trx.query(
          `INSERT INTO wallets (tenant_id, balance, currency, low_balance_threshold)
           VALUES (?, ?, ?, 50.00)`,
          [tenantId, initial_balance, config.billing.defaultCurrency]
        );

        if (initial_balance > 0) {
          await trx.query(
            `INSERT INTO wallet_transactions (tenant_id, type, amount, balance_after, description)
             VALUES (?, 'credit', ?, ?, 'Initial Onboarding Credits')`,
            [tenantId, initial_balance, initial_balance]
          );
        }

        return {
          id: tenantId,
          name,
          app_type,
          api_key: apiKey,
          api_secret: apiSecret,
          per_msg_rate,
          display_phone_number,
          phone_number_id,
          has_custom_meta: Boolean(phone_number_id),
          initial_balance,
        };
      });

      return res.status(201).json({
        success: true,
        message: `Customer "${name}" created successfully!`,
        tenant: newTenant,
      });
    } catch (error) {
      console.error('[TenantController.registerTenant Error]:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * List all tenants (Admin view)
   */
  static async listTenants(req, res) {
    try {
      const tenants = await query(`
        SELECT 
          t.id, t.name, t.app_type, t.api_key, t.per_msg_rate, t.display_phone_number, t.phone_number_id, t.status, t.created_at,
          w.balance, w.currency,
          (SELECT COUNT(*) FROM message_logs WHERE tenant_id = t.id) as total_messages_sent,
          (SELECT COUNT(*) FROM message_logs WHERE tenant_id = t.id AND status = 'delivered') as total_delivered
        FROM tenants t
        LEFT JOIN wallets w ON w.tenant_id = t.id
        ORDER BY t.id DESC
      `);

      return res.json({ success: true, count: tenants.length, tenants });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * List Available Approved Templates
   */
  static async listTemplates(req, res) {
    try {
      const templates = await query(`
        SELECT id, template_name, category, language, header_type, body_preview, meta_status 
        FROM message_templates 
        ORDER BY id ASC
      `);

      return res.json({ success: true, templates });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
