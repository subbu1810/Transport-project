import React, { useState, useEffect, useMemo } from 'react'
import {
  Search, Calendar, Loader2, Download, AlertCircle,
  Building, DollarSign, Wallet, CreditCard, Receipt,
  TrendingUp, RefreshCcw, FilterX, PieChart as PieChartIcon,
  Printer, ShieldCheck, Activity, BarChart3, ArrowUpRight,
  TrendingDown, FileText, Info, PieChart as ReChartIcon
} from 'lucide-react'
import { API_BASE_URL } from '../config/api';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts'
import axios from 'axios'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b']

function BalanceSheet() {
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    branch_id: JSON.parse(localStorage.getItem('user'))?.role !== 'superadmin' ? JSON.parse(localStorage.getItem('user'))?.branch_id : ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState({
    topay: 0,
    paid: 0,
    account: 0,
    total_balance: 0
  })
  const [branches, setBranches] = useState([])

  useEffect(() => {
    fetchBranches()
    handleGetDetails()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/branches`)
      if (response.data.success) {
         const user = JSON.parse(localStorage.getItem('user'))
         if (user?.role === 'superadmin') {
            setBranches(response.data.data)
         } else {
            setBranches(response.data.data.filter(b => b.id === user?.branch_id))
         }
      }
    } catch (err) { console.error(err) }
  }

  const handleGetDetails = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await axios.get(`${API_BASE_URL}/reports/balance-sheet`, {
        params: {
          from_date: filters.fromDate,
          to_date: filters.toDate,
          branch_id: filters.branch_id
        }
      })
      if (response.data.success) {
        setData(response.data.data)
      } else {
        setError(response.data.message || 'Failed to get balance details')
      }
    } catch (err) {
      setError('System Timeout: Audit Server Unreachable')
    } finally {
      setLoading(false)
    }
  }

  const chartData = useMemo(() => [
    { name: 'ToPay', value: parseFloat(data.topay) || 0 },
    { name: 'Paid', value: parseFloat(data.paid) || 0 },
    { name: 'Account', value: parseFloat(data.account) || 0 },
  ].filter(item => item.value > 0), [data])

  const exportToCSV = () => {
    const headers = ['Financial Audit Key', 'Amount (INR)']
    const csvContent = [
      headers.join(','),
      `TOPAY_RECEIVABLES,${data.topay}`,
      `PAID_COLLECTIONS,${data.paid}`,
      `ACCOUNT_CREDITS,${data.account}`,
      `NET_BOOKING_REVENUE,${data.total_balance}`,
      `TIMESTAMP,${new Date().toLocaleString()}`
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `GARUDA_BALANCE_SHEET_${filters.fromDate}_TO_${filters.toDate}.csv`
    link.click()
  }

  return (
    <div id="balance-sheet-audit" className="bg-[#f8fafc] min-h-screen font-sans text-slate-900 border-l border-slate-200">
      
      {/* 🏭 SCREEN UI HEADER (STATIC ON SCREEN) */}
      <div className="bg-white border-b border-slate-200 p-3 flex flex-col md:flex-row justify-between items-center px-6 gap-4 sticky top-0 z-[100] no-print-section backdrop-blur-md bg-white/90 shadow-sm">
         <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-emerald-900/10 shadow-2xl transition-transform hover:rotate-2">
               <ShieldCheck className="text-emerald-500" size={24} />
            </div>
            <div>
               <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-emerald-600 tracking-[0.3em] uppercase underline decoration-2 underline-offset-4 decoration-emerald-200">Sector 09 • Settlement</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               </div>
               <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter mt-1 leading-none">Booking Balance Sheet.</h1>
            </div>
         </div>
         <div className="flex gap-3">
            <button onClick={exportToCSV} className="bg-white text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:border-emerald-600 hover:text-emerald-700 transition-all flex items-center gap-2 shadow-sm group">
               <Download size={14} className="group-hover:translate-y-0.5 transition-transform" /> Audit Export
            </button>
            <button onClick={() => window.print()} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2 shadow-xl shadow-emerald-900/20 group">
               <Printer size={14} className="group-hover:rotate-12 transition-transform" /> Print Trace
            </button>
         </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6 audit-printable-content">
         
         {/* 🖨️ AUDIT PRINT HEADER (ONLY VISIBLE ON PRINT) */}
         <div className="print-header-block mb-10 border-b-4 border-slate-950 pb-8 hidden-screen">
            <div className="flex-print-row">
               <div className="main-logo-section">
                  <h1 className="audit-logo-txt">GARUDA<br/>ENTERPRISE LOGS.</h1>
                  <p className="audit-subtext">Net Asset & Receivables Tracking Matrix</p>
               </div>
               <div className="audit-details-section">
                  <div className="info-box-print">
                     <span className="label-p uppercase">Issuing Matrix</span>
                     <span className="value-p uppercase font-bold">
                        {branches.find(b => b.id == filters.branch_id)?.branch_name || 'All Consolidated Nodes'}
                     </span>
                  </div>
                  <div className="info-box-print border-l border-slate-300 pl-8">
                     <span className="label-p uppercase">Audit Periodicity</span>
                     <span className="value-p uppercase font-bold">{filters.fromDate} → {filters.toDate}</span>
                  </div>
               </div>
               <div className="stamp-section-print">
                  <div className="audit-title-box">
                     <h2 className="stamp-h2 px-4 py-2 bg-black text-emerald-500 rounded-lg font-bold inline-block">BALANCE SHEET</h2>
                  </div>
                  <p className="conf-text mt-2 uppercase text-[8px] text-slate-500">Internal Audit View • PIN-SEC-92</p>
               </div>
            </div>
         </div>

         {/* 🔍 FILTERS (ON SCREEN) */}
         <div className="bg-white p-5 border border-slate-200 rounded-[2rem] shadow-emerald-900/5 shadow-xl no-print-section relative overflow-hidden group/filt">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover/filt:opacity-10 transition-opacity">
               <Search size={120} className="text-slate-900" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6 items-end relative z-10">
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Audit From</label>
                  <div className="relative">
                     <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={14} />
                     <input type="date" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-[11px] outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner" />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Audit To</label>
                  <div className="relative">
                     <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={14} />
                     <input type="date" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-[11px] outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner" />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Network Node</label>
                  <div className="relative">
                     <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={14} />
                     <select value={filters.branch_id} onChange={e => setFilters({...filters, branch_id: e.target.value})} className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-[11px] outline-none appearance-none cursor-pointer focus:border-emerald-500 transition-all shadow-inner">
                        <option value="">ALL CONSOLIDATED NODES</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                     </select>
                  </div>
               </div>
               <div className="flex gap-2">
                  <button onClick={handleGetDetails} disabled={loading} className="flex-1 bg-slate-900 text-white rounded-xl h-[45px] font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl">
                     {loading ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />} AUDIT DETAILS
                  </button>
                  <button onClick={() => setFilters({fromDate: '', toDate: '', branch_id: ''})} className="w-[45px] h-[45px] bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-500 transition-all">
                     <FilterX size={16} />
                  </button>
               </div>
            </div>
         </div>

         {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-center gap-4 no-print-section text-rose-500">
               <AlertCircle size={20} />
               <p className="text-[11px] font-black uppercase tracking-widest">{error}</p>
            </div>
         )}

         {/* 📊 DATA AREA (3-COLUMN GRID ON SCREEN) */}
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 screen-data-layout">
            <div className="lg:col-span-3 space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 screen-cards-grid">
                  <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-xl audit-summary-card-p">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none italic font-bold">ToPay Receivables</p>
                     <p className="text-3xl font-black text-slate-900 tracking-tighter italic font-bold">₹{data.topay.toLocaleString()}</p>
                     <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 h-3 bg-slate-50 border border-slate-100 rounded-full overflow-hidden flex">
                           <div className="h-full bg-orange-500" style={{ width: `${(data.topay / Math.max(1, data.total_balance)) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-orange-600 italic">{Math.round((data.topay / Math.max(1, data.total_balance)) * 100)}%</span>
                     </div>
                  </div>

                  <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-xl audit-summary-card-p">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none italic font-bold">Paid Collections</p>
                     <p className="text-3xl font-black text-slate-900 tracking-tighter italic font-bold">₹{data.paid.toLocaleString()}</p>
                     <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 h-3 bg-slate-50 border border-slate-100 rounded-full overflow-hidden flex">
                           <div className="h-full bg-emerald-500" style={{ width: `${(data.paid / Math.max(1, data.total_balance)) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 italic">{Math.round((data.paid / Math.max(1, data.total_balance)) * 100)}%</span>
                     </div>
                  </div>

                  <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-xl audit-summary-card-p">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none italic font-bold">Account Credit</p>
                     <p className="text-3xl font-black text-slate-900 tracking-tighter italic font-bold">₹{data.account.toLocaleString()}</p>
                     <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 h-3 bg-slate-50 border border-slate-100 rounded-full overflow-hidden flex">
                           <div className="h-full bg-blue-500" style={{ width: `${(data.account / Math.max(1, data.total_balance)) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-blue-600 italic">{Math.round((data.account / Math.max(1, data.total_balance)) * 100)}%</span>
                     </div>
                  </div>
               </div>

               <div className="bg-slate-950 p-10 rounded-[3rem] text-white shadow-2xl terminal-print-box relative overflow-hidden group">
                  <div className="text-center relative z-10">
                     <p className="text-xs font-black uppercase tracking-[0.6em] text-emerald-500 mb-4 italic font-bold opacity-80 decoration-emerald-900/50 underline lg:decoration-none">Consolidated Net Booking Value</p>
                     <h2 className="text-7xl font-black italic tracking-tighter text-white font-black leading-none group-hover:scale-105 transition-transform">₹{data.total_balance.toLocaleString()}</h2>
                  </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl chart-box no-print-section">
               <div className="flex items-center gap-3 mb-6 w-full italic">
                  <PieChartIcon size={20} className="text-emerald-600" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Revenue Flux</h3>
               </div>
               <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
            </div>
         </div>
      </div>

      <style>{`
        .hidden-screen { display: none !important; }
        
        @media print {
          /* SURGICAL PRINT FORCE */
          body * { visibility: hidden !important; background: transparent !important; }
          #balance-sheet-audit, .audit-printable-content, .audit-printable-content * { visibility: visible !important; }
          
          #balance-sheet-audit { 
             position: absolute !important; top: 0 !important; left: 0 !important; 
             width: 100% !important; display: block !important; margin: 0 !important; padding: 0 !important;
          }
          .audit-printable-content { padding: 10mm !important; display: block !important; width: 100% !important; }
          .no-print-section { display: none !important; }
          .hidden-screen { display: block !important; }

          /* HEADER */
          .print-header-block { border-bottom: 2pt solid black !important; padding-bottom: 15pt !important; width: 100% !important; margin-bottom: 25pt !important; }
          .flex-print-row { display: flex !important; flex-direction: row !important; justify-content: space-between !important; width: 100% !important; }
          .main-logo-section { width: 40% !important; }
          .audit-logo-txt { font-size: 26pt !important; line-height: 1 !important; color: black !important; font-weight: 900 !important; }
          .audit-subtext { font-size: 8pt !important; color: #666 !important; }
          
          .audit-details-section { width: 35% !important; display: flex !important; flex-direction: row !important; gap: 20pt !important; }
          .info-box-print { display: flex !important; flex-direction: column !important; }
          .label-p { font-size: 7pt !important; color: #888 !important; }
          .value-p { font-size: 9pt !important; color: black !important; font-weight: bold !important; }
          
          .stamp-section-print { width: 25% !important; text-align: right !important; }
          .stamp-h2 { background: black !important; color: #10b981 !important; padding: 8pt 15pt !important; border-radius: 8pt !important; -webkit-print-color-adjust: exact !important; }

          /* DATA GRID RE-ALIGN FOR PRINT */
          .screen-data-layout { display: block !important; width: 100% !important; }
          .screen-cards-grid { display: flex !important; flex-direction: row !important; gap: 15pt !important; margin-bottom: 25pt !important; width: 100% !important; }
          .audit-summary-card-p { flex: 1 !important; border: 1pt solid #ddd !important; padding: 15pt !important; border-radius: 12pt !important; background: white !important; }
          
          .terminal-print-box { 
             background: black !important; color: white !important; padding: 40pt !important; 
             text-align: center !important; border-radius: 15pt !important; -webkit-print-color-adjust: exact !important; 
          }
          .terminal-print-box * { color: inherit !important; background: transparent !important; }

          @page { size: portrait; margin: 0; }
        }
      `}</style>
    </div>
  )
}

export default BalanceSheet
