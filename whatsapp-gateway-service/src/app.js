import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import apiRoutes from './routes/api.js';
import webhookRoutes from './routes/webhook.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // Basic security and parsing
  app.use(helmet({
    contentSecurityPolicy: false, // Allows inline styles & scripts on dev console
  }));
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static files for Developer UI Dashboard
  app.use(express.static(path.join(__dirname, '../public')));

  // Health Check
  app.get('/health', (req, res) => {
    res.json({
      status: 'UP',
      service: 'WhatsApp Gateway & Billing Microservice',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API & Webhook routes
  app.use('/api/v1', apiRoutes);
  app.use('/api/v1/webhooks', webhookRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('[Unhandled Error]:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal Server Error',
    });
  });

  return app;
}
