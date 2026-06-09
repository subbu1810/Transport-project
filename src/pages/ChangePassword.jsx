import React, { useState } from 'react'
import { Lock, Loader2, AlertCircle, CheckCircle2, RefreshCcw } from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL, STORAGE_URL } from '../config/api';



function ChangePassword() {
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    // Basic Validation
    if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'All fields are required' })
      return
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (passwords.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' })
      return
    }

    try {
      setLoading(true)
      const user = JSON.parse(localStorage.getItem('user'))

      const response = await axios.post(`${API_BASE_URL}/admins/change-password`, {
        admin_id: user.id,
        old_password: passwords.oldPassword,
        new_password: passwords.newPassword
      })

      const data = response.data

      if (data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' })
        setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to change password' })
      }
    } catch (err) {
      console.error('Error changing password:', err)
      setMessage({ type: 'error', text: 'Connection error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' })
    setMessage({ type: '', text: '' })
  }

  return (
    <div className="p-3 bg-gray-50/50 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className="p-6 bg-blue-600 text-white relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                <Lock size={24} />
              </div>
              <div>
                <h1 className="text-lg font-black uppercase tracking-tight">Security Center</h1>
                <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest opacity-80">Manage your access credentials</p>
              </div>
            </div>
            {/* Background Accent */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {message.text && (
              <div className={`p-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-200 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <p className="text-[11px] font-black uppercase tracking-wider">{message.text}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
                <input
                  type="password"
                  value={passwords.oldPassword}
                  onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-sm font-bold placeholder:text-gray-300"
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-sm font-bold placeholder:text-gray-300"
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-sm font-bold placeholder:text-gray-300"
                  placeholder="Re-type new password"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="flex-[0.4] flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-100 text-gray-400 rounded-xl hover:bg-gray-50 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
              >
                <RefreshCcw size={14} /> RESET
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-100 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'UPDATE PASSWORD'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChangePassword
