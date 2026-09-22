import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Loader2, AlertCircle, FileText, Download, Calendar, MapPin, SearchX, ArrowUpDown, ChevronDown, ChevronRight, Search, X } from 'lucide-react'
import { API_BASE_URL } from '../config/api'

// ── Searchable Dropdown Component ──────────────────────────────────────────────
function SearchableSelect({ value, onChange, options, placeholder = 'All', label }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  )

  const selected = options.find(o => o.value === value)
  const displayLabel = selected ? selected.label : placeholder

  const handleSelect = (val) => {
    onChange(val)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQuery('') }}
        className={`w-full flex items-center justify-between px-2 py-1 rounded-lg border text-[10px] font-bold text-left transition-colors ${
          open ? 'bg-white border-rose-400 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-rose-300'
        } ${value ? 'text-slate-800' : 'text-slate-400'}`}
      >
        <span className="truncate">{displayLabel}</span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && (
            <span
              onClick={(e) => { e.stopPropagation(); handleSelect('') }}
              className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <X size={10} />
            </span>
          )}
          <ChevronDown size={11} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[180px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search box */}
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <Search size={10} className="text-slate-400 shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Search ${label}...`}
                className="w-full text-[10px] bg-transparent outline-none font-medium text-slate-700 placeholder-slate-300"
              />
            </div>
          </div>
          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-[10px] text-slate-400 font-semibold">No results found</div>
            ) : (
              filtered.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleSelect(o.value)}
                  className={`w-full text-left px-3 py-2 text-[10px] font-semibold transition-colors block ${
                    value === o.value
                      ? 'bg-rose-500 text-white'
                      : 'text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                  }`}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
// ───────────────────────────────────────────────────────────────────────────────

