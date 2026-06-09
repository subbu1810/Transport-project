import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config/api'
import { 
  BarChart3, RefreshCw, Filter, Calendar, MapPin, Search,
  TrendingUp, TrendingDown, DollarSign, Activity, Truck, AlertCircle
} from 'lucide-react'

export default function RouteAnalytics() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
    to: new Date().toISOString().split('T')[0] // Today
  })

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams()
      if (dateRange.from) qs.append('from_date', dateRange.from)
      if (dateRange.to) qs.append('to_date', dateRange.to)

      const response = await axios.get(`${API_BASE_URL}/routes/profitability?${qs.toString()}`)
      if (response.data.success) {
        setData(response.data.data)
      } else {
        setError(response.data.message || 'Failed to fetch analytics')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error communicating with server')
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = (e) => {
    e.preventDefault()
    fetchAnalytics()
  }

  // Aggregate calculations
  const totalRoutes = data.length
  const grandTotalTrips = data.reduce((sum, item) => sum + item.total_trips, 0)
  const grandTotalIncome = data.reduce((sum, item) => sum + item.total_income, 0)
  const grandTotalExpense = data.reduce((sum, item) => sum + item.total_expense, 0)
  const grandTotalProfit = grandTotalIncome - grandTotalExpense
  const overallMargin = grandTotalIncome > 0 ? (grandTotalProfit / grandTotalIncome) * 100 : 0

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50/50 min-h-screen space-y-6">
      
      {/* Header section with Glassmorphism aesthetic */}
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-indigo-950 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <Activity size={24} />
            </div>
            Route Profitability Analytics
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1 pl-[3.25rem]">
            Financial performance and margin tracking across multi-stop journeys.
          </p>
        </div>

        {/* Filter Form */}
        <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-50">
          <div>
            <label className="block text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-1 ml-1">From Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={14} className="text-indigo-400" />
              </div>
              <input 
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                className="pl-9 pr-4 py-2 border-none ring-1 ring-indigo-200 focus:ring-2 focus:ring-indigo-600 rounded-lg text-sm font-bold text-indigo-900 bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-1 ml-1">To Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={14} className="text-indigo-400" />
              </div>
              <input 
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                className="pl-9 pr-4 py-2 border-none ring-1 ring-indigo-200 focus:ring-2 focus:ring-indigo-600 rounded-lg text-sm font-bold text-indigo-900 bg-white"
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Filter size={16} />}
            Analyze
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="font-medium text-sm">{error}</span>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="bg-white border text-gray-800 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign size={64} className="text-green-600" />
          </div>
          <div className="flex justify-between items-start mb-4 relative">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Income</p>
              <h3 className="text-2xl font-black mt-1">₹{(grandTotalIncome || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-xs font-semibold text-gray-500 relative bg-gray-50 px-2 py-1 rounded inline-block">
            Across {grandTotalTrips} verified trips
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-white border text-gray-800 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingDown size={64} className="text-red-600" />
          </div>
          <div className="flex justify-between items-start mb-4 relative">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Expense</p>
              <h3 className="text-2xl font-black mt-1">₹{(grandTotalExpense || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</h3>
            </div>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="text-xs font-semibold text-gray-500 relative bg-gray-50 px-2 py-1 rounded inline-block">
            Advances & settlements mapped
          </div>
        </div>

        {/* Profit Card */}
        <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-lg shadow-indigo-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
            <BarChart3 size={64} />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Net Profit</p>
              <h3 className="text-2xl font-black mt-1">₹{((grandTotalIncome || 0) - (grandTotalExpense || 0)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</h3>
            </div>
          </div>
          <div className="text-xs font-bold text-white relative z-10 inline-block bg-white/20 px-2 py-1 rounded backdrop-blur-sm shadow-sm ring-1 ring-white/30">
            {overallMargin.toFixed(2)}% Overall Margin
          </div>
        </div>

        {/* Total Routes Card */}
        <div className="bg-slate-800 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 pt-2 pr-2 opacity-5 scale-[2] translate-y-4 group-hover:scale-[2.2] transition-transform">
            <MapPin size={80} />
          </div>
          <div className="flex justify-between items-start mb-4 relative">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Routes</p>
              <h3 className="text-2xl font-black mt-1">{totalRoutes}</h3>
            </div>
            <div className="p-2 bg-slate-700/50 text-slate-300 rounded-lg">
              <Truck size={18} />
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-300 relative inline-block">
            Delivering to sequence drops
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
          <h2 className="text-sm font-black text-gray-800 px-2 flex items-center gap-2">
            <BarChart3 size={16} className="text-indigo-600" /> 
            ROUTE PERFORMANCE BREAKDOWN
          </h2>
          {loading && <LoaderIndicator />}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Route/Branches</th>
                <th className="px-5 py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">Trips</th>
                <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500 w-32">Income (₹)</th>
                <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500 w-32">Expense (₹)</th>
                <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500 w-32">Profit (₹)</th>
                <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500 w-24">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 && !loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                     <div className="inline-flex flex-col items-center justify-center text-gray-400">
                       <Search size={40} className="mb-3 opacity-20" />
                       <span className="font-bold text-gray-500">No route statistics found</span>
                       <span className="text-xs mt-1">Adjust your date range or log trips to evaluate performance</span>
                     </div>
                  </td>
                </tr>
              ) : (
                data.map((route) => {
                  const isLoss = route.profit < 0
                  return (
                    <tr key={route.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="font-black text-gray-800 group-hover:text-indigo-700 transition-colors">
                          {route.route_name.toUpperCase()}
                        </div>
                        {route.stops && route.stops.length > 0 && (
                          <div className="flex flex-wrap items-center mt-1.5 gap-1.5">
                            {route.stops.map((stopName, idx) => (
                              <React.Fragment key={idx}>
                                <span className="bg-white border shadow-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-gray-500">
                                  {stopName || 'Unknown'}
                                </span>
                                {idx < route.stops.length - 1 && (
                                  <span className="text-indigo-200">→</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-block bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded text-xs">
                          {route.total_trips}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-black text-green-700">
                        {route.total_income.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-5 py-3 text-right font-black text-orange-600">
                        {route.total_expense.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                      </td>
                      <td className={`px-5 py-3 text-right font-black ${isLoss ? 'text-red-600' : 'text-indigo-700'}`}>
                        {route.profit.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-1 rounded bg-opacity-10 w-16 justify-end ${
                          isLoss ? 'text-red-700 bg-red-500' : 
                          route.profit_margin > 20 ? 'text-green-700 bg-green-500' : 
                          route.profit_margin > 0 ? 'text-blue-700 bg-blue-500' : 
                          'text-gray-500 bg-gray-500'
                        }`}>
                          {route.profit_margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function LoaderIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full">
      <RefreshCw size={12} className="animate-spin" /> Fetching...
    </div>
  )
}
