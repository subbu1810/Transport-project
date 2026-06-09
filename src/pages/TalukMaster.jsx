import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)

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
      const response = await fetch(`${API_BASE_URL}/taluks`)
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
      const response = await fetch(`${API_BASE_URL}/districts`)
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
      const response = await fetch(`${API_BASE_URL}/taluks/search?q=${encodeURIComponent(query)}`)
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
        ? `${API_BASE_URL}/taluks/${editingTaluk.id}`
        : `${API_BASE_URL}/taluks`
      
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
  const handleDeleteClick = (taluk) => {
    setItemToDelete(taluk)
    setShowDeleteConfirm(true)
  }

  const deleteTaluk = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetch(`${API_BASE_URL}/taluks/${itemToDelete.id}`, {
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
    } finally {
      setShowDeleteConfirm(false)
      setItemToDelete(null)
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
    <div className="p-4 space-y-4">
      {/* Notifications */}
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
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Taluk Master</h1>
        <button 
          onClick={() => {
            setEditingTaluk(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition shadow-sm"
        >
          <Plus size={16} />
          Add Taluk
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search taluks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600 text-xs font-medium"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading taluks...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">District</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Taluk Name</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-center font-bold text-gray-800 uppercase tracking-wider">Actions</th>
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
                      <td className="px-3 py-2 font-bold text-gray-800 uppercase tracking-tight">{taluk.district?.name || '-'}</td>
                      <td className="px-3 py-2 text-gray-600 font-semibold">{taluk.name}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          taluk.is_active 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {taluk.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2 flex justify-center gap-1.5">
                        <button 
                          onClick={() => editTaluk(taluk)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded-md transition"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(taluk)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded-md transition"
                        >
                          <Trash2 size={14} />
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
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl transform animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Taluk?</h3>
              <p className="text-gray-500 mb-8">
                Are you sure you want to delete <span className="font-bold text-gray-800 break-all">"{itemToDelete?.name}"</span>? This action cannot be undone.
              </p>
              
              <div className="flex w-full gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setItemToDelete(null)
                  }}
                  className="flex-1 px-4 py-3 text-gray-700 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteTaluk}
                  className="flex-1 px-4 py-3 text-white font-bold bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TalukMaster
