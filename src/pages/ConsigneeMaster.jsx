import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function ConsigneeMaster() {
  const [consignees, setConsignees] = useState([])
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState('name')
  const [showModal, setShowModal] = useState(false)
  const [editingConsignee, setEditingConsignee] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    gst_number: '',
    address: '',
    land_number: '',
    mobile_number: '',
    destination_id: '',
    is_active: true
  })

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' })
    }, 5000)
  }

  // Fetch all consignees
  const fetchConsignees = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/consignees`)
      const data = await response.json()
      
      if (data.success) {
        setConsignees(data.data)
        setError('')
      } else {
        setError(data.message || 'Failed to fetch consignees')
        showNotification('error', data.message || 'Failed to fetch consignees')
      }
    } catch (err) {
      setError('Failed to connect to server')
      showNotification('error', 'Failed to connect to server. Please check if the Laravel server is running.')
      console.error('Error fetching consignees:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch destinations for dropdown
  const fetchDestinations = async () => {
    try {
      const response = await fetch(`${API_URL}/destinations`)
      const data = await response.json()
      
      if (data.success) {
        setDestinations(data.data)
      }
    } catch (err) {
      console.error('Error fetching destinations:', err)
    }
  }

  // Search consignees
  const searchConsignees = async (query) => {
    if (!query.trim()) {
      fetchConsignees()
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/consignees/search?q=${encodeURIComponent(query)}&type=${searchType}`)
      const data = await response.json()
      
      if (data.success) {
        setConsignees(data.data)
        setError('')
        showNotification('info', `Found ${data.data.length} consignees matching "${query}"`)
      } else {
        setError(data.message || 'Search failed')
        showNotification('error', data.message || 'Search failed')
      }
    } catch (err) {
      setError('Failed to search consignees')
      showNotification('error', 'Failed to search consignees')
      console.error('Error searching consignees:', err)
    } finally {
      setLoading(false)
    }
  }

  // Save consignee
  const saveConsignee = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingConsignee 
        ? `${API_URL}/consignees/${editingConsignee.id}`
        : `${API_URL}/consignees`
      
      const method = editingConsignee ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchConsignees()
        setShowModal(false)
        setEditingConsignee(null)
        resetForm()
        setError('')
        showNotification('success', editingConsignee ? 'Consignee updated successfully!' : 'Consignee created successfully!')
      } else {
        setError(data.message || 'Failed to save consignee')
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ')
          showNotification('error', `Validation failed: ${errorMessages}`)
        } else {
          showNotification('error', data.message || 'Failed to save consignee')
        }
      }
    } catch (err) {
      setError('Failed to save consignee')
      showNotification('error', 'Failed to save consignee. Please check your connection and try again.')
      console.error('Error saving consignee:', err)
    }
  }

  // Delete consignee
  const deleteConsignee = async (id) => {
    if (!window.confirm('Are you sure you want to delete this consignee?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/consignees/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchConsignees()
        setError('')
        showNotification('success', 'Consignee deleted successfully!')
      } else {
        setError(data.message || 'Failed to delete consignee')
        showNotification('error', data.message || 'Failed to delete consignee')
      }
    } catch (err) {
      setError('Failed to delete consignee')
      showNotification('error', 'Failed to delete consignee. Please check your connection and try again.')
      console.error('Error deleting consignee:', err)
    }
  }

  // Edit consignee
  const editConsignee = (consignee) => {
    setEditingConsignee(consignee)
    setFormData({
      name: consignee.name,
      code: consignee.code,
      gst_number: consignee.gst_number || '',
      address: consignee.address,
      land_number: consignee.land_number || '',
      mobile_number: consignee.mobile_number,
      destination_id: consignee.destination_id,
      is_active: consignee.is_active
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      gst_number: '',
      address: '',
      land_number: '',
      mobile_number: '',
      destination_id: '',
      is_active: true
    })
  }

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchConsignees(searchTerm)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchType])

  // Initial fetch
  useEffect(() => {
    fetchConsignees()
    fetchDestinations()
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
        <h1 className="text-3xl font-bold text-gray-800">Consignee Master</h1>
        <button 
          onClick={() => {
            setEditingConsignee(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={20} />
          Add Consignee
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-100 p-4 rounded-lg border-2 border-green-300">
          <div className="flex items-center gap-3">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-3 py-2 border-2 border-green-600 rounded-lg focus:outline-none"
            >
              <option value="name">BY CONSIGNEE NAME</option>
              <option value="code">BY CONSIGNEE CODE</option>
            </select>
            <input
              type="text"
              placeholder="Please Input Value"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading consignees...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-100 border-b-2 border-green-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Consignee Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">GST-NO</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Consignee Address</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Land No</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Mobile</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Destination</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {consignees.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      No consignees found
                    </td>
                  </tr>
                ) : (
                  consignees.map((consignee) => (
                    <tr key={consignee.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-600">{consignee.name}</td>
                      <td className="px-6 py-4 text-gray-600">{consignee.gst_number || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{consignee.address}</td>
                      <td className="px-6 py-4 text-gray-600">{consignee.land_number || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{consignee.mobile_number}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {consignee.destination ? 
                          `${consignee.destination.city_name} (${consignee.destination.taluk?.district?.name})` 
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          consignee.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {consignee.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex justify-center gap-2">
                        <button 
                          onClick={() => editConsignee(consignee)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => deleteConsignee(consignee.id)}
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
                {editingConsignee ? 'Edit Consignee' : 'Add New Consignee'}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setEditingConsignee(null)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={saveConsignee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consignee Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consignee Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength="20"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Number
                </label>
                <input
                  type="text"
                  maxLength="20"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({...formData, gst_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Land Number
                </label>
                <input
                  type="text"
                  maxLength="20"
                  value={formData.land_number}
                  onChange={(e) => setFormData({...formData, land_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  maxLength="20"
                  value={formData.mobile_number}
                  onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination *
                </label>
                <select
                  required
                  value={formData.destination_id}
                  onChange={(e) => setFormData({...formData, destination_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Destination</option>
                  {destinations.map((destination) => (
                    <option key={destination.id} value={destination.id}>
                      {destination.city_name} ({destination.taluk?.district?.name})
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
                    setEditingConsignee(null)
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
                  {editingConsignee ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConsigneeMaster
