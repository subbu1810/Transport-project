import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save, RotateCcw } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function DriverDetails() {
  const [drivers, setDrivers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    dl_number: '',
    dl_type: '',
    phone: '',
    date_of_birth: '',
    date_of_issue: '',
    valid_till: '',
    address: '',
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

  // Fetch all drivers
  const fetchDrivers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/drivers`)
      const data = await response.json()
      
      if (data.success) {
        setDrivers(data.data)
        setError('')
      } else {
        setError(data.message || 'Failed to fetch drivers')
        showNotification('error', data.message || 'Failed to fetch drivers')
      }
    } catch (err) {
      setError('Failed to connect to server')
      showNotification('error', 'Failed to connect to server. Please check if the Laravel server is running.')
      console.error('Error fetching drivers:', err)
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

  // Search drivers
  const searchDrivers = async (query) => {
    if (!query.trim()) {
      fetchDrivers()
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/drivers/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        setDrivers(data.data)
        setError('')
        showNotification('info', `Found ${data.data.length} drivers matching "${query}"`)
      } else {
        setError(data.message || 'Search failed')
        showNotification('error', data.message || 'Search failed')
      }
    } catch (err) {
      setError('Failed to search drivers')
      showNotification('error', 'Failed to search drivers')
      console.error('Error searching drivers:', err)
    } finally {
      setLoading(false)
    }
  }

  // Save driver
  const saveDriver = async (e) => {
    e.preventDefault()

    // Phone validation
    if (formData.phone && formData.phone.length !== 10) {
      showNotification('error', 'Phone number must be exactly 10 digits')
      return
    }
    try {
      const url = editingDriver 
        ? `${API_BASE_URL}/drivers/${editingDriver.id}`
        : `${API_BASE_URL}/drivers`
      
      const method = editingDriver ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchDrivers()
        setShowModal(false)
        setEditingDriver(null)
        resetForm()
        setError('')
        showNotification('success', editingDriver ? 'Driver updated successfully!' : 'Driver created successfully!')
      } else {
        setError(data.message || 'Failed to save driver')
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ')
          showNotification('error', `Validation failed: ${errorMessages}`)
        } else {
          showNotification('error', data.message || 'Failed to save driver')
        }
      }
    } catch (err) {
      setError('Failed to save driver')
      showNotification('error', 'Failed to save driver. Please check your connection and try again.')
      console.error('Error saving driver:', err)
    }
  }

  // Handle delete click
  const handleDeleteClick = (driver) => {
    setItemToDelete(driver)
    setShowDeleteConfirm(true)
  }

  // Delete driver
  const deleteDriver = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetch(`${API_BASE_URL}/drivers/${itemToDelete.id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchDrivers()
        setError('')
        showNotification('success', 'Driver deleted successfully!')
      } else {
        setError(data.message || 'Failed to delete driver')
        showNotification('error', data.message || 'Failed to delete driver')
      }
    } catch (err) {
      setError('Failed to delete driver')
      showNotification('error', 'Failed to delete driver. Please check your connection and try again.')
      console.error('Error deleting driver:', err)
    } finally {
      setShowDeleteConfirm(false)
      setItemToDelete(null)
    }
  }

  // Edit driver
  const editDriver = (driver) => {
    setEditingDriver(driver)
    setFormData({
      name: driver.name,
      dl_number: driver.dl_number,
      dl_type: driver.dl_type,
      phone: driver.phone,
      date_of_birth: driver.date_of_birth ? new Date(driver.date_of_birth).toISOString().split('T')[0] : '',
      date_of_issue: driver.date_of_issue ? new Date(driver.date_of_issue).toISOString().split('T')[0] : '',
      valid_till: driver.valid_till ? new Date(driver.valid_till).toISOString().split('T')[0] : '',
      address: driver.address || '',
      branch_id: driver.branch_id || '',
      is_active: driver.is_active
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      dl_number: '',
      dl_type: '',
      phone: '',
      date_of_birth: '',
      date_of_issue: '',
      valid_till: '',
      address: '',
      branch_id: '',
      is_active: true
    })
  }

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchDrivers(searchTerm)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Initial fetch
  useEffect(() => {
    fetchDrivers()
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
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Driver Details</h1>
          <button 
            onClick={fetchDrivers}
            disabled={loading}
            className="p-1 px-1.5 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-all text-blue-600 disabled:opacity-50"
            title="Refresh Data"
          >
            <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <button 
          onClick={() => {
            setEditingDriver(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition shadow-sm"
        >
          <Plus size={16} />
          Add Driver
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600 text-xs font-medium"
            />
            <Search size={16} className="text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading drivers...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">DL NO</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">DL Type</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Phone</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">DOB</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Issue Date</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Expiry</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Branch</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-center font-bold text-gray-800 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-8 text-center text-gray-500">
                      No drivers found
                    </td>
                  </tr>
                ) : (
                  drivers.map((driver) => (
                  <tr key={driver.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-3 py-2 font-bold text-gray-800 uppercase tracking-tight">{driver.name}</td>
                      <td className="px-3 py-2 text-gray-600 font-mono text-[10px]">{driver.dl_number}</td>
                      <td className="px-3 py-2 text-gray-600">{driver.dl_type}</td>
                      <td className="px-3 py-2 text-gray-600">{driver.phone}</td>
                      <td className="px-3 py-2 text-gray-600">
                        {driver.date_of_birth ? new Date(driver.date_of_birth).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {driver.date_of_issue ? new Date(driver.date_of_issue).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {driver.valid_till ? new Date(driver.valid_till).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{driver.branch?.branch_name || '-'}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          driver.is_active 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {driver.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2 flex justify-center gap-1.5">
                        <button 
                          onClick={() => editDriver(driver)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded-md transition"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(driver)}
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
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-green-100">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">
                {editingDriver ? 'Edit Driver' : 'Add New Driver'}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setEditingDriver(null)
                  resetForm()
                }}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={saveDriver} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Driver Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="100"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="10"
                    placeholder="10 digits"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({...formData, phone: value});
                    }}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    DL Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="20"
                    placeholder="License number"
                    value={formData.dl_number}
                    onChange={(e) => setFormData({...formData, dl_number: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    DL Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.dl_type}
                    onChange={(e) => setFormData({...formData, dl_type: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm cursor-pointer"
                  >
                    <option value="">Select DL Type</option>
                    <option value="LMV">LMV (Light Motor Vehicle)</option>
                    <option value="LMV-TR">LMV-TR (Transport)</option>
                    <option value="LMV-GV">LMV-GV (Goods Vehicle)</option>
                    <option value="HMV">HMV (Heavy Motor Vehicle)</option>
                    <option value="HGMV">HGMV (Heavy Goods)</option>
                    <option value="HPMV">HPMV (Heavy Passenger)</option>
                    <option value="MCWG">MCWG (Motorcycle with Gear)</option>
                    <option value="MCWOG">MCWOG (Motorcycle without Gear)</option>
                    <option value="TRANS">TRANS (Transport)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Branch <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.branch_id}
                    onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Date of Issue
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_issue}
                    onChange={(e) => setFormData({...formData, date_of_issue: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Valid Till
                  </label>
                  <input
                    type="date"
                    value={formData.valid_till}
                    onChange={(e) => setFormData({...formData, valid_till: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    placeholder="Enter permanent address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm resize-none"
                    rows="2"
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
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingDriver(null)
                    resetForm()
                  }}
                  className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-2 border-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-8 py-2.5 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all hover:scale-105 active:scale-95"
                >
                  <Save size={18} />
                  {editingDriver ? 'Update Driver' : 'Save Driver'}
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Driver?</h3>
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
                  onClick={deleteDriver}
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

export default DriverDetails
