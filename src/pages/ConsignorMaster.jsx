import React, { useState, useEffect } from 'react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';
import {
  Plus, Edit2, Trash2, Search, X, Save,
  MapPin, Phone, Mail, Building2, User,
  CreditCard, Tag, FileText, CheckCircle2,
  AlertCircle, Hash, Globe, Navigation, Info, RotateCcw
} from 'lucide-react'

function ConsignorMaster() {
  const [consignors, setConsignors] = useState([])
  const [districts, setDistricts] = useState([])
  const [taluks, setTaluks] = useState([])
  const [destinations, setDestinations] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState('name')
  const [showModal, setShowModal] = useState(false)
  const [editingConsignor, setEditingConsignor] = useState(null)
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [userRole, setUserRole] = useState('admin')
  const [userBranchId, setUserBranchId] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    tin_number: '',
    gst_number: '',
    address: '',
    district_id: '',
    taluk_id: '',
    destination_id: '',
    pin_code: '',
    mobile_no: '',
    land_no: '',
    freight_account: '',
    service_tax: '',
    stationary_charges: '',
    remarks: '',
    branch_id: '',
    is_active: true
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const u = JSON.parse(userStr)
      setUserRole(u.role || 'admin')
      setUserBranchId(u.branch_id)
    }
    fetchDistricts()
    fetchBranches()
  }, [])

  useEffect(() => {
    fetchConsignors()
  }, [selectedBranchId])

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' })
    }, 5000)
  }

  const fetchDistricts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/districts`)
      const data = await response.json()
      if (data.success) setDistricts(data.data)
    } catch (err) {
      console.error('Error fetching districts:', err)
    }
  }

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches`)
      const data = await response.json()
      if (data.success) setBranches(data.data)
    } catch (err) {
      console.error('Error fetching branches:', err)
    }
  }

  useEffect(() => {
    const fetchTaluks = async () => {
      if (!formData.district_id) {
        setTaluks([])
        return
      }
      try {
        const response = await fetch(`${API_BASE_URL}/taluks/district/${formData.district_id}`)
        const data = await response.json()
        if (data.success) setTaluks(data.data)
      } catch (err) {
        console.error('Error fetching taluks:', err)
      }
    }
    fetchTaluks()
  }, [formData.district_id])

  useEffect(() => {
    const fetchDestinations = async () => {
      if (!formData.taluk_id) {
        setDestinations([])
        return
      }
      try {
        const response = await fetch(`${API_BASE_URL}/destinations/taluk/${formData.taluk_id}`)
        const data = await response.json()
        if (data.success) setDestinations(data.data)
      } catch (err) {
        console.error('Error fetching destinations:', err)
      }
    }
    fetchDestinations()
  }, [formData.taluk_id])

  const fetchConsignors = async () => {
    try {
      setLoading(true)
      const user = JSON.parse(localStorage.getItem('user'))
      let url = `${API_BASE_URL}/consignors`
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
        setConsignors(data.data)
      } else {
        showNotification('error', data.message || 'Failed to fetch')
      }
    } catch (err) {
      showNotification('error', 'Server connection failed')
    } finally {
      setLoading(false)
    }
  }

  const searchConsignors = async (query) => {
    if (!query.trim()) {
      fetchConsignors()
      return
    }
    try {
      setLoading(true)
      const user = JSON.parse(localStorage.getItem('user'))
      let url = `${API_BASE_URL}/consignors/search?q=${encodeURIComponent(query)}&type=${searchType}`
      
      if (user?.role === 'admin' && user?.branch_id) {
        url += `&branch_id=${user.branch_id}`
      } else if (user?.role === 'superadmin' && selectedBranchId) {
        url += `&branch_id=${selectedBranchId}`
      }

      const response = await fetch(url)
      const data = await response.json()
      if (data.success) setConsignors(data.data)
    } catch (err) {
      showNotification('error', 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => searchConsignors(searchTerm), 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchType, selectedBranchId])

  const saveConsignor = async (e) => {
    e.preventDefault()
    try {
      const url = editingConsignor ? `${API_BASE_URL}/consignors/${editingConsignor.id}` : `${API_BASE_URL}/consignors`
      const method = editingConsignor ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await response.json()
      if (data.success) {
        fetchConsignors()
        setShowModal(false)
        resetForm()
        showNotification('success', editingConsignor ? 'Updated successfully!' : 'Created successfully!')
      } else {
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ')
          showNotification('error', errorMessages)
        } else {
          showNotification('error', data.message || 'Save failed')
        }
      }
    } catch (err) {
      showNotification('error', 'Save operation failed')
    }
  }

  const handleDeleteClick = (consignor) => {
    setItemToDelete(consignor)
    setShowDeleteConfirm(true)
  }

  const deleteConsignor = async () => {
    if (!itemToDelete) return
    try {
      const response = await fetch(`${API_BASE_URL}/consignors/${itemToDelete.id}`, { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        fetchConsignors()
        showNotification('success', 'Deleted successfully!')
      }
    } catch (err) {
      showNotification('error', 'Delete failed')
    } finally {
      setShowDeleteConfirm(false)
      setItemToDelete(null)
    }
  }

  const editConsignor = (consignor) => {
    setEditingConsignor(consignor)
    setFormData({
      ...consignor,
      tin_number: consignor.tin_number || '',
      gst_number: consignor.gst_number || '',
      address: consignor.address || '',
      pin_code: consignor.pin_code || '',
      mobile_no: consignor.mobile_no || '',
      land_no: consignor.land_no || '',
      freight_account: consignor.freight_account || '',
      service_tax: consignor.service_tax || '',
      stationary_charges: consignor.stationary_charges || '',
      branch_id: consignor.branch_id || '',
      remarks: consignor.remarks || ''
    })
    setShowModal(true)
  }

  const resetForm = () => {
    const user = JSON.parse(localStorage.getItem('user'))
    setEditingConsignor(null)
    setFormData({
      name: '', code: '', tin_number: '', gst_number: '',
      address: '', district_id: '', taluk_id: '', destination_id: '',
      pin_code: '', mobile_no: '', land_no: '', freight_account: '',
      service_tax: '', stationary_charges: '', remarks: '', 
      branch_id: user?.role === 'admin' ? user?.branch_id : '',
      is_active: true
    })
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 font-['Plus_Jakarta_Sans',_sans-serif]">
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

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold text-[#1E293B] tracking-tight">Consignor Master</h1>
          <button 
            onClick={fetchConsignors}
            disabled={loading}
            className="p-1 px-1.5 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-all text-blue-600 disabled:opacity-50"
            title="Refresh Consignors"
          >
            <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all hover:scale-[1.02] active:scale-95 shadow-sm font-bold tracking-wide text-xs"
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Consignor
        </button>
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Filter Bar - Green Theme */}
        <div className="p-3 border-b border-green-300 bg-green-50">
          <div className="flex flex-col lg:flex-row gap-2">
            <div className="w-full lg:w-48">
              <div className="relative group">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" size={14} />
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-green-600 rounded-lg focus:outline-none appearance-none font-bold uppercase text-slate-700 transition-all cursor-pointer text-[10px]"
                >
                  <option value="name">Name</option>
                </select>
              </div>
            </div>
            
            {userRole === 'superadmin' && (
              <div className="w-full lg:w-48">
                <div className="relative group">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" size={14} />
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-green-600 rounded-lg focus:outline-none appearance-none font-bold uppercase text-slate-700 transition-all cursor-pointer text-[10px]"
                  >
                    <option value="">All Branches</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.branch_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Search values..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-green-600 font-medium transition-all text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-green-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-bold animate-pulse">Syncing Data...</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-green-100 border-b border-green-300">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Name</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">GSTIN</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Address</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">District</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Branch</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Mobile</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Freight</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-3 py-2 text-center font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consignors.length === 0 ? (
                  <tr>
                    <td colSpan="17" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <FileText size={64} className="text-slate-400" />
                        <p className="text-xl font-bold">No Consignors Found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  consignors.map((consignor) => (
                    <tr key={consignor.id} className="hover:bg-slate-50 transition-all duration-200 text-slate-600 border-b">
                      <td className="px-3 py-2 whitespace-nowrap font-bold text-slate-900">{consignor.name}</td>
                      <td className="px-3 py-2 whitespace-nowrap uppercase">{consignor.gst_number || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap truncate max-w-[120px]" title={consignor.address}>{consignor.address || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{consignor.district?.name || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-bold text-green-700">{consignor.branch?.branch_name || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono">{consignor.mobile_no || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${consignor.freight_account === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                          consignor.freight_account === 'ToPay' ? 'bg-rose-100 text-rose-700' :
                            consignor.freight_account === 'Account' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                          {consignor.freight_account || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black tracking-widest border ${consignor.is_active
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                          {consignor.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => editConsignor(consignor)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(consignor)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Compact Modal Design - Green Theme */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
            {/* Condensed Header */}
            <div className="px-6 py-4 bg-green-50 flex justify-between items-center border-b-2 border-green-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600 rounded-xl text-white">
                  {editingConsignor ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                  {editingConsignor ? 'Edit Record' : 'New Consignor'}
                </h2>
              </div>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Compact Form Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <form onSubmit={saveConsignor} id="consignorForm" className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <InputField label="Consignor Name *" icon={<User size={16} />} required>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="compact-input" placeholder="Enter Full Name" />
                </InputField>



                <InputField label="TIN Number" icon={<Hash size={16} />}>
                  <input
                    type="text"
                    maxLength="11"
                    value={formData.tin_number}
                    onChange={(e) => setFormData({ ...formData, tin_number: e.target.value })}
                    className="compact-input"
                    placeholder="11 Digit TIN"
                  />
                </InputField>

                <InputField label="GST Number" icon={<FileText size={16} />}>
                  <input
                    type="text"
                    maxLength="15"
                    value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                    className="compact-input"
                    placeholder="15 Digit GSTIN"
                  />
                </InputField>

                <div className="col-span-1 md:col-span-2">
                  <InputField label="Company Address" icon={<MapPin size={16} />}>
                    <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="compact-input" />
                  </InputField>
                </div>

                <InputField label="District" icon={<Globe size={16} />}>
                  <select value={formData.district_id} onChange={(e) => setFormData({ ...formData, district_id: e.target.value, taluk_id: '', destination_id: '' })} className="compact-input appearance-none">
                    <option value="">Choose District</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </InputField>

                <InputField label="Taluk" icon={<Navigation size={16} />}>
                  <select value={formData.taluk_id} onChange={(e) => setFormData({ ...formData, taluk_id: e.target.value, destination_id: '' })} className="compact-input appearance-none">
                    <option value="">Choose Taluk</option>
                    {taluks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </InputField>

                <InputField label="Destination" icon={<MapPin size={16} />}>
                  <select value={formData.destination_id} onChange={(e) => setFormData({ ...formData, destination_id: e.target.value })} className="compact-input appearance-none">
                    <option value="">Choose Destination</option>
                    {destinations.map(dest => <option key={dest.id} value={dest.id}>{dest.city_name}</option>)}
                  </select>
                </InputField>

                <InputField label="Assigned Branch *" icon={<Building2 size={16} />} required>
                  <select 
                    value={formData.branch_id} 
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })} 
                    disabled={userRole === 'admin'}
                    required
                    className="compact-input appearance-none disabled:bg-slate-100 disabled:cursor-not-allowed font-bold"
                  >
                    <option value="">Choose Branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                  </select>
                </InputField>

                <InputField label="PIN Code" icon={<MapPin size={16} />}>
                  <input type="text" value={formData.pin_code} onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })} className="compact-input" />
                </InputField>

                <InputField label="Mobile No" icon={<Phone size={16} />}>
                  <input
                    type="text"
                    maxLength="10"
                    value={formData.mobile_no}
                    onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value.replace(/\D/g, '') })}
                    className="compact-input"
                    placeholder="10 Digit Mobile"
                  />
                </InputField>

                <InputField label="Landline No" icon={<Phone size={16} />}>
                  <input
                    type="text"
                    maxLength="12"
                    value={formData.land_no}
                    onChange={(e) => setFormData({ ...formData, land_no: e.target.value.replace(/\D/g, '') })}
                    className="compact-input"
                    placeholder="STD + Number (Max 12)"
                  />
                </InputField>

                <InputField label="Freight Account" icon={<CreditCard size={16} />}>
                  <select value={formData.freight_account} onChange={(e) => setFormData({ ...formData, freight_account: e.target.value })} className="compact-input appearance-none">
                    <option value="">Select Account</option>
                    <option value="Paid">PAID</option>
                    <option value="ToPay">TOPAY</option>
                    <option value="Account">ACCOUNT</option>
                  </select>
                </InputField>

                <InputField label="Service Tax ID" icon={<FileText size={16} />}>
                  <input type="text" value={formData.service_tax} onChange={(e) => setFormData({ ...formData, service_tax: e.target.value })} className="compact-input" />
                </InputField>

                <InputField label="Stationary Charges" icon={<Hash size={16} />}>
                  <input type="number" step="0.01" value={formData.stationary_charges} onChange={(e) => setFormData({ ...formData, stationary_charges: e.target.value })} className="compact-input" />
                </InputField>

                <InputField label="Status" icon={<CheckCircle2 size={16} />}>
                  <select value={formData.is_active ? 'true' : 'false'} onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })} className="compact-input appearance-none font-bold">
                    <option value="true">ACTIVE</option>
                    <option value="false">INACTIVE</option>
                  </select>
                </InputField>

                <div className="col-span-1 md:col-span-2">
                  <InputField label="Internal Remarks" icon={<Info size={16} />}>
                    <input type="text" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} className="compact-input" />
                  </InputField>
                </div>
              </form>
            </div>

            {/* Reduced Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-6 py-2.5 text-slate-500 font-bold text-xs uppercase hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="consignorForm"
                className="flex items-center gap-2 px-8 py-2.5 bg-green-600 hover:bg-slate-900 text-white rounded-xl transition-all font-black text-xs uppercase shadow-lg shadow-green-100"
              >
                <Save size={18} />
                {editingConsignor ? 'Update Record' : 'Save Record'}
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Consignor?</h3>
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
                  onClick={deleteConsignor}
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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
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
const InputField = ({ label, icon, children, required }) => (
  <div className="space-y-2 group">
    <label className="text-xs font-extrabold text-slate-400 uppercase tracking-[0.15em] ml-1 transition-colors group-focus-within:text-green-600">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors pointer-events-none">
        {icon}
      </div>
      {children}
    </div>
  </div>
)

export default ConsignorMaster
