import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save, RotateCcw, MapPin, ListOrdered, GripVertical, ChevronDown } from 'lucide-react'
import { API_BASE_URL } from '../config/api';

function RouteMaster() {
  const [routes, setRoutes] = useState([])
  const [taluks, setTaluks] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingRoute, setEditingRoute] = useState(null)
  
  const [formData, setFormData] = useState({
    route_name: '',
    origin_branch_id: '',
    destination_taluk_id: '',
    status: 'ACTIVE',
    stops: [] // { taluk_id, stop_sequence, id (temp) }
  })

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' })
    }, 5000)
  }

  useEffect(() => {
    fetchRoutes()
    fetchTaluks()
  }, [])

  const fetchTaluks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/taluks`)
      const data = await response.json()
      if (data.success) {
        setTaluks(data.data)
      }
    } catch (err) {
      console.error('Error fetching taluks:', err)
    }
  }

  const fetchRoutes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/routes`)
      const data = await response.json()
      if (data.success) {
        setRoutes(data.data)
      }
    } catch (err) {
      console.error('Error fetching routes:', err)
      showNotification('error', 'Failed to fetch routes')
    } finally {
      setLoading(false)
    }
  }

  const addStop = () => {
    const nextSequence = formData.stops.length + 1
    const newStop = {
      id: Date.now(),
      taluk_id: '',
      stop_sequence: nextSequence
    }
    setFormData({
      ...formData,
      stops: [...formData.stops, newStop]
    })
  }

  const removeStop = (id) => {
    const updatedStops = formData.stops
      .filter(s => s.id !== id)
      .map((s, idx) => ({ ...s, stop_sequence: idx + 1 }))
    
    setFormData({ ...formData, stops: updatedStops })
  }

  const updateStopTaluk = (id, talukId) => {
    const updatedStops = formData.stops.map(s => 
      s.id === id ? { ...s, taluk_id: talukId } : s
    )
    setFormData({ ...formData, stops: updatedStops })
  }

  const moveStop = (index, direction) => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === formData.stops.length - 1) return

    const newStops = [...formData.stops];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Traditional swap to avoid Babel destructuring issues with array elements
    const temp = newStops[index];
    newStops[index] = newStops[targetIndex];
    newStops[targetIndex] = temp;
    
    // Update sequences
    const finalizedStops = newStops.map((s, idx) => ({ ...s, stop_sequence: idx + 1 }))
    setFormData({ ...formData, stops: finalizedStops })
  }

  const saveRoute = async (e) => {
    e.preventDefault()

    if (!formData.route_name) {
      showNotification('error', 'Route name is required')
      return
    }

    if (formData.stops.length < 2) {
      showNotification('error', 'A route must have at least 2 stops (Origin and Destination)')
      return
    }

    // Check for empty stops
    if (formData.stops.some(s => !s.taluk_id)) {
      showNotification('error', 'All stops must have a taluk selected')
      return
    }

    try {
      const url = editingRoute
        ? `${API_BASE_URL}/routes/${editingRoute.id}`
        : `${API_BASE_URL}/routes`

      const method = editingRoute ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          origin_branch_id: formData.origin_branch_id || null, // Keep origin branch for ownership
          destination_taluk_id: formData.stops[formData.stops.length - 1].taluk_id
        })
      })

      const data = await response.json()

      if (data.success) {
        fetchRoutes()
        setShowModal(false)
        setEditingRoute(null)
        resetForm()
        showNotification('success', editingRoute ? 'Route updated successfully!' : 'Route created successfully!')
      } else {
        showNotification('error', data.message || 'Failed to save route')
      }
    } catch (err) {
      showNotification('error', 'Failed to save route')
      console.error('Error saving route:', err)
    }
  }

  const resetForm = () => {
    setFormData({
      route_name: '',
      origin_branch_id: '',
      destination_taluk_id: '',
      status: 'ACTIVE',
      stops: []
    })
  }

  const editRoute = (route) => {
    setEditingRoute(route)
    setFormData({
      route_name: route.route_name,
      origin_branch_id: route.origin_branch_id || '',
      destination_branch_id: route.destination_branch_id || '',
      status: route.status,
      stops: route.stops.map(s => ({
        id: s.id,
        taluk_id: s.taluk_id,
        stop_sequence: s.stop_sequence
      }))
    })
    setShowModal(true)
  }

  const deleteRoute = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/routes/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        fetchRoutes()
        showNotification('success', 'Route deleted successfully')
      }
    } catch (err) {
      console.error('Error deleting route:', err)
      showNotification('error', 'Failed to delete route')
    }
  }

  const filteredRoutes = routes.filter(r => 
    r.route_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-4 space-y-4">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-[100] max-w-sm w-full bg-white rounded-2xl shadow-2xl border-l-4 overflow-hidden transform transition-all duration-300 ${
          notification.type === 'success' ? 'border-green-500' : 'border-red-500'
        }`}>
          <div className="p-4 flex items-center gap-4">
             <div className="flex-1">
              <p className="text-xs font-bold text-gray-800 tracking-tight uppercase">{notification.type}</p>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">{notification.message}</p>
            </div>
            <button onClick={() => setNotification({ ...notification, show: false })}><X size={16}/></button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Route Master (Multi-Stop Mapping)</h1>
          <button onClick={fetchRoutes} className="p-1 px-1.5 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-all text-blue-600">
            <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <button
          onClick={() => {
            setEditingRoute(null)
            resetForm()
            addStop(); addStop(); // Start with 2 stops
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition shadow-md"
        >
          <Plus size={16} />
          Create New Route
        </button>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search routes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 text-xs font-medium"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase tracking-widest">Route Name</th>
                <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase tracking-widest">Journey Path</th>
                <th className="px-4 py-3 text-center font-bold text-gray-600 uppercase tracking-widest">Stops</th>
                <th className="px-4 py-3 text-center font-bold text-gray-600 uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-right font-bold text-gray-600 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRoutes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="font-black text-gray-800 uppercase tracking-tight">{route.route_name}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {route.stops.map((stop, idx) => (
                        <React.Fragment key={stop.id}>
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${idx === 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : idx === route.stops.length - 1 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                            {stop.taluk?.name}
                          </span>
                          {idx < route.stops.length - 1 && <span className="text-gray-300">→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-black text-gray-500">{route.stops.length} STOPS</span>
                  </td>
                   <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${route.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                      {route.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => editRoute(route)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={14}/></button>
                      <button onClick={() => deleteRoute(route.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">{editingRoute ? 'Edit Route Mapping' : 'Map New Sequential Route'}</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Define the order of delivery stops</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition shadow-sm border border-gray-100"><X size={20}/></button>
            </div>

            <form onSubmit={saveRoute} className="flex-1 overflow-auto p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Route Name (e.g. SINDHANUR-KALBURGI EXPRESS)</label>
                  <input
                    type="text"
                    required
                    value={formData.route_name}
                    onChange={(e) => setFormData({ ...formData, route_name: e.target.value.toUpperCase() })}
                    placeholder="Enter identifying route name"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700 uppercase tracking-tight transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Sequential Stops Path</label>
                    <button type="button" onClick={addStop} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700">+ Add Mid-way Stop</button>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.stops.map((stop, index) => (
                      <div key={stop.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-indigo-100 transition-all group">
                        <div className="flex-shrink-0 flex flex-col items-center justify-center w-8 h-8 rounded-lg bg-gray-50 text-[10px] font-black text-gray-400">
                          {index === 0 ? "START" : index === formData.stops.length - 1 ? "END" : index + 1}
                        </div>
                        <div className="flex-1">
                          <select
                            value={stop.taluk_id}
                            onChange={(e) => updateStopTaluk(stop.id, e.target.value)}
                            className="w-full bg-transparent border-none outline-none font-bold text-gray-700 text-sm py-1 cursor-pointer"
                          >
                            <option value="">Select Taluk</option>
                            {taluks.map(t => (
                              <option key={t.id} value={t.id}>
                               {t.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => moveStop(index, 'up')} className="p-1 hover:bg-gray-100 rounded text-gray-400"><ChevronDown size={14} className="rotate-180"/></button>
                          <button type="button" onClick={() => moveStop(index, 'down')} className="p-1 hover:bg-gray-100 rounded text-gray-400"><ChevronDown size={14}/></button>
                          {formData.stops.length > 2 && (
                            <button type="button" onClick={() => removeStop(stop.id)} className="p-1 hover:bg-red-50 text-red-400 rounded transition"><Trash2 size={14}/></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-gray-700 transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                onClick={saveRoute}
                className="px-8 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center gap-2"
              >
                <Save size={16}/>
                {editingRoute ? 'Update Mapping' : 'Save Route Mapping'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RouteMaster