function PaymentPendingReport() {
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 4)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    branch: JSON.parse(localStorage.getItem('user'))?.role === 'superadmin'
      ? 'All Branches'
      : (JSON.parse(localStorage.getItem('user'))?.branch_id || 'All Branches'),
    consignor: '',
    accountType: ''
  })

  const [branches, setBranches] = useState([])
  const [consignors, setConsignors] = useState([])
  const [reportData, setReportData] = useState([])
  const [summary, setSummary] = useState({ total_pending: 0, total_count: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Column search state
  const [colSearch, setColSearch] = useState({
    gc_number: '',
    consignor_name: '',
    account_type: '',
    destination: '',
    branch: '',
    status: ''
  })

  // Sort state
  const [sortKey, setSortKey] = useState('bill_date')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => { fetchBranches(); fetchConsignors() }, [])

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

  const fetchConsignors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/consignors`)
      setConsignors(response.data.data || response.data || [])
    } catch (err) { }
  }

  const handleGetDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = { from_date: filters.fromDate, to_date: filters.toDate }
      if (filters.branch !== 'All Branches') params.branch_id = filters.branch
      if (filters.consignor) params.consignor_id = filters.consignor
      if (filters.accountType) params.account_type = filters.accountType
      const response = await axios.get(`${API_BASE_URL}/reports/payment-pending`, { params })
      if (response.data.success) {
        setReportData(response.data.data)
        setSummary(response.data.summary)
        if (response.data.data.length === 0) setError('No outstanding receivables found for the selected period.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (filteredData.length === 0) return
    const headers = ['GC Number', 'Bill Date', 'Consignor', 'Destination', 'Branch', 'Account Type', 'Status', 'Invoice Value', 'Recovered', 'Balance Due']
    const rows = filteredData.map(item => [
      item.gc_number,
      new Date(item.bill_date).toLocaleDateString('en-IN'),
      item.consignor_name,
      item.destination,
      item.branch,
      item.account_type?.toUpperCase(),
      item.status,
      item.grand_total.toFixed(2),
      item.amount_paid.toFixed(2),
      item.balance.toFixed(2)
    ])
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payment_pending_${filters.fromDate}_to_${filters.toDate}.csv`
    link.click()
  }

  // Filtering
  const filteredData = reportData.filter(item => {
    return (
      (item.gc_number || '').toLowerCase().includes(colSearch.gc_number.toLowerCase()) &&
      (item.consignor_name || '').toLowerCase().includes(colSearch.consignor_name.toLowerCase()) &&
      (item.account_type || '').toLowerCase().includes(colSearch.account_type.toLowerCase()) &&
      (item.destination || '').toLowerCase().includes(colSearch.destination.toLowerCase()) &&
      (item.branch || '').toLowerCase().includes(colSearch.branch.toLowerCase()) &&
      (item.status || '').toLowerCase().includes(colSearch.status.toLowerCase())
    )
  })

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    let aVal = a[sortKey]
    let bVal = b[sortKey]
    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const SortIcon = ({ col }) => (
    <ArrowUpDown
      size={11}
      className={`inline ml-1 ${sortKey === col ? 'text-rose-500' : 'text-slate-300'}`}
    />
  )

  const accountTypeBadge = (type) => {
    const t = (type || '').toLowerCase()
    if (t === 'topay') return 'bg-orange-100 text-orange-700'
    if (t === 'paid' || t === 'cash') return 'bg-purple-100 text-purple-700'
    if (t === 'account') return 'bg-blue-100 text-blue-700'
    return 'bg-slate-100 text-slate-600'
  }

  const statusBadge = (status) => {
    const s = (status || '').toUpperCase()
    if (s === 'DELIVERED') return 'bg-emerald-100 text-emerald-700'
    if (s === 'INWARDED') return 'bg-blue-100 text-blue-700'
    if (s === 'PENDING' || s === 'BOOKED') return 'bg-amber-100 text-amber-700'
    return 'bg-slate-100 text-slate-600'
  }

  const [expandedGroups, setExpandedGroups] = useState({})
  const toggleGroup = (cName) => {
    setExpandedGroups(prev => ({ ...prev, [cName]: !prev[cName] }))
  }

  // Group by consignor
  const groupedData = React.useMemo(() => {
    const groups = {}
    sortedData.forEach(item => {
      const c = item.consignor_name || 'Unknown'
      if (!groups[c]) groups[c] = { consignor_name: c, branch: item.branch, items: [], grand_total: 0, amount_paid: 0, balance: 0 }
      groups[c].items.push(item)
      groups[c].grand_total += item.grand_total
      groups[c].amount_paid += item.amount_paid
      groups[c].balance += item.balance
    })
    return Object.values(groups)
  }, [sortedData])

  // Summary of filtered data
  const filteredBalance = filteredData.reduce((s, i) => s + i.balance, 0)

  return (
    <div className="h-full bg-[#FDF8F8] p-2 md:p-4 font-outfit overflow-auto">
      <div className="w-full space-y-3">

        {/* Header */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-md">
              <FileText className="text-white" size={18} />
            </span>
            <div>
              <h1 className="text-sm font-black text-[#1E293B] tracking-tight">Payment Pending Report</h1>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Receivables Audit</p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            disabled={sortedData.length === 0}
            className="flex items-center gap-1 px-4 py-1.5 bg-white border border-rose-100 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all shadow-sm disabled:opacity-30"
          >
            <Download size={14} /> Export
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-2 bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-3">
            <AlertCircle size={16} className="text-rose-500" />
            <p className="text-rose-700 font-bold text-xs">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 mx-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Calendar size={10} className="text-rose-500" /> From
              </label>
              <input type="date" value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="w-full px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg focus:border-rose-500 outline-none font-bold text-slate-700 text-[10px]" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Calendar size={10} className="text-rose-500" /> To
              </label>
              <input type="date" value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="w-full px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg focus:border-rose-500 outline-none font-bold text-slate-700 text-[10px]" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <MapPin size={10} className="text-rose-500" /> Branch
              </label>
              {JSON.parse(localStorage.getItem('user'))?.role === 'superadmin' ? (
                <SearchableSelect
                  label="branch"
                  placeholder="All Branches"
                  value={filters.branch === 'All Branches' ? '' : String(filters.branch)}
                  onChange={(val) => setFilters({ ...filters, branch: val || 'All Branches' })}
                  options={branches.map(b => ({ value: String(b.id), label: b.branch_name }))}
                />
              ) : (
                <div className="w-full px-2 py-1 bg-slate-100 border border-slate-100 rounded-lg font-bold text-slate-500 text-[10px] uppercase">
                  {JSON.parse(localStorage.getItem('user'))?.branch_name || 'Own Branch'}
                </div>
              )}
            </div>
            {/* Consignor Filter */}
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Consignor
              </label>
              <SearchableSelect
                label="consignor"
                placeholder="All Consignors"
                value={filters.consignor}
                onChange={(val) => setFilters({ ...filters, consignor: val })}
                options={[
                  ...consignors.map(c => ({ value: String(c.id), label: c.name }))
                ]}
              />
            </div>
            {/* Account Type Filter */}
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                Acct Type
              </label>
              <SearchableSelect
                label="account type"
                placeholder="All Types"
                value={filters.accountType}
                onChange={(val) => setFilters({ ...filters, accountType: val })}
                options={[
                  { value: 'topay',   label: 'To Pay' },
                  { value: 'paid',    label: 'Paid' },
                  { value: 'account', label: 'Account' },
                  { value: 'cash',    label: 'Cash' },
                ]}
              />
            </div>
            <div className="flex items-end">
              <button onClick={handleGetDetails} disabled={loading}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-black uppercase tracking-widest text-[9px] shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1">
                {loading ? <Loader2 className="animate-spin" size={12} /> : 'Generate Audit'}
              </button>
            </div>
          </div>
        </div>



        {/* Main Table */}
        {reportData.length > 0 ? (
          <div className="mx-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-up">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  {/* Column Headers */}
                  <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-widest border-b-2 border-slate-300">
                    <th className="px-2 py-2 text-left font-black cursor-pointer select-none whitespace-nowrap border-r border-slate-300" onClick={() => handleSort('gc_number')}>
                      GC Number <SortIcon col="gc_number" />
                    </th>
                    <th className="px-2 py-2 text-left cursor-pointer select-none whitespace-nowrap border-r border-slate-300" onClick={() => handleSort('bill_date')}>
                      Bill Date <SortIcon col="bill_date" />
                    </th>
                    <th className="px-2 py-2 text-left cursor-pointer select-none border-r border-slate-300" onClick={() => handleSort('consignor_name')}>
                      Consignor <SortIcon col="consignor_name" />
                    </th>
                    <th className="px-2 py-2 text-left cursor-pointer select-none border-r border-slate-300" onClick={() => handleSort('destination')}>
                      Destination <SortIcon col="destination" />
                    </th>
                    <th className="px-2 py-2 text-center cursor-pointer select-none whitespace-nowrap border-r border-slate-300" onClick={() => handleSort('account_type')}>
                      Acct Type <SortIcon col="account_type" />
                    </th>
                    <th className="px-2 py-2 text-center cursor-pointer select-none border-r border-slate-300" onClick={() => handleSort('status')}>
                      Status <SortIcon col="status" />
                    </th>
                    <th className="px-2 py-2 text-right cursor-pointer select-none whitespace-nowrap border-r border-slate-300" onClick={() => handleSort('grand_total')}>
                      Invoice Value <SortIcon col="grand_total" />
                    </th>
                    <th className="px-2 py-2 text-right text-emerald-600 cursor-pointer select-none whitespace-nowrap border-r border-slate-300" onClick={() => handleSort('amount_paid')}>
                      Recovered <SortIcon col="amount_paid" />
                    </th>
                    <th className="px-2 py-2 text-right text-rose-600 bg-rose-50 cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort('balance')}>
                      Balance Due <SortIcon col="balance" />
                    </th>
                  </tr>
                  {/* Column Search Row */}
                  <tr className="bg-slate-50 border-b-2 border-slate-200">
                    <th className="px-2 py-1 border-r border-slate-200">
                      <input type="text" placeholder="Search GC..." value={colSearch.gc_number}
                        onChange={e => setColSearch({ ...colSearch, gc_number: e.target.value })}
                        className="w-full px-2 py-1 text-[10px] rounded border border-slate-300 outline-none focus:border-rose-400 bg-white font-medium normal-case tracking-normal" />
                    </th>
                    <th className="px-2 py-1 border-r border-slate-200"></th>
                    <th className="px-2 py-1 border-r border-slate-200">
                      <input type="text" placeholder="Search Consignor..." value={colSearch.consignor_name}
                        onChange={e => setColSearch({ ...colSearch, consignor_name: e.target.value })}
                        className="w-full px-2 py-1 text-[10px] rounded border border-slate-300 outline-none focus:border-rose-400 bg-white font-medium normal-case tracking-normal" />
                    </th>
                    <th className="px-2 py-1 border-r border-slate-200">
                      <input type="text" placeholder="Destination..." value={colSearch.destination}
                        onChange={e => setColSearch({ ...colSearch, destination: e.target.value })}
                        className="w-full px-2 py-1 text-[10px] rounded border border-slate-300 outline-none focus:border-rose-400 bg-white font-medium normal-case tracking-normal" />
                    </th>
                    <th className="px-2 py-1 border-r border-slate-200">
                      <input type="text" placeholder="Type..." value={colSearch.account_type}
                        onChange={e => setColSearch({ ...colSearch, account_type: e.target.value })}
                        className="w-full px-2 py-1 text-[10px] rounded border border-slate-300 outline-none focus:border-rose-400 bg-white font-medium normal-case tracking-normal text-center" />
                    </th>
                    <th className="px-2 py-1 border-r border-slate-200">
                      <input type="text" placeholder="Status..." value={colSearch.status}
                        onChange={e => setColSearch({ ...colSearch, status: e.target.value })}
                        className="w-full px-2 py-1 text-[10px] rounded border border-slate-300 outline-none focus:border-rose-400 bg-white font-medium normal-case tracking-normal text-center" />
                    </th>
                    <th className="px-2 py-1 border-r border-slate-200"></th>
                    <th className="px-2 py-1 border-r border-slate-200"></th>
                    <th className="px-2 py-1 bg-rose-50"></th>
                  </tr>
                </thead>
                <tbody>
                  {groupedData.map((group, gIdx) => (
                    <React.Fragment key={gIdx}>
                      <tr className="bg-slate-100 hover:bg-slate-200 cursor-pointer border-b-2 border-slate-300" onClick={() => toggleGroup(group.consignor_name)}>
                        <td colSpan={6} className="px-2 py-2 font-bold text-slate-800 border-r border-slate-300 text-[11px]">
                          {expandedGroups[group.consignor_name] ? <ChevronDown size={14} className="inline mr-2 text-rose-500" /> : <ChevronRight size={14} className="inline mr-2 text-rose-500" />}
                          {group.consignor_name} <span className="text-slate-500 text-[10px] ml-2">({group.items.length} GC{group.items.length !== 1 ? 's' : ''})</span>
                        </td>
                        <td className="px-2 py-2 text-right font-bold text-slate-700 border-r border-slate-300 text-[10px] font-mono">₹{group.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-2 py-2 text-right font-bold text-emerald-700 border-r border-slate-300 text-[10px] font-mono">₹{group.amount_paid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-2 py-2 text-right font-black text-rose-700 bg-rose-50/50 text-[10px] font-mono">₹{group.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                      {expandedGroups[group.consignor_name] && group.items.map((item, idx) => (

                        <tr key={idx} className={`border-b border-slate-200 hover:bg-rose-50/30 transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          {/* GC Number */}
                          <td className="px-2 py-1.5 border-r border-slate-200">
                            <span className="font-black text-slate-800 font-mono text-[10px] group-hover:text-rose-600 transition-colors">
                              {item.gc_number}
                            </span>
                          </td>
                          {/* Bill Date */}
                          <td className="px-2 py-1.5 whitespace-nowrap text-slate-600 font-semibold text-[10px] border-r border-slate-200">
                            {new Date(item.bill_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </td>
                          {/* Consignor */}
                          <td className="px-2 py-1.5 max-w-[160px] border-r border-slate-200">
                            <span className="font-bold text-slate-700 text-[10px] block truncate" title={item.consignor_name}>
                              {item.consignor_name}
                            </span>
                            <span className="text-slate-400 text-[9px] font-semibold">{item.branch}</span>
                          </td>
                          {/* Destination */}
                          <td className="px-2 py-1.5 text-slate-700 font-semibold text-[10px] max-w-[120px] border-r border-slate-200">
                            <span className="block truncate" title={item.destination}>{item.destination}</span>
                          </td>
                          {/* Account Type */}
                          <td className="px-2 py-1.5 text-center border-r border-slate-200">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${accountTypeBadge(item.account_type)}`}>
                              {item.account_type}
                            </span>
                          </td>
                          {/* Status */}
                          <td className="px-2 py-1.5 text-center border-r border-slate-200">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${statusBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          {/* Invoice Value */}
                          <td className="px-2 py-1.5 text-right font-bold text-slate-700 text-[10px] font-mono border-r border-slate-200">
                            ₹{item.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          {/* Recovered */}
                          <td className="px-2 py-1.5 text-right font-bold text-emerald-700 text-[10px] font-mono border-r border-slate-200">
                            ₹{item.amount_paid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          {/* Balance Due */}
                          <td className="px-2 py-1.5 text-right font-black text-rose-700 text-[10px] font-mono bg-rose-50">
                            ₹{item.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
                {/* Footer Totals */}
                {sortedData.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-200 border-t-2 border-slate-400 font-black text-[10px]">
                      <td colSpan={6} className="px-2 py-2 text-slate-600 uppercase tracking-widest text-[9px] border-r border-slate-300">
                        Total — {sortedData.length} GC{sortedData.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-2 py-2 text-right text-slate-800 font-mono border-r border-slate-300">
                        ₹{sortedData.reduce((s, i) => s + i.grand_total, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-2 py-2 text-right text-emerald-800 font-mono border-r border-slate-300">
                        ₹{sortedData.reduce((s, i) => s + i.amount_paid, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-2 py-2 text-right text-rose-800 font-mono bg-rose-100">
                        ₹{sortedData.reduce((s, i) => s + i.balance, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                )}
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
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest max-w-[200px] leading-relaxed mx-auto">
                Select criteria and generate to audit receivables
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
        @keyframes fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  )
}

export default PaymentPendingReport
