import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save, Info, CheckCircle, AlertCircle, ShieldAlert, ShieldCheck, UserCog, Search as SearchIcon } from 'lucide-react'
import { API_BASE_URL } from '../config/api';

function RoleDetails() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  })

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' })
    }, 5000)
  }

  // Fetch all roles
  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/roles`)
      const data = await response.json()
      
      if (data.success) {
        setRoles(data.data)
      } else {
        showNotification('error', data.message || 'Failed to fetch roles')
      }
    } catch (err) {
      showNotification('error', 'Failed to connect to server. Please check your backend.')
      console.error('Error fetching roles:', err)
    } finally {
      setLoading(false)
    }
  }

  // Search roles
  const searchRoles = async (query) => {
    if (!query.trim()) {
      fetchRoles()
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/roles/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        setRoles(data.data)
        showNotification('info', `Found ${data.data.length} matches`)
      } else {
        showNotification('error', data.message || 'Search failed')
      }
    } catch (err) {
      showNotification('error', 'Failed to search roles')
      console.error('Error searching roles:', err)
    } finally {
      setLoading(false)
    }
  }

  // Save role
  const saveRole = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingRole 
        ? `${API_BASE_URL}/roles/${editingRole.id}`
        : `${API_BASE_URL}/roles`
      
      const method = editingRole ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchRoles()
        setShowModal(false)
        resetForm()
        showNotification('success', editingRole ? 'Role updated!' : 'Role created!')
      } else {
        const errorMsg = data.errors ? Object.values(data.errors).flat().join(', ') : data.message
        showNotification('error', errorMsg || 'Failed to save')
      }
    } catch (err) {
      showNotification('error', 'Critical error during save')
      console.error('Error saving role:', err)
    }
  }

  // Delete role
  const deleteRole = async (id) => {
    if (!window.confirm('Delete this role? This might affect users assigned to it.')) return

    try {
      const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchRoles()
        showNotification('success', 'Role deleted!')
      } else {
        showNotification('error', data.message || 'Action restricted')
      }
    } catch (err) {
      showNotification('error', 'Failed to delete')
    }
  }

  const editRole = (role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      description: role.description || '',
      is_active: role.is_active
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', is_active: true })
    setEditingRole(null)
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => searchRoles(searchTerm), 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  useEffect(() => {
    fetchRoles()
  }, [])

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Premium Notification Popup */}
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
              {notification.type === 'success' && <CheckCircle className="text-green-600" size={20} />}
              {notification.type === 'error' && <AlertCircle className="text-red-600" size={20} />}
              {notification.type === 'info' && <SearchIcon className="text-blue-600" size={20} />}
            </div>
            <div className="flex-1">
              <h4 className={`text-sm font-bold uppercase tracking-wider ${
                notification.type === 'success' ? 'text-green-800' :
                notification.type === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {notification.type === 'success' ? 'Success' : notification.type === 'error' ? 'Warning' : 'Info'}
              </h4>
              <p className="text-xs font-semibold text-gray-600 mt-0.5">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification({ show: false, type: '', message: '' })}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modern Header Section */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <UserCog size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Role Management</h1>
              <button 
                onClick={() => setShowHelp(true)}
                className="p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-all shadow-sm border border-blue-100 group"
                title="View Role Definitions"
              >
                <Info size={14} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Define & Control Access Levels</p>
          </div>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-green-100 font-bold text-xs uppercase"
        >
          <Plus size={18} />
          New Role
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search & Statistics Area */}
        <div className="p-3 border-b border-gray-50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Filter roles by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-bold text-xs text-slate-700"
            />
          </div>
          <div className="hidden md:flex gap-4">
            <div className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-100">
              Active: {roles.filter(r => r.is_active).length}
            </div>
            <div className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-100">
              Inactive: {roles.filter(r => !r.is_active).length}
            </div>
          </div>
        </div>

        {/* Compact Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8fafc] border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Role Name</th>
                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                   <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hydrating Roles...</p>
                    </div>
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-slate-400 font-bold italic text-sm">No role records found.</td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="hover:bg-green-50/50 transition duration-200">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${role.name.toLowerCase().includes('admin') ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                           {role.name[0]}
                         </div>
                         <span className="font-bold text-slate-700 text-sm tracking-tight">{role.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500 font-semibold italic min-w-[200px]">
                      {role.description || <span className="text-slate-300">No details provided</span>}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${
                        role.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {role.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button onClick={() => editRole(role)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-all"><Edit2 size={14}/></button>
                        <button onClick={() => deleteRole(role.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-all"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Modal - Role Definitions */}
      {showHelp && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-blue-100">
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-blue-700 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg"><Info size={24} /></div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">System Roles Guide</h2>
                  <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Defining Access & Responsibilities</p>
                </div>
              </div>
              <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-widest">
                       <ShieldAlert size={18} /> Super Admin
                    </div>
                    <p className="text-xs text-indigo-800 leading-relaxed font-semibold">
                      Full system access. Can manage branches, global settings, users, and audit logs. Usually reserved for owners or system providers.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-blue-700 font-black text-xs uppercase tracking-widest">
                       <ShieldCheck size={18} /> Admin
                    </div>
                    <p className="text-xs text-blue-800 leading-relaxed font-semibold">
                      Branch-wide control. Can manage all masters (Vehicle, Driver, Consignor), verify trip sheets, and view all financial reports.
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-emerald-700 font-black text-xs uppercase tracking-widest">
                       <CheckCircle size={18} /> Booking Clerk
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed font-semibold">
                      Focused on operations. Responsible for GC Entry, Manifest creation, Waybill details, and real-time tracking of shipments.
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-orange-700 font-black text-xs uppercase tracking-widest">
                       <Info size={18} /> Accountant
                    </div>
                    <p className="text-xs text-orange-800 leading-relaxed font-semibold">
                      Financial monitoring. Manages the Cash Book, receives payments from consignors, and generates balance sheets or P&L reports.
                    </p>
                  </div>
               </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button onClick={() => setShowHelp(false)} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-900 transition-all shadow-lg active:scale-95 uppercase text-xs tracking-widest">Got It!</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col border border-slate-200">
            <div className={`px-6 py-4 flex justify-between items-center border-b-2 ${editingRole ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
               <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-xl text-white ${editingRole ? 'bg-blue-600' : 'bg-green-600'}`}>
                   {editingRole ? <Edit2 size={18} /> : <Plus size={18} />}
                 </div>
                 <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">
                   {editingRole ? 'Edit Access Role' : 'New Security Role'}
                 </h2>
               </div>
               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24}/></button>
            </div>

            <form onSubmit={saveRole} className="p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Identifier *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SYSTEM_ADMIN"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-2 mt-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-bold text-sm text-slate-700"
                    disabled={!!editingRole}
                  />
               </div>

               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Domain Description</label>
                  <textarea
                    rows="3"
                    placeholder="Explain the permissions for this role..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 mt-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all font-semibold text-sm text-slate-600 resize-none italic"
                  />
               </div>

               <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="is_active" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Authorize Role Status</label>
               </div>

               <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 text-slate-500 font-bold text-xs uppercase hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
                  <button type="submit" className={`flex-1 flex items-center justify-center gap-2 py-2 text-white font-black rounded-xl shadow-lg transition transform active:scale-95 text-xs uppercase ${editingRole ? 'bg-blue-600 hover:bg-slate-900 shadow-blue-100' : 'bg-green-600 hover:bg-slate-900 shadow-green-100'}`}>
                     <Save size={16} /> {editingRole ? 'Confirm Update' : 'Initialize Role'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}} />
    </div>
  )
}

export default RoleDetails
