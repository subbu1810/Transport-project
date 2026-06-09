import React, { useState, useEffect, useRef } from 'react'
import { Search, Package, CheckCircle2, AlertCircle, Loader2, MapPin, Calendar, User, FileText, ArrowDownCircle, Info, Barcode, X, HelpCircle } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function ReceiveInward() {
  const [gcNumber, setGcNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' })
  const [selectedWaybill, setSelectedWaybill] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [branches, setBranches] = useState([])
  const [receivedBranchId, setReceivedBranchId] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    setCurrentUser(user)
    if (user) {
      if (user.role === 'superadmin') {
        fetchBranches()
      } else {
        setReceivedBranchId(user.branch_id)
      }
      setTimeout(() => inputRef.current?.focus(), 500)
    }
  }, [])

  const showNotification = (type, title, message) => {
    setNotification({ show: true, type, title, message })
    setTimeout(() => {
      setNotification({ show: false, type: '', title: '', message: '' })
    }, 5000)
  }

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches`)
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
    setSelectedWaybill(null)

    try {
      const response = await fetch(`${API_BASE_URL}/waybills/search/${gcNumber}`)
      const data = await response.json()

      if (data.success && data.data) {
        const wb = data.data
        setSelectedWaybill(wb)
        if (wb.status === 'RECEIVED') {
          showNotification('info', 'Already Inwarded', `GC #${wb.gc_number} was already received. You can view its details below.`)
        } else {
          showNotification('success', 'GC Found', `GC #${wb.gc_number} loaded successfully. Ready to process inward.`)
        }
      } else {
        showNotification('error', 'GC Not Found', data.message || `No record found for GC "${gcNumber}". Please check and try again.`)
      }
    } catch (err) {
      console.error('Error searching GC:', err)
      showNotification('error', 'Connection Error', 'Could not reach the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReceiveInward = async () => {
    if (!selectedWaybill) return

    if (!receivedBranchId) {
      showNotification('error', 'Branch Required', 'Please select a receiving branch before processing the inward.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`${API_BASE_URL}/waybills/bulk-inward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waybill_ids: [selectedWaybill.id],
          received_branch_id: receivedBranchId,
          received_date: new Date().toISOString().split('T')[0],
          remarks: 'Received at destination',
          inward_by: currentUser?.id
        })
      })

      const data = await response.json()

      if (data.success) {
        showNotification('success', 'Inward Successful!', `GC #${selectedWaybill.gc_number} has been marked as received and recorded in the system.`)
        setSelectedWaybill(null)
        setGcNumber('')
        inputRef.current?.focus()
      } else {
        showNotification('error', 'Inward Failed', data.message || 'Could not process the inward. Please try again.')
      }
    } catch (err) {
      console.error('Error processing inward:', err)
      showNotification('error', 'Server Error', 'An unexpected error occurred. Please try again or contact support.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-3 space-y-3 bg-[#f8faf9] min-h-screen font-['Plus_Jakarta_Sans',_sans-serif]">
      {/* Rich Notification - Center Modal */}
      {notification.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`flex items-start gap-4 px-6 py-5 rounded-2xl shadow-2xl border bg-white min-w-[300px] max-w-[400px] mx-4 animate-in zoom-in-95 duration-200 ${notification.type === 'success' ? 'border-emerald-200' :
            notification.type === 'info' ? 'border-blue-200' :
              'border-rose-200'
            }`}>
            <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
              notification.type === 'info' ? 'bg-blue-100 text-blue-600' :
                'bg-rose-100 text-rose-600'
              }`}>
              {notification.type === 'success' ? <CheckCircle2 size={20} /> :
                notification.type === 'info' ? <Info size={20} /> :
                  <AlertCircle size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-[13px] text-gray-900 uppercase tracking-wide leading-tight">{notification.title}</p>
              <p className={`text-[11px] font-medium mt-1 leading-relaxed ${notification.type === 'success' ? 'text-emerald-700' :
                notification.type === 'info' ? 'text-blue-700' :
                  'text-rose-700'
                }`}>{notification.message}</p>
              <button
                onClick={() => setNotification({ ...notification, show: false })}
                className={`mt-3 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg transition-colors ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' :
                  notification.type === 'info' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' :
                    'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
              >
                OK, Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header - Light Green Theme */}
      <div className="flex justify-between items-center bg-white px-4 py-3 rounded-2xl shadow-sm border border-emerald-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
            <ArrowDownCircle size={18} strokeWidth={3} />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">Receive Inward</h1>
            <p className="text-gray-400 mt-1 font-bold text-[8px] uppercase tracking-widest">Arrival Protocol</p>
          </div>
          <button
            onClick={() => setShowHelp(true)}
            className="p-1 bg-white text-emerald-600 rounded-full shadow-sm hover:shadow-md hover:bg-emerald-50 transition-all border border-emerald-100 group mt-0.5"
            title="Inward Guide"
          >
            <HelpCircle size={16} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div className="flex flex-col items-end">
          <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">Branch Access</p>
          <div className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-emerald-100">
            <MapPin size={12} className="text-emerald-400" />
            {currentUser?.role === 'superadmin' ? (
              <select
                value={receivedBranchId}
                onChange={(e) => setReceivedBranchId(e.target.value)}
                className="bg-transparent text-[10px] font-black outline-none cursor-pointer pr-3 appearance-none text-emerald-800"
              >
                <option value="">Select Branch</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.branch_name}</option>
                ))}
              </select>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-tight text-emerald-800">
                {currentUser?.branch_name || 'BRANCH'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Search Panel - Compressed & Green Theme */}
        <div className="bg-white rounded-[1.5rem] shadow-sm p-5 border border-emerald-50 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gray-900 rounded-xl text-white">
                <Barcode size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 tracking-tight uppercase leading-none">Scanning</h2>
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Enter GC Number</p>
              </div>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="SCAN OR ENTER GC..."
                  value={gcNumber}
                  onChange={(e) => setGcNumber(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/50 border-2 border-transparent focus:border-emerald-300 focus:bg-white focus:outline-none transition-all rounded-xl text-xs font-black placeholder:text-gray-300 placeholder:font-bold tracking-wider"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !gcNumber.trim()}
                className="bg-emerald-400 text-white px-6 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 active:scale-95 disabled:opacity-30 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Details Section - Compact & Green theme */}
        {selectedWaybill && (
          <div className="animate-in fade-in zoom-in-95 duration-500 pb-10">
            <div className="bg-white rounded-[1.5rem] shadow-lg border border-emerald-50 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-100 to-emerald-50 px-6 py-4 text-emerald-900 border-b border-emerald-100 relative">
                <div className="relative z-10 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-200 rounded-lg flex items-center justify-center">
                      <Package size={20} strokeWidth={2.5} className="text-emerald-700" />
                    </div>
                    <div>
                      <span className="bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest mb-1 inline-block">Validated</span>
                      <h2 className="text-xl font-black leading-none tracking-tighter text-emerald-900">#{selectedWaybill.gc_number}</h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-4 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase border ${selectedWaybill.status === 'RECEIVED' ? 'bg-emerald-200 text-emerald-700 border-emerald-300' :
                      selectedWaybill.status === 'DISPATCHED' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-white text-gray-500 border-gray-200'
                      }`}>
                      {selectedWaybill.status || 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Route Card */}
                  <div className="bg-[#fcfdfc] p-4 rounded-xl border border-emerald-50">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin size={14} className="text-emerald-500" />
                      <h3 className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Route</h3>
                    </div>
                    <div className="space-y-3 relative pl-3 border-l-2 border-emerald-100">
                      <div>
                        <p className="text-[7px] font-black text-gray-400 uppercase mb-0.5">Origin</p>
                        <p className="text-xs font-black text-gray-800">{selectedWaybill.origin_branch?.branch_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[7px] font-black text-gray-400 uppercase mb-0.5">Dest</p>
                        <p className="text-xs font-black text-emerald-600">{selectedWaybill.destination?.city_name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Consignment info */}
                  <div className="bg-[#fcfdfc] p-4 rounded-xl border border-emerald-50">
                    <div className="flex items-center gap-2 mb-3">
                      <User size={14} className="text-emerald-500" />
                      <h3 className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Stakeholders</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="p-2 bg-white rounded-lg border border-emerald-50 shadow-sm">
                        <p className="text-[7px] font-black text-gray-400 uppercase mb-0.5">Consignor</p>
                        <p className="font-black text-gray-800 text-[10px] truncate uppercase">{selectedWaybill.consignor?.name || 'N/A'}</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-emerald-50 shadow-sm">
                        <p className="text-[7px] font-black text-gray-400 uppercase mb-0.5">Consignee</p>
                        <p className="font-black text-gray-800 text-[10px] truncate uppercase">{selectedWaybill.consignee?.name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Shipment Stats - Calculated dynamically from articles */}
                  <div className="bg-[#fcfdfc] p-4 rounded-xl border border-emerald-50">
                    <div className="flex items-center gap-2 mb-3">
                      <Info size={14} className="text-emerald-500" />
                      <h3 className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Stats</h3>
                    </div>
                    {(() => {
                      const arts = selectedWaybill.articles || []
                      const totalQty = arts.reduce((s, a) => s + (parseInt(a.no_of_articles) || 0), 0) || selectedWaybill.total_articles || 0
                      const totalDeadWt = arts.reduce((s, a) => s + (parseFloat(a.actual_weight) || 0), 0)
                      const totalChargeWt = arts.reduce((s, a) => s + (parseFloat(a.charged_weight) || 0), 0)
                      return (
                        <>
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            <div className="text-center p-2 bg-white rounded-lg border border-emerald-50">
                              <p className="text-[7px] font-black text-gray-400 uppercase mb-0.5">Qty</p>
                              <p className="text-lg font-black text-emerald-500 leading-none">{totalQty}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded-lg border border-emerald-50">
                              <p className="text-[7px] font-black text-gray-400 uppercase mb-0.5">Dead Wt</p>
                              <p className="text-[11px] font-black text-gray-700 leading-none">{totalDeadWt.toFixed(2)}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded-lg border border-emerald-50">
                              <p className="text-[7px] font-black text-gray-400 uppercase mb-0.5">Chg Wt</p>
                              <p className="text-[11px] font-black text-gray-700 leading-none">{totalChargeWt.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="text-center p-2 bg-white rounded-lg border border-emerald-50 mb-2">
                            <p className="text-[7px] font-black text-gray-400 uppercase mb-0.5">Grand Total</p>
                            <p className="text-base font-black text-gray-900">₹{parseFloat(selectedWaybill.grand_total || 0).toLocaleString()}</p>
                          </div>
                        </>
                      )
                    })()}
                    <div className="p-2 bg-emerald-50 rounded-lg text-center">
                      <p className="text-[9px] font-bold text-emerald-500 italic truncate">"{selectedWaybill.article_desc || 'No description'}"</p>
                    </div>
                  </div>
                </div>

                {/* Article Info Table - Even more compact */}
                <div className="bg-white rounded-xl border border-emerald-50 overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <FileText className="text-emerald-400" size={14} />
                    <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="px-4 py-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">Article Type</th>
                          <th className="px-4 py-2 text-[8px] font-black text-gray-400 uppercase tracking-widest text-center">Qty</th>
                          <th className="px-4 py-2 text-[8px] font-black text-gray-400 uppercase tracking-widest text-right">Dead Wt</th>
                          <th className="px-4 py-2 text-[8px] font-black text-gray-400 uppercase tracking-widest text-right">Charge Wt</th>
                          <th className="px-4 py-2 text-[8px] font-black text-gray-400 uppercase tracking-widest text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedWaybill.articles?.length > 0 ? selectedWaybill.articles.map((article, idx) => (
                          <tr key={idx} className="hover:bg-emerald-50/20 transition-colors border-b border-gray-50 last:border-0 text-[10px]">
                            <td className="px-4 py-2 font-black text-gray-700 uppercase">{article.article_type || '—'}</td>
                            <td className="px-4 py-2 text-center">
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md font-black border border-emerald-100">
                                {parseInt(article.no_of_articles) || 0}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right font-bold text-gray-500">{parseFloat(article.actual_weight || 0).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right font-bold text-gray-500">{parseFloat(article.charged_weight || 0).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right font-black text-gray-900">₹{parseFloat(article.amount || 0).toLocaleString()}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 text-center text-[10px] text-gray-400 font-bold italic">No article data found</td>
                          </tr>
                        )}
                      </tbody>
                      {selectedWaybill.articles?.length > 1 && (
                        <tfoot>
                          <tr className="border-t-2 border-gray-100 bg-gray-50/60">
                            <td className="px-4 py-2 text-[9px] font-black text-gray-500 uppercase">Total</td>
                            <td className="px-4 py-2 text-center text-[9px] font-black text-emerald-600">
                              {selectedWaybill.articles.reduce((s, a) => s + (parseInt(a.no_of_articles) || 0), 0)}
                            </td>
                            <td className="px-4 py-2 text-right text-[9px] font-black text-gray-600">
                              {selectedWaybill.articles.reduce((s, a) => s + (parseFloat(a.actual_weight) || 0), 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right text-[9px] font-black text-gray-600">
                              {selectedWaybill.articles.reduce((s, a) => s + (parseFloat(a.charged_weight) || 0), 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right text-[9px] font-black text-gray-900">
                              ₹{selectedWaybill.articles.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleReceiveInward}
                    disabled={saving || selectedWaybill.status === 'RECEIVED'}
                    className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-md active:scale-[0.98] ${selectedWaybill.status === 'RECEIVED'
                      ? 'bg-emerald-50 text-emerald-400 cursor-not-allowed border border-emerald-100'
                      : 'bg-emerald-600 text-white hover:bg-black shadow-emerald-100'
                      }`}
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : (selectedWaybill.status === 'RECEIVED' ? <CheckCircle2 size={16} /> : <ArrowDownCircle size={18} strokeWidth={2.5} />)}
                    {selectedWaybill.status === 'RECEIVED' ? 'INWARD COMPLETED' : 'RECEIVE ARRIVAL'}
                  </button>
                  <button
                    onClick={() => { setSelectedWaybill(null); setGcNumber(''); inputRef.current?.focus(); }}
                    className="px-6 py-3 bg-white border border-gray-200 text-gray-400 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-[0.98]"
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-emerald-100">
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <HelpCircle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Inward Protocol Guide</h2>
                  <p className="text-emerald-100 text-xs">How to process arriving shipments</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">1</span>
                    Arrival Scanning
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 ml-10">
                    <li>• Use a <span className="font-semibold text-gray-800">Barcode Scanner</span> or type the GC number manually into the scanning field.</li>
                    <li>• The system will automatically fetch the waybill details if it's already "Dispatched" to your branch.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">2</span>
                    Article Verification
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 ml-10">
                    <li>• Verify the <span className="font-semibold text-gray-800">Article Quantity</span> and type matches the physical goods arrived.</li>
                    <li>• Check if the <span className="font-semibold text-gray-800">Grand Total</span> and delivery branch is correct.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">3</span>
                    Committing Inward
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 ml-10">
                    <li>• Click <span className="font-semibold text-gray-800">Receive Arrival</span> to officially record the goods at your branch.</li>
                    <li>• Once inwarded, the status changes to "RECEIVED" or "INWARDED".</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-purple-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">★</span>
                    Operational Tip
                  </div>
                  <div className="ml-10">
                    <p className="text-xs text-gray-500 leading-relaxed italic">
                      Inwarding is critical for tracking. If a GC is not inwarded, it cannot be added to a local trip or delivered.
                    </p>
                  </div>
                </section>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-6 py-2 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-all shadow-lg"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReceiveInward
