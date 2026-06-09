import React, { useState, useEffect } from 'react'
import { Info, Plus, Edit2, Trash2, Search, X, Save } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function LookupMaster() {
  const [lookups, setLookups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingLookup, setEditingLookup] = useState(null)
  const [formData, setFormData] = useState({
    is_active: true
  })
  const [showHelp, setShowHelp] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)

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
      const response = await fetch(`${API_BASE_URL}/lookups`)
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
      const response = await fetch(`${API_BASE_URL}/lookups/search?q=${encodeURIComponent(query)}`)
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
        ? `${API_BASE_URL}/lookups/${editingLookup.id}`
        : `${API_BASE_URL}/lookups`

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
  const handleDeleteClick = (lookup) => {
    setItemToDelete(lookup)
    setShowDeleteConfirm(true)
  }

  const deleteLookup = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetch(`${API_BASE_URL}/lookups/${itemToDelete.id}`, {
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
    } finally {
      setShowDeleteConfirm(false)
      setItemToDelete(null)
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
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Lookup Master</h1>
          <button
            onClick={() => setShowHelp(true)}
            className="p-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-all shadow-sm border border-blue-100 group"
          >
            <Info size={14} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
        <button
          onClick={() => {
            setEditingLookup(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition shadow-sm"
        >
          <Plus size={16} />
          Add Lookup
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search lookups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600 text-xs font-medium"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading lookups...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Type</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Code</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Value</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-center font-bold text-gray-800 uppercase tracking-wider">Actions</th>
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
                      <td className="px-3 py-2 font-bold text-blue-900 uppercase tracking-tight">{lookup.type}</td>
                      <td className="px-3 py-2 text-gray-600 font-semibold uppercase">{lookup.code}</td>
                      <td className="px-3 py-2 font-black text-gray-800 tracking-tight">{lookup.value}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${lookup.is_active
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                          {lookup.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2 flex justify-center gap-1.5">
                        <button
                          onClick={() => editLookup(lookup)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded-md transition"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(lookup)}
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

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-blue-100">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Info size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Lookup Master Guide</h2>
                  <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Managing System Configurations</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-8">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-black">?</span>
                    What is Lookup Master?
                  </div>
                  <div className="ml-10">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Lookup Master is the central repository for all "dropdown" options used throughout the Garuda Logistics system. Instead of hardcoding values like <span className="font-bold text-gray-800">Article Types</span> or <span className="font-bold text-gray-800">Payment Modes</span>, they are managed here.
                    </p>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold uppercase text-xs tracking-wider">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-black">1</div>
                      Lookup Type
                    </div>
                    <ul className="space-y-2 text-xs text-gray-500 ml-10 leading-relaxed">
                      <li>• Categorizes the lookup (e.g., <span className="font-bold">ARTICLE_TYPE</span>).</li>
                      <li>• Grouping multiple codes under one type helps the system know where to display them.</li>
                    </ul>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold uppercase text-xs tracking-wider">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-black">2</div>
                      Code & Value
                    </div>
                    <ul className="space-y-2 text-xs text-gray-500 ml-10 leading-relaxed">
                      <li>• <span className="font-bold text-gray-700 uppercase">Code:</span> The unique identifier stored in the database (e.g., <span className="font-bold underline">BAGS</span>).</li>
                      <li>• <span className="font-bold text-gray-700 uppercase">Value:</span> The human-readable text shown to users (e.g., <span className="font-bold italic">Bags/Sacks</span>).</li>
                    </ul>
                  </section>
                </div>

                <section className="space-y-4 bg-amber-50 p-6 rounded-2xl border border-amber-100">
                  <div className="flex items-center gap-2 text-amber-700 font-bold uppercase text-xs tracking-wider">
                    <span className="text-lg">⚠️</span>
                    Important Note
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed ml-7">
                    Be careful when modifying <span className="font-black">Lookup Types</span> or <span className="font-black">Codes</span> that are already in use. Changing them might break historical data connections. Updating the <span className="font-black">Value</span> is generally safe.
                  </p>
                </section>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-8 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-95 uppercase text-xs tracking-widest"
              >
                Got It!
              </button>
            </div>
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Lookup?</h3>
              <p className="text-gray-500 mb-8 font-['Plus_Jakarta_Sans',_sans-serif]">
                Are you sure you want to delete <span className="font-bold text-gray-800 break-all">"{itemToDelete?.value}"</span> from <span className="font-bold text-gray-800">{itemToDelete?.type}</span>? This action cannot be undone.
              </p>
              
              <div className="flex w-full gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setItemToDelete(null)
                  }}
                  className="flex-1 px-4 py-3 text-gray-700 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteLookup}
                  className="flex-1 px-4 py-3 text-white font-bold bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all active:scale-95 text-xs uppercase tracking-widest"
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

export default LookupMaster
