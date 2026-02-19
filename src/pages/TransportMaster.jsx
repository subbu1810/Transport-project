import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function TransportMaster() {
  const [transports, setTransports] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [searchBy, setSearchBy] = useState('transport_name')
  const [showModal, setShowModal] = useState(false)
  const [editingTransport, setEditingTransport] = useState(null)
  const [formData, setFormData] = useState({
    transport_code: '',
    transport_name: '',
    gst_number: '',
    address: '',
    mobile: '',
    bank_name: '',
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

  // Fetch all transports
  const fetchTransports = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/transports`)
      const data = await response.json()
      
      if (data.success) {
        setTransports(data.data)
        setError('')
      } else {
        setError(data.message || 'Failed to fetch transports')
        showNotification('error', data.message || 'Failed to fetch transports')
      }
    } catch (err) {
      setError('Failed to connect to server')
      showNotification('error', 'Failed to connect to server. Please check if the Laravel server is running.')
      console.error('Error fetching transports:', err)
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

  // Search transports
  const searchTransports = async (query) => {
    if (!query.trim()) {
      fetchTransports()
      return
    }

    try {
      setLoading(true)
      const searchParams = new URLSearchParams({
        q: query,
        search_by: searchBy
      })
      const response = await fetch(`${API_URL}/transports/search?${searchParams}`)
      const data = await response.json()
      
      if (data.success) {
        setTransports(data.data)
        setError('')
        showNotification('info', `Found ${data.data.length} transports matching "${query}"`)
      } else {
        setError(data.message || 'Search failed')
        showNotification('error', data.message || 'Search failed')
      }
    } catch (err) {
      setError('Failed to search transports')
      showNotification('error', 'Failed to search transports')
      console.error('Error searching transports:', err)
    } finally {
      setLoading(false)
    }
  }

  // Save transport
  const saveTransport = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingTransport 
        ? `${API_URL}/transports/${editingTransport.id}`
        : `${API_URL}/transports`
      
      const method = editingTransport ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchTransports()
        setShowModal(false)
        setEditingTransport(null)
        resetForm()
        setError('')
        showNotification('success', editingTransport ? 'Transport updated successfully!' : 'Transport created successfully!')
      } else {
        setError(data.message || 'Failed to save transport')
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ')
          showNotification('error', `Validation failed: ${errorMessages}`)
        } else {
          showNotification('error', data.message || 'Failed to save transport')
        }
      }
    } catch (err) {
      setError('Failed to save transport')
      showNotification('error', 'Failed to save transport. Please check your connection and try again.')
      console.error('Error saving transport:', err)
    }
  }

  // Delete transport
  const deleteTransport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transport?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/transports/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchTransports()
        setError('')
        showNotification('success', 'Transport deleted successfully!')
      } else {
        setError(data.message || 'Failed to delete transport')
        showNotification('error', data.message || 'Failed to delete transport')
      }
    } catch (err) {
      setError('Failed to delete transport')
      showNotification('error', 'Failed to delete transport. Please check your connection and try again.')
      console.error('Error deleting transport:', err)
    }
  }

  // Edit transport
  const editTransport = (transport) => {
    setEditingTransport(transport)
    setFormData({
      transport_code: transport.transport_code,
      transport_name: transport.transport_name,
      gst_number: transport.gst_number || '',
      address: transport.address,
      mobile: transport.mobile || '',
      bank_name: transport.bank_name || '',
      branch_id: transport.branch_id || '',
      is_active: transport.is_active
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      transport_code: '',
      transport_name: '',
      gst_number: '',
      address: '',
      mobile: '',
      bank_name: '',
      branch_id: '',
      is_active: true
    })
  }

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchTransports(searchTerm)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchBy])

  // Initial fetch
  useEffect(() => {
    fetchTransports()
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
        <h1 className="text-3xl font-bold text-gray-800">Transport Master</h1>
        <button 
          onClick={() => {
            setEditingTransport(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={20} />
          Add Transport
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-100 p-4 rounded-lg border-2 border-green-300">
          <div className="flex items-center gap-3">
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="px-3 py-2 border-2 border-green-600 rounded-lg focus:outline-none"
            >
              <option value="transport_name">BY TRANSPORT NAME</option>
              <option value="transport_code">BY TRANSPORT CODE</option>
            </select>
            <input
              type="text"
              placeholder="Please Input Value"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            />
            <Search size={20} className="text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading transports...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-100 border-b-2 border-green-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Transport Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Transport Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">GST-NO</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Address</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Mobile</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Bank Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Branch Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transports.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      No transports found
                    </td>
                  </tr>
                ) : (
                  transports.map((transport) => (
                    <tr key={transport.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-800">{transport.transport_code}</td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{transport.transport_name}</td>
                      <td className="px-6 py-4 text-gray-600">{transport.gst_number || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{transport.address}</td>
                      <td className="px-6 py-4 text-gray-600">{transport.mobile || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{transport.bank_name || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{transport.branch?.branch_name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          transport.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transport.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex justify-center gap-2">
                        <button 
                          onClick={() => editTransport(transport)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => deleteTransport(transport.id)}
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
                {editingTransport ? 'Edit Transport' : 'Add New Transport'}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setEditingTransport(null)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={saveTransport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transport Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength="20"
                  value={formData.transport_code}
                  onChange={(e) => setFormData({...formData, transport_code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transport Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength="100"
                  value={formData.transport_name}
                  onChange={(e) => setFormData({...formData, transport_name: e.target.value})}
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
                  maxLength="255"
                  rows="3"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile
                </label>
                <input
                  type="text"
                  maxLength="20"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  maxLength="100"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
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
                    setEditingTransport(null)
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
                  {editingTransport ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransportMaster
