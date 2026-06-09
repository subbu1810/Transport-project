import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/api';
import {
  Search, Calendar, Loader2, Download, AlertCircle,
  MapPin, Clock, Package, DollarSign, RefreshCcw, FilterX,
  Building, CheckCircle2, Truck, ChevronRight, ArrowRight
} from 'lucide-react'

function InwardStatusReport() {
  const currentUser = JSON.parse(localStorage.getItem('user'))
  
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    inward_branch_id: currentUser?.role !== 'superadmin' ? currentUser?.branch_id : '',
    status: 'All'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState([])
  const [summary, setSummary] = useState(null)
  const [branches, setBranches] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [columnSearch, setColumnSearch] = useState({ timestamp: '', gcNumber: '', origin: '', stakeholder: '', status: '' })

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    handleGetDetails()
  }, [filters.fromDate, filters.toDate, filters.inward_branch_id, filters.status])

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches`)
      const d = await response.json()
      if (d.success) {
        if (currentUser?.role === 'superadmin') {
          setBranches(d.data)
        } else {
          // For admin, only show their own branch
          const userBranch = d.data.find(b => b.id === currentUser?.branch_id)
          setBranches(userBranch ? [userBranch] : [])
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
      const params = new URLSearchParams()
      if (filters.fromDate) params.append('from_date', filters.fromDate)
      if (filters.toDate) params.append('to_date', filters.toDate)
      if (filters.inward_branch_id && filters.inward_branch_id !== 'All Branches') {
        params.append('inward_branch_id', filters.inward_branch_id)
      }
      if (filters.status && filters.status !== 'All') {
        params.append('status', filters.status)
      }

      const response = await fetch(`${API_BASE_URL}/reports/inward-status?${params.toString()}`)
      if (!response.ok) throw new Error('Could not reach server')
      const d = await response.json()

      if (d.success) {
        setData(d.data || [])
        setSummary(d.summary || { total_count: 0, total_articles: 0, total_freight: 0 })
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
    const headers = ['Inward Date', 'GC No', 'Origin', 'Consignee', 'Status', 'Articles', 'Freight']
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        item.inward_at ? new Date(item.inward_at).toLocaleDateString() : 'N/A',
        item.gc_number,
        item.origin_branch?.branch_name || item.originBranch?.branch_name || 'N/A',
        item.consignee?.name || 'N/A',
        item.status,
        item.total_articles,
        item.grand_total
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Inward_Status_${new Date().getTime()}.csv`
    link.click()
  }

  const filteredData = data.filter(item => {
    const s = searchTerm.toLowerCase();
    const globalMatch = !searchTerm || 
      (item.gc_number || '').toLowerCase().includes(s) || 
      (item.origin_branch?.branch_name || item.originBranch?.branch_name || '').toLowerCase().includes(s) ||
      (item.consignee?.name || '').toLowerCase().includes(s);

    const tsMatch = !columnSearch.timestamp || (item.inward_at || '').toLowerCase().includes(columnSearch.timestamp.toLowerCase()) || new Date(item.inward_at).toLocaleDateString('en-GB').includes(columnSearch.timestamp);
    const gcMatch = !columnSearch.gcNumber || (item.gc_number || '').toLowerCase().includes(columnSearch.gcNumber.toLowerCase());
    const originMatch = !columnSearch.origin || (item.origin_branch?.branch_name || item.originBranch?.branch_name || '').toLowerCase().includes(columnSearch.origin.toLowerCase());
    const stMatch = !columnSearch.stakeholder || (item.consignee?.name || '').toLowerCase().includes(columnSearch.stakeholder.toLowerCase());
    const statusMatch = !columnSearch.status || (item.status || '').toLowerCase().includes(columnSearch.status.toLowerCase());

    return globalMatch && tsMatch && gcMatch && originMatch && stMatch && statusMatch;
  });

  return (
    <div className="p-4 space-y-4 bg-gray-50/30 min-h-screen font-['Plus_Jakarta_Sans',_sans-serif]">
      {/* Search Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-emerald-50 overflow-hidden">
        <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md text-white border border-white/20">
              <Truck size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight uppercase leading-none">Inward Journal</h1>
              <p className="text-emerald-100 mt-1 font-bold text-[8px] uppercase tracking-widest">Consignment Arrival Surveillance</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGetDetails}
              disabled={loading}
              className="bg-white text-emerald-600 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} strokeWidth={3} />}
              Generate Report
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Period From</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500" size={16} />
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                  className="w-full pl-11 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all text-xs font-black shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Period To</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500" size={16} />
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                  className="w-full pl-11 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all text-xs font-black shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Receiving Branch</label>
              <div className="relative group">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500" size={16} />
                <select
                  value={filters.inward_branch_id}
                  onChange={(e) => setFilters({ ...filters, inward_branch_id: e.target.value })}
                  disabled={currentUser?.role !== 'superadmin'}
                  className="w-full pl-11 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all text-xs font-black appearance-none cursor-pointer shadow-inner disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {currentUser?.role === 'superadmin' && <option value="">All Receiving Branches</option>}
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                  ))}
                </select>
                {currentUser?.role === 'superadmin' && <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 rotate-90" size={14} />}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logistics Status</label>
              <div className="relative group">
                <RefreshCcw className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500" size={16} />
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full pl-11 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all text-xs font-black appearance-none cursor-pointer shadow-inner"
                >
                  <option value="All">Show All Statuses</option>
                  <option value="INWARDED">Inwarded (New)</option>
                  <option value="RECEIVED">Inward Arrived (Old)</option>
                  <option value="LOCAL_TRIP">In Transit (Local)</option>
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 rotate-90" size={14} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
          <AlertCircle size={20} />
          <p className="text-xs font-black uppercase tracking-tight">{error}</p>
        </div>
      )}

      {/* Stats Overview */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3.5 rounded-2xl border border-emerald-50 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-colors">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <Package size={22} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Inwarded</p>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{summary.total_count}</p>
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-blue-50 shadow-sm flex items-center gap-4 group hover:border-blue-200 transition-colors">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <CheckCircle2 size={22} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Articles</p>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{summary.total_articles}</p>
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-amber-50 shadow-sm flex items-center gap-4 group hover:border-amber-200 transition-colors">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
              <DollarSign size={22} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Inward Value</p>
              <p className="text-2xl font-black text-gray-900 tracking-tight">₹{parseFloat(summary.total_freight || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-emerald-50 overflow-hidden flex flex-col flex-1">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-emerald-50/20">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Arrival Data Manifest</h3>
          </div>
          <div className="flex items-center gap-3">
             {/* NEW: Quick Search Bar */}
             <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                <input 
                  type="text"
                  placeholder="GC # / Origin / Consignee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-white border border-emerald-100 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-700 text-[10px] w-48 shadow-inner transition-all"
                />
              </div>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 text-[10px] font-black text-emerald-700 uppercase tracking-widest hover:bg-emerald-100 rounded-xl flex items-center gap-2 transition-all border border-emerald-100 bg-white shadow-sm"
            >
              <Download size={14} strokeWidth={3} /> Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-auto max-h-[500px] relative">
          <table className="w-full text-left border-collapse border border-gray-200">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-[10px] font-black text-gray-900 uppercase tracking-wider border border-gray-200 whitespace-nowrap">Inward Timestamp</th>
                <th className="px-3 py-2 text-[10px] font-black text-gray-900 uppercase tracking-wider border border-gray-200 whitespace-nowrap">GC Number</th>
                <th className="px-3 py-2 text-[10px] font-black text-gray-900 uppercase tracking-wider border border-gray-200 whitespace-nowrap">Origin Point</th>
                <th className="px-3 py-2 text-[10px] font-black text-gray-900 uppercase tracking-wider border border-gray-200 whitespace-nowrap">Stakeholder</th>
                <th className="px-3 py-2 text-[10px] font-black text-gray-900 uppercase tracking-wider border border-gray-200 text-center whitespace-nowrap">Status</th>
                <th className="px-3 py-2 text-[10px] font-black text-gray-900 uppercase tracking-wider border border-gray-200 text-center whitespace-nowrap">Qty</th>
                <th className="px-3 py-2 text-[10px] font-black text-gray-900 uppercase tracking-wider border border-gray-200 text-right whitespace-nowrap">Freight</th>
                <th className="px-3 py-2 text-[10px] font-black text-gray-900 uppercase tracking-wider border border-gray-200 text-right whitespace-nowrap">ToPay</th>
              </tr>
              <tr className="bg-gray-50/50">
                <th className="px-2 py-1 border border-gray-200"><input type="text" placeholder="Search..." className="w-full text-[10px] p-1 border border-gray-300 rounded font-normal text-gray-800 focus:outline-none focus:border-emerald-500" value={columnSearch.timestamp} onChange={(e) => setColumnSearch({...columnSearch, timestamp: e.target.value})} /></th>
                <th className="px-2 py-1 border border-gray-200"><input type="text" placeholder="Search..." className="w-full text-[10px] p-1 border border-gray-300 rounded font-normal text-gray-800 focus:outline-none focus:border-emerald-500" value={columnSearch.gcNumber} onChange={(e) => setColumnSearch({...columnSearch, gcNumber: e.target.value})} /></th>
                <th className="px-2 py-1 border border-gray-200"><input type="text" placeholder="Search..." className="w-full text-[10px] p-1 border border-gray-300 rounded font-normal text-gray-800 focus:outline-none focus:border-emerald-500" value={columnSearch.origin} onChange={(e) => setColumnSearch({...columnSearch, origin: e.target.value})} /></th>
                <th className="px-2 py-1 border border-gray-200"><input type="text" placeholder="Search..." className="w-full text-[10px] p-1 border border-gray-300 rounded font-normal text-gray-800 focus:outline-none focus:border-emerald-500" value={columnSearch.stakeholder} onChange={(e) => setColumnSearch({...columnSearch, stakeholder: e.target.value})} /></th>
                <th className="px-2 py-1 border border-gray-200"><input type="text" placeholder="Search..." className="w-full text-[10px] p-1 border border-gray-300 rounded font-normal text-gray-800 focus:outline-none focus:border-emerald-500" value={columnSearch.status} onChange={(e) => setColumnSearch({...columnSearch, status: e.target.value})} /></th>
                <th className="px-2 py-1 border border-gray-200"></th>
                <th className="px-2 py-1 border border-gray-200"></th>
                <th className="px-2 py-1 border border-gray-200"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <Loader2 className="animate-spin text-emerald-500" size={48} />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter animate-pulse">Scanning Archive Database...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-32 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <FilterX size={48} />
                      <p className="mt-4 font-black uppercase text-xs tracking-widest font-mono">No matching records detected</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors group">
                  <td className="px-3 py-2 border border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-800">
                        {item.inward_at ? new Date(item.inward_at).toLocaleDateString('en-GB') : '-'}
                      </span>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Clock size={10} /> {item.inward_at ? new Date(item.inward_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs font-semibold text-gray-800 border border-gray-200 whitespace-nowrap">
                    {item.gc_number}
                  </td>
                  <td className="px-3 py-2 border border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-800">
                      <MapPin size={12} className="text-emerald-500" />
                      {item.origin_branch?.branch_name || item.originBranch?.branch_name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-3 py-2 border border-gray-200 whitespace-nowrap truncate max-w-[200px]">
                    <div className="text-xs font-medium text-gray-800 truncate" title={item.consignee?.name || 'PRIVATE'}>
                      {item.consignee?.name || 'PRIVATE'}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center border border-gray-200 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black tracking-widest whitespace-nowrap uppercase border ${['RECEIVED', 'INWARDED'].includes(item.status) ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      item.status === 'LOCAL_TRIP' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        item.status?.toUpperCase() === 'DELIVERED' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                      }`}>
                      {item.status || 'PENDING'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center border border-gray-200 whitespace-nowrap">
                    <span className="text-xs font-semibold text-gray-800">{item.total_articles}</span>
                  </td>
                  <td className="px-3 py-2 text-right border border-gray-200 whitespace-nowrap">
                    <span className="text-xs font-semibold text-gray-800">₹{parseFloat(item.grand_total || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-3 py-2 text-right border border-gray-200 whitespace-nowrap">
                    <span className={`text-xs font-semibold ${item.account_type === 'topay' ? 'text-rose-600' : 'text-gray-500'}`}>
                      {item.account_type === 'topay' ? `₹${parseFloat(item.grand_total || 0).toLocaleString()}` : '0.00'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default InwardStatusReport
