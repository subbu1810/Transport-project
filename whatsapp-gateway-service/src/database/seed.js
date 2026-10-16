import { query, queryOne } from './db.js';
import { runMigrations } from './migrate.js';

export async function seedDatabase() {
  await runMigrations();
  console.log('[DB Seed] Seeding sample tenants, wallets, and templates...');

  const sampleTenants = [
    {
      name: 'Garuda Transport Logistics',
      app_type: 'transport',
      api_key: 'gw_live_transport_1001',
      api_secret: 'sec_live_transport_secret_abc123',
      per_msg_rate: 0.80,
      initial_wallet: 500.00
    },
    {
      name: 'Spice Garden Restaurant & Cafe',
      app_type: 'restaurant',
      api_key: 'gw_live_restaurant_2002',
      api_secret: 'sec_live_restaurant_secret_def456',
      per_msg_rate: 0.75,
      initial_wallet: 300.00
    },
    {
      name: 'FitZone Elite Gym & Fitness',
      app_type: 'gym',
      api_key: 'gw_live_gym_3003',
      api_secret: 'sec_live_gym_secret_ghi789',
      per_msg_rate: 0.80,
      initial_wallet: 250.00
    }
  ];

  for (const t of sampleTenants) {
    const existing = await queryOne('SELECT id FROM tenants WHERE api_key = ?', [t.api_key]);
    if (!existing) {
      const res = await query(
        `INSERT INTO tenants (name, app_type, api_key, api_secret, per_msg_rate, status) 
         VALUES (?, ?, ?, ?, ?, 'active')`,
        [t.name, t.app_type, t.api_key, t.api_secret, t.per_msg_rate]
      );
      const tenantId = res.insertId;

      await query(
        `INSERT INTO wallets (tenant_id, balance, currency, low_balance_threshold) 
         VALUES (?, ?, 'INR', 50.00)`,
        [tenantId, t.initial_wallet]
      );

      await query(
        `INSERT INTO wallet_transactions (tenant_id, type, amount, balance_after, description) 
         VALUES (?, 'credit', ?, ?, 'Welcome Credit Top-up')`,
        [tenantId, t.initial_wallet, t.initial_wallet]
      );

      console.log(`  ➕ Seeded Tenant: ${t.name} (API Key: ${t.api_key}) | Wallet: ₹${t.initial_wallet}`);
    }
  }

  // Pre-seed Templates
  const sampleTemplates = [
    {
      template_name: 'transport_lr_dispatch',
      category: 'UTILITY',
      body_preview: 'Hello {{1}}, your consignment with LR No: {{2}} has been dispatched from {{3}} to {{4}}. Track here: {{5}}',
      header_type: 'TEXT'
    },
    {
      template_name: 'restaurant_bill_pdf',
      category: 'UTILITY',
      body_preview: 'Thank you for dining at {{1}}! Your total bill is {{2}} (Bill No: {{3}}). Click below to view/download your e-bill PDF: {{4}}',
      header_type: 'DOCUMENT'
    },
    {
      template_name: 'gym_membership_expiry_reminder',
      category: 'UTILITY',
      body_preview: 'Hi {{1}}, your gym membership at {{2}} expires on {{3}}. Renew today to enjoy uninterrupted workouts! Pay online: {{4}}',
      header_type: 'TEXT'
    }
  ];

  for (const tmpl of sampleTemplates) {
    const existingTmpl = await queryOne('SELECT id FROM message_templates WHERE template_name = ?', [tmpl.template_name]);
    if (!existingTmpl) {
      await query(
        `INSERT INTO message_templates (template_name, category, language, header_type, body_preview, meta_status)
         VALUES (?, ?, 'en_US', ?, ?, 'APPROVED')`,
        [tmpl.template_name, tmpl.category, tmpl.header_type, tmpl.body_preview]
      );
      console.log(`  ➕ Seeded Template: ${tmpl.template_name}`);
    }
  }

  console.log('✅ [DB Seed] Seeding completed.');
}

if (process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
