import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Search, Loader2, AlertCircle, FileText, Download, TrendingUp, UserCheck, LayoutList, Calendar, MapPin, SearchX, IndianRupee } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function PaymentPendingReport() {
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 4)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    branch: JSON.parse(localStorage.getItem('user'))?.role === 'superadmin' ? 'All Branches' : (JSON.parse(localStorage.getItem('user'))?.branch_id || 'All Branches')
  })

  const [branches, setBranches] = useState([])
  const [reportData, setReportData] = useState([])
  const [summary, setSummary] = useState({ total_pending: 0, total_count: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedIdx, setExpandedIdx] = useState(null)
  const [columnSearch, setColumnSearch] = useState({ consignor: '', accountType: '', gcCount: '' })

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/branches`)
      const data = response.data.data || []
      const user = JSON.parse(localStorage.getItem('user'))
      if (user && user.role !== 'superadmin') {
        setBranches(data.filter(b => b.id == user.branch_id))
      } else {
        setBranches(data)
      }
    } catch (err) { }
  }

  const handleGetDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      setExpandedIdx(null) // Reset expanded row
      const params = { from_date: filters.fromDate, to_date: filters.toDate }
      if (filters.branch !== 'All Branches') params.branch_id = filters.branch
      const response = await axios.get(`${API_BASE_URL}/reports/payment-pending`, { params })
      if (response.data.success) {
        setReportData(response.data.data)
        setSummary(response.data.summary)
        if (response.data.data.length === 0) setError('No outstanding receivables recorded.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    if (reportData.length === 0) return
    const headers = ['Consignor', 'Type', 'GCs', 'Total Bill', 'Paid', 'Pending']
    const rows = reportData.map(item => [
      item.consignor_name, item.account_type.toUpperCase(), item.count,
      item.total_amount.toFixed(2), item.paid_amount.toFixed(2), item.pending_amount.toFixed(2)
    ])
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `pending_report.csv`
    link.click()
  }

  const filteredReportData = reportData.filter(item => {
    return (
      (item.consignor_name || '').toLowerCase().includes(columnSearch.consignor.toLowerCase()) &&
      (item.account_type || '').toLowerCase().includes(columnSearch.accountType.toLowerCase()) &&
      (item.count || '').toString().includes(columnSearch.gcCount)
    )
  })

  return (
    <div className="h-full bg-[#FDF8F8] p-2 md:p-4 font-outfit overflow-auto">
      <div className="w-full space-y-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-md">
              <FileText className="text-white" size={18} />
            </span>
            <div>
              <h1 className="text-lg font-black text-[#1E293B] tracking-tight">Payment Pending Report</h1>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Receivables Audit</p>
            </div>
          </div>
          <button
            onClick={exportToExcel}
            disabled={reportData.length === 0}
            className="flex items-center gap-1 px-4 py-1.5 bg-white border border-rose-100 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all shadow-sm disabled:opacity-30"
          >
            <Download size={14} /> Export
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-2 bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
            <AlertCircle size={16} className="text-rose-500" />
            <p className="text-rose-700 font-bold text-xs">{error}</p>
          </div>
        )}

        {/* Compact Filters Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mx-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={10} className="text-rose-500" /> From</label>
              <input type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg focus:border-rose-500 outline-none font-bold text-slate-700 text-[10px]" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={10} className="text-rose-500" /> To</label>
              <input type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg focus:border-rose-500 outline-none font-bold text-slate-700 text-[10px]" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><MapPin size={10} className="text-rose-500" /> Branch</label>
              {JSON.parse(localStorage.getItem('user'))?.role === 'superadmin' ? (
                <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg focus:border-rose-500 outline-none font-bold text-slate-700 text-[10px] cursor-pointer">
                  <option value="All Branches">All Branches</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                </select>
              ) : (
                <div className="w-full px-3 py-1.5 bg-slate-100 border border-slate-100 rounded-lg font-bold text-slate-500 text-[10px] uppercase">
                  {JSON.parse(localStorage.getItem('user'))?.branch_name || 'Own Branch'}
                </div>
              )}
            </div>
            <div className="flex items-end">
              <button onClick={handleGetDetails} disabled={loading} className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-black uppercase tracking-widest text-[9px] shadow-md transition-all active:scale-95 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={12} /> : 'Generate Audit'}
              </button>
            </div>
          </div>
        </div>

        {reportData.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mx-2 animate-fade-up">
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-3.5 rounded-xl text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-rose-100 text-[8.5px] font-black uppercase tracking-widest mb-0.5 opacity-80">Total Outstanding Balance</p>
                <h2 className="text-xl font-black tracking-tight flex items-center gap-1">
                  <span className="text-lg">₹</span>{summary.total_pending.toLocaleString()}
                </h2>
              </div>
              <IndianRupee className="absolute -bottom-2 -right-2 text-white opacity-10" size={54} />
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-rose-200 transition-colors">
              <div>
                <p className="text-slate-400 text-[8.5px] font-black uppercase tracking-widest mb-0.5">Total Waybills</p>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">{summary.total_count}</h2>
              </div>
              <div className="p-2.5 bg-rose-50 rounded-lg text-rose-500 group-hover:scale-110 transition-transform">
                <LayoutList size={18} />
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-colors">
              <div>
                <p className="text-slate-400 text-[8.5px] font-black uppercase tracking-widest mb-0.5">Pending Accounts</p>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">{reportData.length}</h2>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-500 group-hover:scale-110 transition-transform">
                <UserCheck size={18} />
              </div>
            </div>
          </div>
        )}

        {reportData.length > 0 ? (
          <div className="mx-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-up">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-700 font-extrabold uppercase tracking-widest border-b border-slate-100 italic-text">
                    <th className="px-6 py-4 text-left font-black">Consignor Name</th>
                    <th className="px-6 py-4 text-left">Account Type</th>
                    <th className="px-6 py-4 text-center">GC Count</th>
                    <th className="px-6 py-4 text-right">Billed Value</th>
                    <th className="px-6 py-4 text-right text-emerald-600">Recovered</th>
                    <th className="px-6 py-4 text-right text-rose-600 bg-rose-50/30">Total Due</th>
                    <th className="px-6 py-4 w-12"></th>
                  </tr>
                  <tr className="bg-white border-b border-slate-100">
                    <th className="px-4 py-2">
                      <input type="text" placeholder="Search Consignor..." className="w-full px-2 py-1.5 text-[11px] rounded-md border border-slate-200 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 font-medium normal-case tracking-normal" value={columnSearch.consignor} onChange={e => setColumnSearch({...columnSearch, consignor: e.target.value})} />
                    </th>
                    <th className="px-4 py-2">
                      <input type="text" placeholder="Search Type..." className="w-full px-2 py-1.5 text-[11px] rounded-md border border-slate-200 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 font-medium normal-case tracking-normal" value={columnSearch.accountType} onChange={e => setColumnSearch({...columnSearch, accountType: e.target.value})} />
                    </th>
                    <th className="px-4 py-2">
                      <input type="text" placeholder="Search GC Count..." className="w-full px-2 py-1.5 text-[11px] rounded-md border border-slate-200 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 font-medium normal-case tracking-normal text-center" value={columnSearch.gcCount} onChange={e => setColumnSearch({...columnSearch, gcCount: e.target.value})} />
                    </th>
                    <th className="px-4 py-2"></th>
                    <th className="px-4 py-2"></th>
                    <th className="px-4 py-2 bg-rose-50/30"></th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {filteredReportData.map((item, idx) => (
                    <React.Fragment key={idx}>
                      <tr 
                        className={`group transition-all cursor-pointer ${expandedIdx === idx ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}`}
                        onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg border transition-all ${expandedIdx === idx ? 'bg-rose-500 border-rose-500 text-white rotate-180' : 'bg-white border-slate-200 text-slate-400 group-hover:border-rose-300 group-hover:text-rose-400'}`}>
                              <LayoutList size={12} />
                            </div>
                            <span className="font-bold text-slate-800 text-sm tracking-tight">{item.consignor_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                            item.account_type === 'topay' ? 'bg-orange-100 text-orange-600 text-orange-700' : 
                            item.account_type === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>{item.account_type}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800 font-mono">{item.count}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800 tracking-tight">₹{item.total_amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-700 tracking-tight">₹{item.paid_amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-black text-rose-800 tracking-tight bg-rose-50/10">₹{item.pending_amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <Search size={16} className={`transition-all ${expandedIdx === idx ? 'text-rose-500 scale-110' : 'text-slate-200 group-hover:text-slate-400'}`} />
                        </td>
                      </tr>
                      {expandedIdx === idx && (
                        <tr className="bg-slate-50/20">
                          <td colSpan="7" className="px-8 py-4">
                            <div className="bg-white rounded-2xl border border-rose-100/50 overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
                              <div className="px-6 py-3 bg-gradient-to-r from-rose-50/50 to-white flex items-center justify-between border-b border-rose-50">
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-[2px]">Pending GC Details</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.count} Shipments found</span>
                              </div>
                              <table className="w-full text-[11px]">
                                <thead className="bg-slate-50/50 text-[10px] text-slate-700 uppercase font-black tracking-widest">
                                  <tr>
                                    <th className="px-6 py-3 text-left">GC Number</th>
                                    <th className="px-6 py-3 text-left">Bill Date</th>
                                    <th className="px-6 py-3 text-right">Invoice Value</th>
                                    <th className="px-6 py-3 text-right">Recovered</th>
                                    <th className="px-6 py-3 text-right text-rose-600 bg-rose-50/30">Current Due</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {item.waybills.map((wb, wbIdx) => (
                                    <tr key={wbIdx} className="hover:bg-rose-50/30 transition-colors group/sub">
                                      <td className="px-6 py-3 font-bold text-slate-800 group-hover/sub:text-rose-600 transition-colors font-mono">{wb.gc_number}</td>
                                      <td className="px-6 py-3 font-bold text-slate-700">{new Date(wb.bill_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                      <td className="px-6 py-3 text-right font-bold text-slate-800">₹{wb.grand_total.toLocaleString()}</td>
                                      <td className="px-6 py-3 text-right font-bold text-emerald-700">₹{wb.amount_paid.toLocaleString()}</td>
                                      <td className="px-6 py-3 text-right font-black text-rose-800 bg-rose-50/30 group-hover/sub:bg-rose-100/40 transition-colors">₹{wb.balance.toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : !loading && (
          <div className="mx-2 py-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-6 animate-fade-up">
            <div className="relative">
              <div className="absolute inset-0 bg-rose-200 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <SearchX size={64} className="text-rose-100 relative z-10" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-[#1E293B] uppercase tracking-[4px]">Awaiting Analysis</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest max-w-[200px] leading-relaxed mx-auto">Select criteria and run statement to audit receivables</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
        @keyframes fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tracking-widest { letter-spacing: 0.1em; }
        .font-black { font-weight: 850; }
        .italic-text { font-style: italic; }
      `}</style>
    </div>
  )
}

export default PaymentPendingReport
