import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Save, Info, CheckCircle, AlertCircle, Search as SearchIcon, UserPlus, MapPin, Phone, UserCheck, Shield, Key, Eye, EyeOff } from 'lucide-react'
import { API_BASE_URL } from '../config/api';

function UserDetails() {
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [roles, setRoles] = useState([])
  const [consignors, setConsignors] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    branch_id: '',
    role: '',
    is_active: true,
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    consignor_id: ''
  })

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' })
    }, 5000)
  }

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/users`)
      const data = await response.json()
      if (data.success) {
        setUsers(data.data)
      } else {
        showNotification('error', data.message || 'Failed to fetch users')
      }
    } catch (err) {
      showNotification('error', 'Server connection failed')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch branches for dropdown
  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches`)
      const data = await response.json()
      if (data.success) setBranches(data.data)
    } catch (err) {
      console.error('Error fetching branches:', err)
    }
  }

  // Fetch roles for dropdown
  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/roles`)
      const data = await response.json()
      if (data.success) setRoles(data.data)
    } catch (err) {
      console.error('Error fetching roles:', err)
    }
  }
  
  // Fetch consignors for dropdown
  const fetchConsignors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/consignors`)
      const data = await response.json()
      if (data.success) setConsignors(data.data)
    } catch (err) {
      console.error('Error fetching consignors:', err)
    }
  }

  // Search users
  const searchUsers = async (query) => {
    if (!query.trim()) {
      fetchUsers()
      return
    }
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (data.success) {
        setUsers(data.data)
      } else {
        showNotification('error', 'Search failed')
      }
    } catch (err) {
      showNotification('error', 'Search request failed')
    } finally {
      setLoading(false)
    }
  }

  // Save user
  const saveUser = async (e) => {
    e.preventDefault()
    try {
      const url = editingUser ? `${API_BASE_URL}/users/${editingUser.id}` : `${API_BASE_URL}/users`
      const method = editingUser ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: formData.role.toLowerCase() })
      })
      const data = await response.json()
      if (data.success) {
        fetchUsers()
        setShowModal(false)
        resetForm()
        showNotification('success', editingUser ? 'Credential updated!' : 'Identity created!')
      } else {
        const msg = data.errors ? Object.values(data.errors).flat().join(', ') : data.message
        showNotification('error', msg || 'Save failed')
      }
    } catch (err) {
      showNotification('error', 'Critical save error')
    }
  }

  // Delete user
  const deleteUser = async (id) => {
    if (!window.confirm('Erase this user record entirely?')) return
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        fetchUsers()
        showNotification('success', 'User purged!')
      } else {
        showNotification('error', 'Action denied')
      }
    } catch (err) {
      showNotification('error', 'Delete failed')
    }
  }

  const editUser = (user) => {
    setEditingUser(user)
    setFormData({
      username: user.username || user.name || '',
      email: user.email || '',
      password: '',
      full_name: user.full_name || '',
      branch_id: user.branch_id || '',
      role: user.role || '',
      is_active: user.is_active,
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      pincode: user.pincode || '',
      consignor_id: user.consignor_id || ''
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      username: '', email: '', password: '', full_name: '', branch_id: '',
      role: '', is_active: true, phone: '', address: '', city: '', state: '', pincode: '',
      consignor_id: ''
    })
    setEditingUser(null)
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => searchUsers(searchTerm), 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  useEffect(() => {
    fetchUsers()
    fetchBranches()
    fetchRoles()
    fetchConsignors()
  }, [])

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Premium Notification Popup */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-[100] max-w-sm w-full bg-white rounded-2xl shadow-2xl border-l-4 overflow-hidden transform transition-all duration-500 animate-in slide-in-from-right-10 ${
          notification.type === 'success' ? 'border-green-500' : notification.type === 'error' ? 'border-red-500' : 'border-blue-500'
        }`}>
          <div className="p-4 flex items-center gap-4">
            <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-green-50' : notification.type === 'error' ? 'bg-red-50' : 'bg-blue-50'}`}>
              {notification.type === 'success' && <CheckCircle className="text-green-600" size={20} />}
              {notification.type === 'error' && <AlertCircle className="text-red-600" size={20} />}
              {notification.type === 'info' && <SearchIcon className="text-blue-600" size={20} />}
            </div>
            <div className="flex-1">
              <h4 className={`text-sm font-bold uppercase tracking-wider ${notification.type === 'success' ? 'text-green-800' : notification.type === 'error' ? 'text-red-800' : 'text-blue-800'}`}>
                {notification.type === 'success' ? 'Identity Sync' : 'System Notice'}
              </h4>
              <p className="text-xs font-semibold text-gray-600 mt-0.5">{notification.message}</p>
            </div>
            <button onClick={() => setNotification({ show: false, type: '', message: '' })} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Modern Header Section */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <UserCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">User Directory</h1>
              <button 
                onClick={() => setShowHelp(true)}
                className="p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-all shadow-sm border border-blue-100"
              >
                <Info size={14} />
              </button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Manage Credentials & Authentication</p>
          </div>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-blue-100 font-bold text-xs uppercase"
        >
          <UserPlus size={18} />
          Access User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search & Statistics Area */}
        <div className="p-3 border-b border-gray-50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, email or login..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-bold text-xs text-slate-700"
            />
          </div>
          <div className="hidden md:flex gap-4">
             <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-blue-500"></span>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total: {users.length}</span>
             </div>
          </div>
        </div>

        {/* Compact Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8fafc] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Identify</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Login Info</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignment</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Secret</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                   <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Retrieving Personas...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-slate-400 font-bold italic text-sm">No user identity found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-blue-50/50 transition duration-200 group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-black text-[10px] uppercase">
                           {(user.full_name || user.username).substring(0, 2)}
                         </div>
                         <div>
                           <p className="font-bold text-slate-800 text-xs tracking-tight">{user.full_name || user.username}</p>
                           <p className="text-[10px] text-slate-400 font-semibold">{user.email}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                       <p className="text-xs font-black text-indigo-600 tracking-tight uppercase">{user.username}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-bold">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-300" />
                          {user.branch?.branch_name || <span className="text-slate-300">Undef</span>}
                        </div>
                        {user.role?.toLowerCase() === 'consignor' && user.consignor && (
                          <div className="flex items-center gap-1 mt-1">
                            <Shield size={10} className="text-indigo-400" />
                            <span className="text-[10px] text-indigo-600 font-black">{user.consignor.consignor_name}</span>
                          </div>
                        )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black tracking-widest uppercase border border-indigo-100">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                       <PasswordDisplay value={user.password} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${
                        user.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {user.is_active ? 'Active' : 'Locked'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => editUser(user)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-all"><Edit2 size={14}/></button>
                        <button onClick={() => deleteUser(user.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-all"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-blue-100">
            <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex justify-between items-center text-sm">
              <div className="flex items-center gap-3">
                <Shield size={24} />
                <h2 className="text-lg font-black tracking-tight uppercase">User Access Policy</h2>
              </div>
              <button onClick={() => setShowHelp(false)} className="hover:rotate-90 transition-transform"><X size={24} /></button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-6">
               <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <h4 className="flex items-center gap-2 text-blue-700 font-black text-xs uppercase tracking-widest mb-3"><Key size={16}/> Essential Credentials</h4>
                  <ul className="space-y-2 text-xs text-blue-800 font-semibold leading-relaxed">
                    <li>• <span className="font-black underline tracking-wide">Login Username:</span> Permanent identifier used for system entry. Cannot be changed once set.</li>
                    <li>• <span className="font-black underline tracking-wide">Branch Assignment:</span> Limits the user visibility to a specific office's data.</li>
                    <li>• <span className="font-black underline tracking-wide">Privilege Role:</span> Controls available menus and action permissions.</li>
                  </ul>
               </div>
               <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <h4 className="flex items-center gap-2 text-amber-700 font-black text-xs uppercase tracking-widest mb-3"><AlertCircle size={16}/> Privacy Note</h4>
                  <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                    Passwords are encrypted. When editing a user, only enter a value in the password field if you wish to reset it to a new value. Leaving it blank preserves the existing encrypted password.
                  </p>
               </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowHelp(false)} className="px-8 py-2.5 bg-blue-700 text-white rounded-xl font-black hover:bg-slate-900 transition-all shadow-lg text-[10px] uppercase tracking-widest active:scale-95">Acknowledged</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl transform animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col border border-slate-200">
            <div className={`px-6 py-4 flex justify-between items-center border-b-2 ${editingUser ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
               <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-xl text-white ${editingUser ? 'bg-blue-600' : 'bg-green-600'}`}>
                   {editingUser ? <Edit2 size={18} /> : <UserPlus size={18} />}
                 </div>
                 <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">
                   {editingUser ? 'Sync Identity' : 'Enroll New Access'}
                 </h2>
               </div>
               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24}/></button>
            </div>

            <form onSubmit={saveUser} className="p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <InputField label="Identity Full Name *" value={formData.full_name} onChange={(val) => setFormData({ ...formData, full_name: val })} required placeholder="Enter actual name" />
                  <InputField label="Login Username *" value={formData.username} onChange={(val) => setFormData({ ...formData, username: val })} required disabled={!!editingUser} placeholder="Uniqe Login ID" />
                  <InputField label="Primary Email *" type="email" value={formData.email} onChange={(val) => setFormData({ ...formData, email: val })} required placeholder="system@mail.com" />
                  <InputField label={`Secret Key ${editingUser ? '(Empty to Keep)' : '*'}`} type="password" value={formData.password} onChange={(val) => setFormData({ ...formData, password: val })} required={!editingUser} placeholder="••••••••" />
                  
                  <div className="space-y-1.5 group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-600 transition-colors">Branch Assignment *</label>
                    <select required value={formData.branch_id} onChange={(e) => setFormData({ ...formData, branch_id: parseInt(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-bold text-xs">
                      <option value="">Select Domain</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5 group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-600 transition-colors">Privilege Role *</label>
                    <select required value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-bold text-xs">
                      <option value="">Authorize Role</option>
                      {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                  </div>

                  {formData.role?.toLowerCase() === 'consignor' && (
                    <div className="space-y-1.5 group animate-in slide-in-from-top-2">
                      <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 group-focus-within:text-blue-600 transition-colors">Target Consignor *</label>
                      <select required value={formData.consignor_id} onChange={(e) => setFormData({ ...formData, consignor_id: e.target.value })} className="w-full px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-bold text-xs text-indigo-900 shadow-sm shadow-indigo-100">
                        <option value="">Select Account</option>
                        {consignors.map(c => <option key={c.id} value={c.id}>{c.name || c.consignor_name}</option>)}
                      </select>
                    </div>
                  )}

                  <InputField label="Contact Number" value={formData.phone} onChange={(val) => setFormData({ ...formData, phone: val.replace(/\D/g, '').slice(0,10) })} placeholder="10-digit mobile" maxLength="10" />
                  <InputField label="Official City" value={formData.city} onChange={(val) => setFormData({ ...formData, city: val })} placeholder="Location" />
                  
                  <div className="md:col-span-2">
                    <InputField label="Residential Address" value={formData.address} onChange={(val) => setFormData({ ...formData, address: val })} placeholder="Detailed permanent address..." />
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <input type="checkbox" id="user_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor="user_active" className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Authorized Access Status</label>
                  </div>
               </div>

               <div className="pt-2 flex gap-3 border-t border-slate-100 pt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 rounded-xl transition-all">Abort Action</button>
                  <button type="submit" className={`flex-1 flex items-center justify-center gap-2 py-3 text-white font-black rounded-xl shadow-lg transition transform active:scale-95 text-[10px] uppercase tracking-[0.15em] ${editingUser ? 'bg-blue-600 hover:bg-slate-900 shadow-blue-100' : 'bg-green-600 hover:bg-slate-900 shadow-green-100'}`}>
                     <Save size={16} /> {editingUser ? 'Commit Changes' : 'Enroll Identity'}
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

const InputField = ({ label, value, onChange, type = "text", required, disabled, placeholder, maxLength }) => (
  <div className="space-y-1.5 group">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-600 transition-colors">{label}</label>
    <input
      type={type}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      maxLength={maxLength}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-bold text-xs text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
    />
  </div>
)

const PasswordDisplay = ({ value }) => {
  const [show, setShow] = useState(false);
  if (!value) return (
    <div className="flex items-center gap-1 text-slate-400 italic">
       <span className="text-[10px] font-bold">Unsaved</span>
    </div>
  );
  
  return (
    <div className="flex items-center gap-2">
      <p className="text-xs font-black text-rose-600 tracking-tight min-w-[60px]">
        {show ? value : "••••••••"}
      </p>
      <button 
        onClick={() => setShow(!show)}
        className="p-1 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition-all active:scale-95"
        title={show ? "Hide Secret" : "Reveal Secret"}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
};

export default UserDetails
