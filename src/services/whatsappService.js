import axios from 'axios';
import { API_BASE_URL } from '../config/api';

class WhatsAppService {
  /**
   * Fetch public Meta configuration from backend
   */
  async getConfig() {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp/config`);
      return response.data;
    } catch (error) {
      console.error('Failed to load WhatsApp config from backend:', error);
      return {
        success: false,
        data: {
          app_id: '',
          config_id: '',
          api_version: 'v21.0',
        },
      };
    }
  }

  /**
   * Get WhatsApp Business integration status for a tenant
   */
  async getStatus(tenantId) {
    try {
      const params = {};
      if (tenantId) params.tenant_id = tenantId;
      const response = await axios.get(`${API_BASE_URL}/whatsapp/status`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch WhatsApp integration status:', error);
      return {
        success: false,
        connected: false,
        message: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Submit authorization code and session info from Meta Embedded Signup to backend
   */
  async submitEmbeddedSignup({ code, tenant_id, waba_id, phone_number_id }) {
    try {
      const response = await axios.post(`${API_BASE_URL}/whatsapp/embedded-signup`, {
        code,
        tenant_id,
        waba_id,
        phone_number_id,
      });
      return response.data;
    } catch (error) {
      console.error('Embedded signup submission error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Send a test WhatsApp message using tenant credentials
   */
  async sendTestMessage({ phone, message, tenant_id }) {
    try {
      const response = await axios.post(`${API_BASE_URL}/whatsapp/send-test-message`, {
        phone,
        message,
        tenant_id,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send test message:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Disconnect WhatsApp Business account
   */
  async disconnect(tenantId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/whatsapp/disconnect`, {
        tenant_id: tenantId,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to disconnect WhatsApp:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Dynamically load and initialize Facebook JavaScript SDK
   */
  loadFacebookSDK(appId, apiVersion = 'v21.0') {
    return new Promise((resolve, reject) => {
      if (window.FB) {
        try {
          if (appId) {
            window.FB.init({
              appId: String(appId),
              autoLogAppEvents: true,
              xfbml: true,
              version: apiVersion || 'v21.0',
            });
          }
        } catch (e) {
          console.warn('FB.init warning:', e);
        }
        resolve(window.FB);
        return;
      }

      window.fbAsyncInit = function () {
        try {
          window.FB.init({
            appId: appId ? String(appId) : undefined,
            autoLogAppEvents: true,
            xfbml: true,
            version: apiVersion || 'v21.0',
          });
          resolve(window.FB);
        } catch (err) {
          console.error('FB.init failed in fbAsyncInit:', err);
          resolve(window.FB);
        }
      };

      const scriptId = 'facebook-jssdk';
      if (document.getElementById(scriptId)) {
        return;
      }

      const js = document.createElement('script');
      js.id = scriptId;
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      js.async = true;
      js.defer = true;
      js.onerror = () => reject(new Error('Failed to load Facebook SDK'));
      document.body.appendChild(js);
    });
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;
