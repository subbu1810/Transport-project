import React, { useState, useEffect } from 'react'
import { Search, CheckCircle, AlertCircle, Loader2, Package, Calendar, MapPin, User, FileText, Info, Clock, HelpCircle, X, CheckSquare } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function ReceiveGCAck() {
  const [gcNumber, setGcNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [popup, setPopup] = useState({ show: false, message: '', type: 'success' })
  const [selectedWaybill, setSelectedWaybill] = useState(null)
  const [awaitingAcks, setAwaitingAcks] = useState([])
  const [branchCode, setBranchCode] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [branches, setBranches] = useState([])
  const [proofFile, setProofFile] = useState(null)

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

  const showPopup = (message, type = 'success') => {
    setPopup({ show: true, message, type })
    setTimeout(() => setPopup({ show: false, message: '', type: 'success' }), 3000)
  }

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches`)
      const data = await response.json()
      if (data.success) setBranches(data.data)
    } catch (err) { console.error(err) }
  }

  const fetchAwaitingAcks = async (code) => {
    if (!code) return
    try {
      const response = await fetch(`${API_BASE_URL}/waybills/awaiting-ack/${code}`)
      const data = await response.json()
      if (data.success) setAwaitingAcks(data.data)
    } catch (err) { console.error(err) }
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
    setSelectedWaybill(null)
    try {
      const response = await fetch(`${API_BASE_URL}/waybills/search/${gcNumber}`)
      const data = await response.json()
      if (data.success && data.data) {
        setSelectedWaybill(data.data)
        setProofFile(null)
      } else { showPopup(data.message || 'GC not found', 'error') }
    } catch (err) { showPopup('Search failed', 'error') }
    finally { setLoading(false) }
  }

  const handleSubmitAck = async () => {
    if (!selectedWaybill) return
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('gc_number', selectedWaybill.gc_number)
      formData.append('branch_id', currentUser.role === 'superadmin' ? branches.find(b => b.branch_code === branchCode)?.id : currentUser.branch_id)
      if (proofFile) formData.append('delivery_proof', proofFile)

      const response = await fetch(`${API_BASE_URL}/waybills/submit-ack`, {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      if (data.success) {
        showPopup('POD Receipt Confirmed')
        setSelectedWaybill(null)
        setGcNumber('')
        fetchAwaitingAcks(branchCode)
      } else { showPopup(data.message || 'Submission failed', 'error') }
    } catch (err) { showPopup('Error submitting acknowledgement', 'error') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="bg-gray-50 min-h-screen text-[11px]">
      
      {/* 🔮 Popup Toast */}
      {popup.show && (
        <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-4">
          <div className={`px-4 py-1.5 rounded shadow-lg border text-white font-black flex items-center gap-2 ${
            popup.type === 'success' ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'
          }`}>
             {popup.type === 'success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
             <span>{popup.message}</span>
          </div>
        </div>
      )}

      {/* 🏭 High-Density Header */}
      <div className="bg-white border-b border-gray-300 p-2 flex justify-between items-center px-4">
         <div className="flex items-center gap-4">
            <h1 className="text-xs font-black text-gray-800 uppercase tracking-tight">Receipt Verification Module</h1>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-bold text-gray-400 uppercase italic">Active Branch:</span>
               {currentUser?.role === 'superadmin' ? (
                 <select 
                   className="bg-gray-50 border border-gray-200 text-[10px] font-black px-1 rounded outline-none h-6"
                   value={branchCode}
                   onChange={(e) => setBranchCode(e.target.value)}
                 >
                   <option value="">SELECT BRANCH</option>
                   {branches.map(b => <option key={b.id} value={b.branch_code}>{b.branch_name}</option>)}
                 </select>
               ) : (
                 <span className="text-[10px] font-black text-green-700 uppercase">{currentUser?.branch_name}</span>
               )}
            </div>
         </div>
      </div>

      <div className="p-3">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* 📋 Side Trace (Awaiting List) */}
            <div className="md:col-span-1 bg-white border border-gray-200 rounded flex flex-col h-[calc(100vh-100px)]">
               <div className="bg-green-50 p-2 border-b border-green-100 text-green-800 font-black uppercase flex justify-between items-center">
                  <span>Awaiting ACK ({awaitingAcks.length})</span>
                  <Clock size={12} />
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {awaitingAcks.map(gc => (
                    <div 
                      key={gc.id} 
                      onClick={() => { setGcNumber(gc.gc_number); handleSearch({preventDefault: () => {}, target: { value: gc.gc_number }}) }}
                      className="p-2 border-b border-gray-50 hover:bg-green-50/50 cursor-pointer transition-colors group"
                    >
                       <div className="flex justify-between font-black text-gray-900 leading-tight">
                          <span className="group-hover:text-green-700">#{gc.gc_number}</span>
                          <span className="text-gray-400 text-[9px] font-normal italic">{new Date(gc.bill_date).toLocaleDateString('en-GB')}</span>
                       </div>
                       <div className="text-[9px] text-gray-400 font-bold truncate uppercase mt-0.5">{gc.destination?.city_name}</div>
                    </div>
                  ))}
                  {awaitingAcks.length === 0 && (
                    <div className="p-10 text-center opacity-20">
                       <Package size={32} className="mx-auto" />
                       <p className="font-black mt-2 uppercase text-[9px]">Clear</p>
                    </div>
                  )}
               </div>
            </div>

            <div className="md:col-span-3 space-y-4">
               {/* 🔍 Search Row */}
               <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
                  <form onSubmit={handleSearch} className="flex gap-2">
                     <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                        <input 
                          type="text" 
                          value={gcNumber} 
                          onChange={(e) => setGcNumber(e.target.value)}
                          placeholder="Quick GC Finder. Enter ID and Scan..."
                          className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded font-black text-[11px] outline-none focus:border-green-600 transition-all focus:bg-white"
                        />
                     </div>
                     <button className="bg-green-600 text-white px-8 py-2 rounded font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all">
                        Validate
                     </button>
                  </form>
               </div>

               {/* 📂 Verification Panel */}
               {selectedWaybill ? (
                 <div className="bg-white border text-[11px] border-green-600 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="bg-green-600 p-2 text-white flex justify-between items-center text-[10px]">
                       <span className="font-black uppercase tracking-widest italic flex items-center gap-2"><CheckSquare size={12}/> Verification Panel</span>
                       <X size={14} className="cursor-pointer hover:rotate-90 transition-all" onClick={() => setSelectedWaybill(null)} />
                    </div>
                    
                    {/* Compact Matrix Header */}
                    <div className="p-3 grid grid-cols-4 gap-4 bg-green-50/20 border-b border-green-100 italic">
                       <div>
                          <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Identifier</p>
                          <p className="text-base font-black text-green-900 uppercase">#{selectedWaybill.gc_number}</p>
                       </div>
                       <div>
                          <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Routing</p>
                          <p className="font-black text-green-700 uppercase mt-0.5">{selectedWaybill.destination?.city_name}</p>
                       </div>
                       <div>
                          <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Date</p>
                          <p className="font-black text-gray-700 uppercase mt-0.5">{new Date(selectedWaybill.bill_date).toLocaleDateString('en-GB')}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Value</p>
                          <p className="text-sm font-black text-gray-900 mt-0.5">₹{selectedWaybill.grand_total}</p>
                       </div>
                    </div>

                    <div className="p-4 grid grid-cols-2 gap-10">
                       <div className="space-y-4">
                          <div className="flex justify-between border-b border-gray-100 pb-2">
                             <div className="flex-1">
                                <p className="text-[8px] text-gray-400 font-black uppercase">Consignor</p>
                                <p className="font-bold text-gray-600 truncate uppercase mt-0.5">{selectedWaybill.consignor?.name}</p>
                             </div>
                             <div className="flex-1 text-right">
                                <p className="text-[8px] text-gray-400 font-black uppercase">Consignee</p>
                                <p className="font-bold text-gray-600 truncate uppercase mt-0.5">{selectedWaybill.consignee?.name}</p>
                             </div>
                          </div>
                          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded p-4 flex flex-col items-center justify-center text-center group hover:border-green-400 transition-all">
                             <FileText size={20} className="text-gray-300 group-hover:text-green-600 transition-all mb-2" />
                             <input type="file" id="pod-upload-standalone" className="hidden" onChange={e => setProofFile(e.target.files[0])} />
                             <label htmlFor="pod-upload-standalone" className="cursor-pointer">
                                <span className="font-black text-[9px] uppercase tracking-widest text-gray-500 group-hover:text-green-700">
                                   {proofFile ? proofFile.name : 'Click to Upload POD Attachment'}
                                </span>
                             </label>
                          </div>
                       </div>
                       <div className="flex flex-col justify-end">
                          <button 
                            onClick={handleSubmitAck}
                            disabled={submitting}
                            className="w-full bg-green-600 text-white py-4 rounded font-black uppercase text-[11px] tracking-[0.2em] shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle size={16} /> Authenticate Submission</>}
                          </button>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="h-[400px] flex flex-col items-center justify-center bg-white border border-gray-200 rounded text-gray-300 shadow-sm transition-all animate-in fade-in">
                    <Package size={40} className="mb-2 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Search or select a GC to begin verification</p>
                 </div>
               )}
            </div>
         </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
    </div>
  )
}

export default ReceiveGCAck
