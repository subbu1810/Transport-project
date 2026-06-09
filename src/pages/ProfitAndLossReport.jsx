import React, { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { API_BASE_URL } from '../config/api';
import {
  DollarSign, TrendingUp, TrendingDown, Calendar, Search,
  Loader2, Download, AlertCircle, PieChart as PieChartIcon,
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react'

function ProfitAndLossReport() {
  const currentUser = JSON.parse(localStorage.getItem('user'))
  
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    branch_id: currentUser?.role !== 'superadmin' ? currentUser?.branch_id : ''
  })

  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [activeView, setActiveView] = useState('graph') // graph | breakdown

  useEffect(() => {
    fetchBranches()
    handleGetDetails()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches`)
      const d = await response.json()
      if (d.success) {
        if (currentUser?.role === 'superadmin') {
          setBranches(d.data)
        } else {
          const userBranch = d.data.find(b => b.id === currentUser?.branch_id)
          setBranches(userBranch ? [userBranch] : [])
        }
      }
    } catch (err) { console.error(err) }
  }

  const handleGetDetails = async () => {
    try {
      setLoading(true)
      setError('')
      const queryParams = new URLSearchParams({
        from_date: filters.fromDate,
        to_date: filters.toDate,
        branch_id: filters.branch_id
      })

      const response = await fetch(`${API_BASE_URL}/dashboard/profit-loss-stats?${queryParams.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch P&L data')
      const d = await response.json()

      if (d.success) {
        setData(d.data)
      } else {
        setError(d.message || 'Failed to get data')
      }
    } catch (err) {
      console.error('Error fetching P&L stats:', err)
      setError('Connection error or server failure')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!data) return
    const headers = ['Date', 'Income (₹)', 'Expense (₹)', 'Net Profit (₹)']
    const csvContent = [
      headers.join(','),
      ...data.daily_trend.map(row => [
        row.date,
        row.income,
        row.expense,
        row.profit
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.setAttribute('href', URL.createObjectURL(blob))
    link.setAttribute('download', `Profit_Loss_Report_${filters.fromDate}_to_${filters.toDate}.csv`)
    link.click()
  }

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444']

  const getBreakdownData = () => {
    if (!data) return []
    return [
      { name: 'Waybill Revenue', value: data.summary.breakdown.waybill_revenue },
      { name: 'Other Income', value: data.summary.breakdown.other_income },
      { name: 'Trip Costs', value: data.summary.breakdown.trip_costs },
      { name: 'General Expenses', value: data.summary.breakdown.general_expenses }
    ]
  }

  return (
    <div className="p-3 space-y-3 bg-gray-50/50 min-h-screen">
      {/* Header & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <Activity size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-800 uppercase tracking-tight">Profit & Loss Analysis</h1>
              <p className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">Net performance & financial health</p>
            </div>
          </div>

          <div className="flex-1 min-w-[300px]">
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-3 items-end">
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider ml-0.5">From Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                    className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-indigo-500 focus:bg-white focus:outline-none transition-all text-xs font-bold font-mono"
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
                    className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-indigo-500 focus:bg-white focus:outline-none transition-all text-xs font-bold font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider ml-0.5">Branch</label>
                <select
                  value={filters.branch_id || ''}
                  onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
                  disabled={currentUser?.role !== 'superadmin'}
                  className="w-full px-3 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-indigo-500 focus:bg-white focus:outline-none transition-all text-xs font-bold appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed uppercase"
                >
                  {currentUser?.role === 'superadmin' && <option value="">All Branches</option>}
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleGetDetails}
                disabled={loading}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-gray-200 disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                UPDATE REPORT
              </button>
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

      {/* Summary Metrics */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm group hover:border-green-200 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Income</p>
              <div className="p-1.5 bg-green-50 text-green-600 rounded-lg"><ArrowUpRight size={16} /></div>
            </div>
            <h4 className="text-xl font-black text-gray-800 tracking-tighter">₹{data.summary.total_income.toLocaleString('en-IN')}</h4>
            <div className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-tight">Accrued + Cash Inflow</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm group hover:border-red-200 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Expenditure</p>
              <div className="p-1.5 bg-red-50 text-red-600 rounded-lg"><ArrowDownRight size={16} /></div>
            </div>
            <h4 className="text-xl font-black text-gray-800 tracking-tighter">₹{data.summary.total_expense.toLocaleString('en-IN')}</h4>
            <div className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-tight">Trip Costs + Overheads</div>
          </div>

          <div className={`p-4 rounded-xl border shadow-sm transition-colors ${data.summary.net_profit >= 0 ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-red-600 border-red-700 text-white'
            }`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black uppercase tracking-widest leading-none opacity-80">Net Performance</p>
              <DollarSign size={16} className="opacity-80" />
            </div>
            <h4 className="text-xl font-black tracking-tighter">₹{data.summary.net_profit.toLocaleString('en-IN')}</h4>
            <div className="mt-2 text-[10px] font-bold uppercase tracking-tight opacity-70">
              {data.summary.net_profit >= 0 ? 'Surplus / Profit' : 'Deficit / Loss'}
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[400px]">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={14} className="text-indigo-600" />
              Income vs Expenditure Trend
            </h3>
            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 shrink-0">
              <button
                onClick={() => setActiveView('graph')}
                className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${activeView === 'graph' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Graph
              </button>
              <button
                onClick={() => setActiveView('breakdown')}
                className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${activeView === 'breakdown' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Breakdown
              </button>
            </div>
          </div>

          <div className="flex-1 p-4">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                <Loader2 className="animate-spin" size={32} />
                <span className="text-[10px] font-black uppercase tracking-widest">Crunching Numbers...</span>
              </div>
            ) : data ? (
              activeView === 'graph' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.daily_trend}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                      tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                      formatter={(val) => [`₹${val.toLocaleString()}`, '']}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Area name="Income" type="monotone" dataKey="income" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area name="Expense" type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="overflow-x-auto h-full">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 italic">Date</th>
                        <th className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Income</th>
                        <th className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Expense</th>
                        <th className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Profit/Loss</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-mono text-[11px] font-bold">
                      {data.daily_trend.slice().reverse().map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2.5 text-gray-600">{row.date}</td>
                          <td className="px-3 py-2.5 text-right text-indigo-600">₹{row.income.toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-right text-red-500">₹{row.expense.toLocaleString()}</td>
                          <td className={`px-3 py-2.5 text-right ${row.profit >= 0 ? 'text-green-600' : 'text-red-700'}`}>
                            ₹{row.profit.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2 italic text-[10px]">
                No data available for selected period
              </div>
            )}
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <PieChartIcon size={14} className="text-orange-500" />
              Source Breakdown
            </h3>
          </div>
          <div className="flex-1 min-h-[300px] p-4 flex flex-col">
            {data ? (
              <>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getBreakdownData()}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {getBreakdownData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                        formatter={(val) => [`₹${val.toLocaleString()}`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {getBreakdownData().map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[10px] font-bold">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                        <span className="text-gray-500">{item.name}</span>
                      </div>
                      <span className="text-gray-800 tracking-tighter">₹{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300 italic text-[10px]">
                Detailed breakdown unavailable
              </div>
            )}

            <button
              onClick={exportToCSV}
              disabled={!data}
              className="mt-6 w-full px-4 py-2 border-2 border-gray-100 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-200 font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-30"
            >
              <Download size={14} /> DOWNLOAD FULL DATA
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfitAndLossReport
