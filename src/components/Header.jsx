import React, { useState, useEffect } from 'react'
import { Menu, LogOut, User, Phone } from 'lucide-react'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api/v1'

function Header({ onMenuClick, onLogout }) {
  const [logoUrl, setLogoUrl] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetchLogo()
    const storedUser = JSON.parse(localStorage.getItem('user'))
    setUser(storedUser)

    window.addEventListener('logoUpdated', fetchLogo);
    return () => window.removeEventListener('logoUpdated', fetchLogo);
  }, [])

  const fetchLogo = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/logo_path`)
      if (response.data.success && response.data.data) {
        setLogoUrl(`http://localhost:8000/storage/${response.data.data}`)
      }
    } catch (err) {
      console.error('Error fetching logo:', err)
    }
  }

  const handleLogout = () => {
    onLogout()
  }

  return (
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
              <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
            </div>
          )}

          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight leading-none uppercase">
              {user?.transport_name || 'Transport Management System'}
            </h1>
            <div className="flex items-center gap-3 mt-1 opacity-90">
              <p className="text-[10px] font-bold uppercase tracking-widest border-r border-white/20 pr-3">
                {user?.transport_address || 'Multi-Office Transport Solution'}
              </p>
              {user?.transport_phone && (
                <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Phone size={10} strokeWidth={3} /> {user.transport_phone}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button className="p-2 hover:bg-[#1b5e20] rounded-full transition">
            <User size={24} />
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-1.5 bg-[#fbc02d] text-gray-900 rounded-lg font-bold hover:bg-[#f9a825] transition flex items-center gap-2 text-sm shadow-sm"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
