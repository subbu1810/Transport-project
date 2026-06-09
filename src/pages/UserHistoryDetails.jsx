import React, { useState, useEffect, useMemo } from 'react'
import { 
  Calendar, Building, User as UserIcon, Search, FileText, CheckCircle, Clock, 
  DollarSign, PieChart, Activity, Loader2, Download, FilterX, RefreshCcw,
  ArrowUpRight, ArrowDownRight, UserCheck
} from 'lucide-react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function UserHistoryDetails() {
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    branchId: '',
    userId: ''
  })

  const [branches, setBranches] = useState([])
  const [users, setUsers] = useState([])
  const [waybills, setWaybills] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMeta()
  }, [])

  const fetchMeta = async () => {
    try {
      const [brResp, usrResp] = await Promise.all([
        axios.get(`${API_BASE_URL}/branches`),
        axios.get(`${API_BASE_URL}/admins`)
      ])
      if (brResp.data.success) setBranches(brResp.data.data || [])
      if (usrResp.data.success) setUsers(usrResp.data.data || [])
    } catch (err) { console.error("Meta fetch error", err) }
  }

  const filteredUsers = useMemo(() => {
    if (!filters.branchId) return users;
    const selectedBranch = branches.find(b => b.id.toString() === filters.branchId.toString());
    if (!selectedBranch) return users;
    return users.filter(u => u.branch_code === selectedBranch.branch_code);
  }, [filters.branchId, users, branches]);

  const fetchReport = async () => {
    try {
      setLoading(true)
      setError('')
      const params = { from_date: filters.fromDate, to_date: filters.toDate }
      if (filters.branchId) params.branch_id = filters.branchId
      if (filters.userId) params.created_by = filters.userId

      const response = await axios.get(`${API_BASE_URL}/reports/user-history`, { params })
      if (response.data.success) {
        setWaybills(response.data.data)
      } else {
        setError(response.data.message || 'Failed to fetch results')
      }
    } catch (err) {
      setError('Connection failure. Check if server is running.')
    } finally { setLoading(false) }
  }

  const exportExcel = () => {
    if (waybills.length === 0) return
    const dataToExport = waybills.map(wb => ({
      'Date': new Date(wb.bill_date).toLocaleDateString('en-GB'),
      'GC Number': wb.gc_number,
      'Destination': wb.destination?.city_name || 'N/A',
      'Status': wb.status,
      'Freight Type': wb.account_type,
      'Total Amount': wb.grand_total,
      'Amount Paid': wb.amount_paid,
      'Balance': wb.grand_total - wb.amount_paid
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "User History")
    XLSX.writeFile(wb, `Audit_Report_${filters.userId}_${new Date().getTime()}.xlsx`)
  }

  const summary = useMemo(() => ({
    booking: waybills.length,
    delivered: waybills.filter(w => w.status?.toUpperCase() === 'DELIVERED').length,
    pending: waybills.filter(w => w.status?.toUpperCase() !== 'DELIVERED').length,
    account: waybills.filter(w => w.account_type?.toUpperCase() === 'ACCOUNT').length,
    topay: waybills.filter(w => (w.account_type?.toUpperCase() === 'TOPAY' || w.account_type?.toUpperCase() === 'TO PAY')).length,
    paid: waybills.filter(w => (w.account_type?.toUpperCase() === 'PAID' || w.account_type?.toUpperCase() === 'CASH')).length,
    paidBookingAmt: waybills.filter(w => (w.account_type?.toUpperCase() === 'PAID' || w.account_type?.toUpperCase() === 'CASH')).reduce((sum, w) => sum + parseFloat(w.grand_total || 0), 0),
    paidReceivedAmt: waybills.filter(w => (w.account_type?.toUpperCase() === 'PAID' || w.account_type?.toUpperCase() === 'CASH')).reduce((sum, w) => sum + parseFloat(w.amount_paid || 0), 0)
  }), [waybills]);

  return (
    <div className="p-3 space-y-3 bg-gray-50/50 min-h-screen">
      {/* Search Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <UserCheck size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-800 uppercase tracking-tight">User History Report</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Track Clerk / Staff entries & Performance</p>
            </div>
          </div>
          <button
            onClick={exportExcel}
            disabled={waybills.length === 0}
            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-green-100 transition-all border border-green-100 disabled:opacity-50"
          >
            <Download size={14} /> DOWNLOAD EXCEL
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1 md:col-span-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                  className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-indigo-500 text-xs font-black outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-1 md:col-span-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                  className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-indigo-500 text-xs font-black outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-1 md:col-span-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Branch</label>
              <select
                value={filters.branchId}
                onChange={(e) => setFilters({ ...filters, branchId: e.target.value, userId: '' })}
                className="w-full px-3 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-indigo-500 text-xs font-black outline-none transition-all appearance-none uppercase"
              >
                <option value="">All Branches</option>
                {branches.map(br => <option key={br.id} value={br.id}>{br.branch_name}</option>)}
              </select>
            </div>
            <div className="space-y-1 md:col-span-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Select User / Staff</label>
              <select
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                className="w-full px-3 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-indigo-500 text-xs font-black outline-none transition-all appearance-none uppercase"
              >
                <option value="">All Users</option>
                {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-gray-200"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                VIEW REPORT
              </button>
              <button
                onClick={() => setFilters({ ...filters, branchId: '', userId: '' })}
                className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 border-2 border-gray-100 transition-all"
              >
                <FilterX size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-3 text-red-600">
          <Activity size={16} />
          <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      {/* Audit Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Activity Profiling */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Activity size={14} /></div>
            <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Activity Audit</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">Total Bookings</span>
              <span className="text-gray-900 font-black">{summary.booking}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">Successfully Delivered</span>
              <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-black">{summary.delivered}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">In-Transit Status</span>
              <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px] font-black">{summary.pending}</span>
            </div>
          </div>
        </div>

        {/* Freight Segmentation */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><PieChart size={14} /></div>
            <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Freight Split</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">Account Based</span>
              <span className="text-purple-700 font-black">{summary.account}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">ToPay Collection</span>
              <span className="text-orange-700 font-black">{summary.topay}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">Paid / Cash</span>
              <span className="text-blue-700 font-black">{summary.paid}</span>
            </div>
          </div>
        </div>

        {/* Financial Flow */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={14} /></div>
            <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Cash Audit (Paid)</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">Booked Value</span>
              <span className="text-gray-900 font-black">₹{summary.paidBookingAmt.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">Actual Receipt</span>
              <span className="text-emerald-600 font-black">₹{summary.paidReceivedAmt.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">Recovery Gap</span>
              <span className="text-red-600 font-black italic">₹{(summary.paidBookingAmt - summary.paidReceivedAmt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Efficiency Index */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg"><Activity size={14} /></div>
            <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Staff Efficiency</h3>
          </div>
          <div className="flex flex-col items-center justify-center h-[60px]">
            <span className="text-2xl font-black text-indigo-600 tracking-tighter">
              {summary.booking > 0 ? Math.round((summary.delivered / summary.booking) * 100) : 0}%
            </span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Delivery Closure Rate</span>
          </div>
        </div>
      </div>

      {/* Master Transaction Ledger */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <FileText size={14} /> Transaction Ledger ({waybills.length} Records)
          </h3>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">GC Number</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Destination</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Protocol</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Value</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Collection</th>
                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[11px] font-bold">
              {waybills.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center text-gray-400 italic">
                    {loading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Scrutinizing Personnel Logs...</span>
                      </div>
                    ) : 'No audit entries found. Apply filters and Scrutinize.'}
                  </td>
                </tr>
              ) : waybills.map((wb, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex flex-col leading-none">
                      <span className="text-gray-500 font-mono tracking-tight">{new Date(wb.bill_date).toLocaleDateString()}</span>
                      <span className="text-[9px] text-gray-300 uppercase mt-0.5">{new Date(wb.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-indigo-600 font-black tracking-tight">{wb.gc_number}</td>
                  <td className="px-4 py-3 uppercase text-gray-700">{wb.destination?.city_name || 'DIRECT'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                      wb.account_type?.toUpperCase() === 'ACCOUNT' ? 'bg-purple-100 text-purple-700' :
                      wb.account_type?.toUpperCase() === 'TOPAY' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {wb.account_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 font-black">₹{parseFloat(wb.grand_total).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-black">₹{parseFloat(wb.amount_paid).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {wb.status?.toUpperCase() === 'DELIVERED' ? (
                        <span className="flex items-center gap-1 text-green-600 font-black uppercase text-[10px]">
                          <CheckCircle size={12} strokeWidth={3} /> Delivered
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-yellow-600 font-black uppercase text-[10px]">
                          <Clock size={12} strokeWidth={3} /> {wb.status || 'Booked'}
                        </span>
                      )}
                    </div>
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

export default UserHistoryDetails
