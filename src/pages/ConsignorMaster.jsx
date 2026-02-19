import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function ConsignorMaster() {
  const [consignors, setConsignors] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState('name')
  const [showModal, setShowModal] = useState(false)
  const [editingConsignor, setEditingConsignor] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    tin_number: '',
    gst_number: '',
    branch_id: '',
    is_active: true
  })

  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    setCurrentUser(user)
  }, [])

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' })
    }, 5000)
  }

  // Fetch all consignors
  const fetchConsignors = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/consignors`)
      const data = await response.json()

      if (data.success) {
        setConsignors(data.data)
        setError('')
      } else {
        setError(data.message || 'Failed to fetch consignors')
        showNotification('error', data.message || 'Failed to fetch consignors')
      }
    } catch (err) {
      setError('Failed to connect to server')
      showNotification('error', 'Failed to connect to server. Please check if the Laravel server is running.')
      console.error('Error fetching consignors:', err)
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

  // Search consignors
  const searchConsignors = async (query) => {
    if (!query.trim()) {
      fetchConsignors()
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/consignors/search?q=${encodeURIComponent(query)}&type=${searchType}`)
      const data = await response.json()

      if (data.success) {
        setConsignors(data.data)
        setError('')
        showNotification('info', `Found ${data.data.length} consignors matching "${query}"`)
      } else {
        setError(data.message || 'Search failed')
        showNotification('error', data.message || 'Search failed')
      }
    } catch (err) {
      setError('Failed to search consignors')
      showNotification('error', 'Failed to search consignors')
      console.error('Error searching consignors:', err)
    } finally {
      setLoading(false)
    }
  }

  // Save consignor
  const saveConsignor = async (e) => {
    e.preventDefault()

    try {
      const url = editingConsignor
        ? `${API_URL}/consignors/${editingConsignor.id}`
        : `${API_URL}/consignors`

      const method = editingConsignor ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        fetchConsignors()
        setShowModal(false)
        setEditingConsignor(null)
        resetForm()
        setError('')
        showNotification('success', editingConsignor ? 'Consignor updated successfully!' : 'Consignor created successfully!')
      } else {
        setError(data.message || 'Failed to save consignor')
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ')
          showNotification('error', `Validation failed: ${errorMessages}`)
        } else {
          showNotification('error', data.message || 'Failed to save consignor')
        }
      }
    } catch (err) {
      setError('Failed to save consignor')
      showNotification('error', 'Failed to save consignor. Please check your connection and try again.')
      console.error('Error saving consignor:', err)
    }
  }

  // Delete consignor
  const deleteConsignor = async (id) => {
    if (!window.confirm('Are you sure you want to delete this consignor?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/consignors/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        fetchConsignors()
        setError('')
        showNotification('success', 'Consignor deleted successfully!')
      } else {
        setError(data.message || 'Failed to delete consignor')
        showNotification('error', data.message || 'Failed to delete consignor')
      }
    } catch (err) {
      setError('Failed to delete consignor')
      showNotification('error', 'Failed to delete consignor. Please check your connection and try again.')
      console.error('Error deleting consignor:', err)
    }
  }

  // Edit consignor
  const editConsignor = (consignor) => {
    setEditingConsignor(consignor)
    setFormData({
      name: consignor.name,
      code: consignor.code,
      tin_number: consignor.tin_number || '',
      gst_number: consignor.gst_number || '',
      branch_id: consignor.branch_id,
      is_active: consignor.is_active
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      tin_number: '',
      gst_number: '',
      branch_id: currentUser?.role !== 'superadmin' ? currentUser?.branch_id : '',
      is_active: true
    })
  }

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchConsignors(searchTerm)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchType])

  // Initial fetch
  useEffect(() => {
    fetchConsignors()
    fetchBranches()
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
        <h1 className="text-3xl font-bold text-gray-800">Consignor Master</h1>
        <button
          onClick={() => {
            setEditingConsignor(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={20} />
          Add Consignor
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
              <option value="name">BY CONSIGNOR NAME</option>
              <option value="code">BY CONSIGNOR CODE</option>
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
            <div className="text-gray-500">Loading consignors...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-100 border-b-2 border-green-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Consignor Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Consignor Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Tin Num</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">GST-NO</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Created Branch</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {consignors.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No consignors found
                    </td>
                  </tr>
                ) : (
                  consignors.map((consignor) => (
                    <tr key={consignor.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-600">{consignor.name}</td>
                      <td className="px-6 py-4 text-gray-600">{consignor.code}</td>
                      <td className="px-6 py-4 text-gray-600">{consignor.tin_number || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{consignor.gst_number || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{consignor.branch?.branch_name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${consignor.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {consignor.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex justify-center gap-2">
                        <button
                          onClick={() => editConsignor(consignor)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteConsignor(consignor.id)}
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
                {editingConsignor ? 'Edit Consignor' : 'Add New Consignor'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingConsignor(null)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={saveConsignor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consignor Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consignor Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength="20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TIN Number
                </label>
                <input
                  type="text"
                  maxLength="20"
                  value={formData.tin_number}
                  onChange={(e) => setFormData({ ...formData, tin_number: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch *
                </label>
                <select
                  required
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  disabled={currentUser?.role !== 'superadmin'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-500"
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
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
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
                    setEditingConsignor(null)
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
                  {editingConsignor ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConsignorMaster
