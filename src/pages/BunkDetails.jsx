import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function BunkDetails() {
  const [bunks, setBunks] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingBunk, setEditingBunk] = useState(null)
  const [formData, setFormData] = useState({
    bunk_name: '',
    bunk_address: '',
    tin_number: '',
    bunk_land: '',
    bunk_mobile: '',
    bunk_remarks: '',
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

  // Fetch all bunks
  const fetchBunks = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/bunks`)
      const data = await response.json()
      
      if (data.success) {
        setBunks(data.data)
        setError('')
      } else {
        setError(data.message || 'Failed to fetch bunks')
        showNotification('error', data.message || 'Failed to fetch bunks')
      }
    } catch (err) {
      setError('Failed to connect to server')
      showNotification('error', 'Failed to connect to server. Please check if the Laravel server is running.')
      console.error('Error fetching bunks:', err)
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

  // Search bunks
  const searchBunks = async (query) => {
    if (!query.trim()) {
      fetchBunks()
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/bunks/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        setBunks(data.data)
        setError('')
        showNotification('info', `Found ${data.data.length} bunks matching "${query}"`)
      } else {
        setError(data.message || 'Search failed')
        showNotification('error', data.message || 'Search failed')
      }
    } catch (err) {
      setError('Failed to search bunks')
      showNotification('error', 'Failed to search bunks')
      console.error('Error searching bunks:', err)
    } finally {
      setLoading(false)
    }
  }

  // Save bunk
  const saveBunk = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingBunk 
        ? `${API_URL}/bunks/${editingBunk.id}`
        : `${API_URL}/bunks`
      
      const method = editingBunk ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchBunks()
        setShowModal(false)
        setEditingBunk(null)
        resetForm()
        setError('')
        showNotification('success', editingBunk ? 'Bunk updated successfully!' : 'Bunk created successfully!')
      } else {
        setError(data.message || 'Failed to save bunk')
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ')
          showNotification('error', `Validation failed: ${errorMessages}`)
        } else {
          showNotification('error', data.message || 'Failed to save bunk')
        }
      }
    } catch (err) {
      setError('Failed to save bunk')
      showNotification('error', 'Failed to save bunk. Please check your connection and try again.')
      console.error('Error saving bunk:', err)
    }
  }

  // Delete bunk
  const deleteBunk = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bunk?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/bunks/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchBunks()
        setError('')
        showNotification('success', 'Bunk deleted successfully!')
      } else {
        setError(data.message || 'Failed to delete bunk')
        showNotification('error', data.message || 'Failed to delete bunk')
      }
    } catch (err) {
      setError('Failed to delete bunk')
      showNotification('error', 'Failed to delete bunk. Please check your connection and try again.')
      console.error('Error deleting bunk:', err)
    }
  }

  // Edit bunk
  const editBunk = (bunk) => {
    setEditingBunk(bunk)
    setFormData({
      bunk_name: bunk.bunk_name,
      bunk_address: bunk.bunk_address,
      tin_number: bunk.tin_number || '',
      bunk_land: bunk.bunk_land || '',
      bunk_mobile: bunk.bunk_mobile || '',
      bunk_remarks: bunk.bunk_remarks || '',
      branch_id: bunk.branch_id || '',
      is_active: bunk.is_active
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      bunk_name: '',
      bunk_address: '',
      tin_number: '',
      bunk_land: '',
      bunk_mobile: '',
      bunk_remarks: '',
      branch_id: '',
      is_active: true
    })
  }

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchBunks(searchTerm)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Initial fetch
  useEffect(() => {
    fetchBunks()
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
        <h1 className="text-3xl font-bold text-gray-800">Bunk Details</h1>
        <button 
          onClick={() => {
            setEditingBunk(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={20} />
          Add Bunk
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-100 p-4 rounded-lg border-2 border-green-300">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search bunks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            />
            <Search size={20} className="text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading bunks...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bunk Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bunk Address</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">TIN Num</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bunk Land</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bunk Mobile</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bunk Remarks</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Branch</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bunks.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      No bunks found
                    </td>
                  </tr>
                ) : (
                  bunks.map((bunk) => (
                    <tr key={bunk.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-800">{bunk.bunk_name}</td>
                      <td className="px-6 py-4 text-gray-600">{bunk.bunk_address}</td>
                      <td className="px-6 py-4 text-gray-600">{bunk.tin_number || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{bunk.bunk_land || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{bunk.bunk_mobile || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{bunk.bunk_remarks || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{bunk.branch?.branch_name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          bunk.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {bunk.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex justify-center gap-2">
                        <button 
                          onClick={() => editBunk(bunk)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => deleteBunk(bunk.id)}
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
                {editingBunk ? 'Edit Bunk' : 'Add New Bunk'}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setEditingBunk(null)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={saveBunk} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bunk Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength="100"
                  value={formData.bunk_name}
                  onChange={(e) => setFormData({...formData, bunk_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bunk Address *
                </label>
                <textarea
                  required
                  maxLength="255"
                  rows="3"
                  value={formData.bunk_address}
                  onChange={(e) => setFormData({...formData, bunk_address: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, tin_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bunk Land
                </label>
                <input
                  type="text"
                  maxLength="20"
                  value={formData.bunk_land}
                  onChange={(e) => setFormData({...formData, bunk_land: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bunk Mobile
                </label>
                <input
                  type="text"
                  maxLength="20"
                  value={formData.bunk_mobile}
                  onChange={(e) => setFormData({...formData, bunk_mobile: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bunk Remarks
                </label>
                <textarea
                  maxLength="500"
                  rows="3"
                  value={formData.bunk_remarks}
                  onChange={(e) => setFormData({...formData, bunk_remarks: e.target.value})}
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
                    setEditingBunk(null)
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
                  {editingBunk ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BunkDetails
