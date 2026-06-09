import React, { useState, useEffect } from 'react'
import { Bell, Search, Building2, Calendar, Truck, User, AlertTriangle, Package, ChevronRight, RefreshCw } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function TripSheetAlert() {
  const [currentUser, setCurrentUser] = useState(null)
  const [branches, setBranches] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedRow, setExpandedRow] = useState(null)

  const [filters, setFilters] = useState({
    fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default last 30 days
    toDate: new Date().toISOString().split('T')[0],
    branchId: ''
  })

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setCurrentUser(user)
      // Pre-fill branch for non-superadmins — they only see their own branch alerts
      if (user.role !== 'superadmin' && user.branch_id) {
        setFilters(prev => ({ ...prev, branchId: user.branch_id }))
      }
    }
    fetchBranches()
  }, [])

  // Auto-fetch on mount for non-superadmin users once branch is set
  useEffect(() => {
    if (filters.branchId) {
      fetchAlerts()
    }
  }, [filters.branchId])

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/branches`)
      const data = await res.json()
      if (data.success) setBranches(data.data)
    } catch (err) {
      console.error('Error fetching branches:', err)
    }
  }

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (filters.fromDate) params.append('from_date', filters.fromDate)
      if (filters.toDate) params.append('to_date', filters.toDate)
      if (filters.branchId) params.append('branch_id', filters.branchId)

      const res = await fetch(`${API_BASE_URL}/trip-sheets/alerts?${params}`)
      const data = await res.json()

      if (data.success) {
        setAlerts(data.data)
        if (data.data.length === 0) {
          setError('No alert trip sheets found for the selected filters.')
        }
      } else {
        setError(data.message || 'Failed to fetch alerts')
      }
    } catch (err) {
      setError('Network error — could not reach server.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatDateTime = (d) => {
    if (!d) return '-'
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const selectedBranchName = branches.find(b => String(b.id) === String(filters.branchId))?.branch_name || 'All Branches'

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-100 rounded-lg">
            <Bell className="text-orange-600" size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-800 leading-none">Trip Sheet Alert</h1>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Trips acknowledged &amp; dispatched — awaiting verification at your branch</p>
          </div>
        </div>
        {alerts.length > 0 && (
          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-black rounded-full border border-orange-200 flex items-center gap-1.5">
            <AlertTriangle size={12} />
            {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Search size={12} />
          Search Filters
        </h3>
        <div className="grid grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Calendar size={10} /> From Date
            </label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-100 rounded-lg focus:border-orange-400 outline-none text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Calendar size={10} /> To Date
            </label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-100 rounded-lg focus:border-orange-400 outline-none text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Building2 size={10} /> Alert Branch
            </label>
            {currentUser?.role === 'superadmin' ? (
              <select
                value={filters.branchId}
                onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-100 rounded-lg focus:border-orange-400 outline-none text-xs font-bold bg-white"
              >
                <option value="">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.branch_name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                readOnly
                value={selectedBranchName}
                className="w-full px-3 py-2 border-2 border-gray-100 bg-gray-50 rounded-lg text-xs font-bold text-gray-500 cursor-not-allowed outline-none"
              />
            )}
          </div>
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-black flex items-center justify-center gap-2 text-xs transition-all active:scale-95 shadow-md shadow-orange-100 disabled:opacity-50"
          >
            {loading
              ? <><RefreshCw size={14} className="animate-spin" /> Loading...</>
              : <><Search size={14} /> Get Details</>
            }
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50">
          <h3 className="text-xs font-black text-gray-700 flex items-center gap-2">
            <Bell size={14} className="text-orange-500" />
            Trip Sheet Alert Details
            {filters.branchId && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-black rounded-full ml-1">
                {selectedBranchName}
              </span>
            )}
          </h3>
          <span className="text-[10px] text-gray-400 font-bold">{alerts.length} record{alerts.length !== 1 ? 's' : ''}</span>
        </div>

        {error && (
          <div className="p-4 text-center text-xs text-gray-500 font-medium italic">{error}</div>
        )}

        {!error && alerts.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="p-4 bg-orange-50 rounded-full">
              <Bell size={32} className="text-orange-300" />
            </div>
            <p className="text-sm font-bold text-gray-400">No alerts found</p>
            <p className="text-[10px] text-gray-300">Select a branch and date range, then click Get Details</p>
          </div>
        )}

        {alerts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-orange-50 text-[10px] uppercase tracking-wider border-b border-orange-100">
                  <th className="px-3 py-2.5 text-left font-black text-gray-500 w-6"></th>
                  <th className="px-3 py-2.5 text-left font-black text-gray-500">Trip No</th>
                  <th className="px-3 py-2.5 text-left font-black text-gray-500">Trip Date</th>
                  <th className="px-3 py-2.5 text-left font-black text-gray-500">Vehicle</th>
                  <th className="px-3 py-2.5 text-left font-black text-gray-500">Driver</th>
                  <th className="px-3 py-2.5 text-left font-black text-gray-500">Dispatch Branch</th>
                  <th className="px-3 py-2.5 text-left font-black text-gray-500 text-orange-600">Alert Branch</th>
                  <th className="px-3 py-2.5 text-right font-black text-gray-500">Advance</th>
                  <th className="px-3 py-2.5 text-left font-black text-gray-500">Remarks</th>
                  <th className="px-3 py-2.5 text-center font-black text-gray-500">Status</th>
                  <th className="px-3 py-2.5 text-center font-black text-gray-500">GCs</th>
                  <th className="px-3 py-2.5 text-left font-black text-gray-500">ACK Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {alerts.map((ts, idx) => (
                  <React.Fragment key={ts.id}>
                    <tr
                      onClick={() => setExpandedRow(expandedRow === ts.id ? null : ts.id)}
                      className="hover:bg-orange-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-3 py-2.5">
                        <ChevronRight
                          size={14}
                          className={`text-gray-300 transition-transform duration-200 ${expandedRow === ts.id ? 'rotate-90 text-orange-400' : ''}`}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-black text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md">
                          {ts.trip_number}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-bold text-gray-700">{formatDate(ts.trip_date)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5 font-bold text-gray-700">
                          <Truck size={12} className="text-blue-400 flex-shrink-0" />
                          {ts.vehicle?.vehicle_number || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5 font-bold text-gray-600">
                          <User size={12} className="text-green-400 flex-shrink-0" />
                          {ts.driver?.name || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-bold text-gray-600">
                        {ts.dispatch_branch?.branch_name || '-'}
                      </td>
                      <td className="px-3 py-2.5 font-black text-orange-600">
                        {ts.alert_branch_data?.branch_name || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-black text-green-700">
                        {ts.advance_amount ? `₹${parseFloat(ts.advance_amount).toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 italic max-w-[120px] truncate">
                        {ts.trip_remarks || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${ts.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                          ts.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-700' :
                            ts.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                          }`}>
                          {ts.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black rounded-full">
                          {ts.waybills?.length || 0} GC
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-bold text-blue-600">{formatDate(ts.ack_date)}</td>
                    </tr>

                    {/* Expanded GC details */}
                    {expandedRow === ts.id && ts.waybills && ts.waybills.length > 0 && (
                      <tr>
                        <td colSpan={11} className="px-6 py-3 bg-amber-50/60 border-l-4 border-orange-400">
                          <div className="flex items-center gap-2 mb-2">
                            <Package size={14} className="text-orange-500" />
                            <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">
                              GC Details ({ts.waybills.length} consignments)
                            </span>
                          </div>
                          <table className="w-full text-[10px]">
                            <thead>
                              <tr className="text-gray-400 uppercase tracking-wider font-black">
                                <th className="text-left pr-6 py-1">GC Number</th>
                                <th className="text-left pr-6 py-1">Consignor</th>
                                <th className="text-left pr-6 py-1">Consignee</th>
                                <th className="text-left pr-6 py-1">Destination</th>
                                <th className="text-left py-1">Articles</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ts.waybills.map((wb) => (
                                <tr key={wb.id} className="font-bold text-gray-700 border-t border-amber-100">
                                  <td className="pr-6 py-1 text-blue-700">{wb.gc_number}</td>
                                  <td className="pr-6 py-1">{wb.consignor?.consignor_name || wb.consignor?.name || '-'}</td>
                                  <td className="pr-6 py-1">{wb.consignee?.consignee_name || wb.consignee?.name || '-'}</td>
                                  <td className="pr-6 py-1">{wb.destination?.city_name || wb.destination_city || '-'}</td>
                                  <td className="py-1">{wb.total_articles}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default TripSheetAlert
