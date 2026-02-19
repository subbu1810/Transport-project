import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function DriverDetails() {
  const [drivers, setDrivers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    dl_number: '',
    dl_type: '',
    phone: '',
    date_of_birth: '',
    date_of_issue: '',
    valid_till: '',
    address: '',
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

  // Fetch all drivers
  const fetchDrivers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/drivers`)
      const data = await response.json()
      
      if (data.success) {
        setDrivers(data.data)
        setError('')
      } else {
        setError(data.message || 'Failed to fetch drivers')
        showNotification('error', data.message || 'Failed to fetch drivers')
      }
    } catch (err) {
      setError('Failed to connect to server')
      showNotification('error', 'Failed to connect to server. Please check if the Laravel server is running.')
      console.error('Error fetching drivers:', err)
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

  // Search drivers
  const searchDrivers = async (query) => {
    if (!query.trim()) {
      fetchDrivers()
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/drivers/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        setDrivers(data.data)
        setError('')
        showNotification('info', `Found ${data.data.length} drivers matching "${query}"`)
      } else {
        setError(data.message || 'Search failed')
        showNotification('error', data.message || 'Search failed')
      }
    } catch (err) {
      setError('Failed to search drivers')
      showNotification('error', 'Failed to search drivers')
      console.error('Error searching drivers:', err)
    } finally {
      setLoading(false)
    }
  }

  // Save driver
  const saveDriver = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingDriver 
        ? `${API_URL}/drivers/${editingDriver.id}`
        : `${API_URL}/drivers`
      
      const method = editingDriver ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchDrivers()
        setShowModal(false)
        setEditingDriver(null)
        resetForm()
        setError('')
        showNotification('success', editingDriver ? 'Driver updated successfully!' : 'Driver created successfully!')
      } else {
        setError(data.message || 'Failed to save driver')
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ')
          showNotification('error', `Validation failed: ${errorMessages}`)
        } else {
          showNotification('error', data.message || 'Failed to save driver')
        }
      }
    } catch (err) {
      setError('Failed to save driver')
      showNotification('error', 'Failed to save driver. Please check your connection and try again.')
      console.error('Error saving driver:', err)
    }
  }

  // Delete driver
  const deleteDriver = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/drivers/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchDrivers()
        setError('')
        showNotification('success', 'Driver deleted successfully!')
      } else {
        setError(data.message || 'Failed to delete driver')
        showNotification('error', data.message || 'Failed to delete driver')
      }
    } catch (err) {
      setError('Failed to delete driver')
      showNotification('error', 'Failed to delete driver. Please check your connection and try again.')
      console.error('Error deleting driver:', err)
    }
  }

  // Edit driver
  const editDriver = (driver) => {
    setEditingDriver(driver)
    setFormData({
      name: driver.name,
      dl_number: driver.dl_number,
      dl_type: driver.dl_type,
      phone: driver.phone,
      date_of_birth: driver.date_of_birth ? new Date(driver.date_of_birth).toISOString().split('T')[0] : '',
      date_of_issue: driver.date_of_issue ? new Date(driver.date_of_issue).toISOString().split('T')[0] : '',
      valid_till: driver.valid_till ? new Date(driver.valid_till).toISOString().split('T')[0] : '',
      address: driver.address || '',
      branch_id: driver.branch_id || '',
      is_active: driver.is_active
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      dl_number: '',
      dl_type: '',
      phone: '',
      date_of_birth: '',
      date_of_issue: '',
      valid_till: '',
      address: '',
      branch_id: '',
      is_active: true
    })
  }

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchDrivers(searchTerm)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Initial fetch
  useEffect(() => {
    fetchDrivers()
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
        <h1 className="text-3xl font-bold text-gray-800">Driver Details</h1>
        <button 
          onClick={() => {
            setEditingDriver(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={20} />
          Add Driver
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-100 p-4 rounded-lg border-2 border-green-300">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            />
            <Search size={20} className="text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading drivers...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-100 border-b-2 border-green-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Driver Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">DL NO</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">DL Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Date of Birth</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Date Of Issue</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Valid Till</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Branch</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-8 text-center text-gray-500">
                      No drivers found
                    </td>
                  </tr>
                ) : (
                  drivers.map((driver) => (
                    <tr key={driver.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-800">{driver.name}</td>
                      <td className="px-6 py-4 text-gray-600">{driver.dl_number}</td>
                      <td className="px-6 py-4 text-gray-600">{driver.dl_type}</td>
                      <td className="px-6 py-4 text-gray-600">{driver.phone}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {driver.date_of_birth ? new Date(driver.date_of_birth).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {driver.date_of_issue ? new Date(driver.date_of_issue).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {driver.valid_till ? new Date(driver.valid_till).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{driver.branch?.branch_name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          driver.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {driver.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex justify-center gap-2">
                        <button 
                          onClick={() => editDriver(driver)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => deleteDriver(driver.id)}
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
                {editingDriver ? 'Edit Driver' : 'Add New Driver'}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setEditingDriver(null)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={saveDriver} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driver Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength="100"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DL Number *
                </label>
                <input
                  type="text"
                  required
                  maxLength="20"
                  value={formData.dl_number}
                  onChange={(e) => setFormData({...formData, dl_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DL Type *
                </label>
                <input
                  type="text"
                  required
                  maxLength="10"
                  value={formData.dl_type}
                  onChange={(e) => setFormData({...formData, dl_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="text"
                  required
                  maxLength="20"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Issue
                </label>
                <input
                  type="date"
                  value={formData.date_of_issue}
                  onChange={(e) => setFormData({...formData, date_of_issue: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Till
                </label>
                <input
                  type="date"
                  value={formData.valid_till}
                  onChange={(e) => setFormData({...formData, valid_till: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
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
                    setEditingDriver(null)
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
                  {editingDriver ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DriverDetails
