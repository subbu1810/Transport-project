import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonDbPath = path.resolve(__dirname, '../../data/gateway_db.json');

// Ensure data folder exists
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let useJsonFallback = false;
let mysqlPool = null;

// Initial schema for JSON fallback
const defaultData = {
  tenants: [],
  wallets: [],
  wallet_transactions: [],
  message_templates: [],
  message_logs: [],
  counters: {
    tenants: 0,
    wallets: 0,
    wallet_transactions: 0,
    message_templates: 0,
    message_logs: 0,
  }
};

function readJsonDb() {
  if (!fs.existsSync(jsonDbPath)) {
    fs.writeFileSync(jsonDbPath, JSON.stringify(defaultData, null, 2), 'utf-8');
    return JSON.parse(JSON.stringify(defaultData));
  }
  try {
    const raw = fs.readFileSync(jsonDbPath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return JSON.parse(JSON.stringify(defaultData));
  }
}

function writeJsonDb(data) {
  fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Check if MySQL is reachable; if not, seamlessly enable JSON DB
 */
export async function initDatabase() {
  if (config.db.client !== 'mysql') {
    useJsonFallback = true;
    console.log('📁 [Database] Using File-Based JSON Storage Engine.');
    return;
  }

  try {
    mysqlPool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2000,
    });
    
    const conn = await mysqlPool.getConnection();
    conn.release();
    console.log(`🐬 [Database] Connected to MySQL Database: ${config.db.database}`);
    useJsonFallback = false;
  } catch (err) {
    console.warn(`⚠️ [Database] MySQL not reachable (${err.message}). Auto-switching to Persistent File Storage (data/gateway_db.json).`);
    useJsonFallback = true;
    mysqlPool = null;
  }
}

/**
 * Universal Query Engine
 */
