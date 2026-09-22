import React, { useState, useEffect, useRef } from "react";
import { QrCode, Printer, Smartphone, Wifi, RefreshCw, CheckCircle2, Copy, Building2 } from "lucide-react";
import QRCode from "qrcode";
import { API_BASE_URL } from "../config/api";

// All known transports — matched against the logged-in user's API URL
const ALL_TRANSPORTS = [
  {
    code: "LIFE",
    name: "Life Transport",
    apiUrl: "https://api.lifetransport.ssquareg.com/api/v1",
    bg: "from-emerald-500 to-green-600",
    light: "bg-emerald-50 border-emerald-200",
  },
  {
    code: "GARUDA",
    name: "Garuda Transport",
    apiUrl: "https://api.garudaerp.ssquareg.com/api/v1",
    bg: "from-blue-500 to-indigo-600",
    light: "bg-blue-50 border-blue-200",
  },
];

function QRCanvas({ payload, width = 220 }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !payload) return;
    setReady(false);
    QRCode.toCanvas(canvasRef.current, payload, {
      width, margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then(() => setReady(true)).catch(console.error);
  }, [payload, width]);

  return (
    <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-100 flex items-center justify-center">
      <canvas ref={canvasRef} style={{ display: ready ? "block" : "none", borderRadius: 8 }} />
      {!ready && (
        <div style={{ width, height: width }} className="flex items-center justify-center">
          <RefreshCw size={28} className="text-slate-300 animate-spin" />
        </div>
      )}
    </div>
  );
}

function TransportQRCard({ transport }) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);

  const payload = JSON.stringify({
    code: transport.code,
    name: transport.name,
    apiUrl: transport.apiUrl,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(transport.apiUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (!canvasRef.current) return;
    // Re-render to a fresh canvas for print
    const printCanvas = document.createElement("canvas");
    QRCode.toCanvas(printCanvas, payload, { width: 220, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } })
      .then(() => {
        const dataUrl = printCanvas.toDataURL("image/png");
        const win = window.open("", "_blank");
        win.document.write(`<!DOCTYPE html><html><head><title>QR - ${transport.name}</title>
          <style>body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff}
          .card{border:2px solid #e2e8f0;border-radius:20px;padding:40px;text-align:center;max-width:340px}
          .badge{background:#f1f5f9;border-radius:8px;padding:6px 16px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#475569;display:inline-block;margin-bottom:20px}
          h2{font-size:22px;font-weight:900;color:#0f172a;margin:14px 0 6px}
          p{font-size:11px;color:#64748b;word-break:break-all;margin:0}
          img{border-radius:12px;border:1px solid #f1f5f9;margin:18px 0}</style>
          </head><body><div class="card">
          <div class="badge">SCAN TO CONNECT MOBILE APP</div>
          <img src="${dataUrl}" width="220" height="220"/>
          <h2>${transport.name}</h2>
          <p>${transport.apiUrl}</p></div>
          <script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`);
        win.document.close();
      });
  };

  return (
    <div className={`bg-white rounded-2xl border-2 ${transport.light} shadow-md overflow-hidden`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${transport.bg} px-6 py-5 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <QrCode size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Transport Code</p>
            <h3 className="text-white text-lg font-black">{transport.name}</h3>
          </div>
        </div>
        <span className="bg-white/20 text-white text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{transport.code}</span>
      </div>

      {/* QR code */}
      <div className="px-8 py-6 flex flex-col items-center gap-4" ref={canvasRef}>
        <QRCanvas payload={payload} width={220} />

        {/* Instruction */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 w-full">
          <Smartphone size={15} className="text-slate-400 flex-shrink-0" />
          <p className="text-[12px] font-semibold text-slate-500 leading-tight">
            Open mobile app &rarr; <span className="font-black text-slate-700">Company Setup</span> &rarr; scan this QR
          </p>
        </div>

        {/* URL row */}
        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
          <Wifi size={12} className="text-slate-400 flex-shrink-0" />
          <p className="text-[11px] font-bold text-slate-500 flex-1 truncate">{transport.apiUrl}</p>
          <button onClick={handleCopy} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-200 transition" title="Copy URL">
            {copied ? <CheckCircle2 size={13} className="text-green-500" /> : <Copy size={13} className="text-slate-400" />}
          </button>
        </div>

        {/* Print */}
        <button onClick={handlePrint}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white text-sm font-black uppercase tracking-widest bg-gradient-to-r ${transport.bg} shadow-lg hover:opacity-90 active:scale-[0.98] transition-all`}>
          <Printer size={15} /> Print QR Code
        </button>
      </div>
    </div>
  );
}

export default function MobileAppQR() {
  const [transport, setTransport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detect current transport from the active API_BASE_URL or logged-in user data
    const userStr = localStorage.getItem("user");
    let detected = null;

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Try matching by transport name stored in user object
        const transportName = (user.transport_name || user.company_name || user.transport || "").toLowerCase();
        const transportApiUrl = user.transport_api_url || user.api_url || "";

        detected = ALL_TRANSPORTS.find(t =>
          transportApiUrl.includes(t.apiUrl.replace("https://", "").replace("http://", "").split("/")[0]) ||
          transportName.includes(t.name.toLowerCase()) ||
          transportName.includes(t.code.toLowerCase())
        );
      } catch (e) { /* ignore */ }
    }

    // Fallback: match against the currently configured API_BASE_URL in config
    if (!detected) {
      detected = ALL_TRANSPORTS.find(t => API_BASE_URL.includes(t.code.toLowerCase()) || API_BASE_URL === t.apiUrl);
    }

    // Last fallback: match substring of URL
    if (!detected) {
      detected = ALL_TRANSPORTS.find(t => API_BASE_URL.startsWith(t.apiUrl.replace("/api/v1", "")));
    }

    setTransport(detected || null);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw size={28} className="text-slate-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
            <Smartphone size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mobile App QR Setup</h1>
            <p className="text-sm text-slate-500 font-medium">
              Scan this QR with the Garuda ERP mobile app to connect to your transport server
            </p>
          </div>
        </div>

        {/* How-to banner */}
        <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-4 flex flex-wrap items-center gap-4">
          <QrCode size={20} className="text-indigo-500 flex-shrink-0" />
          <p className="text-sm text-indigo-800 font-semibold flex-1">
            <span className="font-black">How to use:</span> Open the mobile app &rarr; tap{" "}
            <span className="font-black">&ldquo;Select Transport&rdquo;</span> on the login screen &rarr; scan the QR below &rarr; app connects automatically.
          </p>
        </div>
      </div>

      {/* QR Card — only the current transport */}
      {transport ? (
        <div className="max-w-md mx-auto">
          <TransportQRCard transport={transport} />
        </div>
      ) : (
        <div className="max-w-md mx-auto bg-white rounded-2xl border-2 border-amber-200 p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 size={24} className="text-amber-600" />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-2">Transport Not Recognised</h3>
          <p className="text-sm text-slate-500 font-medium mb-1">
            Could not automatically detect your transport from the current session.
          </p>
          <p className="text-xs text-slate-400 font-bold break-all">Active API: {API_BASE_URL}</p>
        </div>
      )}

      {/* Tip */}
      <div className="mt-8 max-w-md mx-auto bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-start gap-3">
        <span className="text-amber-500 text-lg mt-0.5">&#128161;</span>
        <p className="text-xs text-amber-800 font-semibold leading-relaxed">
          <span className="font-black">Tip:</span> Print this QR and place it at the desk. Staff only need to scan it once &mdash; the app remembers the server for all future logins.
        </p>
      </div>
    </div>
  );
}
