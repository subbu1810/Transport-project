import { initDatabase, query } from './db.js';
import { config } from '../config/index.js';

export async function runMigrations() {
  await initDatabase();
  console.log(`[DB Migration] Initializing storage schema...`);

  if (config.db.client === 'mysql') {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS tenants (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          app_type VARCHAR(100) NOT NULL DEFAULT 'custom',
          api_key VARCHAR(64) UNIQUE NOT NULL,
          api_secret VARCHAR(128) NOT NULL,
          per_msg_rate DECIMAL(8, 4) NOT NULL DEFAULT ${config.billing.defaultPerMessageRate},
          display_phone_number VARCHAR(50) DEFAULT NULL,
          phone_number_id VARCHAR(100) DEFAULT NULL,
          meta_access_token TEXT DEFAULT NULL,
          waba_id VARCHAR(100) DEFAULT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS wallets (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          tenant_id BIGINT NOT NULL UNIQUE,
          balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          currency VARCHAR(10) NOT NULL DEFAULT '${config.billing.defaultCurrency}',
          low_balance_threshold DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS wallet_transactions (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          tenant_id BIGINT NOT NULL,
          type VARCHAR(20) NOT NULL,
          amount DECIMAL(10, 4) NOT NULL,
          balance_after DECIMAL(10, 2) NOT NULL,
          reference_id VARCHAR(255) DEFAULT NULL,
          description VARCHAR(255) DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS message_templates (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          tenant_id BIGINT DEFAULT NULL,
          template_name VARCHAR(100) NOT NULL,
          category VARCHAR(50) NOT NULL DEFAULT 'UTILITY',
          language VARCHAR(10) NOT NULL DEFAULT 'en_US',
          header_type VARCHAR(50) DEFAULT 'NONE',
          body_preview TEXT,
          meta_status VARCHAR(50) NOT NULL DEFAULT 'APPROVED',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS message_logs (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          tenant_id BIGINT NOT NULL,
          recipient_phone VARCHAR(25) NOT NULL,
          sender_phone_id VARCHAR(100) DEFAULT NULL,
          template_name VARCHAR(100),
          message_type VARCHAR(50) NOT NULL DEFAULT 'template',
          payload TEXT,
          cost_charged DECIMAL(8, 4) NOT NULL DEFAULT 0.0000,
          status VARCHAR(50) NOT NULL DEFAULT 'queued',
          meta_msg_id VARCHAR(255) DEFAULT NULL,
          error_details TEXT DEFAULT NULL,
          sent_at DATETIME DEFAULT NULL,
          delivered_at DATETIME DEFAULT NULL,
          read_at DATETIME DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (e) {
      console.log('ℹ️ [DB Migration] MySQL table creation skipped, active storage engine is ready.');
    }
  }

  console.log('✅ [DB Migration] All storage schemas initialized successfully.');
}

if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}
