import React, { useState, useEffect } from 'react'
import {
  Search, Calendar, Loader2, Download, AlertCircle,
  Building, Wallet, TrendingUp, TrendingDown, RefreshCcw,
  BarChart as BarChartIcon, PieChart as PieChartIcon,
  Table as TableIcon, FilterX, List
} from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'

const COLORS = ['#F97316', '#3B82F6', '#10B981', '#6366F1', '#EC4899', '#8B5CF6']

function HeadwiseReport() {
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    account_head_id: 'All',
    branch_id: 'All Branches'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState({
    entries: [],
    head_aggregated: [],
    daily_summary: [],
    totals: { credit: 0, debit: 0, balance: 0 }
  })
  const [branches, setBranches] = useState([])
  const [heads, setHeads] = useState([])
  const [activeTab, setActiveTab] = useState('summary') // 'summary', 'details', 'graphs'

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [bRes, hRes] = await Promise.all([
        fetch(`${API_BASE_URL}/branches`),
        fetch(`${API_BASE_URL}/account-heads`)
      ])
      const bData = await bRes.json()
      const hData = await hRes.json()
      if (bData.success) setBranches(bData.data)
      if (hData.success) setHeads(hData.data)
      handleGetDetails()
    } catch (err) {
      console.error('Error fetching initial data:', err)
    }
  }

  const handleGetDetails = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      params.append('from_date', filters.fromDate)
      params.append('to_date', filters.toDate)
      if (filters.account_head_id !== 'All') params.append('account_head_id', filters.account_head_id)
      if (filters.branch_id !== 'All Branches') params.append('branch_id', filters.branch_id)

      const response = await fetch(`${API_BASE_URL}/cash-book/headwise-report?${params.toString()}`)
      if (!response.ok) throw new Error('Report fetch failed')
      const d = await response.json()

      if (d.success) {
        setData(d.data)
      } else {
        setError(d.message || 'Failed to fetch report')
      }
    } catch (err) {
      setError('Connection error: Check your server connection')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (data.entries.length === 0) return
    const headers = ['Date', 'Voucher', 'Head', 'Branch', 'Type', 'Amount', 'Remarks']
    const csvContent = [
      headers.join(','),
      ...data.entries.map(item => [
        item.transaction_date,
        item.voucher_no,
        item.account_head?.name || 'N/A',
        item.branch?.branch_name || 'N/A',
        item.transaction_type,
        item.amount,
        `"${item.remarks || ''}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Headwise_Report_${new Date().getTime()}.csv`
    link.click()
  }

  return (
    <div className="p-4 space-y-4 bg-gray-50/30 min-h-screen">
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded-lg text-white">
              <TrendingUp size={20} />
            </div>
            <div>
              <h1 className="text-base font-black text-gray-800 uppercase tracking-tight leading-none">Headwise Financial Analytics</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Cash Book Multi-Head Analysis</p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3 flex-1 justify-end max-w-4xl">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                  className="pl-9 pr-3 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg text-xs font-bold focus:border-black focus:bg-white transition-all w-40"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                  className="pl-9 pr-3 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg text-xs font-bold focus:border-black focus:bg-white transition-all w-40"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Head</label>
              <div className="relative">
                <List className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <select
                  value={filters.account_head_id}
                  onChange={(e) => setFilters({ ...filters, account_head_id: e.target.value })}
                  className="pl-9 pr-8 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg text-xs font-bold appearance-none w-48 focus:border-black transition-all"
                >
                  <option value="All">All Categories</option>
                  {heads.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Branch</label>
              <div className="relative">
                <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <select
                  value={filters.branch_id}
                  onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
                  className="pl-9 pr-8 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg text-xs font-bold appearance-none w-44 focus:border-black transition-all"
                >
                  <option value="All Branches">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleGetDetails}
                disabled={loading}
                className="px-6 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                RELOAD
              </button>
              <button
                onClick={() => setFilters({ ...filters, fromDate: '', toDate: '', account_head_id: 'All', branch_id: 'All Branches' })}
                className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 border-2 border-gray-100 transition-all"
              >
                <FilterX size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2 text-red-600">
          <AlertCircle size={16} />
          <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Inflow (Credit)</p>
            <p className="text-2xl font-black text-gray-800 tracking-tight mt-1">₹{data.totals.credit.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Outflow (Debit)</p>
            <p className="text-2xl font-black text-gray-800 tracking-tight mt-1">₹{data.totals.debit.toLocaleString()}</p>
          </div>
        </div>
        <div className={`bg-white p-4 rounded-xl border-2 shadow-sm flex items-center gap-4 ${data.totals.balance >= 0 ? 'border-green-100' : 'border-red-100'}`}>
          <div className={`p-3 rounded-2xl ${data.totals.balance >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Net Position</p>
            <p className={`text-2xl font-black tracking-tight mt-1 ${data.totals.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              ₹{Math.abs(data.totals.balance).toLocaleString()} {data.totals.balance >= 0 ? 'SURPLUS' : 'DEFICIT'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
        {/* Navigation Tabs */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'summary' ? 'bg-black text-white shadow-md shadow-gray-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            >
              <TableIcon size={14} /> Summary View
            </button>
            <button
              onClick={() => setActiveTab('graphs')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'graphs' ? 'bg-black text-white shadow-md shadow-gray-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            >
              <BarChartIcon size={14} /> Distribution Graph
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'details' ? 'bg-black text-white shadow-md shadow-gray-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            >
              <List size={14} /> Detailed Logs
            </button>
          </div>

          <button
            onClick={exportToCSV}
            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-green-100 transition-all active:scale-95 border border-green-100"
          >
            <Download size={14} /> Download CSV
          </button>
        </div>

        <div className="flex-1 p-5">
          {activeTab === 'summary' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Head Name</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Transactions</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total Amount</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Weightage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[11px] font-bold">
                  {data.head_aggregated.length === 0 ? (
                    <tr><td colSpan="5" className="py-20 text-center text-gray-400 italic font-black uppercase tracking-widest">No headwise data recorded for this period</td></tr>
                  ) : data.head_aggregated.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4 text-gray-800 text-xs font-black uppercase">{item.head_name}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest ${item.transaction_type === 'CREDIT' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                          {item.transaction_type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center font-mono">{item.entry_count}</td>
                      <td className={`px-4 py-4 text-right font-black text-xs ${item.transaction_type === 'CREDIT' ? 'text-blue-700' : 'text-red-700'}`}>
                        ₹{item.total_amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${item.transaction_type === 'CREDIT' ? 'bg-blue-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(100, (item.total_amount / (item.transaction_type === 'CREDIT' ? data.totals.credit || 1 : data.totals.debit || 1)) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-gray-400 font-black">
                            {((item.total_amount / (item.transaction_type === 'CREDIT' ? data.totals.credit || 1 : data.totals.debit || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'graphs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              <div className="bg-gray-50/50 p-6 rounded-2xl border border-dashed border-gray-200">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <PieChartIcon size={14} /> Category Distribution
                </h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.head_aggregated}
                        dataKey="total_amount"
                        nameKey="head_name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        paddingAngle={5}
                        stroke="none"
                      >
                        {data.head_aggregated.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          fontSize: '10px',
                          fontWeight: '900',
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          backgroundColor: '#fff'
                        }}
                        formatter={(val) => `₹${val.toLocaleString()}`}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="bg-gray-50/50 p-6 rounded-2xl border border-dashed border-gray-200 flex-1">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <BarChartIcon size={14} /> Daily Inflow/Outflow Trends
                  </h4>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.daily_summary}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 9, fontWeight: 700 }}
                          tickFormatter={(str) => new Date(str).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        />
                        <YAxis tick={{ fontSize: 9, fontWeight: 700 }} width={40} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', fontSize: '10px', fontWeight: '900', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="credit" name="Inflow" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="debit" name="Outflow" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Voucher</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Head</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[10px] font-bold">
                  {data.entries.length === 0 ? (
                    <tr><td colSpan="6" className="py-20 text-center text-gray-400 italic">No entry logs found</td></tr>
                  ) : data.entries.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-mono">{item.transaction_date}</td>
                      <td className="px-4 py-3 text-gray-800 font-black">{item.voucher_no}</td>
                      <td className="px-4 py-3 uppercase">{item.account_head?.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${item.transaction_type === 'CREDIT' ? 'text-blue-600' : 'text-red-600'}`}>
                          {item.transaction_type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-black ${item.transaction_type === 'CREDIT' ? 'text-blue-700' : 'text-red-700'}`}>
                        ₹{item.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-400 italic max-w-xs truncate">{item.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HeadwiseReport
