import React, { useState, useEffect } from 'react'
import { Info, Plus, Edit2, Trash2, X, Save, CheckCircle, AlertCircle } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function HeadDetails() {
  const [heads, setHeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentHead, setCurrentHead] = useState({
    name: '',
    description: '',
    transaction_type: 'DEBIT',
    status: 'Active'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [showHelp, setShowHelp] = useState(false)

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' })
    }, 5000)
  }

  useEffect(() => {
    fetchHeads()
  }, [])

  const fetchHeads = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/account-heads`)
      const data = await response.json()
      if (data.success) {
        setHeads(data.data)
      }
    } catch (err) {
      console.error('Error fetching heads:', err)
      setError('Failed to load account heads')
      showNotification('error', 'Failed to load account heads')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (head = null) => {
    if (head) {
      setCurrentHead(head)
      setIsEditing(true)
    } else {
      setCurrentHead({
        name: '',
        description: '',
        transaction_type: 'DEBIT',
        status: 'Active'
      })
      setIsEditing(false)
    }
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const url = isEditing
        ? `${API_BASE_URL}/account-heads/${currentHead.id}`
        : `${API_BASE_URL}/account-heads`

      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentHead)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(isEditing ? 'Head updated successfully!' : 'Head created successfully!')
        showNotification('success', isEditing ? 'Head updated successfully!' : 'Head created successfully!')
        fetchHeads()
        setTimeout(() => setShowModal(false), 1500)
      } else {
        const msg = typeof data.message === 'object' ? Object.values(data.message).join(', ') : data.message
        setError(msg)
        showNotification('error', msg)
      }
    } catch (err) {
      console.error('Error saving head:', err)
      setError('An error occurred while saving')
      showNotification('error', 'An error occurred while saving')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account head?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/account-heads/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        setSuccess('Head deleted successfully!')
        showNotification('success', 'Head deleted successfully!')
        fetchHeads()
      } else {
        setError(data.message)
        showNotification('error', data.message)
      }
    } catch (err) {
      console.error('Error deleting head:', err)
      setError('Failed to delete head')
      showNotification('error', 'Failed to delete head')
    }
  }

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
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
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#1e3a8a] tracking-tight">Head Details</h1>
              <button
                onClick={() => setShowHelp(true)}
                className="p-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-all shadow-sm border border-blue-100 group"
              >
                <Info size={14} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm font-bold text-xs"
        >
          <Plus size={16} />
          Add Head
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-green-600 px-4 py-2">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider">Head Details List</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">Head Name</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">Description</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-center font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      <p>Loading heads...</p>
                    </div>
                  </td>
                </tr>
              ) : heads.length > 0 ? heads.map((head) => (
                <tr key={head.id} className="hover:bg-green-50/50 transition duration-200">
                  <td className="px-3 py-2 font-bold text-blue-900">{head.name}</td>
                  <td className="px-3 py-2 text-gray-600 italic">"{head.description}"</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${head.transaction_type === 'CREDIT'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                      {head.transaction_type}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${head.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                      {head.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 flex justify-center gap-1.5">
                    <button
                      onClick={() => handleOpenModal(head)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded-md transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(head.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded-md transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">No head details found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className={`p-4 text-white flex justify-between items-center ${isEditing ? 'bg-blue-600' : 'bg-green-600'}`}>
              <h2 className="text-lg font-bold flex items-center gap-2">
                {isEditing ? <Edit2 size={20} /> : <Plus size={20} />}
                {isEditing ? 'Edit Head Detail' : 'Add New Head'}
              </h2>
              <button onClick={() => setShowModal(false)} className="hover:rotate-90 transition-transform">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {(error || success) && (
                <div className={`p-3 rounded-lg flex items-center gap-2 animate-bounce ${error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  {error ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                  <span className="font-medium text-sm">{error || success}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Head Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OFFICE_EXPENSES"
                  value={currentHead.name}
                  onChange={(e) => setCurrentHead({ ...currentHead, name: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all font-bold text-blue-900 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Description</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe this ledger head..."
                  value={currentHead.description}
                  onChange={(e) => setCurrentHead({ ...currentHead, description: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all resize-none italic text-sm"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Type</label>
                  <select
                    value={currentHead.transaction_type}
                    onChange={(e) => setCurrentHead({ ...currentHead, transaction_type: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all bg-white font-bold text-blue-900 text-sm"
                  >
                    <option value="CREDIT">CREDIT</option>
                    <option value="DEBIT">DEBIT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Status</label>
                  <select
                    value={currentHead.status}
                    onChange={(e) => setCurrentHead({ ...currentHead, status: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all bg-white font-medium text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-500 font-bold rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white font-black rounded-lg shadow-md transition transform active:scale-95 text-sm ${isEditing ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}
                >
                  <Save size={18} />
                  {isEditing ? 'Update Head' : 'Save Head'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-blue-100">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Info size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Head Master Guide</h2>
                  <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Accounting Ledger Management</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-8">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-black">?</span>
                    What are Account Heads?
                  </div>
                  <div className="ml-10">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Account Heads (also called Ledger Heads) are categories used to organize your finances. Every financial transaction—whether an expense or income—must be tagged with a specific "Head" so you can track where your money is going.
                    </p>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-rose-700 font-bold uppercase text-xs tracking-wider">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 font-black">DR</div>
                      Debit Heads
                    </div>
                    <ul className="space-y-2 text-xs text-gray-500 ml-10 leading-relaxed">
                      <li>• Used for <span className="font-bold">Expenses</span> and <span className="font-bold">Payments</span>.</li>
                      <li>• Examples: Office Rent, Fuel Expenses, Staff Salaries, Maintenance.</li>
                    </ul>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold uppercase text-xs tracking-wider">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-black">CR</div>
                      Credit Heads
                    </div>
                    <ul className="space-y-2 text-xs text-gray-500 ml-10 leading-relaxed">
                      <li>• Used for <span className="font-bold">Income</span> and <span className="font-bold">Receipts</span>.</li>
                      <li>• Examples: Freight Collection, Interest Income, Capital Infusion.</li>
                    </ul>
                  </section>
                </div>

                <section className="space-y-4 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 font-bold uppercase text-xs tracking-wider">
                    <span className="text-lg">💡</span>
                    Usage in System
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed ml-7">
                    These heads will appear in the <span className="font-black">Cash Book</span> and <span className="font-black">Expense Entry</span> modules. Proper classification ensures accurate Profit & Loss reporting at the end of the month.
                  </p>
                </section>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-8 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-bold hover:bg-blue-900 transition-all shadow-lg active:scale-95 uppercase text-xs tracking-widest"
              >
                Understood!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HeadDetails
