import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Loader2, AlertCircle, CheckCircle2, RotateCcw, Users, Wallet } from 'lucide-react'
import { API_BASE_URL } from '../config/api'

function OwnerSettlement() {
  const [pendingOwners, setPendingOwners] = useState([])
  const [selectedOwnerName, setSelectedOwnerName] = useState('')
  const [pendingTrips, setPendingTrips] = useState([])
  const [selectedTripIds, setSelectedTripIds] = useState([])
  const [ownersLoading, setOwnersLoading] = useState(false)
  const [tripsLoading, setTripsLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const [payment, setPayment] = useState({
    method: 'CASH',
    reference: '',
    remarks: ''
  })

  useEffect(() => {
    fetchPendingOwners()
  }, [])

  const fetchPendingOwners = async () => {
    setOwnersLoading(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/owner-settlements/pending`)
      if (res.data.success) setPendingOwners(res.data.data)
    } catch {
      setMsg({ type: 'error', text: 'Failed to load owners' })
    }
    setOwnersLoading(false)
  }

  const handleOwnerChange = async (ownerName) => {
    setSelectedOwnerName(ownerName)
    setSelectedTripIds([])
    setPendingTrips([])
    setMsg({ type: '', text: '' })
    if (!ownerName) return
    setTripsLoading(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/owner-settlements/pending-trips/${ownerName}`)
      if (res.data.success) {
        setPendingTrips(res.data.data)
        setSelectedTripIds(res.data.data.map(t => t.id))
      }
    } catch {
      setMsg({ type: 'error', text: 'Failed to load trips' })
    }
    setTripsLoading(false)
  }

  const toggleTrip = (id) => {
    setSelectedTripIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectedTrips = pendingTrips.filter(t => selectedTripIds.includes(t.id))
  const totalEarnings = selectedTrips.reduce((s, t) => s + (parseFloat(t.total_kms) || 0) * (parseFloat(t.rate_per_km) || 0), 0)
  const totalAdvances = selectedTrips.reduce((s, t) => s + (parseFloat(t.advance_amount) || 0) + (parseFloat(t.less_paid_driver) || 0), 0)
  const totalPendingCash = selectedTrips.reduce((s, t) => s + (parseFloat(t.driver_pending_amount) || 0), 0)
  const netPayable = totalEarnings - totalAdvances - totalPendingCash

  const handleSettle = async () => {
    if (!selectedOwnerName || selectedTripIds.length === 0) {
      setMsg({ type: 'error', text: 'Select an owner and at least one trip' })
      return
    }
    setSubmitLoading(true)
    setMsg({ type: '', text: '' })
    try {
      const res = await axios.post(`${API_BASE_URL}/owner-settlements`, {
        owner_name: selectedOwnerName,
        trip_ids: selectedTripIds,
        total_earnings: totalEarnings,
        total_advances: totalAdvances,
        driver_pending_deduction: totalPendingCash,
        net_payable: netPayable,
        payment_method: payment.method,
        payment_reference: payment.reference,
        remarks: payment.remarks
      })
      if (res.data.success) {
        setMsg({ type: 'success', text: 'Settlement completed successfully!' })
        setSelectedOwnerName('')
        setPendingTrips([])
        setSelectedTripIds([])
        setPayment({ method: 'CASH', reference: '', remarks: '' })
        fetchPendingOwners()
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Settlement failed' })
    }
    setSubmitLoading(false)
  }

  const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto font-sans text-sm text-gray-800">
        
        {/* Header - Stays simple and clean */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
              <Wallet size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none uppercase">Owner Settlement</h1>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Finalize vehicle payments & dues</p>
            </div>
          </div>
          
          {msg.text && (
            <div className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-bold shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
              msg.type === 'success' ? 'bg-green-600 text-white shadow-green-100' : 'bg-red-600 text-white shadow-red-100'
            }`}>
              {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {msg.text}
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Side: Owner & Trip Selection (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Owner Selection Card */}
            <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden p-6 transition-all hover:shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-end gap-6">
                <div className="flex-1 min-w-[280px]">
                  <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.1em]">Select Vehicle Owner</label>
                  <div className="relative group">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={18} />
                    <select
                      value={selectedOwnerName}
                      onChange={e => handleOwnerChange(e.target.value)}
                      className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 appearance-none transition-all cursor-pointer"
                    >
                      <option value="">Choose owner account...</option>
                      {ownersLoading
                        ? <option disabled>Loading database...</option>
                        : pendingOwners.map((o, i) => (
                            <option key={i} value={o.owner_name}>
                              {o.owner_name} — {o.trip_count} Pending Trips
                            </option>
                          ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 bg-gray-50 pl-2">
                       ▼
                    </div>
                  </div>
                </div>

                {selectedOwnerName && (
                  <button
                    onClick={() => { setSelectedOwnerName(''); setPendingTrips([]); setSelectedTripIds([]); setMsg({ type: '', text: '' }) }}
                    className="h-12 px-6 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
                  >
                    <RotateCcw size={14} /> Reset Selection
                  </button>
                )}
              </div>
            </div>

            {/* Trips Listing */}
            {selectedOwnerName && (
              <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 bg-gray-50/50">
                  <div>
                    <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Active Pending Trips</span>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Select trips to include in this settlement</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setSelectedTripIds(pendingTrips.map(t => t.id))} className="text-[10px] font-black text-green-600 uppercase tracking-widest hover:text-green-700 transition-colors">Select All</button>
                    <div className="w-[1px] h-3 bg-gray-200 self-center"></div>
                    <button onClick={() => setSelectedTripIds([])} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors">Deselect All</button>
                  </div>
                </div>

                <div className="p-0">
                  {tripsLoading ? (
                    <div className="flex flex-col justify-center items-center py-20 gap-3">
                      <Loader2 className="animate-spin text-green-600" size={32} />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fetching Trip Data...</p>
                    </div>
                  ) : pendingTrips.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                        <CheckCircle2 size={24} />
                      </div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">All trips settled for this owner</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto lg:overflow-visible">
                      {/* Mobile Card Layout (Hidden on Large) */}
                      <div className="block lg:hidden space-y-4 p-4 bg-gray-50/50">
                        {pendingTrips.map(trip => {
                          const earnings = (parseFloat(trip.total_kms) || 0) * (parseFloat(trip.rate_per_km) || 0);
                          const advances = (parseFloat(trip.advance_amount) || 0) + (parseFloat(trip.less_paid_driver) || 0);
                          const pendingCash = parseFloat(trip.driver_pending_amount) || 0;
                          const checked = selectedTripIds.includes(trip.id);
                          return (
                            <div 
                              key={trip.id} 
                              onClick={() => toggleTrip(trip.id)}
                              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                                checked ? 'bg-white border-green-500 shadow-lg shadow-green-100' : 'bg-white border-transparent'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <div className="text-xs font-black text-green-600 tracking-widest uppercase mb-1">{trip.trip_number}</div>
                                  <div className="text-sm font-bold text-gray-900">{trip.vehicle?.vehicle_number || 'No Vehicle'}</div>
                                  <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
                                    {new Date(trip.trip_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                  checked ? 'bg-green-600 border-green-600' : 'border-gray-200'
                                }`}>
                                  {checked && <CheckCircle2 size={14} className="text-white" />}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-4 mt-2">
                                <div>
                                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 font-mono">Earnings</div>
                                  <div className="text-sm font-black text-gray-900">₹{fmt(earnings)}</div>
                                </div>
                                <div>
                                  <div className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1 font-mono">Advances</div>
                                  <div className="text-sm font-black text-red-600">₹{fmt(advances)}</div>
                                </div>
                                {pendingCash > 0 && (
                                  <div className="col-span-2 bg-orange-50/50 p-2 rounded-lg flex justify-between items-center">
                                    <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest font-mono">Deduction (PD)</span>
                                    <span className="text-xs font-black text-orange-700">₹{fmt(pendingCash)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop Table Layout (Hidden on Small) */}
                      <table className="hidden lg:table w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50 text-left">
                            <th className="px-6 py-4 w-12"></th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">Trip Ident.</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono text-center">Stats (KM x Rate)</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono text-right">Owner Earn</th>
                            <th className="px-6 py-4 text-[10px] font-black text-red-400 uppercase tracking-widest font-mono text-right">Adv + Dest</th>
                            <th className="px-6 py-4 text-[10px] font-black text-orange-400 uppercase tracking-widest font-mono text-right">Ded. (PD)</th>
                            <th className="px-6 py-4 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {pendingTrips.map(trip => {
                            const earnings = (parseFloat(trip.total_kms) || 0) * (parseFloat(trip.rate_per_km) || 0)
                            const advances = (parseFloat(trip.advance_amount) || 0) + (parseFloat(trip.less_paid_driver) || 0)
                            const pendingCash = parseFloat(trip.driver_pending_amount) || 0
                            const checked = selectedTripIds.includes(trip.id)
                            return (
                              <tr
                                key={trip.id}
                                onClick={() => toggleTrip(trip.id)}
                                className={`group cursor-pointer transition-all ${checked ? 'bg-green-50/40' : 'hover:bg-gray-50/80'}`}
                              >
                                <td className="px-6 py-4">
                                  <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                                    checked ? 'bg-green-600 border-green-600 shadow-md shadow-green-100' : 'border-gray-200 group-hover:border-green-300'
                                  }`}>
                                    {checked && <CheckCircle2 size={12} className="text-white" />}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-black text-gray-900 leading-tight">{trip.trip_number}</div>
                                  <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
                                    {new Date(trip.trip_date).toLocaleDateString('en-GB')} — {trip.vehicle?.vehicle_number}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                    {trip.total_kms || 0} <span className="text-[10px] text-gray-400">x</span> ₹{trip.rate_per_km || 0}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="text-sm font-black text-gray-900 font-mono">₹{fmt(earnings)}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="text-sm font-black text-red-600 font-mono">₹{fmt(advances)}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="text-sm font-black text-orange-600 font-mono italic">
                                    {pendingCash > 0 ? `₹${fmt(pendingCash)}` : '—'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 opacity-0 group-hover:opacity-100 ml-auto transition-opacity"></div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Summary & Payment (4 cols) - Sticky on Desktop */}
          {selectedOwnerName && (
            <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-6">
              
              {/* Financial Breakdown Card */}
              <div className="bg-gray-900 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>

                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-8 border-b border-gray-800 pb-4">Financial Settlement Summary</h3>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center group">
                    <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors uppercase font-mono tracking-widest">Gross Earnings</span>
                    <span className="text-lg font-black font-mono tracking-tighter">₹{fmt(totalEarnings)}</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-xs font-bold text-red-400 group-hover:text-red-300 transition-colors uppercase font-mono tracking-widest">Less Advances</span>
                    <span className="text-lg font-black text-red-500 font-mono tracking-tighter">− ₹{fmt(totalAdvances)}</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-xs font-bold text-orange-400 group-hover:text-orange-300 transition-colors uppercase font-mono tracking-widest">Less Pend. Cash</span>
                    <span className="text-lg font-black text-orange-600 font-mono tracking-tighter">− ₹{fmt(totalPendingCash)}</span>
                  </div>
                  
                  <div className="pt-6 mt-6 border-t border-gray-800 flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Net Payable</span>
                      <span className={`text-4xl font-black font-mono tracking-tighter ${netPayable >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ₹{fmt(netPayable)}
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-gray-600 text-right uppercase tracking-widest">
                      Calculated for {selectedTripIds.length} Trip{selectedTripIds.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Processing Card */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Payment Methodology</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['CASH', 'BANK TRANSFER', 'CHEQUE'].map(mode => (
                        <button
                          key={mode}
                          onClick={() => setPayment({ ...payment, method: mode })}
                          className={`py-2 px-1 text-[9px] font-black rounded-lg border-2 transition-all uppercase tracking-tight ${
                            payment.method === mode 
                              ? 'bg-gray-900 border-gray-900 text-white' 
                              : 'bg-white border-gray-50 text-gray-400 hover:border-gray-200'
                          }`}
                        >
                          {mode === 'BANK TRANSFER' ? 'BANK' : mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest font-mono">Ref/Instrument Number</label>
                    <input
                      type="text"
                      value={payment.reference}
                      onChange={e => setPayment({ ...payment, reference: e.target.value })}
                      placeholder="TXN ID / CHQ NO"
                      className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-green-500/5 focus:border-green-500 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest font-mono text-mono">Settlement Remarks</label>
                    <textarea
                      rows="2"
                      value={payment.remarks}
                      onChange={e => setPayment({ ...payment, remarks: e.target.value })}
                      placeholder="Add an internal note..."
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-green-500/5 focus:border-green-500 transition-all resize-none"
                    ></textarea>
                  </div>

                  <button
                    onClick={handleSettle}
                    disabled={submitLoading || selectedTripIds.length === 0}
                    className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed shadow-xl shadow-green-100 mt-2 group"
                  >
                    {submitLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" /> 
                        Finalize Settlement
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Empty State */}
        {!selectedOwnerName && (
          <div className="mt-20 flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6">
              <Users size={48} />
            </div>
            <h2 className="text-xl font-black text-gray-300 uppercase tracking-[0.3em]">Selection Required</h2>
            <p className="text-xs font-bold text-gray-400 uppercase mt-2 tracking-widest">Select an owner account above to manage settlements</p>
          </div>
        )}

      </div>
    </div>
  )
}

export default OwnerSettlement
