import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function RateDetails() {
  const [rates, setRates] = useState([])
  const [consignors, setConsignors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingRate, setEditingRate] = useState(null)
  const [formData, setFormData] = useState({
    consignor_id: '',
    article_type: '',
    freight_charges: '',
    handling_charges: '',
    dd_charges: '',
    is_active: true
  })

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' })
    }, 5000)
  }

  // Fetch all rates
  const fetchRates = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/rates`)
      const data = await response.json()
      
      if (data.success) {
        setRates(data.data)
        setError('')
      } else {
        setError(data.message || 'Failed to fetch rates')
        showNotification('error', data.message || 'Failed to fetch rates')
      }
    } catch (err) {
      setError('Failed to connect to server')
      showNotification('error', 'Failed to connect to server. Please check if the Laravel server is running.')
      console.error('Error fetching rates:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch consignors for dropdown
  const fetchConsignors = async () => {
    try {
      const response = await fetch(`${API_URL}/consignors`)
      const data = await response.json()
      
      if (data.success) {
        setConsignors(data.data)
      }
    } catch (err) {
      console.error('Error fetching consignors:', err)
    }
  }

  // Search rates
  const searchRates = async (query) => {
    if (!query.trim()) {
      fetchRates()
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/rates/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        setRates(data.data)
        setError('')
        showNotification('info', `Found ${data.data.length} rates matching "${query}"`)
      } else {
        setError(data.message || 'Search failed')
        showNotification('error', data.message || 'Search failed')
      }
    } catch (err) {
      setError('Failed to search rates')
      showNotification('error', 'Failed to search rates')
      console.error('Error searching rates:', err)
    } finally {
      setLoading(false)
    }
  }

  // Save rate
  const saveRate = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingRate 
        ? `${API_URL}/rates/${editingRate.id}`
        : `${API_URL}/rates`
      
      const method = editingRate ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchRates()
        setShowModal(false)
        setEditingRate(null)
        resetForm()
        setError('')
        showNotification('success', editingRate ? 'Rate updated successfully!' : 'Rate created successfully!')
      } else {
        setError(data.message || 'Failed to save rate')
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ')
          showNotification('error', `Validation failed: ${errorMessages}`)
        } else {
          showNotification('error', data.message || 'Failed to save rate')
        }
      }
    } catch (err) {
      setError('Failed to save rate')
      showNotification('error', 'Failed to save rate. Please check your connection and try again.')
      console.error('Error saving rate:', err)
    }
  }

  // Delete rate
  const deleteRate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rate?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/rates/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchRates()
        setError('')
        showNotification('success', 'Rate deleted successfully!')
      } else {
        setError(data.message || 'Failed to delete rate')
        showNotification('error', data.message || 'Failed to delete rate')
      }
    } catch (err) {
      setError('Failed to delete rate')
      showNotification('error', 'Failed to delete rate. Please check your connection and try again.')
      console.error('Error deleting rate:', err)
    }
  }

  // Edit rate
  const editRate = (rate) => {
    setEditingRate(rate)
    setFormData({
      consignor_id: rate.consignor_id,
      article_type: rate.article_type,
      freight_charges: rate.freight_charges,
      handling_charges: rate.handling_charges,
      dd_charges: rate.dd_charges,
      is_active: rate.is_active
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      consignor_id: '',
      article_type: '',
      freight_charges: '',
      handling_charges: '',
      dd_charges: '',
      is_active: true
    })
  }

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchRates(searchTerm)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Initial fetch
  useEffect(() => {
    fetchRates()
    fetchConsignors()
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
        <h1 className="text-3xl font-bold text-gray-800">Rate Details</h1>

        <button 
          onClick={() => {
            setEditingRate(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={20} />
          Add Rate
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-100 p-4 rounded-lg border-2 border-green-300">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search rates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            />
            <Search size={20} className="text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading rates...</div>
          </div>
        ) : (
          <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
            <h3 className="font-bold text-gray-800 mb-4">Rate Details View</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-yellow-200 border-b-2 border-yellow-400">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Consignor</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Article Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Freight Charges</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800 bg-yellow-300">Handling Charges</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">DD Charges</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Status</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        No rates found
                      </td>
                    </tr>
                  ) : (
                    rates.map((rate) => (
                      <tr key={rate.id} className="border-b hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-gray-600">{rate.consignor?.name || '-'}</td>
                        <td className="px-6 py-4 text-gray-600">{rate.article_type}</td>
                        <td className="px-6 py-4 text-gray-600">{rate.freight_charges}</td>
                        <td className="px-6 py-4 text-gray-600 bg-yellow-100">{rate.handling_charges}</td>
                        <td className="px-6 py-4 text-gray-600">{rate.dd_charges}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            rate.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {rate.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex justify-center gap-2">
                          <button 
                            onClick={() => editRate(rate)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => deleteRate(rate.id)}
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
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingRate ? 'Edit Rate' : 'Add New Rate'}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setEditingRate(null)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={saveRate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consignor *
                </label>
                <select
                  required
                  value={formData.consignor_id}
                  onChange={(e) => setFormData({...formData, consignor_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Consignor</option>
                  {consignors.map((consignor) => (
                    <option key={consignor.id} value={consignor.id}>
                      {consignor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Article Type *
                </label>
                <input
                  type="text"
                  required
                  maxLength="50"
                  value={formData.article_type}
                  onChange={(e) => setFormData({...formData, article_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Freight Charges *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.freight_charges}
                  onChange={(e) => setFormData({...formData, freight_charges: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Handling Charges *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.handling_charges}
                  onChange={(e) => setFormData({...formData, handling_charges: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DD Charges *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.dd_charges}
                  onChange={(e) => setFormData({...formData, dd_charges: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
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
                    setEditingRate(null)
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
                  {editingRate ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RateDetails
