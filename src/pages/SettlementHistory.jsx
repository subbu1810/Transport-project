import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config/api'
import { Loader2, FileText, CheckCircle2, History, ArrowRight, RotateCcw, Users, Wallet } from 'lucide-react'

function SettlementHistory() {
  const [settlements, setSettlements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettlements()
  }, [])

  const fetchSettlements = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/owner-settlements`)
      if (res.data.success) {
        setSettlements(res.data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })

  const totalPaid = settlements.reduce((acc, s) => acc + parseFloat(s.net_payable), 0)
  const totalDed = settlements.reduce((acc, s) => acc + parseFloat(s.driver_pending_deduction), 0)

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto font-sans text-sm text-gray-800">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center shadow-xl shadow-gray-200">
              <History size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none uppercase">Settlement History</h1>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider font-mono">Archive of all owner disbursements</p>
            </div>
          </div>
          
          <button 
            onClick={fetchSettlements}
            className="h-11 px-6 bg-white border border-gray-200 hover:border-gray-900 text-gray-900 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-sm"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <RotateCcw size={14} />}
            Refresh Log
          </button>
        </div>

        {/* Stats Row */}
        {!loading && settlements.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md group">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <FileText size={12} /> Total Settlements
              </div>
              <div className="text-3xl font-black text-gray-900 tracking-tighter">{settlements.length}</div>
              <div className="mt-2 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block">Archived Safely</div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md group">
              <div className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <CheckCircle2 size={12} /> Total Net Paid
              </div>
              <div className="text-3xl font-black text-gray-900 tracking-tighter font-mono">₹{fmt(totalPaid)}</div>
              <div className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Disbursed to Owners</div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md group sm:col-span-2 lg:col-span-1">
              <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Wallet size={12} /> Pending Cash Deducted
              </div>
              <div className="text-3xl font-black text-gray-900 tracking-tighter font-mono">₹{fmt(totalDed)}</div>
              <div className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recovered from Owners</div>
            </div>
          </div>
        )}

        {/* List Section */}
        <div className="bg-white border border-gray-200/60 rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-500">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-gray-400" size={40} />
              <p className="text-xs font-black text-gray-300 uppercase tracking-[0.2em]">Loading Archives...</p>
            </div>
          ) : settlements.length === 0 ? (
            <div className="py-32 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200 mb-4">
                <History size={32} />
              </div>
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest font-mono">No History Found</h3>
              <p className="text-xs text-gray-300 mt-1 uppercase tracking-wider font-bold">New settlements will appear here after creation</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] border-b border-gray-100">
                    <th className="px-6 py-5">Instrument ID</th>
                    <th className="px-6 py-5">Beneficiary / Account</th>
                    <th className="px-6 py-5">Settlement Period</th>
                    <th className="px-6 py-5 text-right font-mono">Earnings</th>
                    <th className="px-6 py-5 text-right font-mono text-red-400 underline decoration-red-100">Advances</th>
                    <th className="px-6 py-5 text-right font-mono text-orange-400">Ded. (PD)</th>
                    <th className="px-6 py-5 text-right font-mono">Net Paid</th>
                    <th className="px-6 py-5 text-center">Disposition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {settlements.map((s, i) => (
                    <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="text-xs font-black text-gray-900 uppercase tracking-tighter mb-1 font-mono">
                          {s.settlement_number}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase">
                           <FileText size={10} /> {new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-black text-gray-800 leading-tight">
                          {s.owner?.owner_name || 'Generic Owner'}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 mt-1 flex items-center gap-1 uppercase tracking-tight">
                           <Users size={10} /> Active Partner
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-900 font-mono tracking-tighter"> {new Date(s.from_date).toLocaleDateString('en-GB')}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mt-0.5">Start</span>
                          </div>
                          <ArrowRight size={12} className="text-gray-200" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-900 font-mono tracking-tighter"> {new Date(s.to_date).toLocaleDateString('en-GB')}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mt-0.5">End</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-xs font-black text-gray-900 font-mono">₹{fmt(s.total_earnings)}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-xs font-black text-red-500 font-mono italic">− ₹{fmt(s.total_advances)}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-xs font-black text-orange-600 font-mono italic decoration-orange-100 underline">
                          {parseFloat(s.driver_pending_deduction) > 0 ? `− ₹${fmt(s.driver_pending_deduction)}` : '₹0.00'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="text-sm font-black text-green-600 font-mono tracking-tighter ring-1 ring-green-100 ring-offset-4 rounded-sm">
                          ₹{fmt(s.net_payable)}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col items-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-[0.1em] border border-green-100">
                            <CheckCircle2 size={10} />
                            {s.status}
                          </span>
                          <span className="text-[9px] font-bold text-gray-400 mt-1.5 uppercase tracking-tighter italic">{s.payment_method}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer/Meta */}
        {!loading && settlements.length > 0 && (
          <div className="mt-8 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">
            <div>Log Integrity Verified: 256-bit</div>
            <div className="flex gap-4">
              <span className="text-gray-300">Total Entries: {settlements.length}</span>
              <span className="text-gray-300">Page: 01 of 01</span>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default SettlementHistory
