import React, { useState, useEffect } from 'react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';
import {
  Search, Calendar, Loader2, Download, AlertCircle,
  Activity, Eye, EyeOff, User, Building, MapPin,
  RefreshCcw, FilterX, Clock, Globe
} from 'lucide-react'

function AuditLogInfo() {
  const user = JSON.parse(localStorage.getItem('user'))
  const isSuperAdmin = user?.role === 'superadmin'

  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    branch_id: isSuperAdmin ? '' : (user?.branch_id || ''),
    gc_number: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState([])
  const [branches, setBranches] = useState([])
  const [expandedRow, setExpandedRow] = useState(null)

  useEffect(() => {
    fetchBranches()
    handleGetDetails()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches`)
      const d = await response.json()
      if (d.success) {
        if (isSuperAdmin) {
          setBranches(d.data)
        } else {
          setBranches(d.data.filter(b => b.id == user.branch_id))
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
      
      // Pass auth context for server-side filtering
      params.append('logged_role', user?.role || '')
      params.append('logged_branch_id', user?.branch_id || '')

      if (filters.fromDate) params.append('from_date', filters.fromDate)
      if (filters.toDate) params.append('to_date', filters.toDate)
      
      if (isSuperAdmin) {
        if (filters.branch_id && filters.branch_id !== 'All Branches') {
          params.append('branch_id', filters.branch_id)
        }
      } else {
        params.append('branch_id', user?.branch_id || '')
      }

      if (filters.gc_number) params.append('gc_number', filters.gc_number)

      const response = await fetch(`${API_BASE_URL}/audit-logs?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch audit logs')
      const d = await response.json()

      if (d.success) {
        setLogs(d.data)
      } else {
        setError(d.message || 'Failed to get logs')
      }
    } catch (err) {
      console.error('Error fetching logs:', err)
      setError('Connection error or server failure')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (logs.length === 0) return
    const headers = ['Date Time', 'Action', 'Entity', 'GC Num', 'Changed By', 'Branch', 'Remarks', 'IP Address']
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.action,
        log.auditable_type.split('\\').pop(),
        log.gc_number || 'N/A',
        log.user?.name || 'System',
        log.branch?.branch_name || 'N/A',
        log.remarks || '',
        log.ip_address || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Audit_Log_${new Date().getTime()}.csv`
    link.click()
  }

  const renderChanges = (oldVal, newVal) => {
    if (!oldVal && !newVal) return <span className="text-gray-400 italic">No value changes tracked</span>

    // Convert to objects if they are JSON strings
    const oldObj = typeof oldVal === 'string' ? JSON.parse(oldVal) : (oldVal || {})
    const newObj = typeof newVal === 'string' ? JSON.parse(newVal) : (newVal || {})

    // Get unique keys from both
    const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]))
      .filter(key => ['id', 'created_at', 'updated_at', 'deleted_at'].indexOf(key) === -1)

    // Find only changed fields
    const changedKeys = allKeys.filter(key => JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key]))

    if (changedKeys.length === 0) return <span className="text-gray-400 italic">Structure updated, no field-level changes</span>

    return (
      <div className="space-y-2 p-3 bg-white border border-gray-200 rounded-xl mt-2 animate-in slide-in-from-top-2 duration-200">
        <div className="grid grid-cols-12 gap-4 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1 mb-1">
          <div className="col-span-3">Field</div>
          <div className="col-span-4 text-red-500">Old Value (Previous)</div>
          <div className="col-span-5 text-green-600">New Value (Current)</div>
        </div>
        {changedKeys.map(key => (
          <div key={key} className="grid grid-cols-12 gap-4 py-1.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
            <div className="col-span-3 text-[10px] font-black text-gray-500 uppercase flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              {key.replace(/_/g, ' ')}
            </div>
            <div className="col-span-4 text-[11px] font-bold text-red-500/80 line-through truncate font-mono bg-red-50/30 px-1.5 py-0.5 rounded">
              {oldObj[key]?.toString() || '(empty)'}
            </div>
            <div className="col-span-5 text-[11px] font-bold text-green-700 truncate font-mono bg-green-50/30 px-1.5 py-0.5 rounded">
              {newObj[key]?.toString() || '(empty)'}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3 bg-gray-50/50 min-h-screen">
      {/* Header & Advanced Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-black rounded-lg text-white">
              <Activity size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-800 uppercase tracking-tight">System Audit Journal</h1>
              <p className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">Tracking every change, for accountability</p>
            </div>
          </div>

          <div className="flex-1 min-w-[500px]">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider ml-0.5">From Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                    className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-black focus:bg-white focus:outline-none transition-all text-xs font-bold font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider ml-0.5">To Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                  <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                    className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-black focus:bg-white focus:outline-none transition-all text-xs font-bold font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider ml-0.5">Branch</label>
                <div className="relative">
                  <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                  {isSuperAdmin ? (
                    <select
                      value={filters.branch_id}
                      onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
                      className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-black focus:bg-white focus:outline-none transition-all text-xs font-bold appearance-none cursor-pointer"
                    >
                      <option value="All Branches">All Branches</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.branch_name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full pl-8 pr-2 py-1.5 bg-gray-100 border-2 border-gray-100 rounded-lg text-xs font-black text-gray-400 uppercase italic">
                      {user?.branch_name || 'My Branch'}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider ml-0.5">GC Number Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                  <input
                    type="text"
                    placeholder="GC-XXXXX"
                    value={filters.gc_number}
                    onChange={(e) => setFilters({ ...filters, gc_number: e.target.value })}
                    className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-black focus:bg-white focus:outline-none transition-all text-xs font-bold"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGetDetails}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-gray-200 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                  FILTER
                </button>
                <button
                  onClick={() => setFilters({ ...filters, branch_id: isSuperAdmin ? '' : (user?.branch_id || ''), gc_number: '' })}
                  className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 border-2 border-gray-100 transition-all"
                  title="Clear Filters"
                >
                  <FilterX size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-3 text-red-600">
          <AlertCircle size={16} />
          <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      {/* Main Content Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              Activity Stream
              <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-[8px] font-black">{logs.length} RECORDS FOUND</span>
            </h3>
          </div>
          <button
            onClick={exportToCSV}
            disabled={logs.length === 0}
            className="px-3 py-1 text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-30"
          >
            <Download size={14} /> EXPORT JOURNAL
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white sticky top-0 z-10">
              <tr>
                <th className="w-12 px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 italic">ID</th>
                <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Timestamp</th>
                <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Action</th>
                <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">GC Number</th>
                <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Operated By</th>
                <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Branch</th>
                <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-gray-300" size={40} />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Scanning Audit Database...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30 italic">
                      <Search size={40} />
                      <p className="text-[10px] font-black uppercase tracking-widest">No activities found for selection</p>
                    </div>
                  </td>
                </tr>
              ) : logs.map((log, index) => (
                <React.Fragment key={log.id}>
                  <tr
                    className={`group hover:bg-gray-50 transition-colors cursor-pointer ${expandedRow === log.id ? 'bg-indigo-50/30' : ''}`}
                    onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                  >
                    <td className="px-4 py-3 font-mono text-[10px] font-bold text-gray-400">#{logs.length - index}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-gray-700 font-mono tracking-tighter">
                          {new Date(log.created_at).toLocaleDateString() === new Date().toLocaleDateString() ? 'Today ' : ''}
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{new Date(log.created_at).toLocaleDateString('en-GB')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                            log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                              log.action === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] font-black text-gray-500/80 uppercase tracking-tight">
                          {log.auditable_type.split('\\').pop()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-black tracking-tighter font-mono ${log.gc_number ? 'text-gray-800' : 'text-gray-300 italic'}`}>
                          {log.gc_number || 'N/A SYSTEM'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><User size={12} /></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight leading-none">{log.user?.name || 'Automated System'}</span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase flex items-center gap-1 mt-0.5">
                            <Globe size={10} /> {log.ip_address || '0.0.0.0'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                        <MapPin size={12} className="text-gray-300" />
                        {log.branch?.branch_name || 'System Level'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className={`p-1.5 rounded-lg transition-all ${expandedRow === log.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                        {expandedRow === log.id ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </td>
                  </tr>

                  {expandedRow === log.id && (
                    <tr className="bg-white border-l-4 border-indigo-600">
                      <td colSpan="7" className="px-4 py-4 shadow-inner">
                        <div className="space-y-4">
                          <div className="flex gap-4 items-start">
                            <div className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Activity size={12} className="text-gray-400" />
                                Operation Context & Remarks
                              </h4>
                              <p className="text-[11px] font-bold text-gray-700 leading-relaxed italic">
                                "{log.remarks || 'No detailed remarks provided for this transaction.'}"
                              </p>
                              <div className="mt-3 flex gap-4 text-[9px] font-bold uppercase text-gray-400 italic">
                                <span>Ref Model: {log.auditable_type}</span>
                                <span>Ref ID: #{log.auditable_id}</span>
                              </div>
                            </div>
                          </div>

                          <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                            <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 mx-1">Deep Data Inspection (Old vs New)</h4>
                            {renderChanges(log.old_values, log.new_values)}
                          </div>
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
    </div>
  )
}

export default AuditLogInfo
