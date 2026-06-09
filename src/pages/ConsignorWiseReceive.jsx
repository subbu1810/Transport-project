import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Search, Loader2, AlertCircle, CheckCircle2, RotateCcw, Filter, FileText, Users, User, Calendar, ArrowRight, Download, IndianRupee, Hash, CreditCard, ClipboardList, Wallet, Receipt, Clock, MapPin, X } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function ConsignorWiseReceive() {
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    consignor: '',
    freightType: 'account',
    branch: '',
    receiptNo: ''
  })

  const [branches, setBranches] = useState([])
  const [consignors, setConsignors] = useState([])
  const [pendingReceipts, setPendingReceipts] = useState([])
  const [waybills, setWaybills] = useState([])
  const [loading, setLoading] = useState(false)
  const [receiptsLoading, setReceiptsLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [lastPrintData, setLastPrintData] = useState(null)
  const [selectedWaybills, setSelectedWaybills] = useState({})
  const [transport, setTransport] = useState(null)
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [isClosed, setIsClosed] = useState(false)
  const [checkLoading, setCheckLoading] = useState(false)

  const [paymentHeader, setPaymentHeader] = useState({
    receivedDate: new Date().toISOString().split('T')[0],
    modeOfPay: 'CASH',
    remarks: '',
    payerName: '',
    refNo: ''
  })

  const [currentUser, setCurrentUser] = useState(null)
  const [consignorSearch, setConsignorSearch] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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
    // No auto-dismiss for "proper" modal popups, user clicks "Continue"
  }

  const fetchInitialData = async () => {
    try {
      setReceiptsLoading(true)
      const user = JSON.parse(localStorage.getItem('user'))
      const rParams = { pending_only: 1 }
      if (user && user.role !== 'superadmin' && user.branch_id) {
        rParams.branch_id = user.branch_id
      }

      const [branchesRes, consignorsRes, receiptsRes, transportsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/branches`),
        axios.get(`${API_BASE_URL}/consignors`),
        axios.get(`${API_BASE_URL}/consignor-receipts`, { params: rParams }),
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
        setTransport(transportsRes.data.data[0]) // Get the first active transport for branding
      }
      setConsignors(consignorsRes.data.data || [])
      setPendingReceipts(receiptsRes.data.data || [])
    } catch (err) {
      setError('System initialization failed')
    } finally {
      setReceiptsLoading(false)
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

  const handleGetDetails = async () => {
    if (!filters.consignor && !filters.receiptNo) {
      showNotification('error', 'Please select a Report ID or a Consignor')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setWaybills([])
    setSelectedWaybills({})

    try {
      if (filters.receiptNo) {
        const response = await axios.get(`${API_BASE_URL}/consignor-receipts/${filters.receiptNo}`)
        if (response.data.success) {
          const receipt = response.data.data
          const wbList = receipt.waybills || []

          const pendingWb = wbList.filter(wb =>
            (parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)) > 0.1 || wb.account_type === 'paid'
          )

          setWaybills(pendingWb)
          setPaymentHeader(prev => ({
            ...prev,
            payerName: receipt.consignor?.name || '',
            remarks: `Payment for Report: ${receipt.receipt_no}`
          }))
          if (receipt.branch_id) {
            setFilters(prev => ({ ...prev, branch: receipt.branch_id.toString() }))
          }

          const initialSelection = {}
          pendingWb.forEach(wb => {
            const balance = parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)
            initialSelection[wb.id] = { paid: balance, discount: 0, selected: false }
          })
          setSelectedWaybills(initialSelection)

          if (pendingWb.length === 0) {
            showNotification('info', 'Report is already fully paid')
          } else {
            showNotification('success', `Fetched ${pendingWb.length} GCs from Report`)
          }
        }
      } else {
        const params = {
          from_date: filters.fromDate,
          to_date: filters.toDate,
          consignor_id: filters.consignor,
          account_type: filters.freightType
        }
        if (filters.branch) params.branch_id = filters.branch

        const response = await axios.get(`${API_BASE_URL}/waybills`, { params })
        if (response.data.success) {
          const pendingWb = response.data.data.filter(wb =>
            (parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)) > 0.1
          )
          setWaybills(pendingWb)
          const selConsignor = consignors.find(c => c.id.toString() === filters.consignor)
          setPaymentHeader(prev => ({ ...prev, payerName: selConsignor?.name || '' }))
          
          if (pendingWb.length === 0) {
            showNotification('info', 'No pending shipments found')
          } else {
            showNotification('success', `Found ${pendingWb.length} shipments`)
          }
        }
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Data retrieval error')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id) => {
    setSelectedWaybills(prev => {
      const current = prev[id] || { paid: 0, discount: 0, selected: false }
      return { ...prev, [id]: { ...current, selected: !current.selected } }
    })
  }

  const handleCellChange = (id, field, value) => {
    const wb = waybills.find(w => w.id === id)
    const balance = parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)
    const newVal = parseFloat(value) || 0

    setSelectedWaybills(prev => {
      const current = prev[id] || { paid: 0, discount: 0, selected: false }
      let updated = { ...current, [field]: newVal }

      // Smart Adjustment:
      // If we are editing discount, adjust the paid amount to fit balance
      if (field === 'discount') {
        if (updated.discount > balance) {
          updated.discount = balance;
          updated.paid = 0;
        } else if (updated.paid + updated.discount > balance) {
          updated.paid = Math.max(0, balance - updated.discount);
        }
      }
      // If we are editing paid amount, adjust it if it exceeds balance - current discount
      else if (field === 'paid') {
        if (updated.paid > balance) {
          updated.paid = balance;
          updated.discount = 0;
        } else if (updated.paid + updated.discount > balance) {
          updated.discount = Math.max(0, balance - updated.paid);
        }
      }

      setError(null)
      return { ...prev, [id]: updated }
    })
  }

  const activeSelections = Object.entries(selectedWaybills).filter(([, v]) => v.selected && (v.paid > 0 || v.discount > 0))
  const totalToReceive = activeSelections.reduce((sum, [, item]) => sum + item.paid, 0)
  const totalDiscount = activeSelections.reduce((sum, [, item]) => sum + item.discount, 0)

  const handleSubmit = async () => {
    if (isClosed) {
      showNotification('error', 'Access Denied: DayBook is already closed for this date.')
      return
    }
    try {
      const paymentList = activeSelections.map(([id, data]) => ({
        id: parseInt(id),
        paid_amount: data.paid,
        discount: data.discount
      }))

      if (paymentList.length === 0) {
        showNotification('error', 'Select at least one GC or enter an amount')
        return
      }

      setSubmitLoading(true)
      setError(null)

      const payload = {
        payment_date: paymentHeader.receivedDate,
        mode_of_pay: paymentHeader.modeOfPay,
        remarks: paymentHeader.remarks,
        payer_name: paymentHeader.payerName,
        ref_no: paymentHeader.refNo,
        branch_id: filters.branch || currentUser?.branch_id || (waybills[0]?.origin_branch_id),
        payments: paymentList
      }

      const response = await axios.post(`${API_BASE_URL}/waybills/bulk-receive-payment`, payload)
      if (response.data.success) {
        const msg = response.data.message || `Bulk payment of ₹${response.data.total_paid.toLocaleString()} processed!`
        setSuccess(msg)
        showNotification('success', msg)
        setWaybills([])
        setSelectedWaybills({})
        // Keep a copy for printing before reset if needed
        const printData = {
          receipt_no: response.data.voucher_no || 'VOU-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          date: paymentHeader.receivedDate,
          from: paymentHeader.payerName,
          amount: response.data.total_paid,
          discount: totalDiscount,
          mode: paymentHeader.modeOfPay,
          refNo: paymentHeader.refNo,
          gcs: paymentList.length,
          remarks: paymentHeader.remarks
        }
        setLastPrintData(printData)
        setFilters(prev => ({ ...prev, receiptNo: '' }))
        fetchInitialData()

        // Auto-print option or show print button
        console.log('Payment Successful', printData)
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to process bulk payment')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handlePrintVoucher = (data) => {
    const printWindow = window.open('', '_blank');
    const companyName = transport?.transport_name || 'GARUDA';
    const logoUrl = transport?.logo_path ? `${STORAGE_URL}/${transport.logo_path}` : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Voucher - ${data.receipt_no}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #1e293b; background: white; margin: 0; }
            .voucher { 
              border: 1.5px solid #10b981; 
              border-radius: 12px; 
              padding: 24px; 
              max-width: 500px; 
              margin: auto; 
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center;
              border-bottom: 1px solid #f1f5f9; 
              padding-bottom: 12px; 
              margin-bottom: 16px; 
            }
            .brand { display: flex; align-items: center; gap: 10px; }
            .logo-img { height: 32px; width: auto; object-fit: contain; }
            .logo-text { font-size: 18px; font-weight: 900; color: #10b981; letter-spacing: -0.5px; }
            .title { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; }
            
            .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
            .field { margin-bottom: 8px; }
            .label { font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
            .value { font-size: 11px; font-weight: 700; color: #1e293b; margin-top: 2px; }
            
            .amount-box { 
              background: #f0fdf4; 
              padding: 14px; 
              border-radius: 10px; 
              display: flex; 
              justify-content: space-between; 
              align-items: center;
              border: 1px solid #dcfce7;
            }
            .total-label { font-size: 9px; font-weight: 800; color: #10b981; text-transform: uppercase; }
            .total-value { font-size: 20px; font-weight: 900; color: #064e3b; letter-spacing: -0.5px; }
            
            .remarks { margin-top: 14px; padding: 10px; background: #f8fafc; border-radius: 8px; }
            .remarks-text { font-size: 9px; font-weight: 600; color: #475569; font-style: italic; }
            
            .footer { margin-top: 32px; display: flex; justify-content: space-between; }
            .signature { border-top: 1px solid #e2e8f0; padding-top: 6px; width: 140px; text-align: center; font-size: 9px; font-weight: 700; color: #94a3b8; }
            
            @media print {
              body { padding: 0; }
              .voucher { border: 1px solid #ccc; box-shadow: none; border-radius: 0; max-width: 100%; }
              .amount-box { background: #f9f9f9 !important; -webkit-print-color-adjust: exact; }
            }
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
              <div class="field">
                <div class="label">Voucher Num</div>
                <div class="value">${data.receipt_no}</div>
              </div>
              <div class="field" style="text-align: right;">
                <div class="label">Date</div>
                <div class="value">${new Date(data.date).toLocaleDateString('en-GB')}</div>
              </div>
              <div class="field">
                <div class="label">Received From</div>
                <div class="value">${data.from}</div>
              </div>
              <div class="field" style="text-align: right;">
                <div class="label">Mode / Channel</div>
                <div class="value">${data.mode} ${data.refNo ? '[' + data.refNo + ']' : ''}</div>
              </div>
            </div>
            
            <div class="amount-box">
              <div>
                <div class="label">GCs Paid</div>
                <div class="value" style="font-size: 14px;">${data.gcs} Records</div>
              </div>
              <div style="text-align: right;">
                <div class="total-label">Amount Received</div>
                <div class="total-value">₹${parseFloat(data.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                ${data.discount > 0 ? `<div style="font-size: 8px; font-weight: 700; color: #059669; opacity: 0.7;">+ ₹${data.discount} Discount Applied</div>` : ''}
              </div>
            </div>
            
            <div class="remarks">
              <div class="label">Notes</div>
              <div class="remarks-text">${data.remarks || 'Standard bulk receipt payment processed successfully.'}</div>
            </div>
            
            <div class="footer">
              <div class="signature">Receiver Sign</div>
              <div class="signature">Authorized Sign</div>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="h-full bg-green-50/10 p-2 md:p-6 font-plus-jakarta overflow-auto relative">
      {/* Centered Modal Notification */}
      {notification.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300"
            onClick={() => setNotification({ ...notification, show: false })}
          ></div>
          <div className={`relative flex flex-col items-center gap-4 px-10 py-8 rounded-[2.5rem] shadow-2xl border-4 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 max-w-sm w-full text-center ${
            notification.type === 'success' ? 'bg-white border-green-500' :
            notification.type === 'error' ? 'bg-white border-rose-500' : 'bg-white border-blue-500'
          }`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 ${
              notification.type === 'success' ? 'bg-green-100 text-green-600' :
              notification.type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {notification.type === 'success' ? <CheckCircle2 size={40} strokeWidth={2.5} /> :
               notification.type === 'error' ? <AlertCircle size={40} strokeWidth={2.5} /> : 
               <Loader2 size={40} className="animate-spin" />}
            </div>
            <div>
              <h3 className={`text-xl font-black uppercase tracking-tighter ${
                notification.type === 'success' ? 'text-green-600' :
                notification.type === 'error' ? 'text-rose-600' : 'text-blue-600'
              }`}>
                {notification.type === 'success' ? 'Great Success!' :
                 notification.type === 'error' ? 'Action Failed' : 'Scanning Records'}
              </h3>
              <p className="text-slate-500 font-bold text-sm mt-1 leading-relaxed">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification({ ...notification, show: false })}
              className={`mt-4 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg ${
                notification.type === 'success' ? 'bg-green-600 shadow-green-200 hover:bg-green-700' :
                notification.type === 'error' ? 'bg-rose-600 shadow-rose-200 hover:bg-rose-700' : 
                'bg-blue-600 shadow-blue-200'
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="w-full space-y-4">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-100">
              <Wallet className="text-white" size={20} />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Consignor Wise Receive</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Bulk Payment Hub</p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-green-100/50 p-4 transition-all hover:shadow-md">
          <div className="flex flex-wrap items-end gap-3 text-left">
            {/* Primary Search: Report ID */}
            <div className="min-w-[220px] flex-1 space-y-1.5">
              <span className="text-[9px] font-black text-green-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <Hash size={12} /> Specific Report ID
              </span>
              <select
                value={filters.receiptNo}
                onChange={(e) => setFilters({ ...filters, receiptNo: e.target.value })}
                className="w-full h-10 px-4 bg-green-50/50 border border-green-200 focus:border-green-500 rounded-xl outline-none font-bold text-slate-700 text-xs transition-all uppercase"
              >
                <option value="">-- Or Search By Consignor --</option>
                {pendingReceipts.map(r => (
                  <option key={r.id} value={r.receipt_no}>
                    {r.receipt_no} — {r.consignor?.name}
                  </option>
                ))}
              </select>
            </div>

            {!filters.receiptNo && (
              <>
                <div className="w-32 space-y-1.5">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">From Date</span>
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-slate-200 focus:border-green-500 rounded-xl outline-none font-bold text-slate-700 text-xs transition-all"
                  />
                </div>
                <div className="w-32 space-y-1.5">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">To Date</span>
                  <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-slate-200 focus:border-green-500 rounded-xl outline-none font-bold text-slate-700 text-xs transition-all"
                  />
                </div>
                <div className="min-w-[220px] flex-1 space-y-1.5">
                  <span className="text-[9px] font-black text-green-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <User size={10} /> Consignor *
                  </span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none h-10">
                      <Search size={12} className="text-green-400" />
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
                      className="w-full h-10 pl-8 pr-8 bg-green-50/50 border border-green-200 focus:border-green-500 rounded-xl outline-none font-bold text-slate-700 text-xs transition-all"
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
                      <div className="absolute left-0 right-0 w-full z-20 bg-white border border-green-100 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                        {filteredConsignors.length === 0 ? (
                          <div className="p-3 text-[10px] text-slate-400 text-center font-bold">No results</div>
                        ) : filteredConsignors.slice(0, 15).map(c => (
                          <div
                            key={c.id}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setFilters(prev => ({ ...prev, consignor: c.id.toString() }))
                              setConsignorSearch(c.name)
                              setIsDropdownOpen(false)
                            }}
                            className="px-4 py-2.5 hover:bg-green-50 cursor-pointer text-xs font-bold text-slate-700 border-b border-slate-50 last:border-0 transition-colors"
                          >
                            {c.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-32 space-y-1.5">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Freight Type</span>
                  <select
                    value={filters.freightType}
                    onChange={(e) => setFilters({ ...filters, freightType: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-slate-200 focus:border-green-500 rounded-xl outline-none font-bold text-slate-700 text-xs transition-all uppercase"
                  >
                    <option value="account">ACCOUNT</option>
                    <option value="topay">TO PAY</option>
                    <option value="paid">PAID</option>
                  </select>
                </div>
                <div className="min-w-[150px] space-y-1.5">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Branch</span>
                  <select
                    value={filters.branch}
                    onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                    disabled={currentUser?.role !== 'superadmin'}
                    className="w-full h-10 px-3 bg-white border border-slate-200 focus:border-green-500 rounded-xl outline-none font-bold text-slate-700 text-xs transition-all uppercase disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">All Branches</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.branch_name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleGetDetails}
                disabled={loading}
                className="h-10 px-6 bg-green-600 hover:bg-black text-white rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 shadow-lg shadow-green-100 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={12} /> : <Search size={12} />}
                Fetch Records
              </button>
              <button
                onClick={() => {
                  setFilters({
                    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().split('T')[0],
                    toDate: new Date().toISOString().split('T')[0],
                    consignor: '',
                    freightType: 'account',
                    branch: currentUser?.branch_id ? currentUser.branch_id.toString() : '',
                    receiptNo: ''
                  })
                  setConsignorSearch('')
                  setWaybills([])
                }}
                className="h-10 px-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center transition-all active:scale-95"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Success Action Bar (Persistent after payment) */}
        <div className="px-1">
          {success && (
            <div className="bg-green-600 border border-green-400 p-4 rounded-2xl flex items-center gap-4 shadow-xl shadow-green-100 animate-in slide-in-from-top-4 duration-500">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                <CheckCircle2 size={24} />
              </div>
              <div className="flex-1">
                <p className="text-white font-black text-xs uppercase tracking-widest leading-tight">Payment Recorded</p>
                <p className="text-green-100 font-bold text-[10px] mt-0.5">{success}</p>
              </div>
              <button
                onClick={() => handlePrintVoucher(lastPrintData)}
                className="px-6 py-2.5 bg-white text-green-700 hover:bg-black hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg"
              >
                <Download size={14} /> Print Voucher
              </button>
              <button
                onClick={() => setSuccess(null)}
                className="p-2 text-white/50 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Small Cards Layout */}
        {waybills.length > 0 ? (
          <div className="space-y-4 animate-in fade-in duration-500 text-left">
            <div className="flex items-center gap-2 px-2">
              <Receipt size={14} className="text-green-600" />
              <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Shipments in {filters.receiptNo}</h3>
              <span className="ml-auto bg-green-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">{waybills.length} Records</span>
              <button
                onClick={() => {
                  const unpaidWbs = waybills.filter(wb => (parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)) > 0)
                  if (unpaidWbs.length === 0) {
                     showNotification('error', 'All GCs are already fully paid!')
                     return
                  }
                  const allSelected = unpaidWbs.every(wb => selectedWaybills[wb.id]?.selected)
                  setSelectedWaybills(prev => {
                    const updated = { ...prev }
                    waybills.forEach(wb => {
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
                className="text-[9px] font-black text-green-600 hover:text-green-800 uppercase tracking-widest border border-green-200 px-2 py-0.5 rounded-lg transition-colors ml-2"
              >
                {waybills.filter(wb => (parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)) > 0).every(wb => selectedWaybills[wb.id]?.selected) ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {waybills.map((wb) => {
                const balance = parseFloat(wb.grand_total) - parseFloat(wb.amount_paid || 0)
                const isPaid = balance <= 0
                const sel = selectedWaybills[wb.id] || { paid: 0, discount: 0, selected: false }
                const isSelected = sel.selected

                return (
                  <div
                    key={wb.id}
                    className={`bg-white rounded-2xl p-3 border-2 shadow-sm transition-all group ${
                      isPaid
                        ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                        : isSelected
                          ? 'border-green-400 shadow-green-50 cursor-pointer hover:shadow-md'
                          : 'border-slate-200 opacity-75 cursor-pointer hover:shadow-md hover:border-green-200'
                    }`}
                    onClick={() => !isPaid && toggleSelect(wb.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isPaid}
                          onChange={() => !isPaid && toggleSelect(wb.id)}
                          className={`mt-0.5 w-4 h-4 border-slate-300 rounded focus:ring-green-500 ${
                            isPaid ? 'opacity-30 cursor-not-allowed text-slate-400' : 'text-green-600 bg-slate-100 cursor-pointer'
                          }`}
                        />
                        <div>
                          <div className={`text-xs font-black transition-colors uppercase ${
                            isPaid ? 'text-slate-400' : isSelected ? 'text-green-700' : 'text-slate-500'
                          }`}>
                            {wb.gc_number}
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-slate-600 font-bold mt-0.5">
                            <Clock size={10} /> {new Date(wb.bill_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isPaid ? (
                          <div className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-lg border border-emerald-200">
                            ✓ PAID
                          </div>
                        ) : (
                          <div className="bg-green-50 text-green-600 text-[9px] font-black px-2 py-0.5 rounded-lg border border-green-100 flex items-center gap-1">
                            <MapPin size={8} /> {wb.destination?.city_name}
                          </div>
                        )}
                        {!isPaid && (
                          <div className="text-[8px] text-slate-600 font-bold flex items-center gap-1">
                            <MapPin size={8} className={isPaid ? 'hidden' : ''} /> {wb.destination?.city_name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50/50 p-2 rounded-xl">
                      <div>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Billed</p>
                        <p className="text-xs font-bold text-slate-700">₹{parseFloat(wb.grand_total).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        {isPaid ? (
                          <>
                            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Received</p>
                            <p className="text-xs font-black text-emerald-700">₹{parseFloat(wb.amount_paid || 0).toLocaleString()}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-[8px] font-black text-rose-600 uppercase tracking-tighter">Balance</p>
                            <p className="text-xs font-black text-rose-700">₹{balance.toLocaleString()}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {!isPaid && isSelected && (
                      <div className="space-y-2" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-700 min-w-[50px]">Discount</span>
                          <input
                            type="number"
                            value={sel.discount || ''}
                            onChange={(e) => handleCellChange(wb.id, 'discount', e.target.value)}
                            className="flex-1 h-7 bg-white border border-slate-200 focus:border-green-400 rounded-lg text-center font-bold text-slate-600 outline-none text-xs"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-green-700 min-w-[50px]">Receive</span>
                          <input
                            type="number"
                            value={sel.paid || ''}
                            onChange={(e) => handleCellChange(wb.id, 'paid', e.target.value)}
                            className="flex-1 h-8 bg-green-50/50 border border-green-100 focus:border-green-600 rounded-lg text-center font-black text-green-700 outline-none text-xs shadow-inner"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    )}

                    {!isPaid && !isSelected && (
                      <div className="text-center text-[9px] text-slate-500 font-bold py-1">Click to select</div>
                    )}

                    {isPaid && (
                      <div className="text-center text-[9px] text-emerald-400 font-black py-1 uppercase tracking-widest">Fully Paid</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Action Bar - Modern Green Light Style */}
            <div className="bg-white rounded-[2rem] p-4 md:p-6 shadow-xl border border-green-100 mt-6 animate-in slide-in-from-bottom-2 duration-700">
              <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-8 text-left border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-8 w-full xl:w-auto">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Receiving Total</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-green-600 text-2xl font-black italic tracking-tighter">₹{totalToReceive.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reductions</p>
                    <p className="text-slate-600 text-xl font-black italic tracking-tighter">₹{totalDiscount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4 w-full xl:flex-1 text-left">
                  <div className="flex flex-col gap-1 min-w-[150px] flex-1 lg:flex-none">
                    <span className="text-[8px] font-black text-green-600/60 uppercase tracking-widest ml-1">Received From</span>
                    <input
                      type="text"
                      placeholder="Person name..."
                      value={paymentHeader.payerName}
                      onChange={(e) => setPaymentHeader({ ...paymentHeader, payerName: e.target.value })}
                      className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 font-black text-[10px] outline-none text-green-800 placeholder:text-green-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1 min-w-[130px] flex-1 lg:flex-none">
                    <span className="text-[8px] font-black text-green-600/60 uppercase tracking-widest ml-1">Channel</span>
                    <select
                      value={paymentHeader.modeOfPay}
                      onChange={(e) => setPaymentHeader({ ...paymentHeader, modeOfPay: e.target.value })}
                      className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 font-black text-[10px] outline-none text-green-800 uppercase focus:border-green-500 transition-colors"
                    >
                      <option value="CASH">CASH</option>
                      <option value="UPI">UPI / ONLINE</option>
                      <option value="CHEQUE">CHEQUE</option>
                    </select>
                  </div>

                  {paymentHeader.modeOfPay !== 'CASH' && (
                    <div className="flex flex-col gap-1 min-w-[130px] flex-1 lg:flex-none transition-all animate-in zoom-in-95">
                      <span className="text-[8px] font-black text-green-600/60 uppercase tracking-widest ml-1">Ref / Chq No</span>
                      <input
                        type="text"
                        placeholder="UTR/Chq number"
                        value={paymentHeader.refNo}
                        onChange={(e) => setPaymentHeader({ ...paymentHeader, refNo: e.target.value })}
                        className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 font-black text-[10px] outline-none text-green-800 placeholder:text-green-200"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1 min-w-[120px] flex-1 lg:flex-none">
                    <span className="text-[8px] font-black text-green-600/60 uppercase tracking-widest ml-1">Receipt Date</span>
                    <input type="date" value={paymentHeader.receivedDate} onChange={(e) => setPaymentHeader({ ...paymentHeader, receivedDate: e.target.value })} className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 font-black text-[10px] outline-none text-green-800" />
                  </div>

                  <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                    <span className="text-[8px] font-black text-green-600/60 uppercase tracking-widest ml-1">Internal Notes</span>
                    <input
                      type="text"
                      placeholder="Transaction notes..."
                      value={paymentHeader.remarks}
                      onChange={(e) => setPaymentHeader({ ...paymentHeader, remarks: e.target.value })}
                      className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 font-bold text-[10px] outline-none text-green-900 placeholder:text-green-300 focus:bg-white focus:border-green-400 transition-all shadow-inner"
                    />
                  </div>

                   {isClosed && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl animate-pulse">
                      <AlertCircle size={16} className="text-rose-600" />
                      <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest leading-none">DayBook Closed - Restricted</p>
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={submitLoading || isClosed || (totalToReceive + totalDiscount) <= 0.01}
                    className="h-12 px-8 bg-green-600 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[2px] text-[10px] shadow-lg shadow-green-200 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-30 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-3 w-full lg:w-auto"
                  >
                    {submitLoading ? <Loader2 className="animate-spin" size={16} /> : isClosed ? <X size={16} /> : <CheckCircle2 size={16} />}
                    {isClosed ? 'Book Closed' : 'Submit Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-24 bg-white rounded-[2rem] shadow-sm border border-green-50 flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
              <ClipboardList size={40} className="text-green-200" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-700 uppercase tracking-widest">No Selection</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Select an unpaid report to view shipments</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        .font-plus-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1fae5; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #10b981; }
        
        .animate-in { animation-name: animate-in; animation-duration: 0.5s; }
        @keyframes animate-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

export default ConsignorWiseReceive
