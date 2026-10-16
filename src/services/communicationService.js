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

  // Instant WhatsApp Web / App share helper
  openWhatsAppChat: (phone, message) => {
    const cleaned = (phone || '').toString().replace(/[^0-9]/g, '');
    const formatted = cleaned.length === 10 ? '91' + cleaned : cleaned;
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message || '')}`;
    window.open(url, '_blank');
  },

  // Share Waybill Summary directly
  shareWaybillSummary: (waybill) => {
    if (!waybill) return;
    const gcNo = waybill.waybill_number || waybill.gc_no || waybill.id || '-';
    const consignor = waybill.consignor?.name || waybill.consignor_name || 'Customer';
    const consignee = waybill.consignee?.name || waybill.consignee_name || '-';
    const from = waybill.from_branch?.branch_name || waybill.source_branch || '-';
    const to = waybill.to_branch?.branch_name || waybill.destination_branch || '-';
    const amount = waybill.total_amount || waybill.freight_amount || 0;
    const phone = waybill.consignor?.mobile || waybill.consignor?.phone || waybill.consignee?.mobile || '';

    const text = `🚚 *Sri Gadilingeswara Roadlines*\n\n` +
      `*Waybill / GC Details:*\n` +
      `• *GC No:* ${gcNo}\n` +
      `• *Consignor:* ${consignor}\n` +
      `• *Consignee:* ${consignee}\n` +
      `• *Route:* ${from} ➔ ${to}\n` +
      `• *Total Amount:* Rs. ${amount}\n` +
      `• *Status:* ${waybill.status || 'Booked'}\n\n` +
      `Thank you for shipping with us!`;

    communicationService.openWhatsAppChat(phone, text);
  }
};
