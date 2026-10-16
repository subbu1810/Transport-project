import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  Building2,
  Phone,
  Hash,
  Sliders,
  Sparkles,
  Info,
  ChevronRight,
  LogOut,
  Zap,
  Globe
} from 'lucide-react';
import { whatsappService } from '../services/whatsappService';

export default function WhatsAppIntegration() {
  // Tenant & User info
  const [tenantId, setTenantId] = useState(1);
  const [tenantName, setTenantName] = useState('Garuda Transport');
  const [userRole, setUserRole] = useState('admin');

  // Meta configuration
  const [metaConfig, setMetaConfig] = useState({
    app_id: '',
    config_id: '',
    api_version: 'v21.0',
    sdk_url: 'https://connect.facebook.net/en_US/sdk.js',
  });
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Status & Data
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [integrationData, setIntegrationData] = useState(null);

  // Connecting state & Steps
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectStep, setConnectStep] = useState(''); // 'launching', 'authorizing', 'exchanging', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Test Message Form
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Disconnect Modal
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Copy Feedback
  const [copiedKey, setCopiedKey] = useState('');

  // Session info ref for message event listener
  const sessionInfoRef = useRef({ waba_id: null, phone_number_id: null });

  // 1. Initialize user and tenant data
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const resolvedTenantId = user.transport_id || user.branch_id || 1;
        setTenantId(resolvedTenantId);
        setTenantName(user.transport_name || 'Garuda Transport Company');
        setUserRole((user.role || 'admin').toLowerCase());
      } catch (e) {
        console.error('Error parsing user session:', e);
      }
    }
  }, []);

  // 2. Fetch Meta Config & Status
  useEffect(() => {
    fetchConfigAndStatus();
  }, [tenantId]);

  // 3. Register Meta Embedded Signup window message listener
  useEffect(() => {
    const messageHandler = (event) => {
      // Validate origin from Meta
      if (
        event.origin !== 'https://www.facebook.com' &&
        event.origin !== 'https://web.facebook.com'
      ) {
        return;
      }

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (data && data.type === 'WA_EMBEDDED_SIGNUP') {
          console.log('Meta Embedded Signup message received:', data);

          if (data.event === 'FINISH' || data.event === 'SUCCESS') {
            if (data.data) {
              sessionInfoRef.current = {
                waba_id: data.data.waba_id || null,
                phone_number_id: data.data.phone_number_id || null,
              };
            }
          } else if (data.event === 'CANCEL') {
            setIsConnecting(false);
            setConnectStep('');
            setErrorMessage('WhatsApp Embedded Signup was cancelled by the user.');
          } else if (data.event === 'ERROR') {
            setIsConnecting(false);
            setConnectStep('');
            setErrorMessage(data.data?.error_message || 'Meta WhatsApp Signup encountered an error.');
          }
        }
      } catch (err) {
        // Ignore parse errors from other message events
      }
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, []);

  const fetchConfigAndStatus = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      // A. Load Backend Config
      const configRes = await whatsappService.getConfig();
      if (configRes.success && configRes.data) {
        setMetaConfig(configRes.data);

        // Load Facebook SDK
        try {
          await whatsappService.loadFacebookSDK(configRes.data.app_id, configRes.data.api_version);
          setSdkLoaded(true);
        } catch (sdkErr) {
          console.warn('Facebook SDK failed to load asynchronously:', sdkErr);
        }
      }

      // B. Load Tenant Integration Status
      const statusRes = await whatsappService.getStatus(tenantId);
      if (statusRes.success && statusRes.connected && statusRes.data) {
        setConnected(true);
        setIntegrationData(statusRes.data);
      } else {
        setConnected(false);
        setIntegrationData(null);
      }
    } catch (err) {
      console.error('Error fetching WhatsApp configuration:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Launch Meta Official WhatsApp Embedded Signup
   */
  const handleLaunchEmbeddedSignup = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setTestResult(null);

    // Verify Facebook SDK is available
    if (!window.FB) {
      setErrorMessage(
        'Meta Facebook SDK is not loaded yet. Please check your internet connection or reload the page.'
      );
      return;
    }

    setIsConnecting(true);
    setConnectStep('launching');

    const configId = metaConfig.config_id || '';

    // Options for Meta WhatsApp Embedded Signup
    const loginOptions = {
      config_id: configId,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        feature: 'whatsapp_embedded_signup',
        sessionInfoVersion: '3',
        version: 'v2',
      },
    };

    // If config_id is not set, fallback to direct scope request
    if (!configId) {
      loginOptions.scope = 'whatsapp_business_messaging,whatsapp_business_management,public_profile';
      delete loginOptions.config_id;
    }

    console.log('Launching Meta FB.login for WhatsApp with options:', loginOptions);

    try {
      window.FB.login(async (response) => {
        console.log('FB.login callback response:', response);

        if (response.authResponse && response.authResponse.code) {
          const authCode = response.authResponse.code;
          setConnectStep('exchanging');

          try {
            const submitPayload = {
              code: authCode,
              tenant_id: tenantId,
              waba_id: sessionInfoRef.current.waba_id,
              phone_number_id: sessionInfoRef.current.phone_number_id,
            };

            const result = await whatsappService.submitEmbeddedSignup(submitPayload);

            if (result.success) {
              setConnected(true);
              setIntegrationData(result.data);
              setConnectStep('success');
              setSuccessMessage(
                result.message || 'WhatsApp Business Account successfully connected!'
              );
              // Refresh status
              fetchConfigAndStatus();
            } else {
              setConnectStep('error');
              setErrorMessage(result.message || 'Failed to exchange authorization with backend.');
            }
          } catch (submitErr) {
            console.error('Token exchange submission error:', submitErr);
            setConnectStep('error');
            setErrorMessage(
              submitErr.message ||
                'Backend verification failed. Please check Meta App credentials in .env.'
            );
          } finally {
            setIsConnecting(false);
          }
        } else {
          // User cancelled login or closed popup
          setIsConnecting(false);
          setConnectStep('');
          if (response.status !== 'connected') {
            setErrorMessage('WhatsApp Embedded Signup was not completed or authorization was cancelled.');
          }
        }
      }, loginOptions);
    } catch (launchErr) {
      console.error('Error invoking FB.login:', launchErr);
      setIsConnecting(false);
      setConnectStep('error');
      setErrorMessage('Could not launch Meta Embedded Signup popup. Please ensure popups are allowed.');
    }
  };

  /**
   * Send Test WhatsApp Message
   */
  const handleSendTestMessage = async (e) => {
    e.preventDefault();
    if (!testPhone) {
      alert('Please enter a recipient mobile number for the test message');
      return;
    }

    try {
      setSendingTest(true);
      setTestResult(null);

      const res = await whatsappService.sendTestMessage({
        phone: testPhone,
        message: testMessage || undefined,
        tenant_id: tenantId,
      });

      setTestResult({
        success: true,
        message: res.message || 'Test message delivered successfully!',
        message_id: res.message_id,
        to: res.to_phone,
      });
    } catch (err) {
      console.error('Test message send failed:', err);
      setTestResult({
        success: false,
        message: err.message || 'Failed to send WhatsApp message via Meta API.',
        details: err.error_details,
      });
    } finally {
      setSendingTest(false);
    }
  };

  /**
   * Disconnect WhatsApp Business Account
   */
  const handleConfirmDisconnect = async () => {
    try {
      setDisconnecting(true);
      await whatsappService.disconnect(tenantId);
      setConnected(false);
      setIntegrationData(null);
      setShowDisconnectModal(false);
      setSuccessMessage('WhatsApp Business Account has been disconnected successfully.');
      setTestResult(null);
    } catch (err) {
      console.error('Failed to disconnect:', err);
      alert(err.message || 'Failed to disconnect WhatsApp account.');
    } finally {
      setDisconnecting(false);
    }
  };

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-40 -top-10 w-48 h-48 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 border border-white/20">
              <Building2 className="w-3.5 h-3.5" />
              Tenant: {tenantName} (ID: #{tenantId})
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3">
              <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-200" />
              WhatsApp Business Integration
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base max-w-2xl font-medium leading-relaxed">
              Connect your company's official WhatsApp Business Account using Meta's Embedded
              Signup to automate Waybill bookings, dispatch alerts, and live tracking for your customers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {connected ? (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/30 backdrop-blur-md border border-emerald-300/40 rounded-2xl text-emerald-100 font-bold text-sm shadow-inner">
                <span className="w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
                <span className="w-2.5 h-2.5 bg-emerald-300 rounded-full -ml-4" />
                Status: Connected ✓
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 backdrop-blur-md border border-amber-300/30 rounded-2xl text-amber-200 font-bold text-sm">
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                Status: Not Connected
              </div>
            )}

            <button
              onClick={fetchConfigAndStatus}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-semibold rounded-2xl transition border border-white/20 backdrop-blur-md text-sm"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border-2 border-red-200 text-red-900 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">
            <div className="font-bold">Integration Notice</div>
            <div>{errorMessage}</div>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-red-500 hover:text-red-700 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-200 text-emerald-900 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">
            <div className="font-bold">Success</div>
            <div>{successMessage}</div>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-500 hover:text-emerald-700 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* MAIN VIEW: NOT CONNECTED VS CONNECTED */}
      {!connected ? (
        /* ──────── NOT CONNECTED STATE ──────── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Embedded Signup CTA (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Connect your WhatsApp Business Account</h2>
                  <p className="text-xs text-gray-500">
                    Official Meta Embedded Signup for {tenantName}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                Connect your business number in minutes without waiting for manual approval.
                Meta's Embedded Signup launches an interactive popup where you can choose your Meta Business Account and register your official WhatsApp Business phone number.
              </p>

              {/* Step Flow Preview */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  How Embedded Signup Works:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                  <div className="p-3 bg-white rounded-xl border border-gray-200 flex flex-col gap-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span className="font-semibold text-gray-800">Launch Popup</span>
                    <span className="text-[11px] text-gray-500">Log into Meta/Facebook & select your Business</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-gray-200 flex flex-col gap-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span className="font-semibold text-gray-800">Add Phone Number</span>
                    <span className="text-[11px] text-gray-500">Enter and verify your WhatsApp business phone</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-gray-200 flex flex-col gap-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
                      3
                    </span>
                    <span className="font-semibold text-gray-800">Instant Activation</span>
                    <span className="text-[11px] text-gray-500">Garuda ERP saves credentials and enables dispatch</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Launch Button & Connection Indicator */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <button
                type="button"
                onClick={handleLaunchEmbeddedSignup}
                disabled={isConnecting}
                className="w-full py-4 px-6 bg-[#1877F2] hover:bg-[#166FE5] active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-blue-200/50 flex items-center justify-center gap-3 text-base transition disabled:opacity-60 cursor-pointer"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>
                      {connectStep === 'launching' && 'Opening Meta Signup...'}
                      {connectStep === 'authorizing' && 'Waiting for Authorization...'}
                      {connectStep === 'exchanging' && 'Configuring WABA Credentials...'}
                      {connectStep === 'success' && 'Connected!'}
                      {!connectStep && 'Connecting to Meta...'}
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Connect WhatsApp Business</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Official Meta Cloud API Authorization • End-to-end encrypted credentials
              </div>
            </div>
          </div>

          {/* Right Column: Prerequisites & Security Guidelines (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                Prerequisites for WhatsApp Signup
              </h3>

              <ul className="space-y-3 text-xs text-gray-600">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    A <strong>Meta Business Manager</strong> account or admin rights on Facebook.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    A dedicated phone number capable of receiving SMS/Call verification. (Must not be currently active on standard WhatsApp app).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Company legal business name and address matching GST / registration details.
                  </span>
                </li>
              </ul>
            </div>

            {/* Features Enabled */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 rounded-3xl p-6 border border-emerald-100 space-y-3">
              <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                Automated Modules in Garuda ERP
              </h3>

              <div className="space-y-2 text-xs text-emerald-900">
                <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-100 flex items-center gap-2">
                  <span className="font-bold">📦 Waybill Bookings:</span> Instant GC booking confirmation to consignor & consignee.
                </div>
                <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-100 flex items-center gap-2">
                  <span className="font-bold">🚛 Dispatch & Trips:</span> Vehicle number and expected arrival notifications.
                </div>
                <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-100 flex items-center gap-2">
                  <span className="font-bold">💳 Payment & Inward:</span> Automated payment receipts & arrival alerts.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ──────── CONNECTED STATE ──────── */
        <div className="space-y-6">
          {/* Top Status & Account Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Account Details Card: 7 cols */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">WhatsApp Business Connected</h2>
                    <p className="text-xs text-gray-500">
                      Active for tenant: <strong>{tenantName}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowDisconnectModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 active:scale-95 text-xs font-bold rounded-xl transition border border-red-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              </div>

              {/* Data Properties Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1">
                  <div className="text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                    Business Name
                  </div>
                  <div className="font-bold text-gray-800 text-sm">
                    {integrationData?.business_name || tenantName}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1">
                  <div className="text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                    WhatsApp Number
                  </div>
                  <div className="font-bold text-emerald-700 text-sm flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {integrationData?.display_phone_number || 'Registered Phone'}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                      WABA ID (Account)
                    </span>
                    <button
                      onClick={() => copyToClipboard(integrationData?.waba_id, 'waba_id')}
                      className="text-gray-400 hover:text-gray-700"
                      title="Copy WABA ID"
                    >
                      {copiedKey === 'waba_id' ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-gray-800 font-bold">
                    {integrationData?.waba_id || 'N/A'}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                      Phone Number ID
                    </span>
                    <button
                      onClick={() => copyToClipboard(integrationData?.phone_number_id, 'phone_id')}
                      className="text-gray-400 hover:text-gray-700"
                      title="Copy Phone Number ID"
                    >
                      {copiedKey === 'phone_id' ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-gray-800 font-bold">
                    {integrationData?.phone_number_id || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                <span>
                  Connected At:{' '}
                  <strong>
                    {integrationData?.connected_at
                      ? new Date(integrationData.connected_at).toLocaleString()
                      : 'Active'}
                  </strong>
                </span>
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Tokens Encrypted At Rest
                </span>
              </div>
            </div>

            {/* Send Test Message Card: 5 cols */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Send Test Message</h3>
                    <p className="text-xs text-gray-500">
                      Verify your connected WhatsApp Business Account
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSendTestMessage} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Recipient Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 9876543210 (10 digits)"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Custom Message (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Leave blank to send standard Garuda Transport greeting..."
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingTest}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {sendingTest ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Sending via Meta Cloud API...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Send Test Message
                      </>
                    )}
                  </button>
                </form>

                {/* Test Result Feedback */}
                {testResult && (
                  <div
                    className={`p-3 rounded-xl text-xs border ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-red-50 text-red-900 border-red-200'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      {testResult.message}
                    </div>
                    {testResult.message_id && (
                      <div className="text-[10px] text-gray-600 mt-1 font-mono">
                        Meta Message ID: {testResult.message_id}
                      </div>
                    )}
                    {testResult.details && (
                      <div className="text-[10px] text-red-700 mt-1 font-mono">
                        Details: {testResult.details}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Webhook & Developer Tools Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Meta Webhook & Status Monitoring</h3>
                  <p className="text-xs text-gray-500">
                    Real-time delivery receipts, message status, and incoming notification setup
                  </p>
                </div>
              </div>

              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition"
              >
                Meta Developer Console <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Webhook Callback URL:</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin.replace(':5173', ':8000')}/api/v1/webhooks/whatsapp`,
                        'webhook_url'
                      )
                    }
                    className="text-gray-400 hover:text-gray-700 flex items-center gap-1"
                  >
                    {copiedKey === 'webhook_url' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    Copy URL
                  </button>
                </div>
                <div className="p-2.5 bg-white border border-gray-300 rounded-xl font-mono text-[11px] text-gray-800 break-all select-all">
                  {window.location.origin.replace(':5173', ':8000')}/api/v1/webhooks/whatsapp
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Verification Token:</span>
                  <button
                    onClick={() => copyToClipboard('lifetransport_wa_verify_2026', 'verify_token')}
                    className="text-gray-400 hover:text-gray-700 flex items-center gap-1"
                  >
                    {copiedKey === 'verify_token' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    Copy Token
                  </button>
                </div>
                <div className="p-2.5 bg-white border border-gray-300 rounded-xl font-mono text-[11px] text-gray-800 select-all">
                  lifetransport_wa_verify_2026
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 text-center space-y-3 bg-red-50/60 border-b border-red-100">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-red-950">Disconnect WhatsApp Business?</h2>
              <p className="text-xs text-gray-600 leading-relaxed px-4">
                Are you sure you want to disconnect WhatsApp integration for{' '}
                <strong>{tenantName}</strong>? Automated Waybill and Dispatch alerts will be paused until reconnected.
              </p>
            </div>
            <div className="p-4 bg-white flex gap-3">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                disabled={disconnecting}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 text-xs font-bold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisconnect}
                disabled={disconnecting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50"
              >
                {disconnecting ? 'Disconnecting...' : 'Yes, Disconnect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
