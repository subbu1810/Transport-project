import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function LookupMaster() {
  const [lookups, setLookups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingLookup, setEditingLookup] = useState(null)
  const [formData, setFormData] = useState({
    type: '',
    code: '',
    value: '',
    is_active: true
  })

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' })
    }, 5000)
  }

  // Fetch all lookups
  const fetchLookups = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/lookups`)
      const data = await response.json()

      if (data.success) {
        setLookups(data.data)
        setError('')
      } else {
        setError(data.message || 'Failed to fetch lookups')
        showNotification('error', data.message || 'Failed to fetch lookups')
      }
    } catch (err) {
      setError('Failed to connect to server')
      showNotification('error', 'Failed to connect to server. Please check if the Laravel server is running.')
      console.error('Error fetching lookups:', err)
    } finally {
      setLoading(false)
    }
  }

  // Search lookups
  const searchLookups = async (query) => {
    if (!query.trim()) {
      fetchLookups()
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/lookups/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (data.success) {
        setLookups(data.data)
        setError('')
      } else {
        setError(data.message || 'Search failed')
        showNotification('error', data.message || 'Search failed')
      }
    } catch (err) {
      setError('Failed to search lookups')
      showNotification('error', 'Failed to search lookups')
      console.error('Error searching lookups:', err)
    } finally {
      setLoading(false)
    }
  }

  // Save lookup
  const saveLookup = async (e) => {
    e.preventDefault()

    try {
      const url = editingLookup
        ? `${API_URL}/lookups/${editingLookup.id}`
        : `${API_URL}/lookups`

      const method = editingLookup ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        fetchLookups()
        setShowModal(false)
        setEditingLookup(null)
        resetForm()
        setError('')
        showNotification('success', editingLookup ? 'Lookup updated successfully!' : 'Lookup created successfully!')
      } else {
        setError(data.message || 'Failed to save lookup')
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ')
          showNotification('error', `Validation failed: ${errorMessages}`)
        } else {
          showNotification('error', data.message || 'Failed to save lookup')
        }
      }
    } catch (err) {
      setError('Failed to save lookup')
      showNotification('error', 'Failed to save lookup. Please check your connection and try again.')
      console.error('Error saving lookup:', err)
    }
  }

  // Delete lookup
  const deleteLookup = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lookup?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/lookups/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        fetchLookups()
        setError('')
        showNotification('success', 'Lookup deleted successfully!')
      } else {
        setError(data.message || 'Failed to delete lookup')
        showNotification('error', data.message || 'Failed to delete lookup')
      }
    } catch (err) {
      setError('Failed to delete lookup')
      showNotification('error', 'Failed to delete lookup. Please check your connection and try again.')
      console.error('Error deleting lookup:', err)
    }
  }

  // Edit lookup
  const editLookup = (lookup) => {
    setEditingLookup(lookup)
    setFormData({
      type: lookup.type,
      code: lookup.code,
      value: lookup.value,
      is_active: lookup.is_active
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      type: '',
      code: '',
      value: '',
      is_active: true
    })
  }

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchLookups(searchTerm)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Initial fetch
  useEffect(() => {
    fetchLookups()
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Notification Popup */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transform transition-all duration-300 ${notification.type === 'success' ? 'bg-green-500 text-white' :
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
        <h1 className="text-3xl font-bold text-gray-800">Lookup Master</h1>
        <button
          onClick={() => {
            setEditingLookup(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={20} />
          Add Lookup
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search lookups by type, code or value..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading lookups...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Lookup Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Lookup Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Lookup Value</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lookups.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No lookups found
                    </td>
                  </tr>
                ) : (
                  lookups.map((lookup) => (
                    <tr key={lookup.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-800">{lookup.type}</td>
                      <td className="px-6 py-4 text-gray-600">{lookup.code}</td>
                      <td className="px-6 py-4 text-gray-600">{lookup.value}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${lookup.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {lookup.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex justify-center gap-2">
                        <button
                          onClick={() => editLookup(lookup)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteLookup(lookup.id)}
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
                {editingLookup ? 'Edit Lookup' : 'Add New Lookup'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingLookup(null)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={saveLookup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lookup Type *
                </label>
                <input
                  type="text"
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value.toUpperCase() })}
                  placeholder="e.g. ARTICLE_TYPE"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lookup Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. BAGS"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lookup Value *
                </label>
                <input
                  type="text"
                  required
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="e.g. Bags"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
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
                    setEditingLookup(null)
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
                  {editingLookup ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LookupMaster
