import React, { useState, useEffect } from 'react'
import { Search, Package, CheckCircle2, AlertCircle, Loader2, MapPin, Calendar, User, FileText, ArrowDownCircle, Info } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function ReceiveInward() {
  const [gcNumber, setGcNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedWaybill, setSelectedWaybill] = useState(null)
  const [currentBranch, setCurrentBranch] = useState(null)

  const [currentUser, setCurrentUser] = useState(null)
  const [branches, setBranches] = useState([])
  const [receivedBranchId, setReceivedBranchId] = useState('')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    setCurrentUser(user)
    if (user) {
      if (user.role === 'superadmin') {
        fetchBranches()
      } else {
        setReceivedBranchId(user.branch_id)
        setCurrentBranch(user)
      }
    }
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_URL}/branches`)
      const data = await response.json()
      if (data.success) {
        setBranches(data.data)
      }
    } catch (err) {
      console.error('Error fetching branches:', err)
    }
  }

  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    if (!gcNumber.trim()) return

    setLoading(true)
    setError('')
    setSuccess('')
    setSelectedWaybill(null)

    try {
      const response = await fetch(`${API_URL}/waybills/search/${gcNumber}`)
      const data = await response.json()

      if (data.success && data.data) {
        setSelectedWaybill(data.data)
      } else {
        setError(data.message || 'GC Number not found')
      }
    } catch (err) {
      console.error('Error searching GC:', err)
      setError('Failed to fetch GC details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReceiveInward = async () => {
    if (!selectedWaybill || !currentBranch) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_URL}/waybills/bulk-inward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waybill_ids: [selectedWaybill.id],
          received_branch_id: receivedBranchId || currentBranch?.branch_id || 1,
          received_date: new Date().toISOString().split('T')[0],
          remarks: 'Received at destination'
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('GC Inwarded successfully!')
        setSelectedWaybill(null)
        setGcNumber('')
      } else {
        setError(data.message || 'Failed to process inward')
      }
    } catch (err) {
      console.error('Error processing inward:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <ArrowDownCircle className="text-blue-600" size={24} />
            Receive Inward
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic text-xs">Process single consignment arrival at your branch</p>
        </div>
        <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-200"></div>
          <span className="text-xs font-black text-gray-700 uppercase tracking-wider italic">Context:</span>
          {currentUser?.role === 'superadmin' ? (
            <select
              value={receivedBranchId}
              onChange={(e) => setReceivedBranchId(e.target.value)}
              className="text-xs font-black text-blue-600 bg-blue-50 border-none outline-none cursor-pointer p-1 rounded hover:bg-blue-100 transition-colors"
            >
              <option value="">Select Branch</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.branch_name}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
              {currentBranch?.branch_name || 'Loading...'}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Search Panel */}
        <div className="lg:col-span-12">
          <div className="bg-white rounded-xl shadow-lg shadow-gray-200/50 p-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                <Search size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">Scan or Search GC</h2>
                <p className="text-xs text-gray-400 font-medium">Enter the GC Number to start the inward process</p>
              </div>
            </div>

            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1 group">
                <input
                  type="text"
                  placeholder="ENTER GC NUMBER TO INWARD"
                  value={gcNumber}
                  onChange={(e) => setGcNumber(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-sm font-bold placeholder:font-normal"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !gcNumber.trim()}
                className="bg-gray-900 text-white px-6 py-2 rounded-xl font-black text-sm hover:bg-gray-800 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {(error || success) && (
              <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 border-2 ${error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                <p className="font-bold text-sm leading-none">{error || success}</p>
              </div>
            )}
          </div>
        </div>

        {/* Details Section */}
        {selectedWaybill && (
          <div className="lg:col-span-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white rounded-xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-4 text-white relative">
                <div className="relative z-10 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl backdrop-blur-md flex items-center justify-center border border-white/30">
                      <Package size={20} />
                    </div>
                    <div>
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest mb-1 inline-block">Consignment Details</span>
                      <h2 className="text-xl font-black leading-none">#{selectedWaybill.gc_number}</h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase shadow-md border ${selectedWaybill.status === 'RECEIVED' ? 'bg-green-500 text-white border-green-400' :
                      selectedWaybill.status === 'DISPATCHED' ? 'bg-yellow-400 text-gray-900 border-yellow-300' :
                        'bg-white/10 text-white border-white/20'
                      }`}>
                      {selectedWaybill.status || 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Route Card */}
                  <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-1">
                      <MapPin size={12} className="text-blue-500" /> Logistics Route
                    </h3>
                    <div className="space-y-3 relative pl-3 border-l-2 border-dashed border-gray-200 ml-1">
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-0.5">From Branch</p>
                        <p className="text-sm font-bold text-gray-800">{selectedWaybill.origin_branch?.branch_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-0.5">To Destination</p>
                        <p className="text-sm font-bold text-gray-800">{selectedWaybill.destination?.city_name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Consignment info */}
                  <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-1">
                      <User size={12} className="text-blue-500" /> Stakeholders
                    </h3>
                    <div className="space-y-2">
                      <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                        <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Consignor</p>
                        <p className="font-bold text-gray-800 text-sm">{selectedWaybill.consignor?.name || 'N/A'}</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                        <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Consignee</p>
                        <p className="font-bold text-gray-800 text-sm">{selectedWaybill.consignee?.name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Shipment Stats */}
                  <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-1">
                      <Info size={12} className="text-blue-500" /> Package Info
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                        <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Articles</p>
                        <p className="text-xl font-black text-blue-600">{selectedWaybill.total_articles || '0'}</p>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                        <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Total Amt</p>
                        <p className="text-lg font-black text-gray-800">₹{selectedWaybill.grand_total || '0'}</p>
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-gray-100 italic">
                      <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Description</p>
                      <p className="text-xs font-medium text-gray-600 truncate">{selectedWaybill.article_desc || 'No description'}</p>
                    </div>
                  </div>
                </div>

                {/* Article Info Table */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="text-gray-400" size={16} /> Article Breakdown
                  </h3>
                  <div className="overflow-hidden border border-gray-100 rounded-xl shadow-sm">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left font-black text-[8px] uppercase tracking-widest text-gray-400">Article Type</th>
                          <th className="px-4 py-2 text-center font-black text-[8px] uppercase tracking-widest text-gray-400">Quantity</th>
                          <th className="px-4 py-2 text-right font-black text-[8px] uppercase tracking-widest text-gray-400">Actual Wt</th>
                          <th className="px-4 py-2 text-right font-black text-[8px] uppercase tracking-widest text-gray-400">Charged Wt</th>
                          <th className="px-4 py-2 text-right font-black text-[8px] uppercase tracking-widest text-gray-400">Rate</th>
                          <th className="px-4 py-2 text-right font-black text-[8px] uppercase tracking-widest text-gray-400">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedWaybill.articles?.map((article, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors capitalize">
                            <td className="px-4 py-2 font-bold text-gray-800">{article.article_type}</td>
                            <td className="px-4 py-2 text-center font-black text-blue-600">{article.no_of_articles}</td>
                            <td className="px-4 py-2 text-right text-gray-600">{article.actual_weight} kg</td>
                            <td className="px-4 py-2 text-right text-gray-600">{article.charged_weight} kg</td>
                            <td className="px-4 py-2 text-right text-gray-600">₹{article.rate}</td>
                            <td className="px-4 py-2 text-right font-black text-gray-900">₹{article.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleReceiveInward}
                    disabled={saving || selectedWaybill.status === 'RECEIVED'}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm uppercase tracking-[0.1em] transition-all shadow-lg active:scale-[0.98] ${selectedWaybill.status === 'RECEIVED'
                      ? 'bg-green-100 text-green-500 cursor-not-allowed shadow-none border-2 border-green-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                      }`}
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownCircle size={16} />}
                    {selectedWaybill.status === 'RECEIVED' ? 'Already Received at Destination' : 'Process Inward Arrival'}
                  </button>
                  <button
                    onClick={() => setSelectedWaybill(null)}
                    className="px-6 py-3 bg-white border-2 border-gray-100 text-gray-400 rounded-xl font-black text-sm uppercase hover:bg-gray-50 transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReceiveInward
