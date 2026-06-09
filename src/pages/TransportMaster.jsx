import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

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
    is_active: true,
    maintenance_rate: 0
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

  // Fetch all transports
  const fetchTransports = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/transports`)
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
      const response = await fetch(`${API_BASE_URL}/branches`)
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
      const response = await fetch(`${API_BASE_URL}/transports/search?${searchParams}`)
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
        ? `${API_BASE_URL}/transports/${editingTransport.id}`
        : `${API_BASE_URL}/transports`
      
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
  const handleDeleteClick = (transport) => {
    setItemToDelete(transport)
    setShowDeleteConfirm(true)
  }

  const deleteTransport = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetch(`${API_BASE_URL}/transports/${itemToDelete.id}`, {
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
    } finally {
      setShowDeleteConfirm(false)
      setItemToDelete(null)
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
      is_active: transport.is_active,
      maintenance_rate: transport.maintenance_rate || 0
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
      is_active: true,
      maintenance_rate: 0
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
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Transport Master</h1>
        <button 
          onClick={() => {
            setEditingTransport(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition shadow-sm"
        >
          <Plus size={16} />
          Add Transport
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="px-2 py-1.5 border border-green-600 rounded-lg focus:outline-none text-[10px] font-black uppercase tracking-tight"
            >
              <option value="transport_name">Transport Name</option>
              <option value="transport_code">Transport Code</option>
            </select>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search transports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600 text-xs font-medium"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading transports...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Code</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">GST NO</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Address</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Mobile</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Maint. Rate</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-center font-bold text-gray-800 uppercase tracking-wider">Actions</th>
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
                      <td className="px-3 py-2 font-bold text-gray-800 uppercase tracking-tight">{transport.transport_code}</td>
                      <td className="px-3 py-2 font-bold text-gray-800 uppercase tracking-tight">{transport.transport_name}</td>
                      <td className="px-3 py-2 text-gray-600 font-semibold">{transport.gst_number || '-'}</td>
                      <td className="px-3 py-2 text-gray-600 font-medium max-w-[150px] truncate" title={transport.address}>{transport.address}</td>
                      <td className="px-3 py-2 text-gray-600 font-semibold font-mono">{transport.mobile || '-'}</td>
                      <td className="px-3 py-2 font-bold text-gray-800">₹{parseFloat(transport.maintenance_rate || 0).toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          transport.is_active 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {transport.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2 flex justify-center gap-1.5">
                        <button 
                          onClick={() => editTransport(transport)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded-md transition"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(transport)}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl transform animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-slate-200">
            {/* Modal Header */}
            <div className={`px-6 py-4 flex justify-between items-center border-b-2 ${editingTransport ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl text-white ${editingTransport ? 'bg-blue-600' : 'bg-green-600'}`}>
                  {editingTransport ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                  {editingTransport ? 'Edit Transport' : 'New Transport'}
                </h2>
              </div>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setEditingTransport(null)
                  resetForm()
                }}
                className="text-slate-400 hover:text-rose-500 transition-colors p-2 hover:bg-white rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveTransport} className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-green-600 transition-colors">
                    Transport Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="20"
                    placeholder="Enter Code"
                    value={formData.transport_code}
                    onChange={(e) => setFormData({...formData, transport_code: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-bold text-sm text-slate-700"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-green-600 transition-colors">
                    Transport Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="100"
                    placeholder="Enter Name"
                    value={formData.transport_name}
                    onChange={(e) => setFormData({...formData, transport_name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-bold text-sm text-slate-700"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-green-600 transition-colors">
                    GST Number
                  </label>
                  <input
                    type="text"
                    maxLength="20"
                    placeholder="Enter GSTIN"
                    value={formData.gst_number}
                    onChange={(e) => setFormData({...formData, gst_number: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-bold text-sm text-slate-700"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-green-600 transition-colors">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    maxLength="10"
                    placeholder="Enter 10-digit Mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-bold text-sm text-slate-700"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-green-600 transition-colors">
                    Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    maxLength="255"
                    rows="2"
                    placeholder="Enter Full Address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-bold text-sm text-slate-700 resize-none"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-green-600 transition-colors">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    maxLength="100"
                    placeholder="Enter Bank Name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-bold text-sm text-slate-700"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-green-600 transition-colors">
                    Branch
                  </label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-bold text-sm text-slate-700 cursor-pointer appearance-none"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-green-600 transition-colors">
                    Maintenance Rate (per GC)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter Rate"
                    value={formData.maintenance_rate}
                    onChange={(e) => setFormData({...formData, maintenance_rate: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-bold text-sm text-slate-700"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2 md:col-span-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 text-green-600 bg-slate-50 border-slate-200 rounded focus:ring-green-500/20 focus:ring-2 transition-all cursor-pointer"
                  />
                  <label htmlFor="is_active" className="text-xs font-black text-slate-500 uppercase tracking-wider cursor-pointer">
                    Active Status
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingTransport(null)
                    resetForm()
                  }}
                  className="px-6 py-2.5 text-slate-500 font-bold bg-slate-100 rounded-xl hover:bg-slate-200 transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex items-center gap-2 px-8 py-2.5 text-white font-bold rounded-xl hover:shadow-lg transition-all active:scale-95 text-xs uppercase tracking-widest ${editingTransport ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-green-600 hover:bg-green-700 shadow-green-500/20'}`}
                >
                  <Save size={18} />
                  {editingTransport ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 w-full max-sm shadow-2xl transform animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Transport?</h3>
              <p className="text-gray-500 mb-8">
                Are you sure you want to delete <span className="font-bold text-gray-800 break-all">"{itemToDelete?.transport_name}"</span>? This action cannot be undone.
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
                  onClick={deleteTransport}
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

export default TransportMaster
