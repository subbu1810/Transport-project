import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save, User, Tag, FileText, CreditCard, CheckCircle2, AlertCircle, Info, Hash, DollarSign, ChevronRight, Building2, LayoutGrid } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function RateDetails() {
  const [rates, setRates] = useState([])
  const [consignors, setConsignors] = useState([])
  const [articleTypes, setArticleTypes] = useState([])
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [consignorSearch, setConsignorSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [editingRate, setEditingRate] = useState(null)
  const [rateToDelete, setRateToDelete] = useState(null)
  const [selectedConsignorId, setSelectedConsignorId] = useState(null)

  const [formData, setFormData] = useState({
    consignor_id: '',
    destination_id: '',
    article_type: '',
    freight_charges: '',
    handling_charges: '',
    dd_charges: '',
    is_active: true
  })

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' })
    }, 5000)
  }

  // Fetch all rates
  const fetchRates = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/rates`)
      const data = await response.json()
      if (data.success) {
        setRates(data.data)
        setError('')
      }
    } catch (err) {
      console.error('Error fetching rates:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch lookups
  const fetchLookups = async () => {
    try {
      const [cRes, aRes, dRes] = await Promise.all([
        fetch(`${API_BASE_URL}/consignors`),
        fetch(`${API_BASE_URL}/lookups`),
        fetch(`${API_BASE_URL}/destinations`)
      ])

      const [cData, aData, dData] = await Promise.all([
        cRes.json(), aRes.json(), dRes.json()
      ])

      if (cData.success) setConsignors(cData.data)
      if (aData.success) setArticleTypes(aData.data.filter(l => l.type === 'ARTICLE_TYPE' && l.is_active))
      if (dData.success) setDestinations(dData.data)

      // Select first consignor by default if none selected
      if (cData.data.length > 0 && !selectedConsignorId) {
        setSelectedConsignorId(cData.data[0].id)
      }
    } catch (err) {
      console.error('Error fetching lookups:', err)
    }
  }

  useEffect(() => {
    fetchRates()
    fetchLookups()
  }, [])

  // Filtered Data
  const filteredConsignors = useMemo(() => {
    return consignors.filter(c =>
      c.name.toLowerCase().includes(consignorSearch.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(consignorSearch.toLowerCase()))
    )
  }, [consignors, consignorSearch])

  const selectedConsignor = useMemo(() =>
    consignors.find(c => c.id === selectedConsignorId),
    [consignors, selectedConsignorId]
  )

  const activeRates = useMemo(() => {
    return rates.filter(r => {
      const r_consignor_id = r.consignor_id || r.consignorId || r.consignor?.id;
      return Number(r_consignor_id) === Number(selectedConsignorId) && (
        (r.article_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.destination?.city_name || r.destination?.branch_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
  }, [rates, selectedConsignorId, searchTerm])

  // Save rate
  const saveRate = async (e) => {
    e.preventDefault()
    try {
      const url = editingRate ? `${API_BASE_URL}/rates/${editingRate.id}` : `${API_BASE_URL}/rates`
      const method = editingRate ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await response.json()
      if (data.success) {
        fetchRates()
        setShowModal(false)
        resetForm()
        showNotification('success', editingRate ? 'Pricing configuration updated successfully!' : 'New rate created successfully!')
      } else {
        let errorMsg = 'Operation failed'
        
        if (data.errors) {
          errorMsg = Object.values(data.errors).flat().join(', ')
        } else if (data.message) {
          // Sanitize raw SQL/Technical errors
          if (data.message.includes('Duplicate entry') || data.message.includes('1062')) {
            errorMsg = 'This rate is already configured for the selected destination and article type.'
          } else if (data.message.includes('Integrity constraint violation')) {
            errorMsg = 'Cannot save: This configuration conflicts with an existing entry.'
          } else {
            errorMsg = data.message
          }
        }
        
        showNotification('error', errorMsg)
      }
    } catch (err) {
      showNotification('error', 'Connection error. Please check your internet.')
    }
  }

  // Initiate delete
  const confirmDelete = (rate) => {
    setRateToDelete(rate)
    setShowDeleteModal(true)
  }

  // Execute delete
  const deleteRate = async () => {
    if (!rateToDelete) return
    try {
      const response = await fetch(`${API_BASE_URL}/rates/${rateToDelete.id}`, { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        fetchRates()
        showNotification('success', 'Rate removed from registry')
        setShowDeleteModal(false)
        setRateToDelete(null)
      } else {
        showNotification('error', data.message || 'Unable to delete rate')
      }
    } catch (err) {
      showNotification('error', 'Network error. Delete failed.')
    }
  }

  const editRate = (rate) => {
    setEditingRate(rate)
    setFormData({
      consignor_id: rate.consignor_id,
      destination_id: rate.destination_id,
      article_type: rate.article_type,
      freight_charges: rate.freight_charges,
      handling_charges: rate.handling_charges,
      dd_charges: rate.dd_charges,
      is_active: rate.is_active
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingRate(null)
    setFormData({
      consignor_id: selectedConsignorId || '',
      destination_id: '',
      article_type: '',
      freight_charges: '0',
      handling_charges: '',
      dd_charges: '',
      is_active: true
    })
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-['Inter',_sans-serif] antialiased overflow-hidden">
      {/* Sidebar - Consignor List */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-xl z-20">
        <div className="p-6 bg-green-600 text-white">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Building2 size={20} />
            </div>
            <h1 className="text-lg font-black uppercase tracking-tighter">Consignors</h1>
          </div>
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Total Registry</span>
            <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-black">{rates.length} Rates</span>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white" size={16} />
            <input
              type="text"
              placeholder="Search customers..."
              value={consignorSearch}
              onChange={(e) => setConsignorSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:bg-white/20 text-sm placeholder:text-white/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredConsignors.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedConsignorId(c.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${selectedConsignorId === c.id
                ? 'bg-green-50 text-green-700 shadow-sm border border-green-100'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <div className="text-left">
                <p className={`font-bold text-sm ${selectedConsignorId === c.id ? 'text-green-800' : 'text-slate-900 group-hover:text-green-600'}`}>
                  {c.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">
                    {c.code || 'NO CODE'}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {rates.filter(r => Number(r.consignor_id || r.consignorId || r.consignor?.id) === Number(c.id)).length} Rates
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className={`pointer-events-none ${selectedConsignorId === c.id ? 'opacity-100 text-green-600' : 'opacity-0'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              {selectedConsignor ? selectedConsignor.name : 'Select a Consignor'}
              <button 
                onClick={() => setShowHelpModal(true)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all"
                title="Rate Info"
              >
                <Info size={18} />
              </button>
            </h2>
            <p className="text-slate-500 text-xs font-medium">Rate Management</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all hover:shadow-lg shadow-indigo-200 font-bold text-sm"
          >
            <Plus size={18} strokeWidth={2.5} />
            Add New Rate
          </button>
        </header>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard label="Total Rates" value={activeRates.length} icon={<FileText size={16} />} color="bg-blue-500" />
            <StatCard label="Active Status" value={activeRates.filter(r => r.is_active).length} icon={<CheckCircle2 size={16} />} color="bg-emerald-500" />
            <StatCard label="Locations" value={new Set(activeRates.map(r => r.destination_id)).size} icon={<Tag size={16} />} color="bg-amber-500" />
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="relative group max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600" size={18} />
                <input
                  type="text"
                  placeholder="Filter rates by location or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-green-600 text-sm font-semibold shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <LayoutGrid size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Rate Table</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Destination</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Article Type</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-tight text-indigo-600">Freight</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Handling</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-tight">DD Charges</th>
                    <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Status</th>
                    <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeRates.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-20">
                          <FileText size={64} />
                          <p className="text-xl font-black uppercase tracking-tighter">No Rates found for this consignor</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    activeRates.map(rate => (
                      <tr key={rate.id} className="hover:bg-green-50/30 transition-colors group">
                        <td className="px-4 py-2 font-semibold text-slate-700">
                          {rate.destination?.city_name || rate.destination?.branch_name || <span className="text-slate-300 font-normal">Not Assigned</span>}
                        </td>
                        <td className="px-4 py-2">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200">
                            {rate.article_type}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-black text-indigo-600 font-mono text-xs">₹{parseFloat(rate.freight_charges).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-mono text-slate-500 font-semibold text-xs">₹{parseFloat(rate.handling_charges).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-mono text-slate-500 font-semibold text-xs">₹{parseFloat(rate.dd_charges).toFixed(2)}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${rate.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                            {rate.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => editRate(rate)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => confirmDelete(rate)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification.show && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md animate-in slide-in-from-bottom duration-300 ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          }`}>
          {notification.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <p className="font-black uppercase tracking-tight">{notification.message}</p>
          <button onClick={() => setNotification({ ...notification, show: false })} className="ml-4 opacity-70 hover:opacity-100">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Modal - Master Entry */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-white/20">
            <div className="px-10 py-8 bg-green-50 flex justify-between items-center border-b border-green-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-600 rounded-2xl text-white shadow-lg shadow-green-200">
                  {editingRate ? <Edit2 size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 leading-none">
                    {editingRate ? 'Modify Rate' : 'New Rate'}
                  </h3>
                  <p className="text-green-600 text-[10px] font-bold uppercase mt-1 tracking-tight">Configuration</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 text-slate-400 hover:bg-slate-100 rounded-2xl transition-all">
                <X size={28} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
              <form onSubmit={saveRate} id="rateForm" className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-1 md:col-span-2 space-y-8">
                  <InputField label="Assigned Consignor" icon={<User size={18} />}>
                    <select
                      required
                      value={formData.consignor_id}
                      onChange={e => setFormData({ ...formData, consignor_id: e.target.value })}
                      className="compact-input bg-slate-50"
                    >
                      <option value="">Select Target Customer</option>
                      {consignors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </InputField>
                </div>

                <InputField label="Destination" icon={<Building2 size={16} />}>
                  <select
                    required
                    value={formData.destination_id}
                    onChange={e => setFormData({ ...formData, destination_id: e.target.value })}
                    className="compact-input"
                  >
                    <option value="">Destination</option>
                    {destinations.map(d => <option key={d.id} value={d.id}>{d.city_name || d.branch_name}</option>)}
                  </select>
                </InputField>

                <InputField label="Article" icon={<Tag size={16} />}>
                  <select
                    required
                    value={formData.article_type}
                    onChange={e => {
                      const val = e.target.value;
                      const lookup = articleTypes.find(l => l.code === val);
                      setFormData({ ...formData, article_type: val, freight_charges: lookup ? lookup.value : formData.freight_charges });
                    }}
                    className="compact-input"
                  >
                    <option value="">Type</option>
                    {articleTypes.map(t => <option key={t.id} value={t.code}>{t.code}</option>)}
                  </select>
                </InputField>
                
                <div className="col-span-2">
                  <InputField label="Freight Rate (Default)" icon={<DollarSign size={16} />}>
                    <input
                      type="number" step="0.01" required
                      value={formData.freight_charges}
                      onChange={e => setFormData({ ...formData, freight_charges: e.target.value })}
                      className="compact-input font-bold text-indigo-600 bg-indigo-50/30"
                      placeholder="0.00"
                    />
                  </InputField>
                </div>

                <div className="grid grid-cols-2 col-span-2 gap-6">
                  <InputField label="Handling" icon={<Hash size={16} />}>
                    <input
                      type="number" step="0.01" required
                      value={formData.handling_charges}
                      onChange={e => setFormData({ ...formData, handling_charges: e.target.value })}
                      className="compact-input font-mono font-bold"
                    />
                  </InputField>

                  <InputField label="Door Delivery" icon={<CreditCard size={16} />}>
                    <input
                      type="number" step="0.01" required
                      value={formData.dd_charges}
                      onChange={e => setFormData({ ...formData, dd_charges: e.target.value })}
                      className="compact-input font-mono font-bold"
                    />
                  </InputField>
                </div>

                <InputField label="Status" icon={<CheckCircle2 size={16} />}>
                  <select
                    value={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    className="compact-input font-black text-emerald-600"
                  >
                    <option value="true">ACTIVE</option>
                    <option value="false">INACTIVE</option>
                  </select>
                </InputField>
              </form>
            </div>

            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button onClick={() => setShowModal(false)} className="px-8 py-3 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-200 rounded-2xl transition-all">
                Cancel
              </button>
              <button
                type="submit"
                form="rateForm"
                className="px-10 py-3 bg-slate-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-slate-200 hover:bg-green-600 hover:scale-[1.05] transition-all"
              >
                {editingRate ? 'Update Rate' : 'Commit Rate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Confirm Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in zoom-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-rose-100">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase mb-2">Confirm Delete</h3>
              <p className="text-slate-500 font-bold text-sm leading-relaxed px-6">
                This will permanently remove the rate for <span className="text-slate-900 underline decoration-rose-200 decoration-2">{rateToDelete?.article_type}</span>. This action cannot be undone.
              </p>
            </div>
            <div className="p-6 bg-slate-50 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-slate-100 transition-all"
              >
                Nevermind
              </button>
              <button
                onClick={deleteRate}
                className="flex-1 px-6 py-3 bg-rose-500 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-rose-100 hover:bg-rose-600 hover:scale-[1.05] transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Information Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[120] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col border border-white/20">
            <div className="px-10 py-8 bg-blue-50 flex justify-between items-center border-b border-blue-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                  <Info size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">Rate System Guide</h3>
                  <p className="text-blue-600 text-xs font-black uppercase tracking-widest mt-1">Understanding Pricing Models</p>
                </div>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="p-3 text-slate-400 hover:bg-slate-100 rounded-2xl transition-all">
                <X size={28} />
              </button>
            </div>

            <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar max-h-[70vh]">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <DollarSign size={14} className="text-green-600" /> Freight Charges (Base)
                </h4>
                <p className="text-slate-600 text-sm font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  The core price for transporting goods between the origin and destination. This is typically calculated based on distance, quantity, and market standards for specific routes.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Hash size={14} className="text-blue-600" /> Handling Fee
                </h4>
                <p className="text-slate-600 text-sm font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  Charges associated with the physical loading, unloading, and management of articles at transit points. Includes labor costs and equipment maintenance.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <CreditCard size={14} className="text-amber-600" /> Door Delivery (DD)
                </h4>
                <p className="text-slate-600 text-sm font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  Surcharge for delivering goods directly to the consignee's doorstep instead of the warehouse. This covers last-mile logistics and additional fuel/time.
                </p>
              </div>

              <div className="p-6 bg-green-50 rounded-[2rem] border border-green-100">
                <div className="flex gap-4">
                  <AlertCircle className="text-green-600 shrink-0" size={24} />
                  <div>
                    <h5 className="font-bold text-green-900 text-sm tracking-tight">Pro Tip</h5>
                    <p className="text-xs text-green-700 font-medium mt-1 leading-relaxed">
                      Rates can be specific to each Consignor. When you create a Waybill, the system automatically pulls these predefined rates to save time and ensure billing accuracy.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowHelpModal(false)}
                className="px-10 py-3 bg-slate-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-slate-200 hover:bg-blue-600 hover:scale-[1.05] transition-all"
              >
                Got it, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed bottom-8 right-8 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl z-[200] animate-in slide-in-from-bottom-10 duration-300 border ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'
          }`}>
          <div className={`p-2 rounded-xl ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}>
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          </div>
          <p className="font-bold text-sm tracking-tight">{notification.message}</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .compact-input {
          width: 100%;
          padding: 0.65rem 0.75rem 0.65rem 2.75rem;
          background-color: white;
          border: 1.5px solid #E2E8F0;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #1E293B;
          transition: all 0.2s ease;
          -webkit-font-smoothing: antialiased;
        }
        .compact-input:focus {
          outline: none;
          border-color: #16A34A;
          box-shadow: 0 10px 15px -3px rgba(22, 163, 74, 0.1);
          background-color: white;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
      `}} />
    </div>
  )
}

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
    <div className={`p-2.5 rounded-xl text-white shadow-lg ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight leading-none mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-800 leading-none">{value}</p>
    </div>
  </div>
)

const InputField = ({ label, icon, children }) => (
  <div className="space-y-1.5 group">
    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 block group-focus-within:text-indigo-600 transition-colors tracking-tight">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors pointer-events-none z-10">
        {icon}
      </div>
      {children}
    </div>
  </div>
)

export default RateDetails
