import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save, User, Tag, FileText, MapPin, Phone, CheckCircle2, RotateCcw, Building2, Loader2 } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function ConsigneeMaster() {
  const [consignees, setConsignees] = useState([])
  const [destinations, setDestinations] = useState([])
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [taluks, setTaluks] = useState([])
  const [branches, setBranches] = useState([])
  const [userRole, setUserRole] = useState('admin')
  const [userBranchId, setUserBranchId] = useState(null)
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState('name')
  const [showModal, setShowModal] = useState(false)
  const [editingConsignee, setEditingConsignee] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    gst_number: '',
    address: '',
    land_number: '',
    mobile_number: '',
    state_id: '',
    district_id: '',
    taluk_id: '',
    destination_id: '',
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

  // Fetch all consignees
  const fetchConsignees = async () => {
    try {
      setLoading(true)
      const user = JSON.parse(localStorage.getItem('user'))
      let url = `${API_BASE_URL}/consignees`
      const params = new URLSearchParams()

      if (user?.role === 'admin' && user?.branch_id) {
        params.append('branch_id', user.branch_id)
      } else if (user?.role === 'superadmin' && selectedBranchId) {
        params.append('branch_id', selectedBranchId)
      }

      const fullUrl = params.toString() ? `${url}?${params.toString()}` : url
      const response = await fetch(fullUrl)
      const data = await response.json()

      if (data.success) {
        setConsignees(data.data)
        setError('')
      } else {
        setError(data.message || 'Failed to fetch consignees')
        showNotification('error', data.message || 'Failed to fetch consignees')
      }
    } catch (err) {
      setError('Failed to connect to server')
      showNotification('error', 'Failed to connect to server')
      console.error('Error fetching consignees:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches`)
      const data = await response.json()
      if (data.success) setBranches(data.data)
    } catch (err) { console.error('Error fetching branches:', err) }
  }

  // Fetch states for dropdown
  const fetchStates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/states`)
      const data = await response.json()
      if (data.success) setStates(data.data)
    } catch (err) { console.error('Error fetching states:', err) }
  }

  // Fetch districts for dropdown
  const fetchDistricts = async (stateId) => {
    if (!stateId) {
      setDistricts([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/districts/state/${stateId}`)
      const data = await response.json()
      if (data.success) setDistricts(data.data)
    } catch (err) { console.error('Error fetching districts:', err) }
  }

  // Fetch taluks for dropdown
  const fetchTaluks = async (districtId) => {
    if (!districtId) {
      setTaluks([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/taluks/district/${districtId}`)
      const data = await response.json()
      if (data.success) setTaluks(data.data)
    } catch (err) { console.error('Error fetching taluks:', err) }
  }

  // Fetch destinations for dropdown by taluk
  const fetchDestinationsByTaluk = async (talukId) => {
    if (!talukId) {
      setDestinations([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/destinations/taluk/${talukId}`)
      const data = await response.json()
      if (data.success) setDestinations(data.data)
    } catch (err) { console.error('Error fetching destinations:', err) }
  }

  // Search consignees
  const searchConsignees = async (query) => {
    if (!query.trim()) {
      fetchConsignees()
      return
    }

    try {
      setLoading(true)
      const user = JSON.parse(localStorage.getItem('user'))
      let url = `${API_BASE_URL}/consignees/search?q=${encodeURIComponent(query)}&type=${searchType}`
      
      if (user?.role === 'admin' && user?.branch_id) {
        url += `&branch_id=${user.branch_id}`
      } else if (user?.role === 'superadmin' && selectedBranchId) {
        url += `&branch_id=${selectedBranchId}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setConsignees(data.data)
        setError('')
        showNotification('info', `Found ${data.data.length} consignees matching "${query}"`)
      } else {
        setError(data.message || 'Search failed')
        showNotification('error', data.message || 'Search failed')
      }
    } catch (err) {
      setError('Failed to search consignees')
      showNotification('error', 'Failed to search consignees')
      console.error('Error searching consignees:', err)
    } finally {
      setLoading(false)
    }
  }

  // Save consignee
  const saveConsignee = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setValidationErrors({})

    try {
      const url = editingConsignee
        ? `${API_BASE_URL}/consignees/${editingConsignee.id}`
        : `${API_BASE_URL}/consignees`

      const method = editingConsignee ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        fetchConsignees()
        setShowModal(false)
        setEditingConsignee(null)
        resetForm()
        setError('')
        showNotification('success', editingConsignee ? 'Consignee updated successfully!' : 'Consignee created successfully!')
      } else {
        setError(data.message || 'Failed to save consignee')
        if (data.errors) {
          setValidationErrors(data.errors)
          showNotification('error', 'Please fix the validation errors.')
        } else {
          showNotification('error', data.message || 'Failed to save consignee')
        }
      }
    } catch (err) {
      setError('Failed to save consignee')
      showNotification('error', 'Failed to save consignee. Please check your connection and try again.')
      console.error('Error saving consignee:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete consignee
  const handleDeleteClick = (consignee) => {
    setItemToDelete(consignee)
    setShowDeleteConfirm(true)
  }

  const deleteConsignee = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetch(`${API_BASE_URL}/consignees/${itemToDelete.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        fetchConsignees()
        setError('')
        showNotification('success', 'Consignee deleted successfully!')
      } else {
        setError(data.message || 'Failed to delete consignee')
        showNotification('error', data.message || 'Failed to delete consignee')
      }
    } catch (err) {
      setError('Failed to delete consignee')
      showNotification('error', 'Failed to delete consignee. Please check your connection and try again.')
      console.error('Error deleting consignee:', err)
    } finally {
      setShowDeleteConfirm(false)
      setItemToDelete(null)
    }
  }

  // Edit consignee
  const editConsignee = async (consignee) => {
    setEditingConsignee(consignee)

    // Get hierarchical data
    const dest = consignee.destination;
    const talukId = dest?.taluk_id || '';
    const districtId = dest?.taluk?.district_id || '';
    const stateId = dest?.taluk?.district?.state_id || '';

    // Pre-fetch dependent data
    if (stateId) fetchDistricts(stateId);
    if (districtId) fetchTaluks(districtId);
    if (talukId) fetchDestinationsByTaluk(talukId);

    setFormData({
      name: consignee.name,
      code: consignee.code,
      gst_number: consignee.gst_number || '',
      address: consignee.address,
      land_number: consignee.land_number || '',
      mobile_number: consignee.mobile_number,
      state_id: stateId,
      district_id: districtId,
      taluk_id: talukId,
      destination_id: consignee.destination_id,
      branch_id: consignee.branch_id || '',
      is_active: consignee.is_active
    })
    setShowModal(true)
  }

  // Reset form
  const resetForm = () => {
    setValidationErrors({})
    setFormData({
      name: '',
      code: '',
      gst_number: '',
      address: '',
      land_number: '',
      mobile_number: '',
      state_id: '',
      district_id: '',
      taluk_id: '',
      destination_id: '',
      branch_id: userRole === 'admin' ? userBranchId : '',
      is_active: true
    })
    setDistricts([]);
    setTaluks([]);
    setDestinations([]);
  }

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchConsignees(searchTerm)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchType, selectedBranchId])

  // Initial fetch
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const u = JSON.parse(userStr)
      setUserRole(u.role || 'admin')
      setUserBranchId(u.branch_id)
    }
    fetchConsignees()
    fetchStates()
    fetchBranches()
  }, [])

  return (
    <div className="p-4 space-y-4 font-['Plus_Jakarta_Sans',_sans-serif]">
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
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Consignee Master</h1>
          <button 
            onClick={fetchConsignees}
            disabled={loading}
            className="p-1 px-1.5 bg-white rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-blue-600 disabled:opacity-50"
            title="Refresh Consignees"
          >
            <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <button
          onClick={() => {
            setEditingConsignee(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm font-bold text-xs uppercase"
        >
          <Plus size={16} />
          Add Consignee
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-green-50 p-3 border-b border-green-200">
          <div className="flex items-center gap-3">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-2 py-1 border border-green-600 rounded-lg focus:outline-none bg-white font-black text-[10px] uppercase text-green-700"
            >
              <option value="name">NAME</option>
            </select>
            {userRole === 'superadmin' && (
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="px-2 py-1 border border-green-600 rounded-lg focus:outline-none bg-white font-black text-[10px] uppercase text-green-700"
              >
                <option value="">ALL BRANCHES</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.branch_name}</option>
                ))}
              </select>
            )}
            <input
              type="text"
              placeholder="Search consignees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600 text-xs font-medium"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading consignees...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">GST-NO</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Address</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Mobile</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Destination</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Branch</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-center font-bold text-gray-800 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {consignees.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No consignees found
                    </td>
                  </tr>
                ) : (
                  consignees.map((consignee) => (
                    <tr key={consignee.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-3 py-2 text-slate-800 font-bold uppercase tracking-tight">{consignee.name}</td>
                      <td className="px-3 py-2 text-gray-600 font-mono text-[10px]">{consignee.gst_number || '-'}</td>
                      <td className="px-3 py-2 text-gray-500 truncate max-w-[150px]" title={consignee.address}>{consignee.address}</td>
                      <td className="px-3 py-2 text-gray-600 font-semibold">{consignee.mobile_number}</td>
                      <td className="px-3 py-2 text-gray-600">
                        {consignee.destination ?
                          `${consignee.destination.city_name} (${consignee.destination.taluk?.district?.name})`
                          : '-'}
                      </td>
                      <td className="px-3 py-2 text-green-700 font-bold uppercase">
                        {consignee.branch?.branch_name || '-'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${consignee.is_active
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-red-50 text-red-600 border-red-100'
                          }`}>
                          {consignee.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="px-3 py-2 flex justify-center gap-1.5">
                        <button
                          onClick={() => editConsignee(consignee)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded-md transition"
                        >
                          <Edit2 size={14} />
                        </button>
                         <button
                          onClick={() => handleDeleteClick(consignee)}
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

      {/* Add/Edit Modal - Green Theme */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
            {/* Condensed Header */}
            <div className="px-6 py-4 bg-green-50 flex justify-between items-center border-b-2 border-green-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600 rounded-xl text-white">
                  {editingConsignee ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                  {editingConsignee ? 'Edit Record' : 'New Consignee'}
                </h2>
              </div>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Compact Form Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <form onSubmit={saveConsignee} id="consigneeForm" className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <InputField label="Consignee Name *" icon={<User size={16} />} required error={validationErrors.name}>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="compact-input" placeholder="Enter Full Name" disabled={isSubmitting} />
                </InputField>



                <InputField label="GST Number" icon={<FileText size={16} />} error={validationErrors.gst_number}>
                  <input 
                    type="text" 
                    maxLength="15"
                    value={formData.gst_number} 
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })} 
                    className="compact-input" 
                    placeholder="15 Digit GSTIN"
                    disabled={isSubmitting}
                  />
                </InputField>

                <InputField label="State *" icon={<MapPin size={16} />} required error={validationErrors.state_id}>
                  <select
                    required
                    value={formData.state_id}
                    onChange={(e) => {
                      const id = e.target.value;
                      setFormData({ ...formData, state_id: id, district_id: '', taluk_id: '', destination_id: '' });
                      fetchDistricts(id);
                    }}
                    className="compact-input appearance-none"
                    disabled={isSubmitting}
                  >
                    <option value="">Select State</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </InputField>

                <InputField label="District *" icon={<MapPin size={16} />} required error={validationErrors.district_id}>
                  <select
                    required
                    value={formData.district_id}
                    onChange={(e) => {
                      const id = e.target.value;
                      setFormData({ ...formData, district_id: id, taluk_id: '', destination_id: '' });
                      fetchTaluks(id);
                    }}
                    className="compact-input appearance-none"
                    disabled={!formData.state_id || isSubmitting}
                  >
                    <option value="">Select District</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </InputField>

                <InputField label="Taluk *" icon={<MapPin size={16} />} required error={validationErrors.taluk_id}>
                  <select
                    required
                    value={formData.taluk_id}
                    onChange={(e) => {
                      const id = e.target.value;
                      setFormData({ ...formData, taluk_id: id, destination_id: '' });
                      fetchDestinationsByTaluk(id);
                    }}
                    className="compact-input appearance-none"
                    disabled={!formData.district_id || isSubmitting}
                  >
                    <option value="">Select Taluk</option>
                    {taluks.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </InputField>

                <InputField label="Destination *" icon={<MapPin size={16} />} required error={validationErrors.destination_id}>
                  <select
                    required
                    value={formData.destination_id}
                    onChange={(e) => setFormData({ ...formData, destination_id: e.target.value })}
                    className="compact-input appearance-none"
                    disabled={!formData.taluk_id || isSubmitting}
                  >
                    <option value="">Select Destination</option>
                    {destinations.map((destination) => (
                      <option key={destination.id} value={destination.id}>
                        {destination.city_name}
                      </option>
                    ))}
                  </select>
                </InputField>

                <div className="col-span-1 md:col-span-2">
                  <InputField label="Company Address" icon={<MapPin size={16} />} error={validationErrors.address}>
                    <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="compact-input" disabled={isSubmitting} />
                  </InputField>
                </div>

                <InputField label="Mobile Number" icon={<Phone size={16} />} error={validationErrors.mobile_number}>
                  <input 
                    type="text" 
                    maxLength="10"
                    value={formData.mobile_number} 
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, '') })} 
                    className="compact-input" 
                    placeholder="10 Digit Mobile"
                    disabled={isSubmitting}
                  />
                </InputField>

                <InputField label="Land Number" icon={<Phone size={16} />} error={validationErrors.land_number}>
                  <input 
                    type="text" 
                    maxLength="12"
                    value={formData.land_number} 
                    onChange={(e) => setFormData({ ...formData, land_number: e.target.value.replace(/\D/g, '') })} 
                    className="compact-input" 
                    placeholder="STD + Number (Max 12)"
                    disabled={isSubmitting}
                  />
                </InputField>

                <InputField label="Assigned Branch *" icon={<Building2 size={16} />} required error={validationErrors.branch_id}>
                  <select 
                    value={formData.branch_id} 
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })} 
                    disabled={userRole === 'admin' || isSubmitting}
                    required
                    className="compact-input appearance-none disabled:bg-slate-100 disabled:cursor-not-allowed font-bold"
                  >
                    <option value="">Choose Branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                  </select>
                </InputField>

                <InputField label="Status" icon={<CheckCircle2 size={16} />} error={validationErrors.is_active}>
                  <select value={formData.is_active ? 'true' : 'false'} onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })} className="compact-input appearance-none font-bold" disabled={isSubmitting}>
                    <option value="true">ACTIVE</option>
                    <option value="false">INACTIVE</option>
                  </select>
                </InputField>
              </form>
            </div>

            {/* Reduced Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowModal(false); resetForm(); }}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-slate-500 font-bold text-xs uppercase hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="consigneeForm"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-2.5 bg-green-600 hover:bg-slate-900 text-white rounded-xl transition-all font-black text-xs uppercase shadow-lg shadow-green-100 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {editingConsignee ? 'Update Record' : 'Save Record'}
                  </>
                )}
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Consignee?</h3>
              <p className="text-gray-500 mb-8 font-['Plus_Jakarta_Sans',_sans-serif]">
                Are you sure you want to delete <span className="font-bold text-gray-800 break-all">"{itemToDelete?.name}"</span>? This action cannot be undone.
              </p>
              
              <div className="flex w-full gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setItemToDelete(null)
                  }}
                  className="flex-1 px-4 py-3 text-gray-700 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-all active:scale-95 text-sm uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteConsignee}
                  className="flex-1 px-4 py-3 text-white font-bold bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all active:scale-95 text-sm uppercase tracking-wider"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .compact-input {
          width: 100%;
          padding: 0.6rem 0.75rem 0.6rem 2.5rem;
          background-color: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          border-radius: 0.75rem;
          font-size: 0.8rem;
          font-weight: 700;
          color: #0F172A;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .compact-input:focus {
          outline: none;
          background-color: white;
          border-color: #16A34A;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}} />
    </div>
  )
}

// Sub-component for form fields
const InputField = ({ label, icon, children, required, error }) => (
  <div className="space-y-2 group">
    <label className={`text-xs font-extrabold uppercase tracking-[0.15em] ml-1 transition-colors ${error ? 'text-rose-500' : 'text-slate-400 group-focus-within:text-green-600'}`}>
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative">
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${error ? 'text-rose-500' : 'text-slate-400 group-focus-within:text-green-600'}`}>
        {icon}
      </div>
      {React.cloneElement(children, {
        className: `${children.props.className} ${error ? '!border-rose-500 focus:!border-rose-500 !bg-rose-50' : ''}`
      })}
    </div>
    {error && (
      <p className="text-[10px] font-bold text-rose-500 ml-1 mt-1 animate-in slide-in-from-top-1">
        {error[0]}
      </p>
    )}
  </div>
)

export default ConsigneeMaster
