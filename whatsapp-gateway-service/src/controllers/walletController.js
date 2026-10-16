import { WalletService } from '../services/walletService.js';

export class WalletController {
  /**
   * Get Current Balance & Recent Transactions
   */
  static async getBalance(req, res) {
    try {
      const tenant = req.tenant;
      const details = await WalletService.getWalletDetails(tenant.id, 20);

      return res.json({
        success: true,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          appType: tenant.appType,
          perMsgRate: tenant.perMsgRate,
        },
        ...details,
      });
    } catch (error) {
      console.error('[WalletController.getBalance Error]:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Recharge / Top-up Wallet
   */
  static async recharge(req, res) {
    try {
      const tenant = req.tenant;
      const { amount, reference_id, description } = req.body;

      const topupAmount = parseFloat(amount);
      if (!topupAmount || topupAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid recharge amount. Must be greater than 0.',
        });
      }

      const result = await WalletService.topupWallet(
        tenant.id,
        topupAmount,
        reference_id || `MANUAL_${Date.now()}`,
        description || `Wallet Top-up of ₹${topupAmount.toFixed(2)}`
      );

      return res.json({
        success: true,
        message: `Successfully recharged ₹${topupAmount.toFixed(2)}`,
        billing: result,
      });
    } catch (error) {
      console.error('[WalletController.recharge Error]:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
