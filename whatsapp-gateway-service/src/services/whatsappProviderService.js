import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';

export class WhatsAppProviderService {
  /**
   * Send Template Message via Meta Cloud API or Simulated Mock
   */
  static async sendTemplateMessage({
    phoneNumberId,
    accessToken,
    recipientPhone,
    templateName,
    language = 'en_US',
    components = [],
    headerMediaUrl = null,
    headerMediaType = null, // 'DOCUMENT', 'IMAGE'
  }) {
    const targetPhoneId = phoneNumberId || config.meta.phoneNumberId;
    const targetToken = accessToken || config.meta.accessToken;

    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');

    // Developer Simulation Mode
    const isMockMode = config.mockDispatch || !targetToken || targetToken.includes('your_meta') || !targetPhoneId || targetPhoneId.includes('your_phone');

    if (isMockMode) {
      console.log(`[WhatsApp Provider] ⚡ [SIMULATED DISPATCH] Template "${templateName}" -> To: +${cleanPhone}`);
      return {
        success: true,
        isSimulated: true,
        metaMessageId: `wamid.SIMULATED_${uuidv4().substring(0, 12)}`,
        contacts: [{ input: recipientPhone, wa_id: cleanPhone }],
        timestamp: new Date().toISOString(),
      };
    }

    // Build Meta Cloud API Payload
    const formattedComponents = [...components];

    if (headerMediaUrl && headerMediaType) {
      const mediaComponent = {
        type: 'header',
        parameters: [
          {
            type: headerMediaType.toLowerCase(),
            [headerMediaType.toLowerCase()]: {
              link: headerMediaUrl,
            },
          },
        ],
      };
      formattedComponents.unshift(mediaComponent);
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: language,
        },
        components: formattedComponents,
      },
    };

    const url = `https://graph.facebook.com/${config.meta.apiVersion}/${targetPhoneId}/messages`;

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${targetToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      const messageData = response.data?.messages?.[0];
      return {
        success: true,
        isSimulated: false,
        metaMessageId: messageData?.id || `wamid.${uuidv4()}`,
        contacts: response.data?.contacts || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const metaError = error.response?.data?.error;
      const errorMessage = metaError ? `${metaError.message} (Code: ${metaError.code})` : error.message;
      console.error('[WhatsApp Meta API Error]:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        raw: error.response?.data || null,
      };
    }
  }

  /**
   * Send Quick Direct Text Message (Within 24-hr session window)
   */
  static async sendTextMessage({ phoneNumberId, accessToken, recipientPhone, textBody }) {
    const targetPhoneId = phoneNumberId || config.meta.phoneNumberId;
    const targetToken = accessToken || config.meta.accessToken;
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');

    const isMockMode = config.mockDispatch || !targetToken || targetToken.includes('your_meta') || !targetPhoneId || targetPhoneId.includes('your_phone');

    if (isMockMode) {
      console.log(`[WhatsApp Provider] ⚡ [SIMULATED TEXT] To: +${cleanPhone} | Body: "${textBody.substring(0, 40)}..."`);
      return {
        success: true,
        isSimulated: true,
        metaMessageId: `wamid.SIMULATED_TEXT_${uuidv4().substring(0, 12)}`,
      };
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'text',
      text: {
        preview_url: true,
        body: textBody,
      },
    };

    const url = `https://graph.facebook.com/${config.meta.apiVersion}/${targetPhoneId}/messages`;

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${targetToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      const messageData = response.data?.messages?.[0];
      return {
        success: true,
        isSimulated: false,
        metaMessageId: messageData?.id,
      };
    } catch (error) {
      const metaError = error.response?.data?.error;
      const errorMessage = metaError ? `${metaError.message} (Code: ${metaError.code})` : error.message;
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
