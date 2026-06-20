import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Search, Loader2, AlertCircle, CheckCircle2, RotateCcw, FileText, Calendar, Download, IndianRupee, CreditCard, ClipboardList, Wallet, Receipt, Clock, MapPin, X, User, Filter } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api'

function ConsignorWiseReceiveWithoutId() {
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    consignor: '',
    freightType: '',
    branch: '',
  })

  const [branches, setBranches] = useState([])
  const [consignors, setConsignors] = useState([])
  const [waybills, setWaybills] = useState([])
  const [selectedWaybills, setSelectedWaybills] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [transport, setTransport] = useState(null)
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [success, setSuccess] = useState(null)
  const [lastPrintData, setLastPrintData] = useState(null)
  const [isClosed, setIsClosed] = useState(false)
  const [checkLoading, setCheckLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [consignorSearch, setConsignorSearch] = useState('')
  const [gcSearch, setGcSearch] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [overallDiscount, setOverallDiscount] = useState(0)

  const [paymentHeader, setPaymentHeader] = useState({
    receivedDate: new Date().toISOString().split('T')[0],
    modeOfPay: 'CASH',
    remarks: '',
    payerName: '',
    refNo: ''
  })

  useEffect(() => {
    fetchInitialData()
    const user = JSON.parse(localStorage.getItem('user'))
    if (user) {
      setCurrentUser(user)
      if (user.branch_id) {
        setFilters(prev => ({ ...prev, branch: user.branch_id.toString() }))
      }
    }
  }, [])

  useEffect(() => {
    const bid = filters.branch || currentUser?.branch_id
    if (bid && paymentHeader.receivedDate) {
      checkClosingStatus()
    }
  }, [filters.branch, currentUser, paymentHeader.receivedDate])

  const checkClosingStatus = async () => {
    try {
      setCheckLoading(true)
      const bid = filters.branch || currentUser?.branch_id
      const date = paymentHeader.receivedDate
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

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
  }

  const fetchInitialData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      const [branchesRes, consignorsRes, transportsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/branches`),
        axios.get(`${API_BASE_URL}/consignors`),
        axios.get(`${API_BASE_URL}/transports`)
      ])
      if (branchesRes.data.success) {
        if (user && user.role !== 'superadmin') {
          setBranches(branchesRes.data.data.filter(b => b.id == user.branch_id))
        } else {
          setBranches(branchesRes.data.data || [])
        }
      }
      if (transportsRes.data.success && transportsRes.data.data.length > 0) {
        setTransport(transportsRes.data.data[0])
      }
      setConsignors(consignorsRes.data.data || [])
    } catch (err) {
      showNotification('error', 'System initialization failed')
    }
  }

  const filteredConsignors = consignors.filter(c => {
    // Role based branch filtering
    if (currentUser?.role !== 'superadmin') {
      if (c.branch_id && currentUser?.branch_id && c.branch_id.toString() !== currentUser.branch_id.toString()) return false;
    } else {
      if (filters.branch && c.branch_id && c.branch_id.toString() !== filters.branch.toString()) return false;
    }
    // Search text filtering
    return c.name?.toLowerCase().includes(consignorSearch.toLowerCase())
  })

  const handleFetchGCs = async () => {
    if (!filters.consignor) {
      showNotification('error', 'Please select a Consignor to fetch unpaid GCs')
      return
    }

    setLoading(true)
    setWaybills([])
    setSelectedWaybills({})
    setSuccess(null)

    try {
      const params = {
        from_date: filters.fromDate,
        to_date: filters.toDate,
        consignor_id: filters.consignor,
      }
      if (filters.branch) params.branch_id = filters.branch
      if (filters.freightType) params.account_type = filters.freightType

      const response = await axios.get(`${API_BASE_URL}/waybills`, { params })
      if (response.data.success) {
        // Get all GCs
        const fetchedGCs = response.data.data

        setWaybills(fetchedGCs)

        const selConsignor = consignors.find(c => c.id.toString() === filters.consignor)
        setPaymentHeader(prev => ({ ...prev, payerName: selConsignor?.name || '' }))

        // Pre-fill with full balance for each
        const initialSelection = {}
        fetchedGCs.forEach(wb => {
          const balance = parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)
          initialSelection[wb.id] = { paid: balance > 0 ? balance : 0, discount: 0, selected: false }
        })
        setSelectedWaybills(initialSelection)

        if (fetchedGCs.length === 0) {
          showNotification('info', 'No GCs found for this consignor in the selected date range')
        } else {
          showNotification('success', `Found ${fetchedGCs.length} GC(s)`)
        }
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to fetch GCs')
    } finally {
      setLoading(false)
    }
  }

  // Helper - uppercase
  const strtoupper = (s) => (s || '').toUpperCase()

  const toggleSelect = (id) => {
    const wb = waybills.find(w => w.id === id)
    if (wb) {
      const balance = parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)
      if (balance <= 0) {
        showNotification('error', 'This GC is already fully paid!')
        return
      }
    }

    setSelectedWaybills(prev => {
      const current = prev[id]
      if (!current) return prev
      return { ...prev, [id]: { ...current, selected: !current.selected } }
    })
  }

  const handleCellChange = (id, field, value) => {
    const wb = waybills.find(w => w.id === id)
    const balance = parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)
    const newVal = parseFloat(value) || 0

    setSelectedWaybills(prev => {
      const current = prev[id] || { paid: 0, discount: 0, selected: true }
      let updated = { ...current, [field]: newVal }

      if (field === 'paid') {
        if (updated.paid > balance) {
          updated.paid = balance
        }
      }

      return { ...prev, [id]: updated }
    })
  }

  const activeSelections = Object.entries(selectedWaybills).filter(([, v]) => v.selected && v.paid > 0)
  const totalToReceive = activeSelections.reduce((sum, [, item]) => sum + item.paid, 0)
  const totalDiscount = overallDiscount

  const handleSubmit = async () => {
    if (isClosed) {
      showNotification('error', 'Access Denied: DayBook is already closed for this date.')
      return
    }

    const paymentList = []
    let remainingDiscount = parseFloat(overallDiscount) || 0;

    activeSelections.forEach(([id, data]) => {
      const wb = waybills.find(w => w.id === parseInt(id));
      const balance = parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0);
      
      const allocatedDiscount = Math.min(data.paid, remainingDiscount);
      remainingDiscount -= allocatedDiscount;
      
      const paidAmount = Math.max(0, data.paid - allocatedDiscount);
      
      paymentList.push({
        id: parseInt(id),
        paid_amount: paidAmount,
        discount: allocatedDiscount
      });
    });

    if (paymentList.length === 0) {
      showNotification('error', 'Select at least one GC with an amount to receive')
      return
    }

    if (overallDiscount > totalToReceive) {
      showNotification('error', 'Overall discount cannot exceed the total receiving amount.')
      return
    }

    try {
      setSubmitLoading(true)

      const payload = {
        payment_date: paymentHeader.receivedDate,
        mode_of_pay: paymentHeader.modeOfPay,
        remarks: paymentHeader.remarks,
        payer_name: paymentHeader.payerName,
        ref_no: paymentHeader.refNo,
        branch_id: filters.branch || currentUser?.branch_id || waybills[0]?.origin_branch_id,
        payments: paymentList
      }

      const response = await axios.post(`${API_BASE_URL}/waybills/bulk-receive-payment`, payload)
      if (response.data.success) {
        const netPaid = totalToReceive - overallDiscount
        const msg = `Bulk payment of ₹${netPaid.toLocaleString()} processed successfully!`
        setSuccess(msg)
        showNotification('success', msg)

        const printData = {
          receipt_no: response.data.voucher_no || 'VOU-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          date: paymentHeader.receivedDate,
          from: paymentHeader.payerName,
          amount: netPaid,
          discount: overallDiscount,
          mode: paymentHeader.modeOfPay,
          refNo: paymentHeader.refNo,
          gcs: paymentList.length,
          remarks: paymentHeader.remarks
        }
        setLastPrintData(printData)
        setWaybills([])
        setSelectedWaybills({})
        setOverallDiscount(0)
        setFilters(prev => ({ ...prev, consignor: '' }))
        setConsignorSearch('')
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to process payment')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handlePrintVoucher = (data) => {
    const printWindow = window.open('', '_blank')
    const companyName = transport?.transport_name || 'TRANSPORT'
    const logoUrl = transport?.logo_path ? `${STORAGE_URL}/${transport.logo_path}` : ''

    printWindow.document.write(`
      <html>
        <head>
          <title>Voucher - ${data.receipt_no}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #1e293b; background: white; margin: 0; }
            .voucher { border: 1.5px solid #6366f1; border-radius: 12px; padding: 24px; max-width: 500px; margin: auto; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 16px; }
            .brand { display: flex; align-items: center; gap: 10px; }
            .logo-img { height: 32px; width: auto; object-fit: contain; }
            .logo-text { font-size: 18px; font-weight: 900; color: #6366f1; letter-spacing: -0.5px; }
            .title { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
            .field { margin-bottom: 8px; }
            .label { font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
            .value { font-size: 11px; font-weight: 700; color: #1e293b; margin-top: 2px; }
            .amount-box { background: #eff6ff; padding: 14px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #dbeafe; }
            .total-label { font-size: 9px; font-weight: 800; color: #6366f1; text-transform: uppercase; }
            .total-value { font-size: 20px; font-weight: 900; color: #1e1b4b; letter-spacing: -0.5px; }
            .remarks { margin-top: 14px; padding: 10px; background: #f8fafc; border-radius: 8px; }
            .remarks-text { font-size: 9px; font-weight: 600; color: #475569; font-style: italic; }
            .footer { margin-top: 32px; display: flex; justify-content: space-between; }
            .signature { border-top: 1px solid #e2e8f0; padding-top: 6px; width: 140px; text-align: center; font-size: 9px; font-weight: 700; color: #94a3b8; }
            @media print { body { padding: 0; } .voucher { border: 1px solid #ccc; box-shadow: none; border-radius: 0; max-width: 100%; } }
          </style>
        </head>
        <body>
          <div class="voucher">
            <div class="header">
              <div class="brand">
                ${logoUrl ? `<img src="${logoUrl}" class="logo-img" onerror="this.style.display='none'">` : ''}
                <div class="logo-text">${companyName}</div>
              </div>
              <div class="title">Payment Voucher</div>
            </div>
            <div class="info-grid">
              <div class="field"><div class="label">Voucher No</div><div class="value">${data.receipt_no}</div></div>
              <div class="field" style="text-align:right"><div class="label">Date</div><div class="value">${new Date(data.date).toLocaleDateString('en-GB')}</div></div>
              <div class="field"><div class="label">Received From</div><div class="value">${data.from}</div></div>
              <div class="field" style="text-align:right"><div class="label">Mode</div><div class="value">${data.mode}${data.refNo ? ' [' + data.refNo + ']' : ''}</div></div>
            </div>
            <div class="amount-box">
              <div>
                <div class="label">GCs Cleared</div>
                <div class="value" style="font-size:14px">${data.gcs} Records</div>
              </div>
              <div style="text-align:right">
                <div class="total-label">Amount Received</div>
                <div class="total-value">₹${parseFloat(data.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                ${data.discount > 0 ? `<div style="font-size:8px;font-weight:700;color:#6366f1;opacity:0.7">+ ₹${data.discount} Discount Applied</div>` : ''}
              </div>
            </div>
            <div class="remarks">
              <div class="label">Notes</div>
              <div class="remarks-text">${data.remarks || 'Direct consignor payment received without report ID.'}</div>
            </div>
            <div class="footer">
              <div class="signature">Receiver Sign</div>
              <div class="signature">Authorized Sign</div>
            </div>
          </div>
          <script>
            window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="h-full bg-indigo-50/10 p-2 md:p-6 font-plus-jakarta overflow-auto relative">

      {/* Modal Notification */}
      {notification.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => setNotification({ ...notification, show: false })}
          />
          <div className={`relative flex flex-col items-center gap-4 px-10 py-8 rounded-[2.5rem] shadow-2xl border-4 max-w-sm w-full text-center ${
            notification.type === 'success' ? 'bg-white border-indigo-500' :
            notification.type === 'error' ? 'bg-white border-rose-500' : 'bg-white border-blue-500'
          }`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 ${
              notification.type === 'success' ? 'bg-indigo-100 text-indigo-600' :
              notification.type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {notification.type === 'success' ? <CheckCircle2 size={40} strokeWidth={2.5} /> :
               notification.type === 'error' ? <AlertCircle size={40} strokeWidth={2.5} /> :
               <Loader2 size={40} className="animate-spin" />}
            </div>
            <div>
              <h3 className={`text-xl font-black uppercase tracking-tighter ${
                notification.type === 'success' ? 'text-indigo-600' :
                notification.type === 'error' ? 'text-rose-600' : 'text-blue-600'
              }`}>
                {notification.type === 'success' ? 'Success!' :
                 notification.type === 'error' ? 'Action Failed' : 'Info'}
              </h3>
              <p className="text-slate-500 font-bold text-sm mt-1 leading-relaxed">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification({ ...notification, show: false })}
              className={`mt-4 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg ${
                notification.type === 'success' ? 'bg-indigo-600 hover:bg-indigo-700' :
                notification.type === 'error' ? 'bg-rose-600 hover:bg-rose-700' :
                'bg-blue-600'
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <Wallet className="text-white" size={20} />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Consignor Wise Receive</h1>
              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Without Report ID · Direct GC Payment</p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100/50 p-4 hover:shadow-md transition-all">
          <div className="flex flex-wrap items-end gap-3 text-left">

            {/* From Date */}
            <div className="w-32 space-y-1.5">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">From Date</span>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-slate-300 focus:border-indigo-500 rounded-xl outline-none font-bold text-slate-700 text-xs transition-all"
              />
            </div>

            {/* To Date */}
            <div className="w-32 space-y-1.5">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">To Date</span>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-slate-300 focus:border-indigo-500 rounded-xl outline-none font-bold text-slate-700 text-xs transition-all"
              />
            </div>

            {/* Consignor with search */}
            <div className="min-w-[220px] flex-1 space-y-1.5">
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                <User size={10} /> Consignor *
              </span>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none h-10">
                  <Search size={12} className="text-indigo-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search consignor..."
                  value={consignorSearch}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  onChange={(e) => {
                    setConsignorSearch(e.target.value)
                    if (!e.target.value) setFilters(prev => ({ ...prev, consignor: '' }))
                  }}
                  className="w-full h-10 pl-8 pr-8 bg-indigo-50/50 border border-indigo-200 focus:border-indigo-500 rounded-xl outline-none font-bold text-slate-700 text-xs transition-all"
                />
                {filters.consignor && (
                  <div className="absolute inset-y-0 right-3 flex items-center h-10">
                    <button 
                      onClick={() => { setFilters(prev => ({ ...prev, consignor: '' })); setConsignorSearch('') }}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {(isDropdownOpen || consignorSearch) && !filters.consignor && (
                  <div className="absolute left-0 right-0 w-full z-20 bg-white border border-indigo-100 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                    {filteredConsignors.length === 0 ? (
                      <div className="p-3 text-[10px] text-slate-400 text-center font-bold">No results</div>
                    ) : filteredConsignors.slice(0, 15).map(c => (
                      <div
                        key={c.id}
                        onMouseDown={(e) => {
                          e.preventDefault() // prevent onBlur from hiding dropdown
                          setFilters(prev => ({ ...prev, consignor: c.id.toString() }))
                          setConsignorSearch(c.name)
                          setIsDropdownOpen(false)
                        }}
                        className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer text-xs font-bold text-slate-700 border-b border-slate-50 last:border-0 transition-colors"
                      >
                        {c.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Freight Type */}
            <div className="w-36 space-y-1.5">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Freight Type</span>
              <select
                value={filters.freightType}
                onChange={(e) => setFilters({ ...filters, freightType: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-slate-300 focus:border-indigo-500 rounded-xl outline-none font-bold text-slate-700 text-xs transition-all uppercase"
              >
                <option value="">All Types</option>
                <option value="account">ACCOUNT</option>
                <option value="topay">TO PAY</option>
                <option value="paid">PAID</option>
              </select>
            </div>

            {/* Branch */}
            <div className="min-w-[150px] space-y-1.5">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Branch</span>
              <select
                value={filters.branch}
                onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                disabled={currentUser?.role !== 'superadmin'}
                className="w-full h-10 px-3 bg-white border border-slate-300 focus:border-indigo-500 rounded-xl outline-none font-bold text-slate-700 text-xs transition-all uppercase disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.branch_name}</option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleFetchGCs}
                disabled={loading}
                className="h-10 px-6 bg-indigo-600 hover:bg-black text-white rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={12} /> : <Search size={12} />}
                Fetch GCs
              </button>
              <button
                onClick={() => {
                  setFilters({
                    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().split('T')[0],
                    toDate: new Date().toISOString().split('T')[0],
                    consignor: '',
                    freightType: '',
                    branch: currentUser?.branch_id ? currentUser.branch_id.toString() : '',
                  })
                  setConsignorSearch('')
                  setWaybills([])
                  setSelectedWaybills({})
                }}
                className="h-10 px-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center transition-all active:scale-95"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Success Bar */}
        {success && (
          <div className="bg-indigo-600 border border-indigo-400 p-4 rounded-2xl flex items-center gap-4 shadow-xl shadow-indigo-100">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
              <CheckCircle2 size={24} />
            </div>
            <div className="flex-1">
              <p className="text-white font-black text-xs uppercase tracking-widest leading-tight">Payment Recorded</p>
              <p className="text-indigo-100 font-bold text-[10px] mt-0.5">{success}</p>
            </div>
            <button
              onClick={() => handlePrintVoucher(lastPrintData)}
              className="px-6 py-2.5 bg-white text-indigo-700 hover:bg-black hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg"
            >
              <Download size={14} /> Print Voucher
            </button>
            <button onClick={() => setSuccess(null)} className="p-2 text-white/50 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        )}

        {/* GC Cards */}
        {waybills.length > 0 ? (
          <div className="space-y-4 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
              <div className="flex items-center gap-2">
                <Receipt size={14} className="text-indigo-600" />
                <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                  GCs — {consignors.find(c => c.id.toString() === filters.consignor)?.name}
                </h3>
                <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full ml-1">
                  {waybills.length} Records
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none h-8">
                    <Search size={12} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search GC Number..."
                    value={gcSearch}
                    onChange={(e) => setGcSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 bg-white border border-slate-300 focus:border-indigo-500 rounded-lg outline-none font-bold text-slate-700 text-xs transition-all"
                  />
                  {gcSearch && (
                    <button 
                      onClick={() => setGcSearch('')}
                      className="absolute inset-y-0 right-3 flex items-center h-8 text-slate-500 hover:text-slate-700"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    const filteredWbs = waybills.filter(wb => wb.gc_number.toLowerCase().includes(gcSearch.toLowerCase()))
                    const unpaidWbs = filteredWbs.filter(wb => (parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)) > 0)
                    if (unpaidWbs.length === 0) {
                       showNotification('error', 'All visible GCs are already fully paid!')
                       return
                    }
                    const allSelected = unpaidWbs.every(wb => selectedWaybills[wb.id]?.selected)
                    setSelectedWaybills(prev => {
                      const updated = { ...prev }
                      filteredWbs.forEach(wb => {
                        if (updated[wb.id]) {
                           const balance = parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)
                           if (balance > 0) {
                             updated[wb.id] = { ...updated[wb.id], selected: !allSelected }
                           }
                        }
                      })
                      return updated
                    })
                  }}
                  className="whitespace-nowrap text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {waybills.filter(wb => wb.gc_number.toLowerCase().includes(gcSearch.toLowerCase()) && (parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)) > 0).every(wb => selectedWaybills[wb.id]?.selected) ? 'Deselect All Visible' : 'Select All Visible'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={waybills.filter(wb => wb.gc_number.toLowerCase().includes(gcSearch.toLowerCase()) && (parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)) > 0).length > 0 && waybills.filter(wb => wb.gc_number.toLowerCase().includes(gcSearch.toLowerCase()) && (parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)) > 0).every(wb => selectedWaybills[wb.id]?.selected)}
                          onChange={() => {
                            const filteredWbs = waybills.filter(wb => wb.gc_number.toLowerCase().includes(gcSearch.toLowerCase()))
                            const unpaidWbs = filteredWbs.filter(wb => (parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)) > 0)
                            if (unpaidWbs.length === 0) {
                               showNotification('error', 'All visible GCs are already fully paid!')
                               return
                            }
                            const allSelected = unpaidWbs.every(wb => selectedWaybills[wb.id]?.selected)
                            setSelectedWaybills(prev => {
                              const updated = { ...prev }
                              filteredWbs.forEach(wb => {
                                if (updated[wb.id]) {
                                   const balance = parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)
                                   if (balance > 0) {
                                     updated[wb.id] = { ...updated[wb.id], selected: !allSelected }
                                   }
                                }
                              })
                              return updated
                            })
                          }}
                          className="w-4 h-4 border-slate-300 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-3">GC Number</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Destination</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-right">Billed (₹)</th>
                      <th className="p-3 text-right">Received (₹)</th>
                      <th className="p-3 text-right">Balance (₹)</th>
                      <th className="p-3 w-40 text-center">Receive Amount (₹)</th>
                      <th className="p-3 w-28 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {waybills.filter(wb => wb.gc_number.toLowerCase().includes(gcSearch.toLowerCase())).map((wb) => {
                      const balance = parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)
                      const isPaid = balance <= 0
                      const sel = selectedWaybills[wb.id] || { paid: 0, discount: 0, selected: false }
                      const isSelected = sel.selected

                      return (
                        <tr 
                          key={wb.id} 
                          className={`hover:bg-slate-50/50 transition-colors ${
                            isPaid ? 'bg-slate-50/50 opacity-60' : isSelected ? 'bg-indigo-50/10' : ''
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isPaid}
                              onChange={() => !isPaid && toggleSelect(wb.id)}
                              className="w-4 h-4 border-slate-300 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="p-3 font-bold text-slate-800">{wb.gc_number}</td>
                          <td className="p-3 text-slate-500">{new Date(wb.bill_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                          <td className="p-3 text-slate-600">{wb.destination?.city_name || '-'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              wb.account_type === 'account' ? 'bg-blue-50 text-blue-600' :
                              wb.account_type === 'topay' ? 'bg-amber-50 text-amber-600' :
                              'bg-slate-50 text-slate-500'
                            }`}>{wb.account_type}</span>
                          </td>
                          <td className="p-3 text-right text-slate-700">₹{parseFloat(wb.grand_total).toLocaleString()}</td>
                          <td className="p-3 text-right text-emerald-600">₹{parseFloat(wb.amount_paid || 0).toLocaleString()}</td>
                          <td className="p-3 text-right text-rose-600 font-bold">₹{balance.toLocaleString()}</td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              value={isSelected && !isPaid ? sel.paid : ''}
                              disabled={isPaid || !isSelected}
                              onChange={(e) => handleCellChange(wb.id, 'paid', e.target.value)}
                              className="w-32 h-8 px-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg text-center font-bold text-slate-700 outline-none text-xs disabled:bg-slate-100 disabled:text-slate-400"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-3 text-center">
                            {isPaid ? (
                              <span className="inline-block bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded-lg border border-emerald-200">✓ PAID</span>
                            ) : (
                              <span className="inline-block bg-green-50 text-green-600 text-[9px] font-bold px-2 py-0.5 rounded-lg border border-green-100">DELIVERED</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Bar */}
            <div className="bg-white rounded-[2rem] p-4 md:p-6 shadow-xl border border-indigo-100 mt-6">
              <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-8 text-left border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-8 w-full xl:w-auto">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Receiving Total</p>
                    <span className="text-indigo-600 text-2xl font-black italic tracking-tighter">₹{totalToReceive.toLocaleString()}</span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Overall Discount</p>
                    <input
                      type="number"
                      value={overallDiscount || ''}
                      onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-28 h-8 bg-indigo-50/50 border border-indigo-100 focus:border-indigo-600 rounded-lg text-center font-black text-indigo-700 outline-none text-xs shadow-inner"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Cash to Receive</p>
                    <span className="text-emerald-600 text-2xl font-black italic tracking-tighter">₹{(totalToReceive - overallDiscount).toLocaleString()}</span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GCs Selected</p>
                    <p className="text-slate-700 text-xl font-black italic tracking-tighter">{activeSelections.length}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4 w-full xl:flex-1 text-left">
                  <div className="flex flex-col gap-1 min-w-[150px] flex-1 lg:flex-none">
                    <span className="text-[8px] font-black text-indigo-600/60 uppercase tracking-widest ml-1">Received From</span>
                    <input
                      type="text"
                      placeholder="Person name..."
                      value={paymentHeader.payerName}
                      onChange={(e) => setPaymentHeader({ ...paymentHeader, payerName: e.target.value })}
                      className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 font-black text-[10px] outline-none text-indigo-800 placeholder:text-indigo-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1 min-w-[130px] flex-1 lg:flex-none">
                    <span className="text-[8px] font-black text-indigo-600/60 uppercase tracking-widest ml-1">Mode</span>
                    <select
                      value={paymentHeader.modeOfPay}
                      onChange={(e) => setPaymentHeader({ ...paymentHeader, modeOfPay: e.target.value })}
                      className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 font-black text-[10px] outline-none text-indigo-800 uppercase focus:border-indigo-500 transition-colors"
                    >
                      <option value="CASH">CASH</option>
                      <option value="UPI">UPI / ONLINE</option>
                      <option value="CHEQUE">CHEQUE</option>
                    </select>
                  </div>

                  {paymentHeader.modeOfPay !== 'CASH' && (
                    <div className="flex flex-col gap-1 min-w-[130px] flex-1 lg:flex-none">
                      <span className="text-[8px] font-black text-indigo-600/60 uppercase tracking-widest ml-1">Ref / Chq No</span>
                      <input
                        type="text"
                        placeholder="UTR/Chq number"
                        value={paymentHeader.refNo}
                        onChange={(e) => setPaymentHeader({ ...paymentHeader, refNo: e.target.value })}
                        className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 font-black text-[10px] outline-none text-indigo-800 placeholder:text-indigo-200"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1 min-w-[120px] flex-1 lg:flex-none">
                    <span className="text-[8px] font-black text-indigo-600/60 uppercase tracking-widest ml-1">Receipt Date</span>
                    <input
                      type="date"
                      value={paymentHeader.receivedDate}
                      onChange={(e) => setPaymentHeader({ ...paymentHeader, receivedDate: e.target.value })}
                      className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 font-black text-[10px] outline-none text-indigo-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                    <span className="text-[8px] font-black text-indigo-600/60 uppercase tracking-widest ml-1">Notes</span>
                    <input
                      type="text"
                      placeholder="Transaction notes..."
                      value={paymentHeader.remarks}
                      onChange={(e) => setPaymentHeader({ ...paymentHeader, remarks: e.target.value })}
                      className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 font-bold text-[10px] outline-none text-indigo-900 placeholder:text-indigo-300 focus:bg-white focus:border-indigo-400 transition-all"
                    />
                  </div>

                  {isClosed && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl animate-pulse">
                      <AlertCircle size={16} className="text-rose-600" />
                      <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest leading-none">DayBook Closed — Restricted</p>
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={submitLoading || isClosed || (totalToReceive + totalDiscount) <= 0.01}
                    className="h-12 px-8 bg-indigo-600 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[2px] text-[10px] shadow-lg shadow-indigo-200 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-30 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-3 w-full lg:w-auto"
                  >
                    {submitLoading ? <Loader2 className="animate-spin" size={16} /> : isClosed ? <X size={16} /> : <CheckCircle2 size={16} />}
                    {isClosed ? 'Book Closed' : 'Submit Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-24 bg-white rounded-[2rem] shadow-sm border border-indigo-50 flex flex-col items-center justify-center space-y-6">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
              <ClipboardList size={40} className="text-indigo-200" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-700 uppercase tracking-widest">No GCs Loaded</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Select a consignor and fetch unpaid delivered GCs</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        .font-plus-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e0e7ff; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #6366f1; }
      `}</style>
    </div>
  )
}

export default ConsignorWiseReceiveWithoutId
