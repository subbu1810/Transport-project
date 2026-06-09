import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Truck, Users, DollarSign, TrendingUp, FileText, MapPin, Loader2, PlusCircle, LayoutGrid, FileSearch, RotateCcw, ScanSearch, BarChart3, Activity } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ComposedChart, Line
} from 'recharts'
import { useTabs } from '../contexts/TabContext'
import { API_BASE_URL } from '../config/api'

function Dashboard() {
  const [data, setData] = useState({ stats: [], recent_trips: [], incoming_alerts: [], top_consignors: [] })
  const [chartData, setChartData] = useState({ profitLoss: [], bookingDispatch: [] })
  const [loading, setLoading] = useState(true)
  const { addTab } = useTabs()
  const currentUser = JSON.parse(localStorage.getItem('user'))

  const iconMap = {
    'Truck': Truck,
    'Users': Users,
    'FileText': FileText,
    'MapPin': MapPin,
    'TrendingUp': TrendingUp,
    'LayoutGrid': LayoutGrid,
    'FileSearch': FileSearch
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const user = JSON.parse(localStorage.getItem('user'))
      const params = {}
      if (user?.role !== 'superadmin' && user?.branch_id) {
        params.branch_id = user.branch_id
      }

      // Fetch advanced analytics for the last 30 days
      const toDate = new Date().toISOString().split('T')[0]
      const fromDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
      const analyticParams = { from_date: fromDate, to_date: toDate, ...params }

      const [statsRes, profitRes, bookingRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard/stats`, { params }),
        axios.get(`${API_BASE_URL}/dashboard/profit-loss-stats`, { params: analyticParams }),
        axios.get(`${API_BASE_URL}/dashboard/booking-dispatch-stats`, { params: analyticParams })
      ])

      if (statsRes.data.success) {
        setData({
          stats: statsRes.data.data.stats || [],
          recent_trips: statsRes.data.data.recent_trips || [],
          incoming_alerts: statsRes.data.data.incoming_alerts || [],
          top_consignors: statsRes.data.data.top_consignors || []
        })
      }

      setChartData({
        profitLoss: profitRes.data?.success ? profitRes.data.data.daily_trend : [],
        bookingDispatch: bookingRes.data?.success ? bookingRes.data.data.daily_stats : []
      })

    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="animate-spin text-blue-600" />
          <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Loading Real-time Insights...</p>
        </div>
      </div>
    )
  }

  if (currentUser?.role === 'consignor') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <div className="bg-white p-12 rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50 text-center animate-in slide-in-from-bottom-5 duration-700 max-w-lg w-full mx-4">
            <div className="inline-flex p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-6 shadow-inner">
                <Users size={48} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-3">Welcome Back!</h1>
            <p className="text-slate-500 font-semibold text-sm leading-relaxed mb-8">
              Access your personalized consignor dashboard. Please use the sidebar menu to navigate to your tracking, reports, and shipments.
            </p>
            <div className="h-1 w-20 bg-indigo-600 rounded-full mx-auto"></div>
        </div>
      </div>
    )
  }

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md p-3 border border-gray-100 rounded-xl shadow-xl">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-100 pb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs font-bold flex justify-between gap-4 mb-1" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span>{typeof entry.value === 'number' && entry.name.toLowerCase().includes('amount') ? `₹${entry.value.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 space-y-4 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
              {currentUser?.role === 'superadmin' ? 'Network' : currentUser?.branch_name} Intelligence Hub
            </h1>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">
              Interactive Data Visualization & Global Analytics
            </p>
          </div>
          <button 
            onClick={fetchDashboardStats}
            disabled={loading}
            className="ml-4 p-2 bg-gray-50 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:bg-gray-100 transition-all active:scale-95 text-blue-600 disabled:opacity-50"
            title="Refresh Dashboard"
          >
            <RotateCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">System Status</p>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 shadow-inner">
            <div className={`w-2 h-2 rounded-full animate-pulse ${data.incoming_alerts.length > 0 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`}></div>
            <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest">
              {data.incoming_alerts.length > 0 ? `${data.incoming_alerts.length} Pending Actions` : 'Live & Synced'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {data.stats.map((stat, index) => {
          const Icon = iconMap[stat.icon] || LayoutGrid
          return (
            <div key={index} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 hover:shadow-lg transition-all group relative overflow-hidden">
              <div className="relative z-10 flex flex-col gap-3">
                <div className={`w-10 h-10 ${stat.iconBg} rounded-xl shadow-sm text-white flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-gray-800 tracking-tighter">{stat.value}</p>
                </div>
              </div>
              <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${stat.iconBg} opacity-[0.03] group-hover:scale-[2] transition-transform duration-500`}></div>
            </div>
          )
        })}
      </div>

      {/* Advanced Interactive Data Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profit vs Loss Trend (Area Chart) */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <BarChart3 size={16} />
              </div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Financial Trend (30 Days)</h3>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.profitLoss} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={60} tickFormatter={(value) => `₹${value/1000}k`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Volume: Dispatch vs Inwards (Composed Chart) */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Truck size={16} />
              </div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Operational Volume (30 Days)</h3>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData.bookingDispatch} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={40} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Bar dataKey="bookings" name="Bookings Dispatched" barSize={12} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="inwards" name="Stock Inwarded" barSize={12} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Line type="step" dataKey="bookings" name="Booking Trend" stroke="#cbd5e1" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Alerts & Recent Trips Column */}
        <div className="md:col-span-8 space-y-4">
          {/* Incoming Trip Alerts */}
          {data.incoming_alerts.length > 0 && (
            <div className="bg-red-50/50 rounded-3xl border border-red-100 p-6 animate-in slide-in-from-left duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-600 rounded-lg text-white shadow-lg shadow-red-200 animate-pulse">
                    <TrendingUp size={16} />
                  </div>
                  <h3 className="text-lg font-black text-red-900 uppercase tracking-tighter">Incoming Trips</h3>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[9px] font-black uppercase tracking-widest shadow-inner">Attention Required</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.incoming_alerts.map((trip) => (
                  <div key={trip.id} className="flex flex-col p-4 bg-white rounded-2xl border border-red-100 shadow-sm hover:border-red-300 transition-all group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-600 group-hover:text-white transition-colors">
                          <Truck size={18} />
                        </div>
                        <div>
                          <p className="font-black text-gray-800 text-sm tracking-tight">{trip.trip_number}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{trip.vehicle?.vehicle_number}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 flex-1 mb-3">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Route</p>
                        <p className="text-xs font-semibold text-gray-800 mt-0.5">
                            <span className="text-gray-400">From</span> {trip.dispatch_branch?.branch_name}
                        </p>
                    </div>
                    <button
                      onClick={() => addTab('Trip Sheet Ack', '/trip-sheet-ack')}
                      className="w-full py-2 bg-red-600 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 text-center"
                    >
                      Process Arrival
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Trips Section */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative overflow-hidden h-[400px] flex flex-col">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Truck size={150} />
            </div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-50 text-gray-600 border border-gray-100 rounded-lg">
                    <Truck size={16} />
                </div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Live Fleet Movement</h3>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[9px] font-black uppercase tracking-widest">Real-time</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 relative z-10 pr-2 custom-scrollbar">
              {data.recent_trips.length > 0 ? (
                data.recent_trips.map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:border-blue-200 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                        <Truck size={16} />
                      </div>
                      <div>
                        <p className="font-black text-gray-800 text-sm tracking-tight">{trip.trip_number}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-bold text-gray-500 uppercase">{trip.dispatch_branch?.branch_name}</span>
                            <span className="text-[10px] text-blue-300">→</span>
                            <span className="text-[9px] font-bold text-gray-600 uppercase">{trip.destination_branch?.branch_name || trip.alert_branch_data?.branch_name || 'Direct'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${trip.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                        trip.status === 'DELIVERED' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                        {trip.status}
                      </span>
                      <p className="text-[8px] text-gray-400 font-bold mt-1 uppercase max-w-[80px] truncate">{new Date(trip.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <Truck size={32} className="text-gray-200 mb-2" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No Fleet Movement Detected</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Mini Leaderboard & Fast Operations */}
        <div className="md:col-span-4 space-y-4">
          {/* Top Consignors Leaderboard */}
          <div className="bg-indigo-600 text-white rounded-3xl p-6 shadow-xl shadow-indigo-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-xl"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-indigo-200" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Top Consignors</h3>
              </div>
              <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">Volume</span>
            </div>
            <div className="space-y-2 relative z-10">
              {data.top_consignors.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/5 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-[10px] ${idx === 0 ? 'bg-amber-400 text-amber-900 shadow-[0_0_10px_rgba(251,191,36,0.5)]' :
                      idx === 1 ? 'bg-slate-300 text-slate-800' :
                        idx === 2 ? 'bg-orange-300 text-orange-900' : 'bg-white/10 text-indigo-200'
                      }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-white text-[11px] truncate max-w-[120px] uppercase leading-tight">{c.consignor?.name}</p>
                      <p className="text-[8px] text-indigo-200 font-bold uppercase">{c.wb_count} Trips Booked</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-white tracking-tighter">₹{Math.round(c.total_value).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {data.top_consignors.length === 0 && (
                <div className="text-center py-4 text-indigo-300 font-bold text-[10px] uppercase tracking-widest">No customer data</div>
              )}
            </div>
          </div>

          {/* Navigation Actions Section */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 opacity-5 -mr-4 -mt-4">
                <LayoutGrid size={100} />
             </div>
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                <PlusCircle size={16} className="text-blue-600" />
                Fast Operations
            </h3>
            <div className="grid grid-cols-2 gap-2 relative z-10">
              <button
                onClick={() => addTab('Trip Sheet Entry', '/trip-sheet-entry')}
                className="group p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-500 transition-all text-left hover:bg-blue-50"
              >
                <p className="font-black text-gray-800 uppercase text-[10px] group-hover:text-blue-700 transition-colors">New Trip</p>
                <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5">Dispatch Exit</p>
              </button>

              <button
                onClick={() => addTab('GC Entry', '/gc-entry')}
                className="group p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-green-500 transition-all text-left hover:bg-green-50"
              >
                <p className="font-black text-gray-800 uppercase text-[10px] group-hover:text-green-700 transition-colors">GC Booking</p>
                <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5">Consignment</p>
              </button>

              <button
                onClick={() => addTab('Trip Sheet Ack', '/trip-sheet-ack')}
                className="group p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-orange-500 transition-all text-left hover:bg-orange-50"
              >
                <p className="font-black text-gray-800 uppercase text-[10px] group-hover:text-orange-700 transition-colors">Inward Ack</p>
                <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5">Settle Trip</p>
              </button>

              <button
                onClick={() => addTab('GC Track', '/gc-track')}
                className="group p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-teal-500 transition-all text-left hover:bg-teal-50"
              >
                <p className="font-black text-gray-800 uppercase text-[10px] group-hover:text-teal-700 transition-colors">GC Track</p>
                <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5">Live Trace</p>
              </button>
            </div>
            <button
                onClick={() => addTab('Route Analytics', '/route-analytics')}
                className="mt-2 w-full py-2 bg-slate-800 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 text-center flex items-center justify-center gap-2"
            >
                <BarChart3 size={14} /> Open Route Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
