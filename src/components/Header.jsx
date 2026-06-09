import React, { useState, useEffect } from 'react'
import { Menu, LogOut, User, Phone, AlertTriangle } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api'

function Header({ onMenuClick, onLogout }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [logoUrl, setLogoUrl] = useState(null)
  const [user, setUser] = useState(null)
  const [companyName, setCompanyName] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')

  const loadCompanyInfo = (userData) => {
    if (!userData) return;

    // 1. Set values from user object if available
    setCompanyName(userData.transport_name || '')
    setCompanyAddress(userData.transport_address || '')
    setCompanyPhone(userData.transport_phone || '')

    // 2. Fallbacks if user object is incomplete
    if (!userData.transport_name) {
      fetch(`${API_BASE_URL}/settings/transport_name`)
        .then(r => r.json())
        .then(data => data.success && setCompanyName(data.data))
        .catch(() => { });
    }

    if (!userData.transport_address) {
      fetch(`${API_BASE_URL}/settings/transport_address`)
        .then(r => r.json())
        .then(data => data.success && setCompanyAddress(data.data))
        .catch(() => { });
    }

    if (!userData.transport_phone) {
      fetch(`${API_BASE_URL}/settings/transport_phone`)
        .then(r => r.json())
        .then(data => data.success && setCompanyPhone(data.data))
        .catch(() => { });
    }
  };

  const loadLogoFromUser = (userData) => {
    if (!userData) return;
    // Per-transport logo takes priority
    if (userData.transport_logo_url) {
      setLogoUrl(userData.transport_logo_url);
    } else if (userData.transport_id) {
      // Fetch from transport endpoint
      fetch(`${API_BASE_URL}/transports/${userData.transport_id}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.data?.logo_path) {
            setLogoUrl(`${STORAGE_URL}/${data.data.logo_path}`);
          }
        })
        .catch(() => { });
    } else {
      // Fallback: global settings logo
      fetch(`${API_BASE_URL}/settings/logo_path`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.data) {
            setLogoUrl(`${STORAGE_URL}/${data.data}`);
          }
        })
        .catch(() => { });
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    setUser(storedUser)
    loadLogoFromUser(storedUser);
    loadCompanyInfo(storedUser);

    // Re-fetch on logo update event (from SystemSettings)
    const handleLogoUpdated = () => {
      const freshUser = JSON.parse(localStorage.getItem('user'));
      setUser(freshUser);
      loadLogoFromUser(freshUser);
      loadCompanyInfo(freshUser);
    };
    window.addEventListener('logoUpdated', handleLogoUpdated);
    return () => window.removeEventListener('logoUpdated', handleLogoUpdated);
  }, [])

  return (
    <>
    <header className="bg-[#2e7d32] text-white shadow-md">
      <div className="px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-[#1b5e20] rounded-lg transition"
          >
            <Menu size={24} />
          </button>

          {logoUrl && (
            <div className="bg-white p-1 rounded-md shadow-sm">
              <img src={logoUrl} alt="Company Logo" className="h-10 w-auto object-contain" />
            </div>
          )}

          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight leading-none uppercase">
              {companyName || 'Transport Management System'}
            </h1>
            <div className="flex items-center gap-3 mt-1 opacity-90 text-white/90">
              <p className="text-[10px] font-bold uppercase tracking-widest border-r border-white/20 pr-3">
                {companyAddress || 'Multi-Office Transport Solution'}
              </p>
              {companyPhone && (
                <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Phone size={10} strokeWidth={3} /> {companyPhone}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end px-4 border-l border-white/20">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-tighter">Login:</span>
              <span className="text-xs font-bold text-white uppercase">{user?.username}</span>
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                <User size={12} className="text-white" />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] font-black text-[#fbc02d] uppercase tracking-widest bg-[#1b5e20] px-1.5 py-0.5 rounded">
                {user?.branch_name || 'Main Branch'}
              </span>
            </div>

            {(user?.branch_phone || user?.phone_number) && (
              <div className="flex items-center gap-1.5 mt-1 text-white/80 group cursor-pointer hover:text-white transition-colors">
                <Phone size={10} className="group-hover:animate-pulse" />
                <span className="text-[10px] font-medium tracking-wide">
                  {user?.branch_phone || user?.phone_number}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="px-5 py-2 bg-gradient-to-r from-[#fbc02d] to-[#f9a825] text-gray-900 rounded-xl font-black hover:scale-105 transition-all flex items-center gap-2 text-[11px] shadow-lg shadow-black/20 hover:shadow-[#fbc02d]/20 uppercase"
          >
            <LogOut size={14} strokeWidth={3} />
            Logout
          </button>
        </div>
      </div>
    </header>

    {/* Logout Confirmation Modal */}
    {showLogoutConfirm && (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
            border: '1.5px solid rgba(251,192,45,0.35)',
            borderRadius: '18px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(251,192,45,0.1)',
            minWidth: '320px',
            maxWidth: '90vw',
            padding: '32px 28px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            animation: 'popIn 0.18s cubic-bezier(.34,1.56,.64,1) both'
          }}
        >
          {/* Icon */}
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(251,192,45,0.15)',
            border: '2px solid rgba(251,192,45,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <AlertTriangle size={26} style={{ color: '#fbc02d' }} strokeWidth={2.5} />
          </div>

          {/* Title */}
          <h2 style={{
            color: '#fff', fontWeight: 900, fontSize: '17px',
            letterSpacing: '0.03em', textTransform: 'uppercase', margin: 0
          }}>Confirm Logout</h2>

          {/* Message */}
          <p style={{
            color: 'rgba(255,255,255,0.75)', fontSize: '13px',
            textAlign: 'center', margin: 0, lineHeight: 1.6
          }}>
            Are you sure you want to logout?<br />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>You will be returned to the login screen.</span>
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px', width: '100%' }}>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              style={{
                flex: 1, padding: '10px 0',
                background: 'rgba(255,255,255,0.08)',
                border: '1.5px solid rgba(255,255,255,0.18)',
                borderRadius: '10px',
                color: '#fff', fontWeight: 800, fontSize: '12px',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              Cancel
            </button>
            <button
              onClick={() => { setShowLogoutConfirm(false); onLogout(); }}
              style={{
                flex: 1, padding: '10px 0',
                background: 'linear-gradient(135deg, #fbc02d, #f9a825)',
                border: 'none',
                borderRadius: '10px',
                color: '#1b2e0a', fontWeight: 900, fontSize: '12px',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'opacity 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                boxShadow: '0 4px 14px rgba(251,192,45,0.35)'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <LogOut size={13} strokeWidth={3} />
              Yes, Logout
            </button>
          </div>
        </div>

        <style>{`
          @keyframes popIn {
            from { opacity: 0; transform: scale(0.88); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    )}
    </>
  )
}

export default Header
