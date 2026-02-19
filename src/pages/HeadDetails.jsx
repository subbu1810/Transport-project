import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Save, CheckCircle, AlertCircle } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

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

  useEffect(() => {
    fetchHeads()
  }, [])

  const fetchHeads = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/account-heads`)
      const data = await response.json()
      if (data.success) {
        setHeads(data.data)
      }
    } catch (err) {
      console.error('Error fetching heads:', err)
      setError('Failed to load account heads')
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
        ? `${API_URL}/account-heads/${currentHead.id}`
        : `${API_URL}/account-heads`

      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentHead)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(isEditing ? 'Head updated successfully!' : 'Head created successfully!')
        fetchHeads()
        setTimeout(() => setShowModal(false), 1500)
      } else {
        setError(typeof data.message === 'object' ? Object.values(data.message).join(', ') : data.message)
      }
    } catch (err) {
      console.error('Error saving head:', err)
      setError('An error occurred while saving')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account head?')) return

    try {
      const response = await fetch(`${API_URL}/account-heads/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        setSuccess('Head deleted successfully!')
        fetchHeads()
      } else {
        setError(data.message)
      }
    } catch (err) {
      console.error('Error deleting head:', err)
      setError('Failed to delete head')
    }
  }

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a8a]">Head Details</h1>
          <p className="text-gray-500 text-xs">Configure and manage account ledger heads</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md hover:shadow-lg font-bold text-sm"
        >
          <Plus size={18} />
          Add Head Master
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-green-600 p-3">
          <h3 className="font-bold text-white text-base">Head Master Details</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Head Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
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
                  <td className="px-4 py-3 font-bold text-blue-900 text-xs">{head.name}</td>
                  <td className="px-4 py-3 text-gray-600 italic text-xs">"{head.description}"</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border-2 ${head.transaction_type === 'CREDIT'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                      {head.transaction_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${head.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                      {head.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex justify-center gap-2">
                    <button
                      onClick={() => handleOpenModal(head)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(head.id)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
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
    </div>
  )
}

export default HeadDetails
