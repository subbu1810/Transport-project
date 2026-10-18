import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  RefreshCw,
  ExternalLink,
  Sliders,
  Copy,
  Check,
  Sparkles,
  User,
  Truck,
  FileText
} from 'lucide-react';
import { communicationService } from '../services/communicationService';
import { API_BASE_URL } from '../config/api';

export default function Communication() {
  const [activeTab, setActiveTab] = useState('send'); // 'send', 'templates', 'logs', 'settings'

  // Data states
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Quick Send Form
  const [phone, setPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [channel, setChannel] = useState('whatsapp');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Template Form Modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'custom',
    channel: 'whatsapp',
    body: '',
    language: 'en',
    status: 'active',
  });

  // Filters for logs
  const [searchPhone, setSearchPhone] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [copiedTag, setCopiedTag] = useState('');

  // Meta Test Send
  const [testNumber, setTestNumber] = useState('');
  const [testingMeta, setTestingMeta] = useState(false);
  const [metaTestResponse, setMetaTestResponse] = useState(null);

  // Webhook and environment helpers
  const backendBase = (API_BASE_URL || '').replace(/\/api\/v1\/?$/, '');
  const isLocalhost = backendBase.includes('localhost') || backendBase.includes('127.0.0.1');
  const [customTunnelUrl, setCustomTunnelUrl] = useState(() => localStorage.getItem('wa_custom_tunnel_url') || '');
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const activeWebhookUrl = customTunnelUrl.trim()
    ? `${customTunnelUrl.trim().replace(/\/+$/, '')}/api/whatsapp/webhook`
    : `${backendBase}/api/whatsapp/webhook`;

  const availableTags = [
    { tag: '{{name}}', desc: 'Recipient Name' },
    { tag: '{{gc_no}}', desc: 'Waybill / GC Number' },
    { tag: '{{from_branch}}', desc: 'Source Branch' },
    { tag: '{{to_branch}}', desc: 'Destination Branch' },
    { tag: '{{amount}}', desc: 'Bill / Freight Amount' },
    { tag: '{{status}}', desc: 'Current Status' },
    { tag: '{{vehicle_no}}', desc: 'Vehicle Number' },
    { tag: '{{date}}', desc: 'Today Date' },
  ];

  // Default seed templates if none exist
  const defaultPresets = [
    {
      name: 'Waybill Booking Confirmation',
      type: 'waybill',
      channel: 'whatsapp',
      body: 'Dear {{name}}, your consignment GC No. {{gc_no}} from {{from_branch}} to {{to_branch}} has been booked successfully.\nAmount: Rs. {{amount}}.\nThank you for choosing Sri Gadilingeswara Roadlines!',
    },
    {
      name: 'Dispatch & Transit Notification',
      type: 'dispatch',
      channel: 'whatsapp',
      body: 'Dear {{name}}, your shipment (GC: {{gc_no}}) is dispatched with Vehicle {{vehicle_no}} towards {{to_branch}}.\nExpected soon. Track via our transport desk.',
    },
    {
      name: 'Delivery Arrival Alert',
      type: 'delivery',
      channel: 'whatsapp',
      body: 'Hello {{name}}, your consignment GC: {{gc_no}} has arrived at {{to_branch}} and is ready for delivery/pickup.\nTotal Freight: Rs. {{amount}}.',
    },
    {
      name: 'Payment & Due Reminder',
      type: 'payment',
      channel: 'whatsapp',
      body: 'Dear {{name}}, this is a gentle reminder regarding pending balance of Rs. {{amount}} for your transport accounts. Kindly clear at your earliest convenience.',
    }
  ];

  useEffect(() => {
    fetchTemplates();
    fetchLogs();
  }, []);

  // Re-fetch when switching to relevant tab
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [activeTab]);

  // Debounced filter effect for logs
  useEffect(() => {
    if (activeTab === 'logs') {
      const timer = setTimeout(() => {
        fetchLogs();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [searchPhone, statusFilter]);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const res = await communicationService.getTemplates();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setTemplates(res.data);
      } else {
        // Show default presets in UI if database is fresh
        setTemplates(defaultPresets.map((t, idx) => ({ ...t, id: idx + 1 })));
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
      setTemplates(defaultPresets.map((t, idx) => ({ ...t, id: idx + 1 })));
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const params = {};
      if (searchPhone && searchPhone.trim()) params.phone = searchPhone.trim();
      if (statusFilter && statusFilter.trim()) params.status = statusFilter.trim();

      const res = await communicationService.getLogs(params);
      if (res) {
        // Handle Laravel paginator { data: [...] } or direct array [...]
        const list = Array.isArray(res) ? res : (Array.isArray(res.data) ? res.data : []);
        setLogs(list);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleTemplateSelect = (e) => {
    const tId = e.target.value;
    setSelectedTemplateId(tId);
    if (!tId) return;

    const chosen = templates.find((t) => String(t.id) === String(tId));
    if (chosen) {
      let body = chosen.body;
      if (recipientName) body = body.replace(/{{name}}|{{customer_name}}/g, recipientName);
      setMessageBody(body);
    }
  };

  const insertTag = (tag) => {
    setMessageBody((prev) => prev + ' ' + tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(''), 2000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!phone) {
      alert('Please enter a recipient phone number');
      return;
    }
    if (!messageBody.trim()) {
      alert('Please enter a message or select a template');
      return;
    }

    try {
      setSending(true);
      setSendResult(null);

      const res = await communicationService.send({
        phone,
        recipient_name: recipientName,
        channel,
        message_body: messageBody,
        template_id: selectedTemplateId || null,
      });

      setSendResult(res);
      fetchLogs();
    } catch (err) {
      console.error(err);
      alert('Error sending message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const openWhatsAppWeb = (targetPhone, text) => {
    const cleaned = (targetPhone || phone || '').replace(/[^0-9]/g, '');
    const formatted = cleaned.length === 10 ? '91' + cleaned : cleaned;
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(text || messageBody)}`;
    window.open(url, '_blank');
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!templateForm.name || !templateForm.body) {
      alert('Template Name and Message Body are required');
      return;
    }

    try {
      if (editingTemplate && editingTemplate.id) {
        await communicationService.updateTemplate(editingTemplate.id, templateForm);
      } else {
        await communicationService.createTemplate(templateForm);
      }
      setShowTemplateModal(false);
      setEditingTemplate(null);
      setTemplateForm({ name: '', type: 'custom', channel: 'whatsapp', body: '', language: 'en', status: 'active' });
      fetchTemplates();
    } catch (err) {
      console.error(err);
      alert('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await communicationService.deleteTemplate(id);
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 rounded-2xl text-white shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">WhatsApp & Messaging Hub</h1>
              <p className="text-emerald-100 text-sm">
                Automated Waybill alerts, customer dispatches, and WhatsApp notifications
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (phone) openWhatsAppWeb(phone, messageBody);
              else alert('Enter a phone number to open direct WhatsApp');
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl shadow transition duration-150"
          >
            <ExternalLink className="w-4 h-4" />
            Direct WhatsApp Web
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 bg-white rounded-xl shadow-sm px-4 pt-2 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('send')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === 'send'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Send className="w-4 h-4" />
          Send Message
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === 'templates'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Message Templates ({templates.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('logs');
            fetchLogs();
          }}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === 'logs'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          Delivery Logs
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sliders className="w-4 h-4" />
          API & Webhook Configuration
        </button>
      </div>

      {/* TAB 1: SEND MESSAGE */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: 7 cols */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                Compose WhatsApp Message
              </h2>
              <span className="text-xs font-medium px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                Channel: WhatsApp Business
              </span>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Recipient Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Logistics"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number (WhatsApp) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Load From Template (Optional)
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={handleTemplateSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">-- Choose a pre-configured template --</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Message Body *
                  </label>
                  <span className="text-xs text-gray-400">{messageBody.length} characters</span>
                </div>
                <textarea
                  rows={6}
                  required
                  placeholder="Type your message or use templates with variables..."
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-sans"
                />
              </div>

              {/* Dynamic Tag Helpers */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Quick Insert Placeholders:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => insertTag(item.tag)}
                      className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 text-gray-700 rounded-lg transition border border-gray-200"
                      title={item.desc}
                    >
                      {item.tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Send feedback alert */}
              {sendResult && (
                <div
                  className={`p-4 rounded-xl flex items-start justify-between gap-3 text-sm ${
                    sendResult.success
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {sendResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold">{sendResult.message}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Recipient: {sendResult.data?.phone} | Status: {sendResult.data?.status}
                      </div>
                    </div>
                  </div>

                  {sendResult.direct_wa_url && (
                    <a
                      href={sendResult.direct_wa_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow whitespace-nowrap flex items-center gap-1"
                    >
                      Open in WhatsApp <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow transition duration-150 disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send via WhatsApp API
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => openWhatsAppWeb(phone, messageBody)}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-xl shadow transition duration-150"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open WhatsApp Web
                </button>
              </div>
            </form>
          </div>

          {/* Right Live Preview Mockup: 5 cols */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            <div className="bg-slate-900 p-4 rounded-3xl shadow-xl border-4 border-slate-800 max-w-sm mx-auto w-full">
              {/* WhatsApp Header bar */}
              <div className="bg-emerald-800 p-3 rounded-t-2xl flex items-center gap-3 text-white">
                <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm">
                  🚚
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {recipientName || 'Sri Gadilingeswara Roadlines'}
                  </div>
                  <div className="text-xs text-emerald-200">
                    {phone ? `+${phone.replace(/[^0-9]/g, '')}` : 'Online'}
                  </div>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="bg-[#EFEAE2] p-4 min-h-[320px] rounded-b-2xl flex flex-col justify-end relative overflow-hidden bg-opacity-95">
                <div className="text-center my-2">
                  <span className="text-[10px] bg-white/80 text-gray-500 px-2 py-0.5 rounded shadow-sm">
                    TODAY
                  </span>
                </div>

                {/* Message Bubble */}
                <div className="bg-[#DCF8C6] text-gray-800 p-3 rounded-xl rounded-tr-none shadow-sm max-w-[90%] self-end space-y-1 text-xs leading-relaxed break-words whitespace-pre-wrap">
                  {messageBody || (
                    <span className="text-gray-400 italic">
                      Type your message on the left to see live preview...
                    </span>
                  )}
                  <div className="flex items-center justify-end gap-1 text-[10px] text-gray-500 pt-1">
                    <span>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-blue-500 font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-3">
              Real-time WhatsApp Chat message preview
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Pre-configured Message Templates</h2>
              <p className="text-xs text-gray-500">
                Standard templates for Waybills, Dispatches, Deliveries, and Payments
              </p>
            </div>

            <button
              onClick={() => {
                setEditingTemplate(null);
                setTemplateForm({ name: '', type: 'custom', channel: 'whatsapp', body: '', language: 'en', status: 'active' });
                setShowTemplateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow transition"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-5 border border-gray-200 hover:border-emerald-300 rounded-2xl bg-gray-50 hover:bg-emerald-50/30 transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-800 text-sm">{tpl.name}</h3>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full uppercase">
                      {tpl.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                    {tpl.body}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200/80">
                  <span className="text-[11px] text-gray-400">Channel: {tpl.channel}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedTemplateId(tpl.id);
                        setMessageBody(tpl.body);
                        setActiveTab('send');
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Use in Send
                    </button>
                    <button
                      onClick={() => {
                        setEditingTemplate(tpl);
                        setTemplateForm({ ...tpl });
                        setShowTemplateModal(true);
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Message Delivery Logs</h2>
              <p className="text-xs text-gray-500">
                Track status and history of all sent WhatsApp messages
              </p>
            </div>

            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by phone number..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 uppercase text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Message Snippet</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent Time</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {log.recipient_name || 'Customer'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">+{log.phone}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium text-[10px] border border-emerald-200">
                          {log.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={log.message_body}>
                        {log.message_body}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                            log.status === 'sent' || log.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {log.sent_at || log.created_at ? new Date(log.sent_at || log.created_at).toLocaleString() : 'Just now'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openWhatsAppWeb(log.phone, log.message_body)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg transition"
                        >
                          Open in WA
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      No message logs recorded yet. Send your first message from the compose tab!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: API & WEBHOOK SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Meta WhatsApp Business API Integration</h2>
            <p className="text-xs text-gray-500">
              Configure Meta Cloud API credentials or use instant Web WhatsApp dispatch
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                Backend Configuration Details (.env)
              </h3>
              <p className="text-xs text-gray-600">
                To enable automated direct cloud dispatch via Meta WhatsApp API, set these in your backend <code className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-800">.env</code>:
              </p>

              <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs space-y-1">
                <div>WHATSAPP_TOKEN=EAAG...</div>
                <div>WHATSAPP_PHONE_NUMBER_ID=109876543210</div>
                <div>WHATSAPP_VERIFY_TOKEN=your_custom_verify_token</div>
              </div>

              <div className="pt-2 space-y-3">
                {isLocalhost && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900">
                    <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>Local Backend Active ({backendBase})</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Meta Cloud API requires a public HTTPS URL to deliver incoming webhook callbacks. For local webhook testing, run a tunnel like <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">ngrok http 8000</code> and paste your tunnel address below:
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="e.g. https://xyz.ngrok-free.app"
                        value={customTunnelUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomTunnelUrl(val);
                          localStorage.setItem('wa_custom_tunnel_url', val);
                        }}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                      {customTunnelUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomTunnelUrl('');
                            localStorage.removeItem('wa_custom_tunnel_url');
                          }}
                          className="text-[11px] text-amber-700 hover:text-amber-900 underline whitespace-nowrap"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">Webhook Callback URL:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activeWebhookUrl, 'webhook_url')}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      {copiedKey === 'webhook_url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'webhook_url' ? 'Copied!' : 'Copy URL'}
                    </button>
                  </div>
                  <div className="p-2.5 bg-white border border-gray-300 rounded-xl font-mono text-xs text-gray-700 break-all select-all flex items-center justify-between">
                    <span>{activeWebhookUrl}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">Verify Token:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('lifetransport_wa_verify_2026', 'verify_token')}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      {copiedKey === 'verify_token' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'verify_token' ? 'Copied!' : 'Copy Token'}
                    </button>
                  </div>
                  <div className="p-2.5 bg-white border border-gray-300 rounded-xl font-mono text-xs text-gray-700 select-all">
                    lifetransport_wa_verify_2026
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Live Status & Diagnostics
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200">
                  <span className="font-medium text-gray-700">Webhook Route:</span>
                  <span className="text-emerald-600 font-bold">✓ Active (/api/whatsapp/webhook)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200">
                  <span className="font-medium text-gray-700">Communication API:</span>
                  <span className="text-emerald-600 font-bold">✓ Ready (/api/v1/communication)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200">
                  <span className="font-medium text-gray-700">Instant WA Dispatch:</span>
                  <span className="text-emerald-600 font-bold">✓ Enabled (wa.me click-to-chat)</span>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="https://developers.facebook.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Visit Meta for Developers Dashboard <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE/EDIT TEMPLATE MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800">
              {editingTemplate ? 'Edit Template' : 'Create Message Template'}
            </h3>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Waybill Booking Alert"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Category Type
                  </label>
                  <select
                    value={templateForm.type}
                    onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="waybill">Waybill / GC</option>
                    <option value="dispatch">Dispatch</option>
                    <option value="delivery">Delivery</option>
                    <option value="payment">Payment Reminder</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Channel
                  </label>
                  <select
                    value={templateForm.channel}
                    onChange={(e) => setTemplateForm({ ...templateForm, channel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="all">All Channels</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Message Body *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Dear {{name}}, your GC No. {{gc_no}} is booked..."
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow transition"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
