import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock } from 'lucide-react'
import loginBg from '../assets/login-bg.png'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function Login({ onLoginSuccess }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!username || !password) {
      setError('Please enter both username and password')
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch(`${API_BASE_URL}/admins/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: username,
          password: password
        })
      })

      const data = await response.json()

      if (data.success) {
        // Store user data including role
        localStorage.setItem('user', JSON.stringify({
          id: data.data.id,
          username: data.data.name,
          name: data.data.name,
          full_name: data.data.full_name,
          email: data.data.email,
          role: data.data.role,
          branch_code: data.data.branch_code,
          branch_name: data.data.branch_name,
          branch_phone: data.data.branch_phone,
          phone_number: data.data.phone_number,
          branch_id: data.data.branch_id,
          transport_id: data.data.transport_id,
          transport_name: data.data.transport_name,
          transport_address: data.data.transport_address,
          transport_phone: data.data.transport_phone,
          transport_mobile: data.data.transport_mobile,
          transport_email: data.data.transport_email,
          transport_gstin: data.data.transport_gstin || data.data.gst_number,
          transport_logo_url: data.data.transport_logo_url
        }))

        if (onLoginSuccess) onLoginSuccess()
        navigate('/')
      } else {
        setError(data.message || 'Invalid credentials')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Failed to connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setUsername('')
    setPassword('')
    setError('')
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center font-sans overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-10 mix-blend-multiply"
        style={{
          backgroundImage: `url(${loginBg})`,
        }}
      />

      {/* Decorative Circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob accommodation-delay-2000"></div>

      {/* Login Card */}
      <div className="relative z-20 w-[400px] bg-white/90 backdrop-blur-sm border border-white/50 rounded-3xl shadow-xl shadow-green-100 p-8 space-y-8 animate-in fade-in zoom-in duration-500">

        {/* Header Section */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-green-500 to-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-green-500/30 mb-4 transform -rotate-3 hover:rotate-0 transition-all group">
            <User size={32} className="text-white group-hover:scale-110 transition-transform" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Welcome Back</h2>
          <p className="text-green-600/80 text-sm font-medium">Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            {/* Username Input */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-green-600 text-gray-400">
                <User size={20} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full h-12 pl-12 pr-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all text-sm font-semibold shadow-sm group-hover:border-green-200"
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-green-600 text-gray-400">
                <Lock size={20} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-12 pl-12 pr-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all text-sm font-semibold shadow-sm group-hover:border-green-200"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs text-center font-bold animate-pulse shadow-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleReset}
              type="button"
              className="flex-1 h-12 bg-gray-100 text-gray-600 text-xs font-bold uppercase rounded-xl hover:bg-gray-200 transition-all active:scale-95"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold uppercase rounded-xl hover:shadow-lg hover:shadow-green-500/30 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Garuda Transport Erp v1.0</p>
        </div>
      </div>
    </div>
  )
}

export default Login
