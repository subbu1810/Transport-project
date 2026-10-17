import { API_BASE_URL } from '../config/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const communicationService = {
  // Templates
  getTemplates: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/communication/templates${query ? `?${query}` : ''}`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  createTemplate: async (data) => {
    const res = await fetch(`${API_BASE_URL}/communication/templates`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateTemplate: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/communication/templates/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteTemplate: async (id) => {
    const res = await fetch(`${API_BASE_URL}/communication/templates/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Logs
  getLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/communication/logs${query ? `?${query}` : ''}`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  // Send Single Message
  send: async (data) => {
    const res = await fetch(`${API_BASE_URL}/communication/send`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Bulk Send
  bulkSend: async (data) => {
    const res = await fetch(`${API_BASE_URL}/communication/bulk-send`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Send Waybill / GC WhatsApp via Meta Cloud API
  sendWaybillWhatsApp: async (waybillId, { phone, recipient_type = 'consignor' } = {}) => {
    const res = await fetch(`${API_BASE_URL}/waybills/${waybillId}/send-whatsapp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ phone, recipient_type }),
    });
    return res.json();
  },

  // Instant WhatsApp Web / App share helper
  openWhatsAppChat: (phone, message) => {
    const cleaned = (phone || '').toString().replace(/[^0-9]/g, '');
    const formatted = cleaned.length === 10 ? '91' + cleaned : cleaned;
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message || '')}`;
    window.open(url, '_blank');
  },

  // Share Waybill Summary directly via WhatsApp Web
  shareWaybillSummary: (waybill, companyName = 'Mallikarjuna Roadlines', targetPhone = null) => {
    if (!waybill) return;
    const gcNo = waybill.gc_number || waybill.waybill_number || waybill.gc_no || waybill.id || '-';
    const consignor = waybill.consignor?.name || waybill.consignor_name || 'Customer';
    const consignee = waybill.consignee?.name || waybill.consignee_name || '-';
    const from = waybill.origin_branch?.branch_name || waybill.from_branch?.branch_name || waybill.source_branch || '-';
    const to = waybill.destination?.city_name || waybill.destination?.branch_name || waybill.to_branch?.branch_name || '-';
    const amount = waybill.grand_total || waybill.total_amount || waybill.freight_amount || 0;
    const accType = (waybill.account_type || 'TO PAY').toUpperCase();
    const articles = waybill.total_articles || waybill.articles?.length || 1;
    const articleDesc = waybill.article_desc ? ` (${waybill.article_desc})` : '';

    const phone = targetPhone || 
      waybill.consignor?.mobile_no || 
      waybill.consignor?.mobile || 
      waybill.consignor?.phone || 
      waybill.consignee?.mobile_number || 
      waybill.consignee?.mobile || '';

    const text = `🚚 *${companyName}*\n\n` +
      `✅ *Consignment Booked Successfully!*\n` +
      `• *GC No:* ${gcNo}\n` +
      `• *Date:* ${waybill.bill_date || new Date().toISOString().split('T')[0]}\n` +
      `• *Consignor:* ${consignor}\n` +
      `• *Consignee:* ${consignee}\n` +
      `• *Route:* ${from} ➔ ${to}\n` +
      `• *Articles:* ${articles}${articleDesc}\n` +
      `• *Total Freight:* ₹${Number(amount).toFixed(2)} (${accType})\n` +
      `• *Status:* Booked\n\n` +
      `Thank you for shipping with us!`;

    communicationService.openWhatsAppChat(phone, text);
  }
};