export async function query(sql, params = []) {
  if (!useJsonFallback && mysqlPool) {
    try {
      const [results] = await mysqlPool.execute(sql, params);
      return results;
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
        useJsonFallback = true;
      } else {
        throw err;
      }
    }
  }

  // Fallback JSON Engine Operations
  const data = readJsonDb();
  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase();

  if (upper.startsWith('SELECT')) {
    if (upper.includes('FROM TENANTS')) {
      if (upper.includes('WHERE T.API_KEY = ?') || upper.includes('WHERE API_KEY = ?')) {
        const apiKey = params[0];
        const tenant = data.tenants.find((t) => t.api_key === apiKey);
        if (!tenant) return [];
        const wallet = data.wallets.find((w) => w.tenant_id === tenant.id) || {};
        return [{ ...tenant, balance: wallet.balance || 0, currency: wallet.currency || 'INR', low_balance_threshold: wallet.low_balance_threshold || 50 }];
      }
      return data.tenants.map((t) => {
        const wallet = data.wallets.find((w) => w.tenant_id === t.id) || {};
        const sentLogs = data.message_logs.filter((l) => l.tenant_id === t.id);
        const deliveredLogs = sentLogs.filter((l) => l.status === 'delivered');
        return {
          ...t,
          balance: wallet.balance || 0,
          currency: wallet.currency || 'INR',
          total_messages_sent: sentLogs.length,
          total_delivered: deliveredLogs.length,
        };
      });
    }

    if (upper.includes('FROM WALLETS')) {
      if (upper.includes('WHERE TENANT_ID = ?')) {
        const tId = Number(params[0]);
        const wallet = data.wallets.find((w) => w.tenant_id === tId);
        return wallet ? [wallet] : [];
      }
      return data.wallets;
    }

    if (upper.includes('FROM WALLET_TRANSACTIONS')) {
      const tId = Number(params[0]);
      const limit = params[1] ? Number(params[1]) : 20;
      const txs = data.wallet_transactions
        .filter((tx) => tx.tenant_id === tId)
        .sort((a, b) => b.id - a.id)
        .slice(0, limit);
      return txs;
    }

    if (upper.includes('FROM MESSAGE_TEMPLATES')) {
      if (upper.includes('WHERE TEMPLATE_NAME = ?')) {
        const tmpl = data.message_templates.find((m) => m.template_name === params[0]);
        return tmpl ? [tmpl] : [];
      }
      return data.message_templates;
    }

    if (upper.includes('FROM MESSAGE_LOGS')) {
      if (upper.includes('WHERE ID = ? AND TENANT_ID = ?')) {
        const log = data.message_logs.find((l) => l.id === Number(params[0]) && l.tenant_id === Number(params[1]));
        return log ? [log] : [];
      }
      if (upper.includes('WHERE TENANT_ID = ?')) {
        const tId = Number(params[0]);
        const limit = params[1] ? Number(params[1]) : 50;
        return data.message_logs
          .filter((l) => l.tenant_id === tId)
          .sort((a, b) => b.id - a.id)
          .slice(0, limit);
      }
      return data.message_logs;
    }

    return [];
  }

  if (upper.startsWith('INSERT INTO')) {
    if (upper.includes('INTO TENANTS')) {
      data.counters.tenants++;
      const newTenant = {
        id: data.counters.tenants,
        name: params[0],
        app_type: params[1],
        api_key: params[2],
        api_secret: params[3],
        per_msg_rate: parseFloat(params[4]),
        display_phone_number: params[5] || null,
        phone_number_id: params[6] || null,
        meta_access_token: params[7] || null,
        waba_id: params[8] || null,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      data.tenants.push(newTenant);
      writeJsonDb(data);
      return { insertId: newTenant.id, affectedRows: 1 };
    }

    if (upper.includes('INTO WALLETS')) {
      data.counters.wallets++;
      const newWallet = {
        id: data.counters.wallets,
        tenant_id: Number(params[0]),
        balance: parseFloat(params[1]),
        currency: params[2] || 'INR',
        low_balance_threshold: parseFloat(params[3] || 50),
        updated_at: new Date().toISOString(),
      };
      data.wallets.push(newWallet);
      writeJsonDb(data);
      return { insertId: newWallet.id, affectedRows: 1 };
    }

    if (upper.includes('INTO WALLET_TRANSACTIONS')) {
      data.counters.wallet_transactions++;
      const newTx = {
        id: data.counters.wallet_transactions,
        tenant_id: Number(params[0]),
        type: params[1],
        amount: parseFloat(params[2]),
        balance_after: parseFloat(params[3]),
        reference_id: params[4] || null,
        description: params[5] || '',
        created_at: new Date().toISOString(),
      };
      data.wallet_transactions.push(newTx);
      writeJsonDb(data);
      return { insertId: newTx.id, affectedRows: 1 };
    }

    if (upper.includes('INTO MESSAGE_TEMPLATES')) {
      data.counters.message_templates++;
      const newTmpl = {
        id: data.counters.message_templates,
        template_name: params[0],
        category: params[1],
        language: 'en_US',
        header_type: params[2] || 'NONE',
        body_preview: params[3] || '',
        meta_status: 'APPROVED',
        created_at: new Date().toISOString(),
      };
      data.message_templates.push(newTmpl);
      writeJsonDb(data);
      return { insertId: newTmpl.id, affectedRows: 1 };
    }

    if (upper.includes('INTO MESSAGE_LOGS')) {
      data.counters.message_logs++;
      const newLog = {
        id: data.counters.message_logs,
        tenant_id: Number(params[0]),
        recipient_phone: params[1],
        sender_phone_id: params[2] || null,
        template_name: params[3],
        message_type: 'template',
        payload: params[4],
        cost_charged: parseFloat(params[5]),
        status: params[6] || 'queued',
        meta_msg_id: null,
        error_details: null,
        sent_at: null,
        delivered_at: null,
        read_at: null,
        created_at: new Date().toISOString(),
      };
      data.message_logs.push(newLog);
      writeJsonDb(data);
      return { insertId: newLog.id, affectedRows: 1 };
    }
  }

  if (upper.startsWith('UPDATE')) {
    if (upper.includes('UPDATE WALLETS')) {
      const newBalance = parseFloat(params[0]);
      const tenantId = Number(params[1]);
      const wallet = data.wallets.find((w) => w.tenant_id === tenantId);
      if (wallet) {
        wallet.balance = newBalance;
        wallet.updated_at = new Date().toISOString();
        writeJsonDb(data);
      }
      return { affectedRows: 1 };
    }

    if (upper.includes('UPDATE MESSAGE_LOGS')) {
      if (upper.includes("SET STATUS = 'SENT'")) {
        const metaId = params[0];
        const logId = Number(params[1]);
        const log = data.message_logs.find((l) => l.id === logId);
        if (log) {
          log.status = 'sent';
          log.meta_msg_id = metaId;
          log.sent_at = new Date().toISOString();
          writeJsonDb(data);
        }
        return { affectedRows: 1 };
      }
      if (upper.includes("SET STATUS = 'FAILED'")) {
        const err = params[0];
        const logId = Number(params[1]);
        const log = data.message_logs.find((l) => l.id === logId);
        if (log) {
          log.status = 'failed';
          log.error_details = err;
          writeJsonDb(data);
        }
        return { affectedRows: 1 };
      }
      if (upper.includes('WHERE META_MSG_ID = ?')) {
        const status = params[0];
        const metaId = params[params.length - 1];
        const log = data.message_logs.find((l) => l.meta_msg_id === metaId);
        if (log) {
          log.status = status;
          if (status === 'delivered') log.delivered_at = new Date().toISOString();
          if (status === 'read') log.read_at = new Date().toISOString();
          writeJsonDb(data);
        }
        return { affectedRows: 1 };
      }
    }
  }

  return [];
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows && rows.length > 0 ? rows[0] : null;
}

export async function transaction(callback) {
  const trxContext = {
    query: async (sql, params = []) => query(sql, params),
    queryOne: async (sql, params = []) => queryOne(sql, params),
  };
  return callback(trxContext);
}

export default { initDatabase, query, queryOne, transaction };
