import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)

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
      const response = await fetch(`${API_BASE_URL}/bunks`)
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
      const response = await fetch(`${API_BASE_URL}/branches`)
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
      const response = await fetch(`${API_BASE_URL}/bunks/search?q=${encodeURIComponent(query)}`)
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
        ? `${API_BASE_URL}/bunks/${editingBunk.id}`
        : `${API_BASE_URL}/bunks`
      
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

  // Handle delete click
  const handleDeleteClick = (bunk) => {
    setItemToDelete(bunk)
    setShowDeleteConfirm(true)
  }

  // Delete bunk
  const deleteBunk = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetch(`${API_BASE_URL}/bunks/${itemToDelete.id}`, {
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
    } finally {
      setShowDeleteConfirm(false)
      setItemToDelete(null)
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
    <div className="p-4 space-y-4">
      {/* Notification Popup */}
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
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Bunk Details</h1>
        <button 
          onClick={() => {
            setEditingBunk(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition shadow-sm"
        >
          <Plus size={16} />
          Add Bunk
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search bunks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-green-600 font-medium transition-all text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading bunks...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Address</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">TIN Num</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Landline</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Mobile</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-center font-bold text-gray-800 uppercase tracking-wider">Actions</th>
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
                      <td className="px-3 py-2 font-bold text-gray-800 uppercase tracking-tight">{bunk.bunk_name}</td>
                      <td className="px-3 py-2 text-gray-600 font-medium max-w-[200px] truncate" title={bunk.bunk_address}>{bunk.bunk_address}</td>
                      <td className="px-3 py-2 text-gray-600 font-semibold">{bunk.tin_number || '-'}</td>
                      <td className="px-3 py-2 text-gray-600 font-semibold font-mono">{bunk.bunk_land || '-'}</td>
                      <td className="px-3 py-2 text-gray-600 font-semibold font-mono">{bunk.bunk_mobile || '-'}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          bunk.is_active 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {bunk.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2 flex justify-center gap-1.5">
                        <button 
                          onClick={() => editBunk(bunk)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded-md transition"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(bunk)}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800">
                {editingBunk ? 'Edit Bunk' : 'Add New Bunk'}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setEditingBunk(null)
                  resetForm()
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveBunk} className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Bunk Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="100"
                    placeholder="Enter bunk name"
                    value={formData.bunk_name}
                    onChange={(e) => setFormData({...formData, bunk_name: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Branch
                  </label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm cursor-pointer"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Bunk Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    maxLength="255"
                    rows="2"
                    placeholder="Enter full address"
                    value={formData.bunk_address}
                    onChange={(e) => setFormData({...formData, bunk_address: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    TIN Number
                  </label>
                  <input
                    type="text"
                    maxLength="20"
                    placeholder="TIN number"
                    value={formData.tin_number}
                    onChange={(e) => setFormData({...formData, tin_number: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Bunk Mobile
                  </label>
                  <input
                    type="text"
                    maxLength="10"
                    placeholder="10 digits"
                    value={formData.bunk_mobile}
                    onChange={(e) => setFormData({...formData, bunk_mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Landline
                  </label>
                  <input
                    type="text"
                    maxLength="20"
                    placeholder="Landline number"
                    value={formData.bunk_land}
                    onChange={(e) => setFormData({...formData, bunk_land: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 text-green-600 bg-gray-50 border-gray-200 rounded focus:ring-green-500/20 focus:ring-2 transition-all"
                  />
                  <label htmlFor="is_active" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Active Status
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Bunk Remarks
                  </label>
                  <textarea
                    maxLength="500"
                    rows="2"
                    placeholder="Any additional remarks"
                    value={formData.bunk_remarks}
                    onChange={(e) => setFormData({...formData, bunk_remarks: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingBunk(null)
                    resetForm()
                  }}
                  className="px-6 py-2.5 text-gray-500 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-all active:scale-95 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all active:scale-95 text-sm"
                >
                  <Save size={18} />
                  {editingBunk ? 'Update Bunk' : 'Save Bunk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl transform animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Bunk?</h3>
              <p className="text-gray-500 mb-8 text-sm">
                Are you sure you want to delete <span className="font-bold text-gray-800 break-all">"{itemToDelete?.bunk_name}"</span>? This action cannot be undone.
              </p>
              
              <div className="flex w-full gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setItemToDelete(null)
                  }}
                  className="flex-1 px-4 py-3 text-gray-700 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-all active:scale-95 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteBunk}
                  className="flex-1 px-4 py-3 text-white font-bold bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all active:scale-95 text-sm"
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

export default BunkDetails
