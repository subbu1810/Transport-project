import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Edit2, Trash2, Search, X, Save, Users, Calendar, Phone, Mail, MapPin, Briefcase, IndianRupee, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function EmployeeManagement() {
    const [employees, setEmployees] = useState([])
    const [branches, setBranches] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notification, setNotification] = useState({ show: false, type: '', message: '' })
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingEmployee, setEditingEmployee] = useState(null)

    const [formData, setFormData] = useState({
        emp_id: '',
        first_name: '',
        last_name: '',
        designation: '',
        phone_number: '',
        email: '',
        address: '',
        date_of_joining: new Date().toISOString().split('T')[0],
        base_salary: 0,
        salary_type: 'MONTHLY',
        branch_id: '',
        is_active: true
    })

    useEffect(() => {
        fetchEmployees()
        fetchBranches()
    }, [])

    const showNotification = (type, message) => {
        setNotification({ show: true, type, message })
        setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000)
    }

    const fetchEmployees = async (query = '') => {
        try {
            setLoading(true)
            const params = query ? { q: query } : {}
            const response = await axios.get(`${API_BASE_URL}/employees`, { params })
            if (response.data.success) {
                setEmployees(response.data.data)
            }
        } catch (err) {
            setError('Failed to fetch employees')
        } finally {
            setLoading(false)
        }
    }

    const fetchBranches = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/branches`)
            if (response.data.success) {
                setBranches(response.data.data)
            }
        } catch (err) { }
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value)
        fetchEmployees(e.target.value)
    }

    const resetForm = () => {
        setFormData({
            emp_id: '',
            first_name: '',
            last_name: '',
            designation: '',
            phone_number: '',
            email: '',
            address: '',
            date_of_joining: new Date().toISOString().split('T')[0],
            base_salary: 0,
            salary_type: 'MONTHLY',
            branch_id: '',
            is_active: true
        })
    }

    const validateForm = () => {
        if (!formData.emp_id) return 'Employee ID is required'
        if (!formData.first_name) return 'First name is required'
        return null
    }

    const handleSave = async (e) => {
        e.preventDefault()
        const errorMsg = validateForm()
        if (errorMsg) {
            showNotification('error', errorMsg)
            return
        }

        try {
            setLoading(true)
            const response = editingEmployee
                ? await axios.put(`${API_BASE_URL}/employees/${editingEmployee.id}`, formData)
                : await axios.post(`${API_BASE_URL}/employees`, formData)

            if (response.data.success) {
                showNotification('success', editingEmployee ? 'Updated successfully' : 'Created successfully')
                setShowModal(false)
                fetchEmployees()
                resetForm()
            }
        } catch (err) {
            showNotification('error', err.response?.data?.message || 'Operation failed')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (emp) => {
        setEditingEmployee(emp)
        setFormData({
            ...emp,
            branch_id: emp.branch_id || ''
        })
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this employee?')) return
        try {
            const response = await axios.delete(`${API_BASE_URL}/employees/${id}`)
            if (response.data.success) {
                showNotification('success', 'Employee deleted')
                fetchEmployees()
            }
        } catch (err) {
            showNotification('error', 'Failed to delete')
        }
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-outfit">
            {/* Notifications */}
            {notification.show && (
                <div className={`fixed top-6 right-6 z-[100] p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce-in text-white ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    <p className="font-bold">{notification.message}</p>
                </div>
            )}

            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-[#1E293B] tracking-tight flex items-center gap-3">
                        <span className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-100 text-white">
                            <Users size={32} />
                        </span>
                        Employee Management
                    </h1>
                    <p className="text-slate-400 font-medium mt-1 ml-16">Organize, track, and manage your workforce</p>
                </div>
                <button
                    onClick={() => { setEditingEmployee(null); resetForm(); setShowModal(true) }}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={18} /> Add New Employee
                </button>
            </div>

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Search */}
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-4">
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                        <input
                            type="text"
                            placeholder="Search by ID, Name or Designation..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all text-sm"
                        />
                    </div>
                </div>

                {/* Employee Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up">
                    {employees.map((emp) => (
                        <div key={emp.id} className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden hover:border-indigo-200 transition-all group">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black">
                                            {emp.first_name[0]}{emp.last_name ? emp.last_name[0] : ''}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-700 uppercase tracking-tight">{emp.first_name} {emp.last_name}</h3>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{emp.designation || 'Staff'}</p>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${emp.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                        {emp.is_active ? 'Active' : 'Inactive'}
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <Briefcase size={14} className="text-slate-300" />
                                        <span className="text-[11px] font-bold uppercase tracking-tight">{emp.emp_id}</span>
                                    </div>
                                    {emp.branch && (
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <MapPin size={14} className="text-slate-300" />
                                            <span className="text-[11px] font-bold uppercase tracking-tight">{emp.branch.branch_name}</span>
                                        </div>
                                    )}
                                    {emp.phone_number && (
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <Phone size={14} className="text-slate-300" />
                                            <span className="text-[11px] font-bold tracking-tight">{emp.phone_number}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex gap-2 invisible group-hover:visible transition-all">
                                    <button onClick={() => handleEdit(emp)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 font-black uppercase text-[9px] tracking-widest transition-all">
                                        <Edit2 size={12} /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(emp.id)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 font-black uppercase text-[9px] tracking-widest transition-all">
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {!loading && employees.length === 0 && (
                    <div className="py-24 bg-white rounded-[3rem] shadow-sm border border-slate-50 flex flex-col items-center justify-center space-y-4">
                        <Users size={64} className="text-slate-100" />
                        <div className="text-center">
                            <h3 className="text-xl font-black text-[#1E293B] uppercase tracking-widest">No Employees Found</h3>
                            <p className="text-slate-400 font-medium mt-2">Start by adding your first team member</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal - Compact Redesign */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300 p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{editingEmployee ? 'Edit Profile' : 'New Employee'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-600 transition-colors"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSave} className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Employee ID *</label>
                                <input type="text" value={formData.emp_id} onChange={(e) => setFormData({ ...formData, emp_id: e.target.value.toUpperCase() })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700 uppercase" placeholder="EMP001" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Designation</label>
                                <input type="text" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700" placeholder="e.g. Branch Manager" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name *</label>
                                <input type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                                <input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><Phone size={10} className="inline mr-1" /> Contact</label>
                                <input type="text" value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><Mail size={10} className="inline mr-1" /> Email</label>
                                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700" />
                            </div>

                            <div className="space-y-1.5 col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Office Branch</label>
                                <select value={formData.branch_id} onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700 uppercase">
                                    <option value="">Select Branch</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5 col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700" rows="3" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Joining Date</label>
                                <input type="date" value={formData.date_of_joining} onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Salary</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                    <input type="number" value={formData.base_salary} onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700" />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 col-span-2 py-4">
                                <input type="checkbox" id="active-check" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-5 h-5 accent-indigo-600" />
                                <label htmlFor="active-check" className="text-sm font-black text-slate-600 uppercase tracking-widest">Active Employee Status</label>
                            </div>

                            <button type="submit" disabled={loading} className="col-span-2 py-5 bg-[#1E293B] hover:bg-[#0F172A] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2 shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-4">
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                {editingEmployee ? 'Update Profile' : 'Finalize Employee'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
        @keyframes fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes bounce-in { 0% { transform: scale(0.9); opacity: 0; } 50% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
        </div>
    )
}

export default EmployeeManagement
