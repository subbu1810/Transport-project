import React, { useState, useEffect } from 'react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';
import {
    Plus, Edit2, Trash2, Search, X, Save, ShieldCheck,
    User, Mail, Phone, MapPin, Shield, Lock, Building, Hash, Eye, EyeOff, Info
} from 'lucide-react'

const InputField = ({ label, icon: Icon, type = 'text', value, onChange, placeholder, required = false, disabled = false, error = false }) => (
    <div className="space-y-1.5 flex-1">
        <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.1em] ml-1 flex items-center gap-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative group/input">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${error ? 'text-red-400' : 'text-gray-400 group-focus-within/input:text-green-600'}`}>
                <Icon size={18} />
            </div>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className={`w-full pl-12 pr-4 py-3 bg-white border-2 rounded-2xl outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300 placeholder:font-medium
            ${error ? 'border-red-200 focus:border-red-400 focus:ring-4 focus:ring-red-50' : 'border-gray-50 focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5 shadow-sm group-hover/input:border-gray-200 hover:group-focus-within/input:border-green-500/50'}
            ${disabled ? 'bg-gray-50 cursor-not-allowed text-gray-400' : ''}`}
            />
        </div>
    </div>
)

function BranchManagement() {
    const [admins, setAdmins] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notification, setNotification] = useState({ show: false, type: '', message: '' })
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingAdmin, setEditingAdmin] = useState(null)
    const [showPassword, setShowPassword] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        full_name: '', // Added to sync with backend
        phone_number: '',
        email: '',
        address: '',
        role: 'admin',
        password: '',
        branch_code: '',
        branch_name: '',
        branch_address: '',
        branch_email: '',
        branch_phone: '',
        transport_name: '',
        transport_address: '',
        transport_phone: '',
        is_active: true
    })

    // Show notification
    const showNotification = (type, message) => {
        setNotification({ show: true, type, message })
        setTimeout(() => {
            setNotification({ show: false, type: '', message: '' })
        }, 5000)
    }

    // Fetch all admins
    const fetchAdmins = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${API_BASE_URL}/admins`)
            const data = await response.json()

            if (data.success) {
                setAdmins(Array.isArray(data.data) ? data.data : [])
                setError('')
            } else {
                setError(data.message || 'Failed to fetch branches')
            }
        } catch (err) {
            setError('Failed to connect to server')
            console.error('Error fetching branches:', err)
        } finally {
            setLoading(false)
        }
    }

    // Create or update admin
    const saveAdmin = async (e) => {
        e.preventDefault()

        try {
            const url = editingAdmin
                ? `${API_BASE_URL}/admins/${editingAdmin.id}`
                : `${API_BASE_URL}/admins`

            const method = editingAdmin ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (data.success) {
                // Update localStorage if editing current user
                if (currentUser && editingAdmin && currentUser.id === editingAdmin.id) {
                    const updatedUser = {
                        ...currentUser,
                        ...formData,
                        transport_name: formData.transport_name,
                        transport_address: formData.transport_address,
                        transport_phone: formData.transport_phone
                    }
                    localStorage.setItem('user', JSON.stringify(updatedUser))
                    setCurrentUser(updatedUser)
                    // Trigger a custom event or just reload to update header
                    window.location.reload()
                }

                fetchAdmins()
                setShowModal(false)
                setEditingAdmin(null)
                resetForm()
                showNotification('success', editingAdmin ? 'Profile & Brand updated!' : 'New unit initialized!')
            } else {
                if (data.errors) {
                    const errorMessages = Object.values(data.errors).flat().join(', ')
                    showNotification('error', `Details invalid: ${errorMessages}`)
                } else {
                    showNotification('error', data.message || 'Action failed')
                }
            }
        } catch (err) {
            showNotification('error', 'Server connection error')
        }
    }

    // Delete admin (branch)
    const deleteAdmin = async (id) => {
        if (!window.confirm('Are you sure you want to remove this branch record?')) {
            return
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admins/${id}`, {
                method: 'DELETE'
            })

            const data = await response.json()

            if (data.success) {
                fetchAdmins()
                showNotification('success', 'Branch record removed')
            } else {
                showNotification('error', data.message || 'Deletion failed')
            }
        } catch (err) {
            showNotification('error', 'Server error')
        }
    }

    const editAdmin = (admin) => {
        setEditingAdmin(admin)
        setFormData({
            name: admin.name || '',
            full_name: admin.full_name || admin.name || '',
            phone_number: admin.phone_number || '',
            email: admin.email || '',
            address: admin.address || '',
            role: admin.role || 'admin',
            password: '',
            branch_code: admin.branch_code || '',
            branch_name: admin.branch_name || '',
            branch_address: admin.branch_address || '',
            branch_email: admin.branch_email || '',
            branch_phone: admin.branch_phone || '',
            transport_name: admin.transport_name || '',
            transport_address: admin.transport_address || '',
            transport_phone: admin.transport_phone || '',
            is_active: admin.is_active ?? true
        })
        setShowModal(true)
    }

    const resetForm = () => {
        setFormData({
            name: '',
            full_name: '',
            phone_number: '',
            email: '',
            address: '',
            role: 'admin',
            password: '',
            branch_code: '',
            branch_name: '',
            branch_address: '',
            branch_email: '',
            branch_phone: '',
            transport_name: currentUser?.transport_name || '',
            transport_address: currentUser?.transport_address || '',
            transport_phone: currentUser?.transport_phone || '',
            is_active: true
        })
    }

    const [currentUser, setCurrentUser] = useState(null)
    const [unauthorized, setUnauthorized] = useState(false)

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'))
        setCurrentUser(user)
        if (user && user.role === 'superadmin') {
            fetchAdmins()
        } else {
            setLoading(false)
            setUnauthorized(true)
        }
    }, [])

    const filteredAdmins = admins.filter(admin =>
        (admin.name && admin.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (admin.email && admin.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (admin.branch_name && admin.branch_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    if (unauthorized) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="p-6 bg-red-50 rounded-full text-red-600 mb-6">
                    <Shield size={64} strokeWidth={1.5} />
                </div>
                <h1 className="text-3xl font-black text-gray-800 mb-2">Unauthorized Access</h1>
                <p className="text-gray-500 max-w-md font-bold italic">
                    You do not have the required permissions to access Branch Management.
                    Only Super Administrators can manage operational units and administrative accounts.
                </p>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen">
            {/* Premium Notification */}
            {notification.show && (
                <div className={`fixed top-8 right-8 z-[10000] p-5 rounded-3xl shadow-2xl flex items-center gap-4 animate-slide-in border-b-4 ${notification.type === 'success' ? 'bg-green-600 border-green-800 text-white' : 'bg-red-600 border-red-800 text-white'
                    }`}>
                    <div className="p-2 bg-white/20 rounded-xl">
                        {notification.type === 'success' ? <ShieldCheck size={24} /> : <Info size={24} />}
                    </div>
                    <div>
                        <p className="font-black text-sm uppercase tracking-widest">{notification.type === 'success' ? 'Success' : 'Attention'}</p>
                        <p className="text-xs font-bold opacity-90">{notification.message}</p>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-600 rounded-2xl shadow-lg shadow-green-200">
                            <Building className="text-white" size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-gray-800 tracking-tight">Branch Management</h1>
                    </div>
                    <p className="text-gray-500 font-bold ml-16 flex items-center gap-2 italic">
                        Configuring the operational units of {currentUser?.transport_name || 'the system'}
                    </p>
                </div>
                <button
                    onClick={() => { setEditingAdmin(null); resetForm(); setShowModal(true); }}
                    className="group relative flex items-center gap-3 px-8 py-4 bg-[#2e7d32] text-white rounded-[2rem] hover:bg-[#1b5e20] transition-all font-black uppercase text-xs tracking-[0.1em] shadow-xl shadow-green-200 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                    <Plus size={20} className="relative z-10" />
                    <span className="relative z-10">Add New Branch</span>
                </button>
            </div>

            {/* Search & Stats Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                    <Search className="text-gray-400 ml-4" size={20} />
                    <input
                        type="text"
                        placeholder="Quick search by Branch Name, Admin, Email or Code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none font-bold text-gray-700 placeholder:text-gray-300 placeholder:font-medium"
                    />
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Found: {filteredAdmins.length}</span>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-[2rem] p-[1px] shadow-lg shadow-green-100">
                    <div className="bg-white rounded-[1.95rem] h-full p-4 flex items-center justify-center gap-4">
                        <div className="p-3 bg-green-100 rounded-2xl text-green-600">
                            <Building size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Units</p>
                            <p className="text-2xl font-black text-gray-800 leading-none">{admins.filter(a => a.is_active).length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Table Content */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Unit ID</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Regional Branch Profile</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transport Brand</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Primary Administrator</th>
                                <th className="px-8 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-6 bg-gray-50 rounded-full text-gray-200">
                                                <Building size={64} strokeWidth={1} />
                                            </div>
                                            <p className="text-gray-400 font-black uppercase text-xs tracking-widest">No branch records available</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAdmins.map((admin) => (
                                    <tr key={admin.id} className="group hover:bg-green-50/30 transition-all duration-300">
                                        <td className="px-8 py-6 align-top">
                                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-black">#{admin.id}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-lg font-black text-gray-800 leading-none group-hover:text-green-700 transition-colors uppercase">{admin.branch_name || 'Unnamed Unit'}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-black rounded-md uppercase tracking-tighter">Code: {admin.branch_code || '---'}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1"><Mail size={12} /> {admin.branch_email || 'No email'}</span>
                                                </div>
                                                {admin.branch_address && <p className="text-[11px] text-gray-500 font-medium max-w-xs mt-1 truncate">{admin.branch_address}</p>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-black text-blue-600 uppercase italic leading-none">{admin.transport_name || 'No Brand'}</span>
                                                <span className="text-[10px] text-gray-400 font-bold">{admin.transport_phone || '---'}</span>
                                                {admin.transport_address && <p className="text-[9px] text-gray-400 font-medium truncate max-w-[120px]">{admin.transport_address}</p>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center text-white shadow-md shadow-green-100 uppercase">
                                                    {admin.name ? admin.name.charAt(0) : '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-gray-700 uppercase tracking-tight">{admin.name || 'No Name'}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold">{admin.email}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[9px] font-black text-green-600 bg-green-50 px-1.5 rounded uppercase tracking-widest">{admin.role}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${admin.is_active
                                                ? 'bg-green-50 text-green-600 border-green-100'
                                                : 'bg-red-50 text-red-600 border-red-100'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${admin.is_active ? 'bg-green-600' : 'bg-red-600'}`} />
                                                {admin.is_active ? 'Online' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => editAdmin(admin)}
                                                    className="p-3 text-blue-500 bg-blue-50/50 hover:bg-blue-500 hover:text-white rounded-2xl transition-all shadow-sm active:scale-90"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => deleteAdmin(admin.id)}
                                                    className="p-3 text-red-500 bg-red-50/50 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm active:scale-90"
                                                >
                                                    <Trash2 size={18} />
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

            {/* REDESIGNED MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[11000] p-4 animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.1)] w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col animate-scale-up border border-white/20">
                        {/* Modal Header */}
                        <div className="p-10 pb-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full translate-x-32 translate-y-[-16rem] blur-3xl opacity-50" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-2 h-8 bg-green-600 rounded-full" />
                                    <h2 className="text-3xl font-black text-gray-800 tracking-tight">
                                        {editingAdmin ? 'Update Operational Unit' : 'Initialize New Branch'}
                                    </h2>
                                </div>
                                <p className="text-gray-500 font-bold ml-5">
                                    Complete the profile below to authenticate the regional branch and administrator
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-4 bg-white text-gray-400 hover:text-red-500 rounded-[1.5rem] shadow-sm hover:shadow-xl border border-gray-100 transition-all active:scale-95 group relative z-10"
                            >
                                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        <form onSubmit={saveAdmin} className="p-10 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

                                {/* Left Side: Admin Profile */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-orange-100 text-orange-600 rounded-2xl">
                                            <User size={20} />
                                        </div>
                                        <span className="font-black text-gray-800 uppercase text-xs tracking-[0.2em]">Administrative Profile</span>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-[2.5rem] p-8 space-y-6 border border-gray-100/50">
                                        <InputField
                                            label="Login Username" icon={Shield} required
                                            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., bangalore_admin"
                                            disabled={editingAdmin ? true : false}
                                        />
                                        <InputField
                                            label="Full Name" icon={User} required
                                            value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            placeholder="e.g., John Doe"
                                        />
                                        <InputField
                                            label="Gmail / Business Email" icon={Mail} required type="email"
                                            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="admin@srklogistics.com"
                                        />
                                        <InputField
                                            label="Phone / Mobile" icon={Phone}
                                            value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                            placeholder="+91 00000 00000"
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5 border-none outline-none">
                                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.1em] ml-1 flex items-center gap-1.5">
                                                    Account Role <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative group/input">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-green-600 transition-colors">
                                                        <Shield size={18} />
                                                    </div>
                                                    <select
                                                        value={formData.role}
                                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-50 rounded-2xl outline-none transition-all font-bold text-gray-700 appearance-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5 shadow-sm"
                                                    >
                                                        <option value="admin">ADMIN</option>
                                                        <option value="manager">MANAGER</option>
                                                        <option value="operator">OPERATOR</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 relative">
                                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.1em] ml-1 flex items-center gap-1.5">
                                                    Password {!editingAdmin && <span className="text-red-500">*</span>}
                                                </label>
                                                <div className="relative group/input">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-green-600 transition-colors">
                                                        <Lock size={18} />
                                                    </div>
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        required={!editingAdmin}
                                                        value={formData.password}
                                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                        className="w-full pl-12 pr-12 py-3 bg-white border-2 border-gray-50 rounded-2xl outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300 shadow-sm focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5"
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button" onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 p-1 transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Branch Assignment */}
                                <div className="lg:col-span-3 space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-green-100 text-green-600 rounded-2xl">
                                            <Building size={20} />
                                        </div>
                                        <span className="font-black text-gray-800 uppercase text-xs tracking-[0.2em]">Operational Unit Details</span>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-[2.5rem] p-10 space-y-6 border border-gray-100/50">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            <InputField
                                                label="Branch Name" icon={Building} required
                                                value={formData.branch_name} onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                                                placeholder="e.g., Bangalore Head Office"
                                            />
                                            <InputField
                                                label="Unit Code" icon={Hash}
                                                value={formData.branch_code} onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                                                placeholder="e.g., BLR-001"
                                            />
                                            <InputField
                                                label="Support Phone" icon={Phone}
                                                value={formData.branch_phone} onChange={(e) => setFormData({ ...formData, branch_phone: e.target.value })}
                                                placeholder="+91 80 1234 5678"
                                            />
                                            <InputField
                                                label="Unit Email" icon={Mail} type="email"
                                                value={formData.branch_email} onChange={(e) => setFormData({ ...formData, branch_email: e.target.value })}
                                                placeholder="bangalore@srklogistics.com"
                                            />
                                        </div>

                                        <div className="space-y-1.5 col-span-2">
                                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.1em] ml-1 flex items-center gap-1.5">
                                                Complete Address
                                            </label>
                                            <div className="relative group/input">
                                                <div className="absolute left-4 top-5 text-gray-400 group-focus-within/input:text-green-600 transition-colors">
                                                    <MapPin size={18} />
                                                </div>
                                                <textarea
                                                    rows="4"
                                                    value={formData.branch_address}
                                                    onChange={(e) => setFormData({ ...formData, branch_address: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-50 rounded-[1.5rem] outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300 shadow-sm focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5 resize-none"
                                                    placeholder="Unit door number, street, locality, landmark, city, and state details..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Transport Profile Section */}
                                    <div className="bg-gray-50/50 rounded-[2.5rem] p-10 space-y-6 border border-gray-100/50 mt-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <span className="font-black text-gray-800 uppercase text-xs tracking-[0.2em]">Transport Brand Profile</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            <InputField
                                                label="Transport Name" icon={Building} required
                                                value={formData.transport_name} onChange={(e) => setFormData({ ...formData, transport_name: e.target.value })}
                                                placeholder="e.g., Your Business Name"
                                            />
                                            <InputField
                                                label="Transport Phone" icon={Phone}
                                                value={formData.transport_phone} onChange={(e) => setFormData({ ...formData, transport_phone: e.target.value })}
                                                placeholder="+91 00000 00000"
                                            />
                                        </div>
                                        <div className="space-y-1.5 flex-1">
                                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.1em] ml-1 flex items-center gap-1.5">
                                                Transport Head Office Address
                                            </label>
                                            <div className="relative group/input">
                                                <div className="absolute left-4 top-5 text-gray-400 group-focus-within/input:text-blue-600 transition-colors">
                                                    <MapPin size={18} />
                                                </div>
                                                <textarea
                                                    rows="3"
                                                    value={formData.transport_address}
                                                    onChange={(e) => setFormData({ ...formData, transport_address: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-50 rounded-[1.5rem] outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300 shadow-sm focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 resize-none"
                                                    placeholder="Main business address..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center justify-between p-8 bg-green-50/50 rounded-[2rem] border border-green-100/50 gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox" id="branch_active" checked={formData.is_active}
                                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-800 uppercase tracking-tight leading-none">Status: {formData.is_active ? 'Online' : 'Offline'}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Allow branch to process waybills</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button" onClick={() => setShowModal(false)}
                                                className="px-8 py-3 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:text-gray-800 transition"
                                            >
                                                Discard
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-[1.5rem] hover:from-green-700 hover:to-green-800 transition-all font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-green-100 active:scale-95"
                                            >
                                                <Save size={18} />
                                                {editingAdmin ? 'Confirm Changes' : 'Initialize Unit'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
        
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        
        @keyframes slide-in { 0% { transform: translateX(100%); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes scale-up { 0% { transform: scale(0.95) translateY(20px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        .animate-scale-up { animation: scale-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
        </div>
    )
}

export default BranchManagement
