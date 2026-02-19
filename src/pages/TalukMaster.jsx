import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function TalukMaster() {
  const [taluks, setTaluks] = useState([])
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTaluk, setEditingTaluk] = useState(null)
  const [formData, setFormData] = useState({
    district_id: '',
    name: '',
    code: '',
    is_active: true
  })

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' })
    }, 5000)
  }

  // Fetch all taluks
  const fetchTaluks = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/taluks`)
      const data = await response.json()
      
      if (data.success) {
        setTaluks(data.data)
        setError('')
      } else {
        setError(data.message || 'Failed to fetch taluks')
        showNotification('error', data.message || 'Failed to fetch taluks')
      }
    } catch (err) {
      setError('Failed to connect to server')
      showNotification('error', 'Failed to connect to server. Please check if the Laravel server is running.')
      console.error('Error fetching taluks:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch districts for dropdown
  const fetchDistricts = async () => {
    try {
      const response = await fetch(`${API_URL}/districts`)
      const data = await response.json()
      
      if (data.success) {
        setDistricts(data.data)
      }
    } catch (err) {
      console.error('Error fetching districts:', err)
    }
  }

  // Search taluks
  const searchTaluks = async (query) => {
    if (!query.trim()) {
      fetchTaluks()
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/taluks/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        setTaluks(data.data)
        setError('')
        showNotification('info', `Found ${data.data.length} taluks matching "${query}"`)
      } else {
        setError(data.message || 'Search failed')
        showNotification('error', data.message || 'Search failed')
      }
    } catch (err) {
      setError('Failed to search taluks')
      showNotification('error', 'Failed to search taluks')
      console.error('Error searching taluks:', err)
    } finally {
      setLoading(false)
    }
  }

  // Save taluk
  const saveTaluk = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingTaluk 
        ? `${API_URL}/taluks/${editingTaluk.id}`
        : `${API_URL}/taluks`
      
      const method = editingTaluk ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchTaluks()
        setShowModal(false)
        setEditingTaluk(null)
        resetForm()
        setError('')
        showNotification('success', editingTaluk ? 'Taluk updated successfully!' : 'Taluk created successfully!')
      } else {
        setError(data.message || 'Failed to save taluk')
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ')
          showNotification('error', `Validation failed: ${errorMessages}`)
        } else {
          showNotification('error', data.message || 'Failed to save taluk')
        }
      }
    } catch (err) {
      setError('Failed to save taluk')
      showNotification('error', 'Failed to save taluk. Please check your connection and try again.')
      console.error('Error saving taluk:', err)
    }
  }

  // Delete taluk
  const deleteTaluk = async (id) => {
    if (!window.confirm('Are you sure you want to delete this taluk?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/taluks/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchTaluks()
        setError('')
        showNotification('success', 'Taluk deleted successfully!')
      } else {
        setError(data.message || 'Failed to delete taluk')
        showNotification('error', data.message || 'Failed to delete taluk')
      }
    } catch (err) {
      setError('Failed to delete taluk')
      showNotification('error', 'Failed to delete taluk. Please check your connection and try again.')
      console.error('Error deleting taluk:', err)
    }
  }

  // Edit taluk
  const editTaluk = (taluk) => {
    setEditingTaluk(taluk)
    setFormData({
      district_id: taluk.district_id,
      name: taluk.name,
      code: taluk.code || '',
      is_active: taluk.is_active
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      district_id: '',
      name: '',
      code: '',
      is_active: true
    })
  }

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchTaluks(searchTerm)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Initial fetch
  useEffect(() => {
    fetchTaluks()
    fetchDistricts()
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
        <h1 className="text-3xl font-bold text-gray-800">Taluk Master</h1>
        <button 
          onClick={() => {
            setEditingTaluk(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={20} />
          Add Taluk
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search taluks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading taluks...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">District</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {taluks.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No taluks found
                    </td>
                  </tr>
                ) : (
                  taluks.map((taluk) => (
                    <tr key={taluk.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-800">{taluk.district?.name || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{taluk.name}</td>
                      <td className="px-6 py-4 text-gray-600">{taluk.code || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          taluk.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {taluk.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex justify-center gap-2">
                        <button 
                          onClick={() => editTaluk(taluk)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => deleteTaluk(taluk.id)}
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
                {editingTaluk ? 'Edit Taluk' : 'Add New Taluk'}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setEditingTaluk(null)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={saveTaluk} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District *
                </label>
                <select
                  required
                  value={formData.district_id}
                  onChange={(e) => setFormData({...formData, district_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select District</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taluk Name *
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
                  Taluk Code
                </label>
                <input
                  type="text"
                  maxLength="20"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
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
                    setEditingTaluk(null)
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
                  {editingTaluk ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TalukMaster
