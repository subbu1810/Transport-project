import { Router } from 'express';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { MessageController } from '../controllers/messageController.js';
import { WalletController } from '../controllers/walletController.js';
import { TenantController } from '../controllers/tenantController.js';

const router = Router();

// ==========================================
// 🔓 PUBLIC / ADMIN ONBOARDING ROUTES
// ==========================================
// Register a new app/client (e.g. new Restaurant, new Gym branch)
router.post('/tenants/register', TenantController.registerTenant);
router.get('/tenants', TenantController.listTenants);
router.get('/templates', TenantController.listTemplates);

// ==========================================
// 🔒 PROTECTED CLIENT ROUTES (Requires API Key)
// ==========================================

// 1. WhatsApp Messaging
router.post('/messages/send-template', apiKeyAuth, MessageController.sendTemplate);
router.post('/messages/send-text', apiKeyAuth, MessageController.sendText);
router.get('/messages/logs', apiKeyAuth, MessageController.getLogs);
router.get('/messages/:id/status', apiKeyAuth, MessageController.getStatus);

// 2. Prepaid Wallet & Top-up
router.get('/wallet/balance', apiKeyAuth, WalletController.getBalance);
router.post('/wallet/recharge', apiKeyAuth, WalletController.recharge);

export default router;
