import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

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
      const response = await fetch(`${API_URL}/vehicles`)
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
      const response = await fetch(`${API_URL}/branches`)
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
      const response = await fetch(`${API_URL}/vehicles/search?q=${encodeURIComponent(query)}`)
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
        ? `${API_URL}/vehicles/${editingVehicle.id}`
        : `${API_URL}/vehicles`
      
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
      const response = await fetch(`${API_URL}/vehicles/${id}`, {
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
    setFormData({
      vehicle_number: '',
      owner_name: '',
      phone: '',
      insurance_upto: '',
      vehicle_status: 'AVAILABLE',
      rc_valid_from: '',
      rc_valid_to: '',
      branch_id: '',
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
    <div className="p-6 space-y-6">
      {/* Notification Popup */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-start">
            <div className="flex-1">
              <p className="font-medium">
                {notification.type === 'success' ? 'Success!' :
                 notification.type === 'error' ? 'Error!' :
                 'Info'}
              </p>
              <p className="text-sm mt-1">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification({ show: false, type: '', message: '' })}
              className="ml-4 text-white hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Vehicle Details</h1>
        <button 
          onClick={() => {
            setEditingVehicle(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={20} />
          Add Vehicle
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-100 p-4 rounded-lg border-2 border-green-300">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            />
            <Search size={20} className="text-gray-400" />
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Insurance Upto</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">Vehicle Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-800">RC Valid From</th>
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
                      <td className="px-4 py-4 text-gray-600">{vehicle.phone || '-'}</td>
                      <td className="px-4 py-4 text-gray-600">
                        {vehicle.insurance_upto ? new Date(vehicle.insurance_upto).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          vehicle.vehicle_status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                          vehicle.vehicle_status === 'NOT_AVAILABLE' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {vehicle.vehicle_status?.replace('_', ' ') || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {vehicle.rc_valid_from ? new Date(vehicle.rc_valid_from).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {vehicle.rc_valid_to ? new Date(vehicle.rc_valid_to).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-4 py-4 text-gray-600">{vehicle.branch?.branch_name || '-'}</td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          vehicle.is_active 
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setEditingVehicle(null)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={saveVehicle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  required
                  maxLength="20"
                  value={formData.vehicle_number}
                  onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength="100"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  maxLength="20"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Upto
                </label>
                <input
                  type="date"
                  value={formData.insurance_upto}
                  onChange={(e) => setFormData({...formData, insurance_upto: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Status *
                </label>
                <select
                  required
                  value={formData.vehicle_status}
                  onChange={(e) => setFormData({...formData, vehicle_status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="NOT_AVAILABLE">Not Available</option>
                  <option value="MAINTENANCE">Under Maintenance</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RC Valid From
                </label>
                <input
                  type="date"
                  value={formData.rc_valid_from}
                  onChange={(e) => setFormData({...formData, rc_valid_from: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RC Valid To
                </label>
                <input
                  type="date"
                  value={formData.rc_valid_to}
                  onChange={(e) => setFormData({...formData, rc_valid_to: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch
                </label>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingVehicle(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Save size={18} />
                  {editingVehicle ? 'Update' : 'Save'}
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
