import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save, RotateCcw } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function Destination() {
  const [destinations, setDestinations] = useState([])
  const [taluks, setTaluks] = useState([])
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDestination, setEditingDestination] = useState(null)
  
  const [filterDistrict, setFilterDistrict] = useState('')
  const [filterTaluk, setFilterTaluk] = useState('')
  const [formData, setFormData] = useState({
    district_id: '',
    taluk_id: '',
    city_name: '',
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

  // Fetch all destinations
  const fetchDestinations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/destinations`)
      const data = await response.json()
      
      if (data.success) {
        setDestinations(data.data)
        setError('')
      } else {
        setError(data.message || 'Failed to fetch destinations')
        showNotification('error', data.message || 'Failed to fetch destinations')
      }
    } catch (err) {
      setError('Failed to connect to server')
      showNotification('error', 'Failed to connect to server. Please check if the Laravel server is running.')
      console.error('Error fetching destinations:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch taluks for dropdown
  const fetchTaluks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/taluks`)
      const data = await response.json()
      
      if (data.success) {
        setTaluks(data.data)
      }
    } catch (err) {
      console.error('Error fetching taluks:', err)
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

  // Search destinations
  const searchDestinations = async (query) => {
    if (!query.trim()) {
      fetchDestinations()
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/destinations/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        setDestinations(data.data)
        setError('')
        showNotification('info', `Found ${data.data.length} destinations matching "${query}"`)
      } else {
        setError(data.message || 'Search failed')
        showNotification('error', data.message || 'Search failed')
      }
    } catch (err) {
      setError('Failed to search destinations')
      showNotification('error', 'Failed to search destinations')
      console.error('Error searching destinations:', err)
    } finally {
      setLoading(false)
    }
  }

  // Save destination
  const saveDestination = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingDestination 
        ? `${API_BASE_URL}/destinations/${editingDestination.id}`
        : `${API_BASE_URL}/destinations`
      
      const method = editingDestination ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchDestinations()
        setShowModal(false)
        setEditingDestination(null)
        resetForm()
        setError('')
        showNotification('success', editingDestination ? 'Destination updated successfully!' : 'Destination created successfully!')
      } else {
        if (data.errors) {
          // Check specifically for city_name validation error (usually duplicates)
          if (data.errors.city_name) {
            showNotification('error', `A destination with name "${formData.city_name}" already exists in this Taluk.`);
            setError(`A destination with name "${formData.city_name}" already exists in this Taluk.`);
          } else {
            const errorMessages = Object.values(data.errors).flat().join(', ')
            showNotification('error', `Validation failed: ${errorMessages}`)
            setError(`Validation failed: ${errorMessages}`)
          }
        } else {
          setError(data.message || 'Failed to save destination')
          showNotification('error', data.message || 'Failed to save destination')
        }
      }
    } catch (err) {
      setError('Failed to save destination')
      showNotification('error', 'Failed to save destination. Please check your connection and try again.')
      console.error('Error saving destination:', err)
    }
  }

  // Delete destination
  const handleDeleteClick = (dest) => {
    setItemToDelete(dest)
    setShowDeleteConfirm(true)
  }

  const deleteDestination = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetch(`${API_BASE_URL}/destinations/${itemToDelete.id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchDestinations()
        setError('')
        showNotification('success', 'Destination deleted successfully!')
      } else {
        setError(data.message || 'Failed to delete destination')
        showNotification('error', data.message || 'Failed to delete destination')
      }
    } catch (err) {
      setError('Failed to delete destination')
      showNotification('error', 'Failed to delete destination. Please check your connection and try again.')
      console.error('Error deleting destination:', err)
    } finally {
      setShowDeleteConfirm(false)
      setItemToDelete(null)
    }
  }

  // Edit destination
  const editDestination = (destination) => {
    setEditingDestination(destination)
    setFormData({
      district_id: destination.taluk?.district_id || '',
      taluk_id: destination.taluk_id,
      city_name: destination.city_name,
      is_active: destination.is_active
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      district_id: '',
      taluk_id: '',
      city_name: '',
      is_active: true
    })
  }

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchDestinations(searchTerm)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Initial fetch
  useEffect(() => {
    fetchDestinations()
    fetchTaluks()
    fetchDistricts()
  }, [])

  // Filtered destinations logic
  const filteredDestinations = destinations.filter(dest => {
    const matchesSearch = !searchTerm || dest.city_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = !filterDistrict || dest.taluk?.district_id?.toString() === filterDistrict.toString();
    const matchesTaluk = !filterTaluk || dest.taluk_id?.toString() === filterTaluk.toString();
    return matchesSearch && matchesDistrict && matchesTaluk;
  });

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
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Destination Master</h1>
          <button 
            onClick={fetchDestinations}
            disabled={loading}
            className="p-1 px-1.5 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-all text-blue-600 disabled:opacity-50"
            title="Refresh Destinations"
          >
            <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <button 
          onClick={() => {
            setEditingDestination(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition shadow-sm"
        >
          <Plus size={16} />
          Add Destination
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black text-green-700 uppercase tracking-widest mb-1 ml-1">Filter District</label>
              <select 
                value={filterDistrict} 
                onChange={(e) => { setFilterDistrict(e.target.value); setFilterTaluk(''); }}
                className="w-full px-3 py-1.5 bg-white border border-green-200 rounded-lg focus:outline-none focus:border-green-600 font-bold text-gray-700 text-xs uppercase"
              >
                <option value="">All Districts</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-green-700 uppercase tracking-widest mb-1 ml-1">Filter Taluk</label>
              <select 
                value={filterTaluk} 
                onChange={(e) => setFilterTaluk(e.target.value)}
                disabled={!filterDistrict}
                className="w-full px-3 py-1.5 bg-white border border-green-200 rounded-lg focus:outline-none focus:border-green-600 font-bold text-gray-700 text-xs uppercase disabled:bg-gray-100 disabled:opacity-50"
              >
                <option value="">All Taluks</option>
                {taluks
                  .filter(t => !filterDistrict || t.district_id?.toString() === filterDistrict.toString())
                  .map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-green-700 uppercase tracking-widest mb-1 ml-1">Search City</label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={14} />
                <input
                  type="text"
                  placeholder="Search city name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-green-600 font-medium transition-all text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading destinations...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">District</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Taluk</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">City / Dest</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-center font-bold text-gray-800 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDestinations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No destinations found for the selected filters
                    </td>
                  </tr>
                ) : (
                  filteredDestinations.map((dest) => (
                    <tr key={dest.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-4 py-2 font-bold text-gray-800 uppercase tracking-tight">{dest.taluk?.district?.name || '-'}</td>
                      <td className="px-4 py-2 text-gray-600">{dest.taluk?.name || '-'}</td>
                      <td className="px-4 py-2 text-gray-600 font-semibold">{dest.city_name}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          dest.is_active 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {dest.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-2 flex justify-center gap-1.5">
                        <button 
                          onClick={() => editDestination(dest)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded-md transition"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(dest)}
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
                {editingDestination ? 'Edit Destination' : 'Add New Destination'}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setEditingDestination(null)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={saveDestination} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District *
                </label>
                <select
                  required
                  value={formData.district_id}
                  onChange={(e) => setFormData({...formData, district_id: e.target.value, taluk_id: ''})}
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
                  Taluk *
                </label>
                <select
                  required
                  disabled={!formData.district_id}
                  value={formData.taluk_id}
                  onChange={(e) => setFormData({...formData, taluk_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Taluk</option>
                  {taluks
                    .filter(taluk => !formData.district_id || taluk.district_id == formData.district_id)
                    .map((taluk) => (
                      <option key={taluk.id} value={taluk.id}>
                        {taluk.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city_name}
                  onChange={(e) => setFormData({...formData, city_name: e.target.value})}
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
                    setEditingDestination(null)
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
                  {editingDestination ? 'Update' : 'Save'}
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Destination?</h3>
              <p className="text-gray-500 mb-8">
                Are you sure you want to delete <span className="font-bold text-gray-800 break-all">"{itemToDelete?.city_name}"</span>? This action cannot be undone.
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
                  onClick={deleteDestination}
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

export default Destination
