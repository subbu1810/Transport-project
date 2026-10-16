import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController.js';

const router = Router();

// Meta WhatsApp Cloud API Webhook Verification & Listener
router.get('/whatsapp', WebhookController.verifyWebhook);
router.post('/whatsapp', WebhookController.handleWebhook);

export default router;
