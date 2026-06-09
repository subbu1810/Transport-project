import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save, RotateCcw } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function BranchMaster() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' })
    }, 5000)
  }
  const [formData, setFormData] = useState({
    branch_code: '',
    branch_name: '',
    address: '',
    city: '',
    taluk: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    is_active: true
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [taluks, setTaluks] = useState([])
  const [filteredDistricts, setFilteredDistricts] = useState([])
  const [filteredTaluks, setFilteredTaluks] = useState([])

  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    setCurrentUser(user)
    if (user && user.role === 'superadmin') {
      fetchBranches()
      fetchStates()
      fetchDistricts()
      fetchTaluks()
    } else {
      setLoading(false)
      setError('Unauthorized access. Only super administrators can manage branches.')
    }
  }, [])

  const fetchStates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/states`)
      const data = await response.json()
      if (data.success) {
        setStates(data.data)
      }
    } catch (err) {
      console.error('Error fetching states:', err)
    }
  }

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

  // Filter districts when state changes
  useEffect(() => {
    if (formData.state) {
      const stateObj = states.find(s => s.name === formData.state)
      if (stateObj) {
        const filtered = districts.filter(d => d.state_id === stateObj.id)
        setFilteredDistricts(filtered)
      } else {
        setFilteredDistricts([])
      }
    } else {
      setFilteredDistricts([])
    }
  }, [formData.state, states, districts])

  // Filter taluks when district changes
  useEffect(() => {
    if (formData.city) {
      const districtObj = districts.find(d => d.name === formData.city)
      if (districtObj) {
        const filtered = taluks.filter(t => t.district_id === districtObj.id)
        setFilteredTaluks(filtered)
      } else {
        setFilteredTaluks([])
      }
    } else {
      setFilteredTaluks([])
    }
  }, [formData.city, taluks, districts])

  // Fetch all branches
  const fetchBranches = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/branches`)
      const data = await response.json()

      if (data.success) {
        setBranches(data.data)
        setError('')
      } else {
        setError(data.message || 'Failed to fetch branches')
        showNotification('error', data.message || 'Failed to fetch branches')
      }
    } catch (err) {
      setError('Failed to connect to server')
      console.error('Error fetching branches:', err)
    } finally {
      setLoading(false)
    }
  }

  // Search branches
  const searchBranches = async (query) => {
    if (!query.trim()) {
      fetchBranches()
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/branches/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (data.success) {
        setBranches(data.data)
        setError('')
      } else {
        setError(data.message || 'Search failed')
        showNotification('error', data.message || 'Search failed')
      }
    } catch (err) {
      setError('Failed to search branches')
      console.error('Error searching branches:', err)
    } finally {
      setLoading(false)
    }
  }

  // Create or update branch
  const saveBranch = async (e) => {
    e.preventDefault()

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.pincode && formData.pincode.length !== 6) {
      setError('Pincode must be exactly 6 digits')
      return
    }
    if (formData.phone && formData.phone.length !== 10) {
      setError('Phone number must be exactly 10 digits')
      return
    }
    if (formData.email && !emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      const url = editingBranch
        ? `${API_BASE_URL}/branches/${editingBranch.id}`
        : `${API_BASE_URL}/branches`

      const method = editingBranch ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        fetchBranches()
        setShowModal(false)
        setEditingBranch(null)
        resetForm()
        setError('')
        showNotification('success', editingBranch ? 'Branch updated successfully!' : 'Branch created successfully!')
      } else {
        setError(data.message || 'Failed to save branch')
        showNotification('error', data.message || 'Failed to save branch')
      }
    } catch (err) {
      setError('Failed to save branch')
      console.error('Error saving branch:', err)
    }
  }

  // Delete branch
  const handleDeleteClick = (branch) => {
    setItemToDelete(branch)
    setShowDeleteConfirm(true)
  }

  const deleteBranch = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetch(`${API_BASE_URL}/branches/${itemToDelete.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        fetchBranches()
        setError('')
        showNotification('success', 'Branch deleted successfully!')
      } else {
        setError(data.message || 'Failed to delete branch')
        showNotification('error', data.message || 'Failed to delete branch')
      }
    } catch (err) {
      setError('Failed to delete branch')
      console.error('Error deleting branch:', err)
    } finally {
      setShowDeleteConfirm(false)
      setItemToDelete(null)
    }
  }

  // Edit branch
  const editBranch = (branch) => {
    setEditingBranch(branch)
    setFormData({
      branch_code: branch.branch_code,
      branch_name: branch.branch_name,
      address: branch.address || '',
      city: branch.city || '',
      taluk: branch.taluk || '',
      state: branch.state || '',
      pincode: branch.pincode || '',
      phone: branch.phone || '',
      email: branch.email || '',
      is_active: branch.is_active
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      branch_code: '',
      branch_name: '',
      address: '',
      city: '',
      taluk: '',
      state: '',
      pincode: '',
      phone: '',
      email: '',
      is_active: true
    })
  }

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchBranches(searchTerm)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Initial fetch
  useEffect(() => {
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
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Branch Master</h1>
          <button 
            onClick={fetchBranches}
            disabled={loading}
            className="p-1 px-1.5 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-all text-blue-600 disabled:opacity-50"
            title="Refresh Data"
          >
            <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <button
          onClick={() => {
            setEditingBranch(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition shadow-sm"
        >
          <Plus size={16} />
          Add Branch
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search branches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600 text-xs font-medium"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading branches...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">ID</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Code</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Branch Name</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">City</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Taluk</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">State</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Phone</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-center font-bold text-gray-800 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      No branches found
                    </td>
                  </tr>
                ) : (
                  branches.map((branch) => (
                    <tr key={branch.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-3 py-2 font-mono text-[10px] text-gray-500 font-semibold">{branch.id}</td>
                      <td className="px-3 py-2 font-bold text-gray-800 uppercase tracking-tight">{branch.branch_code}</td>
                      <td className="px-3 py-2 text-gray-600 font-semibold">{branch.branch_name}</td>
                      <td className="px-3 py-2 text-gray-600">{branch.city || '-'}</td>
                      <td className="px-3 py-2 text-gray-600">{branch.taluk || '-'}</td>
                      <td className="px-3 py-2 text-gray-600">{branch.state || '-'}</td>
                      <td className="px-3 py-2 text-gray-600 font-mono text-[10px]">{branch.phone || '-'}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${branch.is_active
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-red-50 text-red-600 border-red-100'
                          }`}>
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2 flex justify-center gap-1.5">
                        <button
                          onClick={() => editBranch(branch)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded-md transition"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(branch)}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingBranch(null)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={saveBranch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.branch_code}
                    onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={!!editingBranch}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.branch_name}
                    onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state.id} value={state.name}>{state.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City (District)
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value, taluk: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={!formData.state}
                  >
                    <option value="">Select City</option>
                    {filteredDistricts.map(district => (
                      <option key={district.id} value={district.name}>{district.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taluk
                  </label>
                  <select
                    value={formData.taluk}
                    onChange={(e) => setFormData({ ...formData, taluk: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={!formData.city}
                  >
                    <option value="">Select Taluk</option>
                    {filteredTaluks.map(taluk => (
                      <option key={taluk.id} value={taluk.name}>{taluk.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="6 digits"
                    value={formData.pincode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setFormData({ ...formData, pincode: value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    maxLength="10"
                    placeholder="10 digits"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({ ...formData, phone: value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold"
                  />
                </div>
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
                    setEditingBranch(null)
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
                  {editingBranch ? 'Update' : 'Save'}
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Branch?</h3>
              <p className="text-gray-500 mb-8">
                Are you sure you want to delete <span className="font-bold text-gray-800 break-all">"{itemToDelete?.branch_name}"</span>? This action cannot be undone.
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
                  onClick={deleteBranch}
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

export default BranchMaster
