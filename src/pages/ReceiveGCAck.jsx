import React, { useState, useEffect } from 'react'
import { Search, CheckCircle, AlertCircle, Loader2, Package, Calendar, MapPin, User, FileText, Info, Clock } from 'lucide-react'

function ReceiveGCAck() {
  const [gcNumber, setGcNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedWaybill, setSelectedWaybill] = useState(null)
  const [awaitingAcks, setAwaitingAcks] = useState([])
  const [branchCode, setBranchCode] = useState('')

  const [currentUser, setCurrentUser] = useState(null)
  const [branches, setBranches] = useState([])

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    setCurrentUser(user)
    if (user) {
      if (user.role === 'superadmin') {
        fetchBranches()
      } else if (user.branch_code) {
        setBranchCode(user.branch_code)
        fetchAwaitingAcks(user.branch_code)
      }
    }
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/branches')
      const data = await response.json()
      if (data.success) {
        setBranches(data.data)
      }
    } catch (err) {
      console.error('Error fetching branches:', err)
    }
  }

  const fetchAwaitingAcks = async (code) => {
    if (!code) {
      setAwaitingAcks([])
      return
    }
    try {
      const response = await fetch(`http://localhost:8000/api/v1/waybills/awaiting-ack/${code}`)
      const data = await response.json()
      if (data.success) {
        setAwaitingAcks(data.data)
      }
    } catch (err) {
      console.error('Error fetching awaiting acks:', err)
    }
  }

  useEffect(() => {
    if (branchCode && currentUser?.role === 'superadmin') {
      fetchAwaitingAcks(branchCode)
    }
  }, [branchCode])

  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    if (!gcNumber.trim()) return

    setLoading(true)
    setError('')
    setSuccess('')
    setSelectedWaybill(null)

    try {
      const response = await fetch(`http://localhost:8000/api/v1/waybills/search/${gcNumber}`)
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

  const handleSubmitAck = async () => {
    if (!selectedWaybill) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const user = JSON.parse(localStorage.getItem('user'))
      let id_of_branch = null

      if (user?.role === 'superadmin') {
        const foundBranch = branches.find(b => b.branch_code === branchCode)
        id_of_branch = foundBranch?.id
      } else {
        id_of_branch = user?.branch_id
      }

      const response = await fetch('http://localhost:8000/api/v1/waybills/submit-ack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gc_number: selectedWaybill.gc_number,
          remarks: 'Acknowledgment received',
          branch_id: id_of_branch
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('GC marked as DELIVERED successfully!')
        setSelectedWaybill(null)
        setGcNumber('')
        fetchAwaitingAcks(branchCode)
      } else {
        setError(data.message || 'Failed to submit acknowledgment')
      }
    } catch (err) {
      console.error('Error submitting ack:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Receive GC Ack</h1>
          <p className="text-gray-500 text-sm font-medium">Manage and receive signed consignment acknowledgments</p>
        </div>
        <div className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-bold text-gray-700 italic">Branch Context:</span>
          {currentUser?.role === 'superadmin' ? (
            <select
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              className="text-xs font-black text-green-600 bg-green-50 border-none outline-none cursor-pointer p-0.5 rounded hover:bg-green-100 transition-colors"
            >
              <option value="">Select Branch</option>
              {branches.map(b => (
                <option key={b.id} value={b.branch_code}>{b.branch_name}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-black text-green-600">{branchCode || 'All'}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Search and Results */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-lg shadow-gray-200/50 p-4 border border-gray-100 transition-all hover:shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-green-100 rounded-lg text-green-600">
                <Search size={16} />
              </div>
              <h2 className="text-base font-bold text-gray-800">Quick GC Search</h2>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1 group">
                <input
                  type="text"
                  placeholder="Enter GC Number to Ack"
                  value={gcNumber}
                  onChange={(e) => setGcNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:border-green-500 focus:bg-white focus:outline-none transition-all text-sm font-semibold placeholder:font-normal"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !gcNumber}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-gray-200 text-sm"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
              </button>
            </form>

            {(error || success) && (
              <div className={`mt-3 p-2 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4 ${error ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                {error ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                <p className="font-bold text-sm">{error || success}</p>
              </div>
            )}
          </div>

          {selectedWaybill && (
            <div className="bg-white rounded-xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-8">
              <div className="bg-green-600 p-4 text-white relative">
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 inline-block">Waybill Details</span>
                    <h2 className="text-2xl font-black mb-0.5">#{selectedWaybill.gc_number}</h2>
                    <p className="text-green-100 text-xs font-medium opacity-90">Booked on: {new Date(selectedWaybill.bill_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-1 rounded-lg text-xs font-black tracking-widest uppercase shadow-lg ${selectedWaybill.status === 'DELIVERED' ? 'bg-white text-green-600' :
                      selectedWaybill.status === 'PENDING' ? 'bg-blue-500 text-white' : 'bg-yellow-400 text-gray-900'
                      }`}>
                      {selectedWaybill.status}
                    </span>
                  </div>
                </div>
                {/* Visual decoration */}
                <Package size={80} className="absolute -right-4 -bottom-4 text-white/10 rotate-12" />
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                        <MapPin size={12} /> Shipping Route
                      </h3>
                      <div className="space-y-2 relative pl-3 border-l border-gray-100 ml-1">
                        <div className="relative">
                          <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-gray-300 border border-white shadow-sm" />
                          <p className="text-[10px] font-bold text-gray-400">From</p>
                          <p className="text-sm font-bold text-gray-800">{selectedWaybill.origin_branch?.branch_name || 'N/A'}</p>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-green-600 border border-white shadow-sm" />
                          <p className="text-[10px] font-bold text-gray-400">To</p>
                          <p className="text-sm font-bold text-gray-800">{selectedWaybill.destination?.city_name || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Consignor</p>
                        <p className="text-xs font-bold text-gray-800 flex items-center gap-1 italic">
                          <User size={10} className="text-gray-400" /> {selectedWaybill.consignor?.name || 'N/A'}
                        </p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Consignee</p>
                        <p className="text-xs font-bold text-gray-800 flex items-center gap-1 italic">
                          <User size={10} className="text-gray-400" /> {selectedWaybill.consignee?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                        <Info size={12} /> Package Overview
                      </h3>
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 mb-0.5">Total Articles</p>
                          <p className="text-lg font-black text-gray-900">{selectedWaybill.total_articles}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 mb-0.5">Grand Total</p>
                          <p className="text-lg font-black text-green-600">₹{selectedWaybill.grand_total}</p>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-gray-200/60">
                          <p className="text-[10px] font-bold text-gray-500 mb-0.5">Article Description</p>
                          <p className="text-xs text-gray-700 font-medium italic">{selectedWaybill.article_desc || 'No description provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSubmitAck}
                    disabled={submitting || selectedWaybill.status === 'DELIVERED'}
                    className={`flex-1 py-2.5 rounded-lg font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg ${selectedWaybill.status === 'DELIVERED'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-green-600 text-white hover:bg-green-700 active:scale-95 shadow-green-200'
                      }`}
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                    {selectedWaybill.status === 'DELIVERED' ? 'Already Delivered' : 'Confirm Acknowledgement'}
                  </button>
                  <button
                    onClick={() => setSelectedWaybill(null)}
                    className="px-4 py-2.5 bg-white border border-gray-100 text-gray-400 rounded-lg font-bold hover:bg-gray-50 transition-all font-black text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Waiting List */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-lg shadow-gray-200/50 p-4 border border-gray-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-100 rounded-lg text-yellow-600">
                  <Clock size={16} className="animate-[pulse_2s_infinite]" />
                </div>
                <h2 className="text-base font-bold text-gray-800">Pending Ack</h2>
              </div>
              <div className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-black">
                {awaitingAcks.length}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px] pr-2 custom-scrollbar">
              {awaitingAcks.length === 0 ? (
                <div className="text-center py-10 px-4 border-2 border-dashed border-gray-100 rounded-xl">
                  <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-200">
                    <Package size={20} />
                  </div>
                  <p className="text-gray-400 font-bold text-xs">No pending acknowledgments for this branch.</p>
                </div>
              ) : (
                awaitingAcks.map((waybill) => (
                  <div
                    key={waybill.id}
                    onClick={() => {
                      setGcNumber(waybill.gc_number)
                      setSelectedWaybill(waybill)
                    }}
                    className="p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-green-50 hover:border-green-200 transition-all cursor-pointer group animate-in slide-in-from-right-4 duration-500"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-sm font-black text-gray-900 group-hover:text-green-700 transition-colors">#{waybill.gc_number}</span>
                      <span className="text-[9px] font-black uppercase tracking-tighter text-white bg-green-500 px-1.5 py-0.5 rounded-full">{waybill.status}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin size={10} /> <span className="font-bold italic">To: {waybill.destination?.city_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar size={10} /> <span className="font-bold">{new Date(waybill.bill_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReceiveGCAck
