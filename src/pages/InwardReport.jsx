import React, { useState, useEffect } from 'react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';
import {
  Search, Calendar, Loader2, Download, AlertCircle,
  MapPin, Clock, Package, DollarSign, RefreshCcw, FilterX,
  Building, CheckCircle2, Truck, ChevronRight, ArrowRight, X
} from 'lucide-react'

function InwardReport() {
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    inward_branch_id: '',
    status: 'All'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState([])
  const [summary, setSummary] = useState(null)
  const [branches, setBranches] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const userString = localStorage.getItem('user')
    if (userString) {
      const user = JSON.parse(userString)
      setCurrentUser(user)
      if (user.role !== 'superadmin' && user.branch_id) {
        setFilters(prev => ({ ...prev, inward_branch_id: user.branch_id }))
      }
    }
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches`)
      const d = await response.json()
      if (d.success) setBranches(d.data)
    } catch (err) {
      console.error('Error fetching branches:', err)
    }
  }

  const handleGetDetails = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (filters.fromDate) params.append('from_date', filters.fromDate)
      if (filters.toDate) params.append('to_date', filters.toDate)
      if (filters.inward_branch_id) params.append('inward_branch_id', filters.inward_branch_id)
      if (filters.status && filters.status !== 'All') params.append('status', filters.status)

      const response = await fetch(`${API_BASE_URL}/reports/inward-status?${params.toString()}`)
      if (!response.ok) throw new Error('Could not reach server')
      const d = await response.json()

      if (d.success) {
        setData(d.data || [])
        setSummary(d.summary || { total_count: 0, total_articles: 0, total_freight: 0 })
        if ((d.data || []).length === 0) {
          setError('No records found for the selected filters. Verify if GCs were inwarded during this period.')
        }
      } else {
        setError(d.message || 'Report retrieval failed')
      }
    } catch (err) {
      console.error('Inward report error:', err)
      setError('Connection failure. Check if backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!data || data.length === 0) return
    const headers = ['Inward Date', 'GC No', 'Origin', 'Destination', 'Consignee', 'Status', 'Articles', 'Freight']
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        item.inward_at ? new Date(item.inward_at).toLocaleDateString() : 'N/A',
        item.gc_number,
        item.origin_branch?.branch_name || 'N/A',
        item.destination?.city_name || 'N/A',
        item.consignee?.name || 'N/A',
        item.status,
        item.total_articles,
        item.grand_total
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Inward_Report_${new Date().getTime()}.csv`
    link.click()
  }

  return (
    <div className="p-3 space-y-3 bg-[#f8fafc] min-h-screen font-['Plus_Jakarta_Sans',_sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-2.5 rounded-2xl shadow-sm border border-indigo-50 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100 text-white">
            <Truck size={16} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-sm font-black text-gray-900 tracking-tight leading-none uppercase">Inward Report</h1>
            <p className="text-gray-600 mt-1 font-black text-[6px] uppercase tracking-widest">Arrival Data Manifest</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-indigo-50 px-2 py-1 rounded-xl border border-indigo-100 self-end sm:self-auto uppercase">
          <div className="flex flex-col">
            <span className="text-[5px] font-black text-indigo-700 uppercase tracking-widest leading-none mb-0.5">Reporting Branch</span>
            <span className="text-indigo-900 text-[9px] font-black tracking-tight">
              {filters.inward_branch_id
                ? (branches.find(b => b.id.toString() === filters.inward_branch_id.toString())?.branch_name || currentUser?.branch_name)
                : 'ALL BRANCHES'
              }
            </span>
          </div>
          <div className="w-px h-4 bg-indigo-200 mx-0.5"></div>
          <MapPin size={10} className="text-indigo-600" />
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm p-3 border border-indigo-50 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-700 uppercase tracking-widest ml-1">Period From</label>
            <div className="relative group">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500" size={14} />
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-indigo-500 focus:bg-white focus:outline-none transition-all text-[11px] font-black shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-700 uppercase tracking-widest ml-1">Period To</label>
            <div className="relative group">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500" size={14} />
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-indigo-500 focus:bg-white focus:outline-none transition-all text-[11px] font-black shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-700 uppercase tracking-widest ml-1">Status Filter</label>
            <div className="relative group">
              <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500" size={14} />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-indigo-500 focus:bg-white focus:outline-none transition-all text-[11px] font-black appearance-none cursor-pointer shadow-inner"
              >
                <option value="All">All Inwarded GCs (Any Status)</option>
                <option value="INWARDED">Currently In Stock (Inwarded)</option>
                <option value="RECEIVED">Received at Branch</option>
                <option value="LOCAL_TRIP">Out for Delivery (Local Trip)</option>
                <option value="DELIVERED">Delivered (Completed)</option>
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 rotate-90" size={12} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-700 uppercase tracking-widest ml-1">Inward Branch</label>
            <div className="relative group">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500" size={14} />
              {currentUser?.role === 'superadmin' ? (
                <select
                  value={filters.inward_branch_id}
                  onChange={(e) => setFilters({ ...filters, inward_branch_id: e.target.value })}
                  className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-indigo-500 focus:bg-white focus:outline-none transition-all text-[11px] font-black appearance-none cursor-pointer shadow-inner"
                >
                  <option value="">All Receiving Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  readOnly
                  value={currentUser?.branch_name || 'Own Branch'}
                  className="w-full pl-9 pr-3 py-1.5 bg-gray-100 border-2 border-gray-100 rounded-lg text-gray-500 font-black text-[11px] cursor-not-allowed uppercase"
                />
              )}
              {currentUser?.role === 'superadmin' && (
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 rotate-90" size={12} />
              )}
            </div>
          </div>

          <div className="flex items-end px-1 pb-0.5">
            <button
              onClick={handleGetDetails}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <><Search size={14} strokeWidth={3} /> GET DETAILS</>}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
          <AlertCircle size={18} />
          <p className="text-[10px] font-black uppercase tracking-tight">{error}</p>
          <button onClick={() => setError('')} className="ml-auto opacity-50 hover:opacity-100"><X size={14} /></button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && summary.total_count > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white p-2.5 rounded-2xl border border-indigo-50 shadow-sm flex items-center gap-3 hover:border-indigo-100 transition-colors">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Package size={16} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Total Inwarded</p>
              <p className="text-lg font-black text-gray-900 tracking-tight leading-none">{summary.total_count}</p>
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-2xl border border-blue-50 shadow-sm flex items-center gap-3 hover:border-blue-100 transition-colors">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <RefreshCcw size={16} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Articles Moved</p>
              <p className="text-lg font-black text-gray-900 tracking-tight leading-none">{summary.total_articles}</p>
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-2xl border border-amber-50 shadow-sm flex items-center gap-3 hover:border-amber-100 transition-colors">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <DollarSign size={16} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Inward Value</p>
              <p className="text-lg font-black text-gray-900 tracking-tight leading-none">₹{parseFloat(summary.total_freight || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-indigo-50 overflow-hidden flex flex-col flex-1 min-h-[400px]">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-indigo-50/10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
            <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Inward Manifest Data</h3>
          </div>
          <div className="flex items-center gap-3">
             {/* NEW: Quick Search Bar */}
             <div className="relative no-print">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                <input 
                  type="text"
                  placeholder="GC Number / Consignee / Origin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-white border border-indigo-50 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 text-[10px] w-48 shadow-inner transition-colors"
                />
              </div>
          </div>
          {data.length > 0 && (
            <button
              onClick={exportToCSV}
              className="px-4 py-2 text-[9px] font-black text-indigo-700 uppercase tracking-widest hover:bg-indigo-50 rounded-xl flex items-center gap-2 transition-all border border-indigo-100 bg-white"
            >
              <Download size={14} strokeWidth={3} /> Export CSV
            </button>
          )}
        </div>

        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left border-collapse">
            <thead className="bg-indigo-900 sticky top-0 z-20 shadow-md text-white">
              <tr className="text-[9px] font-black text-white uppercase tracking-widest leading-none">
                <th className="px-6 py-3 font-black">Arrival Date</th>
                <th className="px-6 py-3 font-black">GC Number</th>
                <th className="px-6 py-3 font-black">Booking Branch</th>
                <th className="px-6 py-3 font-black">Destination</th>
                <th className="px-6 py-3 font-black">Consignee</th>
                <th className="px-6 py-3 font-black">Article Type</th>
                <th className="px-6 py-3 text-center font-black">Status</th>
                <th className="px-6 py-3 text-center font-black">Qty</th>
                <th className="px-6 py-3 text-right font-black">ToPay Amt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(() => {
                const filtered = data.filter(item => {
                  if (!searchTerm) return true;
                  const s = searchTerm.toLowerCase();
                  return (
                    (item.gc_number || '').toLowerCase().includes(s) ||
                    (item.consignee?.name || '').toLowerCase().includes(s) ||
                    (item.origin_branch?.branch_name || '').toLowerCase().includes(s) ||
                    (item.destination?.city_name || '').toLowerCase().includes(s)
                  );
                });
                if (filtered.length === 0) return (
                  <tr>
                    <td colSpan="9" className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center opacity-30">
                        <FilterX size={48} className="text-gray-600 mb-3" />
                        <p className="text-xs font-black uppercase tracking-widest text-gray-700">No Data Detected</p>
                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter mt-1">Adjust date range or branch selection</p>
                      </div>
                    </td>
                  </tr>
                );
                return filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition-all duration-200 border-l-4 border-transparent hover:border-indigo-500 group">
                    <td className="px-6 py-1.5">
                      <div className="flex flex-col leading-tight">
                        <span className="text-[10px] font-bold text-gray-900 tracking-tight">
                          {item.inward_at ? new Date(item.inward_at).toLocaleDateString('en-GB') : '-'}
                        </span>
                        <span className="text-[8px] text-gray-600 font-bold uppercase tracking-tight">
                          {item.inward_at ? new Date(item.inward_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-1.5">
                      <span className="font-black text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{item.gc_number}</span>
                    </td>
                    <td className="px-6 py-1.5 text-[9px] font-bold text-gray-700 uppercase tracking-tight">
                      {item.origin_branch?.branch_name || item.originBranch?.branch_name || 'N/A'}
                    </td>
                    <td className="px-6 py-1.5 text-[9px] font-bold text-gray-700 uppercase tracking-tight">
                      {item.destination?.city_name || 'N/A'}
                    </td>
                    <td className="px-6 py-1.5 text-[9px] font-bold text-gray-800 uppercase tracking-tight truncate max-w-[150px]" title={item.consignee?.name}>
                      {item.consignee?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-1.5 text-[8px] font-bold text-gray-700 uppercase tracking-tight">
                      {item.articles && item.articles.length > 0
                        ? item.articles.map(a => a.article_type).filter(Boolean).join(', ') || '-'
                        : item.article_desc || '-'
                      }
                    </td>
                    <td className="px-6 py-1.5 text-center">
                      <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold tracking-widest uppercase border ${
                        item.status === 'RECEIVED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        item.status === 'LOCAL_TRIP' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        item.status === 'Delivered' || item.status === 'DELIVERED' ? 'bg-green-50 text-green-700 border-green-100' :
                        item.status === 'INWARDED' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                        {item.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-1.5 text-center">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold text-[9px] border border-indigo-100">
                        {item.total_articles}
                      </span>
                    </td>
                    <td className="px-6 py-1.5 text-right font-bold text-gray-900">
                      <span className={`px-2 py-0.5 rounded-md border text-[9px] ${
                        item.account_type === 'topay'
                        ? 'bg-rose-50 text-rose-600 border-rose-100'
                        : 'bg-gray-50 text-gray-400 border-gray-100'
                      }`}>
                        ₹{parseFloat(item.grand_total || 0).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default InwardReport
