import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts'
import { Search, Loader2, Download, Calendar, Database, TrendingUp, Package, Truck, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function BookingAndDispatch() {
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    branch_id: JSON.parse(localStorage.getItem('user'))?.branch_id?.toString() || ''
  })

  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')))

  const [data, setData] = useState({
    daily_stats: [],
    branch_stats: [],
    totals: { bookings: 0, inwards: 0, booking_amount: 0, inward_amount: 0 }
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [branches, setBranches] = useState([])
  const [activeView, setActiveView] = useState('graph') // graph | details

  useEffect(() => {
    fetchBranches()
    handleGetDetails()
  }, [])

  const fetchBranches = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      const response = await fetch(`${API_BASE_URL}/branches`)
      const d = await response.json()
      if (d.success) {
        if (user?.role === 'superadmin') {
          setBranches(d.data)
        } else {
          const userBranch = d.data.find(b => b.id === user?.branch_id)
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

      const response = await fetch(`${API_BASE_URL}/dashboard/booking-dispatch-stats?${queryParams.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch statistics')
      const d = await response.json()

      if (d.success) {
        setData(d.data)
      } else {
        setError(d.message || 'Failed to get data')
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Connection error or server failure')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print();
  }

  return (
    <div className="p-3 space-y-3 bg-gray-50/50 min-h-screen">
      {/* Header & Filter Row */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <TrendingUp size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-800 uppercase tracking-tight">Booking & Dispatch</h1>
              <p className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">Performance analytics & trends</p>
            </div>
          </div>

          <div className="flex-1 min-w-[300px]">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 items-end">
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider ml-0.5">From</label>
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
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider ml-0.5">To</label>
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
                <div className="relative">
                  <Database className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                  <select
                    value={filters.branch_id || ''}
                    onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
                    disabled={currentUser?.role !== 'superadmin'}
                    className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-indigo-500 focus:bg-white focus:outline-none transition-all text-xs font-bold appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">All Branches</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <button
                  onClick={handleGetDetails}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-indigo-100 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  UPDATE STATS
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

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Bookings</p>
            <h4 className="text-xl font-black text-gray-800 tracking-tighter mt-0.5">{data.totals.bookings}</h4>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
            <Package size={20} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Inwards</p>
            <h4 className="text-xl font-black text-gray-800 tracking-tighter mt-0.5">{data.totals.inwards}</h4>
          </div>
          <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:scale-110 transition-transform">
            <Truck size={20} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Booking Revenue</p>
            <h4 className="text-xl font-black text-gray-800 tracking-tighter mt-0.5">₹{Math.round(data.totals.booking_amount).toLocaleString()}</h4>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
            <ArrowUpRight size={20} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Inward Revenue</p>
            <h4 className="text-xl font-black text-gray-800 tracking-tighter mt-0.5">₹{Math.round(data.totals.inward_amount).toLocaleString()}</h4>
          </div>
          <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:scale-110 transition-transform">
            <ArrowDownRight size={20} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveView('graph')}
              className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'graph' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Performance Graph
            </button>
            <button
              onClick={() => setActiveView('details')}
              className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'details' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Branch Overview
            </button>
          </div>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all"
          >
            <Download size={12} /> Full Report
          </button>
        </div>

        <div className="p-6">
          {activeView === 'graph' ? (
            <div className="space-y-6">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.daily_stats}>
                    <defs>
                      <linearGradient id="colorBook" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                      labelStyle={{ fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', paddingTop: '20px' }} />
                    <Area type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorBook)" />
                    <Area type="monotone" dataKey="inwards" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 rounded-lg">
                    <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest rounded-l-lg border-b border-gray-100">Branch Name</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">Booking Qty</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-100 text-right">Booking Amt</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">Inward Qty</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest rounded-r-lg border-b border-gray-100 text-right">Inward Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.branch_stats.map((branch, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-bold text-gray-800">{branch.branch_name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-black">{branch.booking_count}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-black text-gray-900 text-right">₹{Math.round(branch.booking_amount).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-black">{branch.inward_count}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-black text-gray-900 text-right">₹{Math.round(branch.inward_amount).toLocaleString()}</td>
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

export default BookingAndDispatch
