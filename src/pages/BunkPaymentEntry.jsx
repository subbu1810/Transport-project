import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Building2, Calendar, DollarSign, Search, CreditCard, 
  FileText, CheckCircle2, AlertCircle, Loader2, Save, 
  ArrowLeft, RefreshCw, Landmark, Wallet
} from 'lucide-react'
import { API_BASE_URL } from '../config/api'

function BunkPaymentEntry() {
  const [bunks, setBunks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState(null)

  const [formData, setFormData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    bunk_id: '',
    amount: '',
    mode_of_payment: 'Cash',
    reference_no: '',
    remarks: '',
  })

  // Selected Bunk's Stats
  const [selectedBunk, setSelectedBunk] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) setCurrentUser(JSON.parse(userData))
    fetchInitData()
  }, [])

  const fetchInitData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/fuel/init-data`)
      if (res.data.success) {
        setBunks(res.data.bunks)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load initial data')
    } finally {
      setLoading(false)
    }
  }

  const handleBunkChange = (e) => {
    const id = e.target.value
    const bunk = bunks.find(b => b.id.toString() === id)
    setSelectedBunk(bunk)
    setFormData({ ...formData, bunk_id: id })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.bunk_id || !formData.amount) {
      setError('Please fill all required fields')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const payload = {
        ...formData,
        branch_id: currentUser?.branch_id
      }

      const res = await axios.post(`${API_BASE_URL}/fuel/payments`, payload)
      
      if (res.data.success) {
        setSuccess('Payment recorded successfully!')
        setFormData({
          payment_date: new Date().toISOString().split('T')[0],
          bunk_id: '',
          amount: '',
          mode_of_payment: 'Cash',
          reference_no: '',
          remarks: '',
        })
        setSelectedBunk(null)
      }
    } catch (err) {
      console.error('Error saving payment:', err)
      setError(err.response?.data?.message || 'Error recording payment')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-orange-600" size={32} />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-100 rounded-xl">
            <Landmark className="text-orange-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-800 tracking-tight uppercase">Bunk Payment Entry</h1>
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mt-0.5">Record Cash/Bank settlements for fuel bunks</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div className="p-6 sm:p-8 space-y-6">
              {/* Alert Message */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-in slide-in-from-top-2">
                  <AlertCircle className="text-rose-600 shrink-0" size={20} />
                  <p className="text-sm font-bold text-rose-700">{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in slide-in-from-top-2">
                  <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
                  <p className="text-sm font-bold text-emerald-700">{success}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                {/* Payment Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} className="text-orange-500" />
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold text-gray-700"
                  />
                </div>

                {/* Bunk Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Building2 size={12} className="text-orange-500" />
                    Fuel Bunk / Petrol Pump
                  </label>
                  <select
                    required
                    value={formData.bunk_id}
                    onChange={handleBunkChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold text-gray-700"
                  >
                    <option value="">Select Bunk</option>
                    {bunks.map(bunk => (
                      <option key={bunk.id} value={bunk.id}>{bunk.bunk_name} ({bunk.location})</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign size={12} className="text-orange-500" />
                    Payment Amount
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black group-focus-within:text-orange-600 transition-colors">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-black text-lg text-gray-800"
                    />
                  </div>
                </div>

                {/* Payment Mode */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <CreditCard size={12} className="text-orange-500" />
                    Mode of Payment
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Cash', 'Bank/Online'].map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setFormData({ ...formData, mode_of_payment: mode })}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all font-bold text-xs ${
                          formData.mode_of_payment === mode 
                          ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' 
                          : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {mode === 'Cash' ? <Wallet size={14} /> : <Landmark size={14} />}
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reference No */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={12} className="text-orange-500" />
                    Reference No (Cheque / UTR / Transaction ID)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Payment Reference if any..."
                    value={formData.reference_no}
                    onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold text-gray-700"
                  />
                </div>

                {/* Remarks */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={12} className="text-orange-500" />
                    Additional Remarks
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Optional notes about this payment..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold text-gray-700 resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Form Footer */}
            <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    payment_date: new Date().toISOString().split('T')[0],
                    bunk_id: '',
                    amount: '',
                    mode_of_payment: 'Cash',
                    reference_no: '',
                    remarks: '',
                  })
                  setSelectedBunk(null)
                  setError('')
                  setSuccess('')
                }}
                className="px-6 py-3 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-gray-700 transition-colors"
                disabled={saving}
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-10 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 shadow-xl shadow-orange-200 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Submit Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Bunk Info & Summary */}
        <div className="space-y-6">
          {selectedBunk ? (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                  <Building2 size={20} />
                </div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Bunk Selection</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Bunk Name</p>
                  <p className="text-sm font-black text-gray-800">{selectedBunk.bunk_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Location</p>
                    <p className="text-[11px] font-bold text-gray-600">{selectedBunk.location}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Contact</p>
                    <p className="text-[11px] font-bold text-gray-600">{selectedBunk.contact_no || 'N/A'}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-dashed border-gray-100">
                  <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                    <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest leading-none mb-2">Pending Balance</p>
                    <p className="text-2xl font-[1000] text-gray-800 tabular-nums">
                      <span className="text-sm font-black mr-1 uppercase">₹</span>
                      {parseFloat(selectedBunk.current_balance || selectedBunk.opening_balance || 0).toLocaleString()}
                    </p>
                    <div className="mt-4 pt-4 border-t border-orange-100 flex items-center gap-2">
                      <div className="p-1 bgColor-orange-500 rounded text-orange-600">
                         <Search size={14} />
                      </div>
                      <p className="text-[9px] font-black text-orange-600 uppercase tracking-tighter">View Full Ledger</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <Search size={24} />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                Select a Fuel Bunk to view their balance and record a payment
              </p>
            </div>
          )}

          {/* Quick Stats Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 text-white shadow-xl">
             <div className="flex items-center gap-3 mb-4">
                <Calendar size={18} className="text-orange-400" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">Payment Period</p>
             </div>
             <p className="text-sm font-bold opacity-80 mb-6 leading-relaxed">
               All payments are recorded as settlements in the bunk ledger and will affect the final closing balance.
             </p>
             <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-60">System Online</span>
                </div>
                <span className="text-[10px] font-black text-orange-400">AUDIT READY</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BunkPaymentEntry
