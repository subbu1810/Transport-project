import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Search, Loader2, AlertCircle, FileText, Download, Calendar, Database, LayoutList, Clock, SearchX, MapPin, Package, TrendingUp } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function DispatchPendingReport() {
  const user = JSON.parse(localStorage.getItem('user'))
  const isSuperAdmin = user?.role === 'superadmin'

  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    branch_id: isSuperAdmin ? '' : (user?.branch_id || ''),
    account_type: ''
  })

  const [waybills, setWaybills] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [branches, setBranches] = useState([])

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/branches`)
      if (response.data.success) {
        const data = response.data.data
        if (isSuperAdmin) {
          setBranches(data)
        } else {
          setBranches(data.filter(b => b.id == user.branch_id))
        }
      }
    } catch (err) {
      console.error('Error fetching branches:', err)
    }
  }

  const handleGetDetails = async () => {
    try {
      setLoading(true)
      setError('')

      // Use available_at_branch to see what is physically at the location
      const params = {
        from_date: filters.fromDate,
        to_date: filters.toDate
      }
      
      if (filters.branch_id) {
        params.available_at_branch = filters.branch_id
      } else {
        // If "All Branches" is selected (superadmin), fallback to status list
        params.status = 'PENDING,Booked,INWARDED,RECEIVED'
      }

      if (filters.account_type) params.account_type = filters.account_type

      const response = await axios.get(`${API_BASE_URL}/waybills`, { params })

      if (response.data.success) {
        setWaybills(response.data.data)
        if (response.data.data.length === 0) {
          setError('No pending dispatches or stock found for the selected criteria')
        }
      } else {
        setError(response.data.message || 'Failed to fetch report')
      }
    } catch (err) {
      console.error('Error fetching dispatch pending report:', err)
      setError('Error connecting to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const calculatePendingDays = (billDate) => {
    const today = new Date()
    const bill = new Date(billDate)
    const diffTime = Math.abs(today - bill)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const exportToExcel = () => {
    if (waybills.length === 0) return
    const headers = ['Branch', 'Bill Date', 'Pending Days', 'GC Number', 'Destination', 'Invoice No', 'Articles', 'Weight', 'Total Amount']
    const csvContent = [
      headers.join(','),
      ...waybills.map(wb => [
        wb.origin_branch?.branch_name || '-',
        wb.bill_date,
        calculatePendingDays(wb.bill_date),
        wb.gc_number,
        wb.destination?.city_name || '-',
        wb.invoice_no || '-',
        wb.total_articles,
        wb.actual_weight || 0,
        wb.grand_total
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Dispatch_Pending_Report_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="h-full bg-[#fdfaf8] p-2 md:p-4 font-outfit overflow-auto">
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-br from-orange-500 to-rose-600 rounded-2xl shadow-lg ring-4 ring-orange-50">
              <Clock className="text-white" size={22} />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Dispatch Pending</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px]">Warehouse Audit Registry</p>
            </div>
          </div>
          <button
            onClick={exportToExcel}
            disabled={waybills.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-white border border-orange-100 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all shadow-sm disabled:opacity-30 group"
          >
            <Download size={14} className="group-hover:translate-y-0.5 transition-transform" /> Export Data
          </button>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 mx-2">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <Calendar size={12} className="text-orange-500" /> From Date
              </label>
              <input 
                type="date" 
                value={filters.fromDate} 
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:border-orange-500 focus:bg-white outline-none font-bold text-slate-700 text-xs transition-all" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <Calendar size={12} className="text-orange-500" /> To Date
              </label>
              <input 
                type="date" 
                value={filters.toDate} 
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:border-orange-500 focus:bg-white outline-none font-bold text-slate-700 text-xs transition-all" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <Database size={12} className="text-orange-500" /> Origin Branch
              </label>
              {isSuperAdmin ? (
                <select 
                  value={filters.branch_id} 
                  onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })} 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:border-orange-500 focus:bg-white outline-none font-bold text-slate-700 text-xs transition-all cursor-pointer"
                >
                  <option value="">All Branches</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                </select>
              ) : (
                <div className="w-full px-4 py-2 bg-slate-100 border border-slate-100 rounded-xl font-bold text-slate-500 text-xs uppercase italic">
                  {user?.branch_name || 'My Branch'}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <FileText size={12} className="text-orange-500" /> Payment Type
              </label>
              <select 
                value={filters.account_type} 
                onChange={(e) => setFilters({ ...filters, account_type: e.target.value })} 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:border-orange-500 focus:bg-white outline-none font-bold text-slate-700 text-xs transition-all cursor-pointer"
              >
                <option value="">All Types</option>
                <option value="paid">PAID</option>
                <option value="topay">TO PAY</option>
                <option value="billing">BILLING</option>
              </select>
            </div>
            <button 
              onClick={handleGetDetails} 
              disabled={loading} 
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
              Generate List
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-2 bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 animate-fade-up">
            <AlertCircle size={18} className="text-rose-500" />
            <p className="text-rose-700 font-bold text-xs uppercase tracking-tight">{error}</p>
          </div>
        )}

        {waybills.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mx-2 animate-fade-up">
            <div className="bg-gradient-to-br from-orange-500 to-rose-600 p-5 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-orange-100 text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">Total Pending Value</p>
                <h2 className="text-2xl font-black tracking-tight">₹{waybills.reduce((sum, wb) => sum + parseFloat(wb.grand_total || 0), 0).toLocaleString()}</h2>
              </div>
              <TrendingUp className="absolute -bottom-2 -right-2 text-white opacity-10" size={100} />
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-colors">
              <div>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Waybill Count</p>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{waybills.length}</h2>
              </div>
              <div className="p-3 bg-orange-50 rounded-2xl text-orange-500 group-hover:rotate-12 transition-transform">
                <Package size={24} />
              </div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
              <div>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Stock Aging</p>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  {Math.max(...waybills.map(wb => calculatePendingDays(wb.bill_date)))}<span className="text-sm ml-1">Days</span>
                </h2>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
                <Clock size={24} />
              </div>
            </div>
          </div>
        )}

        {waybills.length > 0 ? (
          <div className="mx-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-up pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-extrabold uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4 text-left">Location / Type</th>
                    <th className="px-6 py-4 text-left">Bill Date</th>
                    <th className="px-6 py-4 text-center">Wait Time</th>
                    <th className="px-6 py-4 text-left">GC Number</th>
                    <th className="px-6 py-4 text-left">Destination</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Qty/Wt</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {waybills.map((wb, idx) => {
                    const days = calculatePendingDays(wb.bill_date)
                    return (
                      <tr key={idx} className="hover:bg-orange-50/30 transition-all group">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-700 leading-tight">{wb.origin_branch?.branch_name || '-'}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Origin Branch</p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-400 whitespace-nowrap">{new Date(wb.bill_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${
                            days > 7 ? 'bg-rose-100 text-rose-700' : 
                            days > 3 ? 'bg-orange-100 text-orange-700' : 
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {days} {days === 1 ? 'Day' : 'Days'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-black text-orange-600 tracking-tight text-sm">{wb.gc_number}</p>
                          <p className="text-[9px] font-bold text-slate-400 truncate max-w-[120px]">{wb.consignor?.name || 'Party Name'}</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">{wb.destination?.city_name || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black border uppercase tracking-widest ${
                            wb.status === 'INWARDED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            wb.status === 'RECEIVED' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                            'bg-orange-50 text-orange-600 border-orange-100'
                          }`}>{wb.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-bold text-slate-600 font-mono">{wb.total_articles} <span className="text-[9px] font-black opacity-40">PCS</span></p>
                          <p className="text-[10px] font-bold text-slate-400">{wb.actual_weight || 0}kg</p>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-800 tracking-tight">₹{parseFloat(wb.grand_total || 0).toLocaleString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : !loading && (
          <div className="mx-2 py-20 bg-white rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-6 animate-fade-up">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
              <SearchX size={80} className="text-orange-100 relative z-10" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-[4px]">Clear Warehouse</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest max-w-[250px] leading-relaxed mx-auto">No pending dispatches found. Everything is in transit or delivered.</p>
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
      `}</style>
    </div>
  )
}

export default DispatchPendingReport
