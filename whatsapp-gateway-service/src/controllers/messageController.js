import { query, queryOne } from '../database/db.js';
import { WalletService } from '../services/walletService.js';
import { WhatsAppProviderService } from '../services/whatsappProviderService.js';

export class MessageController {
  /**
   * Universal Send Template Endpoint for All Apps (Transport, Restaurant, Gym, etc.)
   */
  static async sendTemplate(req, res) {
    try {
      const tenant = req.tenant;
      const {
        to,
        template,
        language = 'en_US',
        parameters = {},
        header_media_url = null,
        header_media_type = null, // 'DOCUMENT' or 'IMAGE'
      } = req.body;

      // 1. Validation
      if (!to || !template) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: "to" (phone number) and "template" (template name).',
        });
      }

      // 2. Check Wallet Balance
      const messageCost = tenant.perMsgRate;
      const hasBalance = await WalletService.hasSufficientBalance(tenant.id, messageCost);

      if (!hasBalance) {
        return res.status(402).json({
          success: false,
          error: `Payment Required: Insufficient wallet balance. Current balance is ₹${tenant.walletBalance.toFixed(2)}, cost per message is ₹${messageCost.toFixed(2)}. Please recharge your wallet.`,
          balance: tenant.walletBalance,
          costRequired: messageCost,
        });
      }

      // 3. Format Template Component Body Parameters
      const bodyParams = [];
      if (Array.isArray(parameters)) {
        parameters.forEach((val) => {
          bodyParams.push({ type: 'text', text: String(val) });
        });
      } else if (typeof parameters === 'object' && parameters !== null) {
        Object.values(parameters).forEach((val) => {
          bodyParams.push({ type: 'text', text: String(val) });
        });
      }

      const components = [];
      if (bodyParams.length > 0) {
        components.push({
          type: 'body',
          parameters: bodyParams,
        });
      }

      const senderPhoneIdentifier = tenant.displayPhoneNumber || tenant.phoneNumberId || 'Shared Gateway Number';

      // 4. Initial Log Entry in database (queued)
      const logInsert = await query(
        `INSERT INTO message_logs (tenant_id, recipient_phone, sender_phone_id, template_name, message_type, payload, cost_charged, status)
         VALUES (?, ?, ?, ?, 'template', ?, ?, 'queued')`,
        [tenant.id, to, senderPhoneIdentifier, template, JSON.stringify(req.body), messageCost]
      );
      const messageLogId = logInsert.insertId;

      // 5. Deduct Wallet Balance
      const deduction = await WalletService.deductForMessage(
        tenant.id,
        messageCost,
        messageLogId,
        `Sent "${template}" to ${to}`
      );

      // 6. Dispatch to Meta WhatsApp Cloud API (Using Customer's Dedicated Phone ID & Token)
      const dispatchResult = await WhatsAppProviderService.sendTemplateMessage({
        phoneNumberId: tenant.phoneNumberId,
        accessToken: tenant.accessToken,
        recipientPhone: to,
        templateName: template,
        language,
        components,
        headerMediaUrl: header_media_url,
        headerMediaType: header_media_type,
      });

      if (dispatchResult.success) {
        // Update Log Status to 'sent'
        await query(
          `UPDATE message_logs 
           SET status = 'sent', meta_msg_id = ?, sent_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [dispatchResult.metaMessageId, messageLogId]
        );

        return res.status(200).json({
          success: true,
          messageId: messageLogId,
          metaMessageId: dispatchResult.metaMessageId,
          sender: {
            businessName: tenant.name,
            senderPhone: senderPhoneIdentifier,
            phoneNumberId: tenant.phoneNumberId || 'default',
          },
          status: 'sent',
          recipient: to,
          template,
          billing: {
            costDeducted: messageCost,
            remainingBalance: deduction.newBalance,
            currency: tenant.currency,
          },
          isSimulated: dispatchResult.isSimulated || false,
        });
      } else {
        // Failed -> Update log & Refund Wallet
        await query(
          `UPDATE message_logs 
           SET status = 'failed', error_details = ? 
           WHERE id = ?`,
          [dispatchResult.error, messageLogId]
        );

        const refund = await WalletService.refundForFailedMessage(
          tenant.id,
          messageCost,
          messageLogId,
          `Auto-refund: Dispatch failed - ${dispatchResult.error}`
        );

        return res.status(502).json({
          success: false,
          error: `Failed to dispatch WhatsApp message: ${dispatchResult.error}`,
          messageId: messageLogId,
          billing: {
            refunded: true,
            currentBalance: refund ? refund.newBalance : tenant.walletBalance,
          },
        });
      }
    } catch (error) {
      console.error('[MessageController.sendTemplate Error]:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal Server Error',
      });
    }
  }

  /**
   * Direct Text Message (for active 24h conversation windows)
   */
  static async sendText(req, res) {
    try {
      const tenant = req.tenant;
      const { to, message } = req.body;

      if (!to || !message) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: "to" and "message".',
        });
      }

      const messageCost = tenant.perMsgRate;
      const hasBalance = await WalletService.hasSufficientBalance(tenant.id, messageCost);

      if (!hasBalance) {
        return res.status(402).json({
          success: false,
          error: 'Insufficient wallet balance.',
        });
      }

      const senderPhoneIdentifier = tenant.displayPhoneNumber || tenant.phoneNumberId || 'Shared Gateway Number';

      const logInsert = await query(
        `INSERT INTO message_logs (tenant_id, recipient_phone, sender_phone_id, template_name, message_type, payload, cost_charged, status)
         VALUES (?, ?, ?, 'direct_text', 'text', ?, ?, 'queued')`,
        [tenant.id, to, senderPhoneIdentifier, JSON.stringify({ message }), messageCost]
      );
      const messageLogId = logInsert.insertId;

      const deduction = await WalletService.deductForMessage(
        tenant.id,
        messageCost,
        messageLogId,
        `Direct text to ${to}`
      );

      const dispatchResult = await WhatsAppProviderService.sendTextMessage({
        phoneNumberId: tenant.phoneNumberId,
        accessToken: tenant.accessToken,
        recipientPhone: to,
        textBody: message,
      });

      if (dispatchResult.success) {
        await query(
          `UPDATE message_logs SET status = 'sent', meta_msg_id = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [dispatchResult.metaMessageId, messageLogId]
        );

        return res.status(200).json({
          success: true,
          messageId: messageLogId,
          metaMessageId: dispatchResult.metaMessageId,
          sender: {
            businessName: tenant.name,
            senderPhone: senderPhoneIdentifier,
          },
          status: 'sent',
          billing: {
            costDeducted: messageCost,
            remainingBalance: deduction.newBalance,
          },
          isSimulated: dispatchResult.isSimulated || false,
        });
      } else {
        await query(
          `UPDATE message_logs SET status = 'failed', error_details = ? WHERE id = ?`,
          [dispatchResult.error, messageLogId]
        );

        await WalletService.refundForFailedMessage(tenant.id, messageCost, messageLogId, dispatchResult.error);

        return res.status(502).json({
          success: false,
          error: dispatchResult.error,
        });
      }
    } catch (error) {
      console.error('[MessageController.sendText Error]:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get Message Status
   */
  static async getStatus(req, res) {
    try {
      const tenant = req.tenant;
      const { id } = req.params;

      const log = await queryOne(
        `SELECT id, recipient_phone, sender_phone_id, template_name, message_type, cost_charged, status, meta_msg_id, error_details, sent_at, delivered_at, read_at, created_at
         FROM message_logs 
         WHERE id = ? AND tenant_id = ?`,
        [id, tenant.id]
      );

      if (!log) {
        return res.status(404).json({ success: false, error: 'Message not found.' });
      }

      return res.json({ success: true, message: log });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get Recent Message Logs for Tenant
   */
  static async getLogs(req, res) {
    try {
      const tenant = req.tenant;
      const limit = parseInt(req.query.limit || '50', 10);

      const logs = await query(
        `SELECT id, recipient_phone, sender_phone_id, template_name, message_type, cost_charged, status, meta_msg_id, sent_at, delivered_at, read_at, created_at
         FROM message_logs 
         WHERE tenant_id = ? 
         ORDER BY id DESC LIMIT ?`,
        [tenant.id, limit]
      );

      return res.json({ success: true, count: logs.length, logs });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
