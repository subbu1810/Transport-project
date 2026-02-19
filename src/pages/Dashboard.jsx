import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Truck, Users, DollarSign, TrendingUp, FileText, MapPin, Loader2, PlusCircle, LayoutGrid, FileSearch } from 'lucide-react'
import { useTabs } from '../contexts/TabContext'

const API_BASE_URL = 'http://localhost:8000/api/v1'

function Dashboard() {
  const [data, setData] = useState({ stats: [], recent_trips: [] })
  const [loading, setLoading] = useState(true)
  const { addTab } = useTabs()

  const iconMap = {
    'Truck': Truck,
    'Users': Users,
    'FileText': FileText,
    'MapPin': MapPin,
    'TrendingUp': TrendingUp
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

      const response = await axios.get(`${API_BASE_URL}/dashboard/stats`, { params })
      if (response.data.success) {
        setData(response.data.data)
      }
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

  return (
    <div className="p-4 space-y-4 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 uppercase tracking-tight">Operation Dashboard</h1>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Real-time logistics analytics</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">System Status</p>
          <div className="flex items-center gap-2 justify-end mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-gray-800 uppercase">Live & Synced</span>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.stats.map((stat, index) => {
          const Icon = iconMap[stat.icon] || LayoutGrid
          return (
            <div key={index} className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-50/50 p-4 hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="relative z-10 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 text-[9px] font-medium uppercase tracking-widest truncate mb-1">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-800 truncate tracking-tight">{stat.value}</p>
                </div>
                <div className={`${stat.iconBg} p-3 rounded-xl shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform flex-shrink-0 text-white`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full ${stat.iconBg} opacity-[0.03] group-hover:scale-150 transition-transform`}></div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Recent Trips Section */}
        <div className="bg-gray-50/50 rounded-3xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 uppercase tracking-tighter">Live Trip Feeds</h3>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[9px] font-medium uppercase tracking-widest">Most Recent</span>
          </div>
          <div className="space-y-3">
            {data.recent_trips.length > 0 ? (
              data.recent_trips.map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-50 shadow-sm hover:border-blue-200 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                      <Truck size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm uppercase tracking-tight">{trip.trip_number}</p>
                      <p className="text-[9px] text-gray-400 font-normal uppercase tracking-wider mt-0.5">
                        {trip.dispatch_branch?.branch_name} → {trip.destination_branch?.branch_name || 'Direct'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-widest shadow-sm ${trip.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                      trip.status === 'DELIVERED' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                      {trip.status}
                    </span>
                    <p className="text-[8px] text-gray-400 font-normal mt-1 uppercase tracking-tighter">{new Date(trip.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Truck size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 font-medium uppercase tracking-widest text-[10px]">No Recent Exits Detected</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Actions Section */}
        <div className="bg-gray-50/50 rounded-3xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 uppercase tracking-tighter mb-6">Fast Operations</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => addTab('Trip Sheet Entry', '/trip-sheet-entry')}
              className="group p-4 bg-white rounded-2xl border-2 border-transparent hover:border-blue-500 transition-all text-left shadow-sm hover:shadow-lg hover:-translate-y-1"
            >
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <PlusCircle size={20} />
              </div>
              <p className="font-semibold text-gray-800 uppercase tracking-tight text-xs">New Trip</p>
              <p className="text-[9px] text-gray-400 font-normal uppercase tracking-widest mt-1">Dispatch Exit</p>
            </button>

            <button
              onClick={() => addTab('GC Entry', '/gc-entry')}
              className="group p-4 bg-white rounded-2xl border-2 border-transparent hover:border-green-500 transition-all text-left shadow-sm hover:shadow-lg hover:-translate-y-1"
            >
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-600 group-hover:text-white transition-all">
                <FileText size={20} />
              </div>
              <p className="font-semibold text-gray-800 uppercase tracking-tight text-xs">GC Booking</p>
              <p className="text-[9px] text-gray-400 font-normal uppercase tracking-widest mt-1">Consignment</p>
            </button>

            <button
              onClick={() => addTab('GC Report', '/gc-report')}
              className="group p-4 bg-white rounded-2xl border-2 border-transparent hover:border-purple-500 transition-all text-left shadow-sm hover:shadow-lg hover:-translate-y-1"
            >
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <FileSearch size={20} />
              </div>
              <p className="font-semibold text-gray-800 uppercase tracking-tight text-xs">Audit Hub</p>
              <p className="text-[9px] text-gray-400 font-normal uppercase tracking-widest mt-1">Log Analysis</p>
            </button>

            <button
              onClick={() => addTab('Trip Sheet Ack', '/trip-sheet-ack')}
              className="group p-4 bg-white rounded-2xl border-2 border-transparent hover:border-orange-500 transition-all text-left shadow-sm hover:shadow-lg hover:-translate-y-1"
            >
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-600 group-hover:text-white transition-all">
                <DollarSign size={20} />
              </div>
              <p className="font-semibold text-gray-800 uppercase tracking-tight text-xs">Inward Ack</p>
              <p className="text-[9px] text-gray-400 font-normal uppercase tracking-widest mt-1">Settle Trip</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
