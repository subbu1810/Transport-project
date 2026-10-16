import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mockDispatch: process.env.MOCK_DISPATCH === 'true',
  
  db: {
    client: process.env.DB_CLIENT || 'mysql',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'champ_f82_garuda_erp',
    password: process.env.DB_PASSWORD || 'Subbu@1810',
    database: process.env.DB_NAME || 'champ_f82_garuda_transport',
  },

  meta: {
    phoneNumberId: process.env.META_WA_PHONE_NUMBER_ID || '',
    accessToken: process.env.META_WA_ACCESS_TOKEN || '',
    wabaId: process.env.META_WA_WABA_ID || '',
    apiVersion: process.env.META_WA_API_VERSION || 'v20.0',
    webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || 'lifetransport_wa_verify_2026',
  },

  billing: {
    defaultPerMessageRate: parseFloat(process.env.DEFAULT_PER_MESSAGE_RATE || '0.80'),
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'INR',
  }
};
