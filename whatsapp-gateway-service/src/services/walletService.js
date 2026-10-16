import { query, queryOne, transaction } from '../database/db.js';

export class WalletService {
  /**
   * Check if tenant has enough balance for a message
   */
  static async hasSufficientBalance(tenantId, costRequired) {
    const wallet = await queryOne('SELECT balance FROM wallets WHERE tenant_id = ?', [tenantId]);
    if (!wallet) return false;
    return parseFloat(wallet.balance) >= parseFloat(costRequired);
  }

  /**
   * Atomically deduct message cost and log transaction
   */
  static async deductForMessage(tenantId, cost, messageId, description) {
    return transaction(async (trx) => {
      const wallet = await trx.queryOne('SELECT balance FROM wallets WHERE tenant_id = ?', [tenantId]);
      if (!wallet) throw new Error('Wallet not found');

      const currentBalance = parseFloat(wallet.balance);
      const deductAmount = parseFloat(cost);

      if (currentBalance < deductAmount) {
        throw new Error(`Insufficient wallet balance (Current: ₹${currentBalance.toFixed(2)}, Required: ₹${deductAmount.toFixed(2)})`);
      }

      const newBalance = currentBalance - deductAmount;

      // Update wallet
      await trx.query('UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = ?', [
        newBalance,
        tenantId,
      ]);

      // Record transaction
      await trx.query(
        `INSERT INTO wallet_transactions (tenant_id, type, amount, balance_after, reference_id, description)
         VALUES (?, 'debit', ?, ?, ?, ?)`,
        [tenantId, deductAmount, newBalance, messageId ? String(messageId) : null, description || 'Message sent']
      );

      return {
        previousBalance: currentBalance,
        newBalance,
        amountDeducted: deductAmount,
      };
    });
  }

  /**
   * Refund a failed message
   */
  static async refundForFailedMessage(tenantId, cost, messageId, reason) {
    return transaction(async (trx) => {
      const wallet = await trx.queryOne('SELECT balance FROM wallets WHERE tenant_id = ?', [tenantId]);
      if (!wallet) return null;

      const currentBalance = parseFloat(wallet.balance);
      const refundAmount = parseFloat(cost);
      const newBalance = currentBalance + refundAmount;

      await trx.query('UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = ?', [
        newBalance,
        tenantId,
      ]);

      await trx.query(
        `INSERT INTO wallet_transactions (tenant_id, type, amount, balance_after, reference_id, description)
         VALUES (?, 'refund', ?, ?, ?, ?)`,
        [tenantId, refundAmount, newBalance, messageId ? String(messageId) : null, reason || 'Refund for failed message']
      );

      return { newBalance, refundAmount };
    });
  }

  /**
   * Recharge Wallet
   */
  static async topupWallet(tenantId, amount, paymentReference, description) {
    return transaction(async (trx) => {
      const wallet = await trx.queryOne('SELECT balance FROM wallets WHERE tenant_id = ?', [tenantId]);
      if (!wallet) throw new Error('Wallet not found');

      const currentBalance = parseFloat(wallet.balance);
      const topupAmount = parseFloat(amount);
      const newBalance = currentBalance + topupAmount;

      await trx.query('UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = ?', [
        newBalance,
        tenantId,
      ]);

      await trx.query(
        `INSERT INTO wallet_transactions (tenant_id, type, amount, balance_after, reference_id, description)
         VALUES (?, 'credit', ?, ?, ?, ?)`,
        [tenantId, topupAmount, newBalance, paymentReference || null, description || 'Wallet Recharge']
      );

      return {
        previousBalance: currentBalance,
        newBalance,
        amountAdded: topupAmount,
      };
    });
  }

  /**
   * Get Wallet Summary & Transaction History
   */
  static async getWalletDetails(tenantId, limit = 20) {
    const wallet = await queryOne('SELECT * FROM wallets WHERE tenant_id = ?', [tenantId]);
    const transactions = await query(
      'SELECT * FROM wallet_transactions WHERE tenant_id = ? ORDER BY id DESC LIMIT ?',
      [tenantId, limit]
    );

    return {
      wallet: wallet
        ? {
            balance: parseFloat(wallet.balance),
            currency: wallet.currency,
            lowBalanceThreshold: parseFloat(wallet.low_balance_threshold),
            isLowBalance: parseFloat(wallet.balance) <= parseFloat(wallet.low_balance_threshold),
          }
        : null,
      recentTransactions: transactions,
    };
  }
}
