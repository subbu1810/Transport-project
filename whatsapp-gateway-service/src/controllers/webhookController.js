import { query } from '../database/db.js';
import { config } from '../config/index.js';

export class WebhookController {
  /**
   * Meta Webhook Verification Challenge (GET)
   */
  static verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === config.meta.webhookVerifyToken) {
      console.log('✅ [Meta Webhook] Successfully verified webhook challenge.');
      return res.status(200).send(challenge);
    } else {
      console.warn('⚠️ [Meta Webhook] Verification token mismatch.');
      return res.sendStatus(403);
    }
  }

  /**
   * Meta Webhook Status Updates & Incoming Messages (POST)
   */
  static async handleWebhook(req, res) {
    try {
      const body = req.body;

      if (body.object === 'whatsapp_business_account') {
        const entries = body.entry || [];
        for (const entry of entries) {
          const changes = entry.changes || [];
          for (const change of changes) {
            const value = change.value;
            if (!value) continue;

            // 1. Status Callbacks (sent, delivered, read, failed)
            if (value.statuses && Array.isArray(value.statuses)) {
              for (const statusObj of value.statuses) {
                const metaMsgId = statusObj.id;
                const status = statusObj.status; // 'sent', 'delivered', 'read', 'failed'
                const timestamp = statusObj.timestamp ? new Date(parseInt(statusObj.timestamp, 10) * 1000) : new Date();

                let updateField = '';
                if (status === 'delivered') updateField = ', delivered_at = ?';
                else if (status === 'read') updateField = ', read_at = ?';

                console.log(`📡 [Meta Webhook Status] Message ${metaMsgId} -> Status: ${status.toUpperCase()}`);

                if (updateField) {
                  await query(
                    `UPDATE message_logs SET status = ? ${updateField} WHERE meta_msg_id = ?`,
                    [status, timestamp, metaMsgId]
                  );
                } else {
                  await query(
                    `UPDATE message_logs SET status = ? WHERE meta_msg_id = ?`,
                    [status, metaMsgId]
                  );
                }
              }
            }

            // 2. Incoming Messages from users (optional 2-way conversation tracking)
            if (value.messages && Array.isArray(value.messages)) {
              for (const msg of value.messages) {
                console.log(`📩 [Meta Webhook Inbound] Received message from ${msg.from}: ${msg.text?.body || msg.type}`);
              }
            }
          }
        }

        return res.status(200).send('EVENT_RECEIVED');
      }

      return res.sendStatus(404);
    } catch (error) {
      console.error('[WebhookController.handleWebhook Error]:', error);
      return res.status(500).send('Webhook Processing Error');
    }
  }
}
