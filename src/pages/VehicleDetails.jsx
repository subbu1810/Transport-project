import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save, RotateCcw } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function VehicleDetails() {
  const [vehicles, setVehicles] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [formData, setFormData] = useState({
    vehicle_number: '',
    owner_name: '',
    rate_per_km: '',
    phone: '',
    insurance_upto: '',
    vehicle_status: 'AVAILABLE',
    rc_valid_from: '',
    rc_valid_to: '',
    branch_id: '',
    is_active: true
  })

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' })
    }, 5000)
  }

  // Fetch all vehicles
  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const user = JSON.parse(localStorage.getItem('user'))
      let url = `${API_BASE_URL}/vehicles`
      
      if (user?.role === 'admin' && user?.branch_id) {
        url += `?branch_id=${user.branch_id}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setVehicles(data.data)
        setError('')
      } else {
        setError(data.message || 'Failed to fetch vehicles')
        showNotification('error', data.message || 'Failed to fetch vehicles')
      }
    } catch (err) {
      setError('Failed to connect to server')
      showNotification('error', 'Failed to connect to server. Please check if the Laravel server is running.')
      console.error('Error fetching vehicles:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch branches for dropdown
  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches`)
      const data = await response.json()

      if (data.success) {
        setBranches(data.data)
      }
    } catch (err) {
      console.error('Error fetching branches:', err)
    }
  }

  // Search vehicles
  const searchVehicles = async (query) => {
    if (!query.trim()) {
      fetchVehicles()
      return
    }

    try {
      setLoading(true)
      const user = JSON.parse(localStorage.getItem('user'))
      let url = `${API_BASE_URL}/vehicles/search?q=${encodeURIComponent(query)}`
      
      if (user?.role === 'admin' && user?.branch_id) {
        url += `&branch_id=${user.branch_id}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setVehicles(data.data)
        setError('')
        showNotification('info', `Found ${data.data.length} vehicles matching "${query}"`)
      } else {
        setError(data.message || 'Search failed')
        showNotification('error', data.message || 'Search failed')
      }
    } catch (err) {
      setError('Failed to search vehicles')
      showNotification('error', 'Failed to search vehicles')
      console.error('Error searching vehicles:', err)
    } finally {
      setLoading(false)
    }
  }

  // Save vehicle
  const saveVehicle = async (e) => {
    e.preventDefault()

    try {
      const url = editingVehicle
        ? `${API_BASE_URL}/vehicles/${editingVehicle.id}`
        : `${API_BASE_URL}/vehicles`

      const method = editingVehicle ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        fetchVehicles()
        setShowModal(false)
        setEditingVehicle(null)
        resetForm()
        setError('')
        showNotification('success', editingVehicle ? 'Vehicle updated successfully!' : 'Vehicle created successfully!')
      } else {
        setError(data.message || 'Failed to save vehicle')
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ')
          showNotification('error', `Validation failed: ${errorMessages}`)
        } else {
          showNotification('error', data.message || 'Failed to save vehicle')
        }
      }
    } catch (err) {
      setError('Failed to save vehicle')
      showNotification('error', 'Failed to save vehicle. Please check your connection and try again.')
      console.error('Error saving vehicle:', err)
    }
  }

  // Delete vehicle
  const deleteVehicle = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        fetchVehicles()
        setError('')
        showNotification('success', 'Vehicle deleted successfully!')
      } else {
        setError(data.message || 'Failed to delete vehicle')
        showNotification('error', data.message || 'Failed to delete vehicle')
      }
    } catch (err) {
      setError('Failed to delete vehicle')
      showNotification('error', 'Failed to delete vehicle. Please check your connection and try again.')
      console.error('Error deleting vehicle:', err)
    }
  }

  // Edit vehicle
  const editVehicle = (vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      vehicle_number: vehicle.vehicle_number,
      owner_name: vehicle.owner_name,
      rate_per_km: vehicle.rate_per_km || '',
      phone: vehicle.phone || '',
      insurance_upto: vehicle.insurance_upto ? new Date(vehicle.insurance_upto).toISOString().split('T')[0] : '',
      vehicle_status: vehicle.vehicle_status,
      rc_valid_from: vehicle.rc_valid_from ? new Date(vehicle.rc_valid_from).toISOString().split('T')[0] : '',
      rc_valid_to: vehicle.rc_valid_to ? new Date(vehicle.rc_valid_to).toISOString().split('T')[0] : '',
      branch_id: vehicle.branch_id || '',
      is_active: vehicle.is_active
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    const user = JSON.parse(localStorage.getItem('user'))
    setFormData({
      vehicle_number: '',
      owner_name: '',
      rate_per_km: '',
      phone: '',
      insurance_upto: '',
      vehicle_status: 'AVAILABLE',
      rc_valid_from: '',
      rc_valid_to: '',
      branch_id: user?.role === 'admin' ? user?.branch_id : '',
      is_active: true
    })
  }

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchVehicles(searchTerm)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Initial fetch
  useEffect(() => {
    fetchVehicles()
    fetchBranches()
  }, [])

  return (
    <div className="p-4 space-y-4">
      {/* Notification Popup */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-[100] max-w-sm w-full bg-white rounded-2xl shadow-2xl border-l-4 overflow-hidden transform transition-all duration-500 animate-in slide-in-from-right-10 ${
          notification.type === 'success' ? 'border-green-500' :
          notification.type === 'error' ? 'border-red-500' :
          'border-blue-500'
        }`}>
          <div className="p-4 flex items-center gap-4">
            <div className={`p-2 rounded-full ${
              notification.type === 'success' ? 'bg-green-50' :
              notification.type === 'error' ? 'bg-red-50' :
              'bg-blue-50'
            }`}>
              {notification.type === 'success' && <Plus className="text-green-600 rotate-45" size={20} />}
              {notification.type === 'error' && <X className="text-red-600 font-bold" size={20} />}
              {notification.type === 'info' && <Search className="text-blue-600" size={20} />}
            </div>
            <div className="flex-1">
              <h4 className={`text-sm font-bold uppercase tracking-wider ${
                notification.type === 'success' ? 'text-green-800' :
                notification.type === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {notification.type === 'success' ? 'Success' :
                 notification.type === 'error' ? 'Notice' :
                 'Info'}
              </h4>
              <p className="text-xs font-semibold text-gray-600 mt-0.5">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification({ show: false, type: '', message: '' })}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Vehicle Details</h1>
          <button 
            onClick={fetchVehicles}
            disabled={loading}
            className="p-1.5 px-2 bg-white rounded-xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-all text-blue-600 disabled:opacity-50"
            title="Refresh Fleet Data"
          >
            <RotateCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <button
          onClick={() => {
            setEditingVehicle(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded text-sm font-bold shadow-sm hover:bg-green-700 transition"
        >
          <Plus size={16} />
          Add Vehicle
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
        <div className="flex justify-start">
          <div className="bg-green-50 p-1.5 rounded-lg border flex items-center gap-2 border-green-200 w-full max-w-md transition-all focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100">
            <Search size={18} className="text-green-600 ml-2" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-transparent border-none focus:outline-none text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading vehicles...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-green-100 border-b-2 border-green-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Vehicle No</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Owner Name</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-800">Rate/KM (₹)</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Insurance Upto</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Vehicle Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">RC Valid To</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Branch</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                      No vehicles found
                    </td>
                  </tr>
                ) : (
                  vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-4 py-4 font-semibold text-gray-800">{vehicle.vehicle_number}</td>
                      <td className="px-4 py-4 text-gray-600">{vehicle.owner_name}</td>
                      <td className="px-4 py-4 text-right font-semibold text-green-700">{vehicle.rate_per_km ? `₹${vehicle.rate_per_km}` : '-'}</td>
                      <td className="px-4 py-4 text-gray-600">{vehicle.phone || '-'}</td>
                      <td className="px-4 py-4 text-gray-600">
                        {vehicle.insurance_upto ? new Date(vehicle.insurance_upto).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${vehicle.vehicle_status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                          vehicle.vehicle_status === 'NOT_AVAILABLE' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {vehicle.vehicle_status?.replace('_', ' ') || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {vehicle.rc_valid_to ? new Date(vehicle.rc_valid_to).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-4 py-4 text-gray-600">{vehicle.branch?.branch_name || '-'}</td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${vehicle.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {vehicle.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 flex justify-center gap-2">
                        <button
                          onClick={() => editVehicle(vehicle)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteVehicle(vehicle.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800">
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingVehicle(null)
                  resetForm()
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveVehicle} className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Vehicle Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="20"
                    placeholder="e.g. KA-01-AB-1234"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Owner Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="100"
                    placeholder="Enter owner name"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Rate per KM (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 12.50"
                    value={formData.rate_per_km}
                    onChange={(e) => setFormData({ ...formData, rate_per_km: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Phone
                  </label>
                  <input
                    type="text"
                    maxLength="10"
                    placeholder="10 digits"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Insurance Upto
                  </label>
                  <input
                    type="date"
                    value={formData.insurance_upto}
                    onChange={(e) => setFormData({ ...formData, insurance_upto: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Vehicle Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.vehicle_status}
                    onChange={(e) => setFormData({ ...formData, vehicle_status: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm cursor-pointer"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="NOT_AVAILABLE">Not Available</option>
                    <option value="MAINTENANCE">Under Maintenance</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Branch
                  </label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    disabled={JSON.parse(localStorage.getItem('user'))?.role === 'admin'}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    RC Valid From
                  </label>
                  <input
                    type="date"
                    value={formData.rc_valid_from}
                    onChange={(e) => setFormData({ ...formData, rc_valid_from: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    RC Valid To
                  </label>
                  <input
                    type="date"
                    value={formData.rc_valid_to}
                    onChange={(e) => setFormData({ ...formData, rc_valid_to: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-green-600 bg-gray-50 border-gray-200 rounded focus:ring-green-500/20 focus:ring-2 transition-all"
                  />
                  <label htmlFor="is_active" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Active Status
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingVehicle(null)
                    resetForm()
                  }}
                  className="px-6 py-2.5 text-gray-500 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-all active:scale-95 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all active:scale-95 text-sm"
                >
                  <Save size={18} />
                  {editingVehicle ? 'Update Vehicle' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VehicleDetails
