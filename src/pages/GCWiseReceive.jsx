import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Search, Loader2, AlertCircle, CheckCircle2, RotateCcw, CreditCard, Calendar, User, FileText, IndianRupee, ArrowRight, X, Layout, CheckCircle, Package, Layers } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function GCWiseReceive() {
  const [gcNumberSearch, setGcNumberSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [waybill, setWaybill] = useState(null)
  const [popup, setPopup] = useState({ show: false, message: '', type: 'success' })
  
  const [paymentData, setPaymentData] = useState({
    receivedDate: new Date().toISOString().split('T')[0],
    outstanding: 0,
    discount: 0,
    balance: 0,
    paidAmount: 0,
    payerName: '',
    modeOfPay: 'CASH',
    doCheckNo: '',
    doCheckDate: new Date().toISOString().split('T')[0],
    remarks: ''
  })
  const [isClosed, setIsClosed] = useState(false)
  const [checkLoading, setCheckLoading] = useState(false)

  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user) setCurrentUser(user)
  }, [])

  useEffect(() => {
    if (currentUser?.branch_id && paymentData.receivedDate) {
      checkClosingStatus()
    }
  }, [currentUser, paymentData.receivedDate])

  const checkClosingStatus = async () => {
    try {
      setCheckLoading(true)
      const bid = currentUser?.branch_id
      const date = paymentData.receivedDate
      if (!bid || !date) return

      const response = await axios.get(`${API_BASE_URL}/day-book-closings?from_date=${date}&to_date=${date}&branch_id=${bid}`)
      if (response.data.success) {
        setIsClosed(response.data.data.length > 0)
      }
    } catch (err) {
      console.error('Error checking closing status:', err)
    } finally {
      setCheckLoading(false)
    }
  }

  const showPopup = (message, type = 'success') => {
    setPopup({ show: true, message, type })
    setTimeout(() => setPopup({ show: false, message: '', type: 'success' }), 3000)
  }

  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    if (!gcNumberSearch.trim()) return
    setLoading(true)
    setWaybill(null)
    try {
      const response = await axios.get(`${API_BASE_URL}/waybills/search/${gcNumberSearch}`)
      if (response.data.success) {
        const wb = response.data.data
        setWaybill(wb)
        const outstanding = parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)
        setPaymentData(prev => ({
          ...prev,
          outstanding: outstanding.toFixed(2),
          balance: outstanding.toFixed(2),
          paidAmount: outstanding.toFixed(2),
          discount: 0,
          payerName: wb.consignor?.name || wb.consignee?.name || '',
          remarks: `Payment for GC: ${wb.gc_number}`
        }))
      }
    } catch (err) {
      showPopup(err.response?.data?.message || 'GC record not found', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentChange = (field, value) => {
    const newData = { ...paymentData, [field]: value }
    if (field === 'discount' || field === 'paidAmount') {
      const out = parseFloat(newData.outstanding) || 0
      const disc = parseFloat(field === 'discount' ? value : newData.discount) || 0
      const paid = parseFloat(field === 'paidAmount' ? value : newData.paidAmount) || 0
      newData.balance = (out - disc - paid).toFixed(2)
    }
    setPaymentData(newData)
  }

  const handleSubmit = async () => {
    if (!waybill) return
    if (isClosed) {
      showPopup('Access Denied: DayBook is closed for this date.', 'error')
      return
    }
    if (parseFloat(paymentData.paidAmount) <= 0 && parseFloat(paymentData.discount) <= 0) {
      showPopup('Record either payment or discount', 'error')
      return
    }
    setSubmitLoading(true)
    try {
      const payload = {
        id: waybill.id,
        payment_date: paymentData.receivedDate,
        paid_amount: parseFloat(paymentData.paidAmount),
        mode_of_pay: paymentData.modeOfPay,
        remarks: paymentData.remarks,
        payer_name: paymentData.payerName,
        dd_check_no: paymentData.doCheckNo,
        dd_check_date: paymentData.doCheckDate,
        discount: parseFloat(paymentData.discount) || 0,
        branch_id: currentUser?.branch_id || waybill.origin_branch_id
      }
      const response = await axios.post(`${API_BASE_URL}/waybills/receive-payment`, payload)
      if (response.data.success) {
        showPopup('Payment Synchronized Successfully')
        setWaybill(response.data.data)
        const newOutstanding = parseFloat(response.data.data.grand_total) - parseFloat(response.data.data.amount_paid)
        setPaymentData(prev => ({
          ...prev,
          outstanding: newOutstanding.toFixed(2),
          balance: newOutstanding.toFixed(2),
          paidAmount: newOutstanding.toFixed(2),
          discount: 0
        }))
      }
    } catch (err) {
      showPopup('Gateway Synchronization Error', 'error')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleReset = () => {
    setWaybill(null); setGcNumberSearch('');
    setPaymentData({
      receivedDate: new Date().toISOString().split('T')[0], outstanding: 0, discount: 0, balance: 0, paidAmount: 0, payerName: '', modeOfPay: 'CASH', doCheckNo: '', doCheckDate: new Date().toISOString().split('T')[0], remarks: ''
    })
  }

  return (
    <div className="bg-gray-50 min-h-screen text-[11px]">
      
      {/* 🔮 Industrial Popup Notification */}
      {popup.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-10 duration-300">
          <div className={`px-6 py-2.5 rounded shadow-[0_10px_40px_rgba(0,0,0,0.2)] border-2 flex items-center gap-3 min-w-[320px] ${
            popup.type === 'success' ? 'bg-green-600 border-green-400 text-white' : 'bg-red-600 border-red-400 text-white'
          }`}>
             <div className="bg-white/20 p-1.5 rounded-full">
                {popup.type === 'success' ? <CheckCircle size={18} className="text-white" /> : <AlertCircle size={18} className="text-white" />}
             </div>
             <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-70 leading-none mb-1">System Notification</span>
                <span className="font-black text-[11px] uppercase tracking-tight leading-none">{popup.message}</span>
             </div>
          </div>
        </div>
      )}

      {/* 🏭 High-Density Header */}
      <div className="bg-white border-b border-gray-300 p-2 flex justify-between items-center px-4 no-print">
         <div className="flex items-center gap-4">
            <h1 className="text-xs font-black text-gray-800 uppercase tracking-tight">Fin-Hub | Payment Settlement</h1>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <span className="text-[9px] font-black text-green-600 uppercase tracking-widest italic">{currentUser?.branch_name} Unit</span>
         </div>
         <div className="hidden md:flex bg-green-50 px-3 py-1 rounded border border-green-100">
            <span className="text-green-700 text-[10px] font-black uppercase tracking-widest">Active System</span>
         </div>
      </div>

      <div className="p-3">
         {/* 🔍 Search Row - Compact */}
         <div className="bg-white p-3 border border-gray-200 rounded shadow-sm mb-4">
            <form onSubmit={handleSearch} className="flex gap-2">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                  <input 
                    type="text" 
                    value={gcNumberSearch} 
                    onChange={(e) => setGcNumberSearch(e.target.value.toUpperCase())}
                    placeholder="Enter GC Identifier (e.g. GC-2026-0001) and Search..."
                    className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded font-black text-[11px] outline-none focus:border-green-600 transition-all focus:bg-white uppercase"
                  />
               </div>
               <button type="submit" disabled={loading} className="bg-green-600 text-white px-8 py-2 rounded font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all flex items-center gap-2">
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <><Search size={14} /> Scan Ledger</>}
               </button>
            </form>
         </div>

         {waybill ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 animate-in fade-in duration-300">
               {/* 📊 Left: GC Snapshot */}
               <div className="md:col-span-4 space-y-4">
                  <div className="bg-white border-2 border-green-600 shadow-xl overflow-hidden">
                     <div className="bg-green-600 p-2 text-white flex justify-between items-center px-3">
                        <span className="font-black text-[9px] uppercase italic tracking-[0.2em]">GC Ledger Snapshot</span>
                        <X size={14} className="cursor-pointer" onClick={handleReset} />
                     </div>
                     <div className="p-3 bg-green-50/50 border-b border-green-100 flex flex-col gap-1">
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[7px] font-black text-green-700 uppercase">Waybill Identity</p>
                              <h2 className="text-lg font-black text-gray-900 leading-none">#{waybill.gc_number}</h2>
                           </div>
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${parseFloat(paymentData.balance) <= 0.01 ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
                              {parseFloat(paymentData.balance) <= 0.01 ? 'SETTLED' : 'PENDING'}
                           </span>
                        </div>
                     </div>
                     <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <p className="text-[8px] font-black text-gray-400 uppercase">Book Date</p>
                              <p className="font-bold text-gray-700">{new Date(waybill.bill_date).toLocaleDateString('en-GB')}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[8px] font-black text-gray-400 uppercase">Consignee</p>
                              <p className="font-bold text-gray-700 uppercase italic truncate">{waybill.consignee?.name}</p>
                           </div>
                        </div>
                        <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-x-6 gap-y-3">
                           <div>
                              <p className="text-[8px] font-black text-gray-400 uppercase">Grand Total</p>
                              <p className="text-xs font-black text-gray-800">₹{parseFloat(waybill.grand_total).toLocaleString()}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[8px] font-black text-green-600 uppercase">Paid Total</p>
                              <p className="text-xs font-black text-green-700">₹{parseFloat(waybill.amount_paid || 0).toLocaleString()}</p>
                           </div>
                        </div>
                        <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-600 flex justify-between items-center rounded-r">
                           <span className="text-[9px] font-black text-red-600 uppercase italic">Outstanding Balance</span>
                           <span className="text-base font-black text-red-700 italic">₹{parseFloat(paymentData.outstanding).toLocaleString()}</span>
                        </div>
                        <button onClick={handleReset} className="w-full py-1.5 border border-gray-200 text-[9px] font-black uppercase hover:bg-gray-100 transition-all rounded">Reset Module</button>
                     </div>
                  </div>
               </div>

               {/* 💳 Right: High-Density Settlement Form */}
               <div className="md:col-span-8 space-y-4">
                  <div className="bg-white border border-gray-200 p-6 rounded shadow-sm">
                     <div className="flex items-center gap-2 mb-6 text-green-700 border-b border-gray-50 pb-2">
                        <CreditCard size={14} />
                        <h3 className="font-black text-gray-800 uppercase tracking-widest text-[10px]">Settlement Matrix</h3>
                     </div>

                     <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 italic">
                              <Calendar size={11} className="text-green-600" /> Received Dt
                           </label>
                           <input type="date" value={paymentData.receivedDate} onChange={e => handlePaymentChange('receivedDate', e.target.value)} className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded font-black text-[11px] outline-none focus:border-green-600 focus:bg-white" />
                        </div>
                        <div className="space-y-1 text-right">
                           <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 italic justify-end">
                              <FileText size={11} className="text-green-600" /> Pay Mode
                           </label>
                           <select value={paymentData.modeOfPay} onChange={e => handlePaymentChange('modeOfPay', e.target.value)} className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded font-black text-[11px] outline-none focus:border-green-600 text-right">
                              <option value="CASH">LIQUID CASH</option>
                              <option value="BANK TRANSFER">BANK / UPI TRF</option>
                              <option value="CHEQUE">CLEARING CHEQUE</option>
                           </select>
                        </div>
                     </div>

                     {/* Financials Logic Cluster */}
                     <div className="grid grid-cols-2 gap-8 p-6 bg-green-50/20 border-2 border-dashed border-green-100 rounded mb-8">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-green-700 uppercase tracking-widest italic">Sync Paid Amount</label>
                           <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-green-300">₹</span>
                              <input type="number" value={paymentData.paidAmount} onChange={e => handlePaymentChange('paidAmount', e.target.value)} className="w-full pl-6 pr-4 py-2.5 bg-white border border-green-200 rounded font-black text-lg text-green-700 outline-none focus:border-green-600" />
                           </div>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Admin Discount</label>
                           <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-300">₹</span>
                              <input type="number" value={paymentData.discount} onChange={e => handlePaymentChange('discount', e.target.value)} className="w-full pl-6 pr-4 py-2.5 bg-white border border-gray-200 rounded font-black text-[13px] text-gray-500 outline-none focus:border-green-600" />
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Ledger Remark</label>
                           <input type="text" value={paymentData.remarks} onChange={e => handlePaymentChange('remarks', e.target.value)} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded font-black text-[10px] uppercase outline-none focus:border-green-600" placeholder="e.g. Cleared via UPI..." />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic text-right block">Payer Context</label>
                           <input type="text" value={paymentData.payerName} onChange={e => handlePaymentChange('payerName', e.target.value)} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded font-black text-[10px] uppercase outline-none focus:border-green-600 text-right" placeholder="Party Name..." />
                        </div>
                     </div>

                      {isClosed && (
                        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 flex items-center gap-3 animate-pulse">
                          <AlertCircle size={18} className="text-red-600" />
                          <div>
                            <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">DayBook Finalized</p>
                            <p className="text-[9px] font-bold text-red-600 mt-0.5">Entries are locked for {paymentData.receivedDate}. Choose another date.</p>
                          </div>
                        </div>
                      )}

                      <button 
                        onClick={handleSubmit} 
                        disabled={submitLoading || isClosed || (parseFloat(paymentData.paidAmount) + parseFloat(paymentData.discount)) <= 0}
                        className="w-full bg-green-600 text-white py-4 rounded font-black uppercase tracking-[0.3em] text-[11px] shadow-lg hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {submitLoading ? <Loader2 size={16} className="animate-spin" /> : isClosed ? <X size={16} /> : <Layers size={16} />}
                        {isClosed ? 'Book Closed - Submission Restricted' : 'Sync Ledger Balance'}
                     </button>
                  </div>
               </div>
            </div>
         ) : (
            <div className="h-[400px] flex flex-col items-center justify-center bg-white border border-gray-200 rounded text-gray-300 shadow-sm transition-all animate-in fade-in">
               <Package size={44} className="mb-2 opacity-20" />
               <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Awaiting Ledger Input</h3>
               <p className="text-[9px] font-black text-gray-400 mt-1 uppercase italic">Scan GC ID Above to Initiate Financial Matrix</p>
            </div>
         )}
      </div>

   </div>
  )
}

export default GCWiseReceive
