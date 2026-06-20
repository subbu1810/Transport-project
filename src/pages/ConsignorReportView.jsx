import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Loader2, AlertCircle, FileText, Printer, Search, Trash2, Edit2, CheckCircle2, Filter } from 'lucide-react'
import { useTabs } from '../contexts/TabContext'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function ConsignorReportView() {
  const [filters, setFilters] = useState({
    consignorReportId: '',
  })

  const [receipts, setReceipts] = useState([])
  const [receiptData, setReceiptData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [receiptsLoading, setReceiptsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validationError, setValidationError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [tableFilters, setTableFilters] = useState({ deliverStatus: '', paymentStatus: '' })
  const [reportSearch, setReportSearch] = useState('')
  const [showReportDropdown, setShowReportDropdown] = useState(false)
  const [settings, setSettings] = useState({ 
    company_name: '', 
    address: '', 
    phone: '', 
    mobile: '', 
    email: '', 
    gstin: '', 
    logo_path: '', 
    upi_qr_path: '' 
  });
  const { addTab } = useTabs()

  useEffect(() => {
    // 1. Initial load from localStorage for immediate display
    const storedUser = JSON.parse(localStorage.getItem('user'))
    if (storedUser) {
      setSettings(prev => ({
        ...prev,
        company_name: storedUser.transport_name || '',
        address: storedUser.transport_address || '',
        phone: storedUser.transport_phone || '',
        mobile: storedUser.transport_mobile || '',
        gstin: storedUser.transport_gstin || storedUser.gst_number || '',
      }))
    }
    
    fetchReceipts()
    fetchSystemSettings()
  }, [])

  const fetchSystemSettings = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      const transportId = user?.transport_id;
      
      if (transportId) {
        const response = await axios.get(`${API_BASE_URL}/transports/${transportId}`);
        if (response.data.success && response.data.data) {
          const t = response.data.data;
          setSettings(prev => ({
            ...prev,
            company_name: t.transport_name,
            address: t.address,
            phone: t.phone,
            mobile: t.mobile,
            email: t.email,
            gstin: t.gstin || t.gst_number || t.gst || '',
          }));
        }
      } else {
        // Fallback to global settings if no transport_id (e.g. older session or superadmin)
        const response = await axios.get(`${API_BASE_URL}/settings`);
        if (response.data.success && response.data.data) {
          const s = response.data.data;
          setSettings(prev => ({
            ...prev,
            company_name: s.transport_name || s.company_name || prev.company_name,
            address: s.transport_address || s.address || prev.address,
            phone: s.transport_phone || s.phone || prev.phone,
            gstin: s.gstin || s.gst_number || prev.gstin
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchReceipts = async () => {
    try {
      setReceiptsLoading(true)
      const user = JSON.parse(localStorage.getItem('user'))
      const params = {}
      if (user && user.role !== 'superadmin' && user.branch_id) {
        params.branch_id = user.branch_id
      }
      const response = await axios.get(`${API_BASE_URL}/consignor-receipts`, { params })
      if (response.data.success) {
        setReceipts(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching receipts list:', err)
      setError('Failed to load receipts list')
    } finally {
      setReceiptsLoading(false)
    }
  }

  const handleGetDetails = async () => {
    if (!filters.consignorReportId.trim()) {
      setValidationError('Please select or enter a Consignor Report ID')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setValidationError('')
      setReceiptData(null)

      const response = await axios.get(`${API_BASE_URL}/consignor-receipts/${filters.consignorReportId.trim()}`)
      if (response.data.success) {
        setReceiptData(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching receipt details:', err)
      setError(err.response?.data?.message || 'Failed to fetch details')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleEdit = () => {
    if (!receiptData) return
    // Switch to prepare tab and pass data
    addTab('Consignor Report Prepare', '/consignor-report-prepare', {
      editMode: true,
      receiptId: receiptData.id,
      receiptNo: receiptData.receipt_no,
      consignorId: receiptData.consignor_id,
      branchId: receiptData.branch_id,
      transactionDate: receiptData.transaction_date,
      selectedWaybills: receiptData.waybills.map(wb => ({
        id: wb.id,
        gc_number: wb.gc_number,
        grand_total: wb.grand_total,
        bill_date: wb.bill_date
      }))
    })
  }

  const handleDelete = async () => {
    try {
      setLoading(true)
      const response = await axios.delete(`${API_BASE_URL}/consignor-receipts/${receiptData.id}`)
      if (response.data.success) {
        setSuccess('Report deleted successfully')
        setReceiptData(null)
        setFilters({ consignorReportId: '' })
        fetchReceipts()
        setShowDeleteConfirm(false)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
  }

  const gcDetails = [...(receiptData?.waybills || [])].sort((a, b) => new Date(a.bill_date) - new Date(b.bill_date))

  // Reset table filters whenever a new receipt is loaded
  useEffect(() => {
    setTableFilters({ deliverStatus: '', paymentStatus: '' })
  }, [receiptData])

  // Client-side filtered rows
  const filteredGcDetails = gcDetails.filter(gc => {
    // Deliver status filter
    if (tableFilters.deliverStatus) {
      const ds = (gc.deliver_status || 'PENDING').toLowerCase()
      const isDelivered = ds === 'delivered' || ds === 'ack_received'
      if (tableFilters.deliverStatus === 'delivered' && !isDelivered) return false
      if (tableFilters.deliverStatus === 'pending' && isDelivered) return false
    }
    // Payment status filter
    if (tableFilters.paymentStatus) {
      const paid = parseFloat(gc.amount_paid || 0)
      const total = parseFloat(gc.grand_total || 0)
      const pmtStatus = paid >= total && total > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid'
      if (pmtStatus !== tableFilters.paymentStatus) return false
    }
    return true
  })

  return (
    <div className="p-4 space-y-4 min-h-screen print:block print:h-auto print:min-h-0">
      {/* SCREEN UI */}
      <div className="print:hidden space-y-4">
        <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-100 rounded-lg text-green-600 shadow-sm shadow-green-100">
            <FileText size={18} />
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Consignor Report View</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-3 space-y-3 border border-gray-100 no-print">
        {(error || validationError) && (
          <div className="p-2 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-200 text-xs shadow-sm">
            <AlertCircle size={14} className="shrink-0" />
            <p className="font-bold uppercase tracking-tight">{error || validationError}</p>
          </div>
        )}

        {success && (
          <div className="p-2 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 border border-green-200 text-xs shadow-sm">
            <CheckCircle2 size={14} className="shrink-0" />
            <p className="font-bold uppercase tracking-widest">{success}</p>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-green-50/30 p-3 rounded-xl border border-green-100 shadow-sm transition-all hover:shadow-md">
          <h3 className="font-black text-[9px] text-green-700 uppercase tracking-widest mb-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
            Search Consignor Report Id Details
          </h3>
          <div className="max-w-2xl">
            <div className="space-y-1">
              <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Select Consignor Report ID</label>
              <div className="flex gap-2">
                {/* Searchable Dropdown */}
                <div className="relative flex-1">
                  <div
                    className={`flex items-center gap-2 px-3 py-1 border-2 rounded-lg bg-white cursor-text transition-all ${
                      showReportDropdown ? 'border-green-500 ring-1 ring-green-200' : 'border-slate-200 hover:border-green-400'
                    }`}
                    onClick={() => setShowReportDropdown(true)}
                  >
                    <Search size={12} className="text-gray-400 shrink-0" />
                    <input
                      type="text"
                      placeholder={filters.consignorReportId ? filters.consignorReportId : 'Search by ID or consignor name...'}
                      value={showReportDropdown ? reportSearch : (filters.consignorReportId || '')}
                      onChange={(e) => { setReportSearch(e.target.value); setShowReportDropdown(true) }}
                      onFocus={() => { setShowReportDropdown(true); setReportSearch('') }}
                      onBlur={() => setTimeout(() => setShowReportDropdown(false), 180)}
                      className="flex-1 outline-none bg-transparent font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-medium text-[10px] uppercase min-w-0"
                    />
                    {filters.consignorReportId && (
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setFilters({ ...filters, consignorReportId: '' }); setReportSearch(''); setReceiptData(null) }}
                        className="text-gray-300 hover:text-red-400 transition-colors shrink-0 text-xs font-black"
                      >
                        ✕
                      </button>
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 shrink-0 transition-transform ${showReportDropdown ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
                  </div>

                  {showReportDropdown && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border-2 border-green-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {receiptsLoading ? (
                        <div className="px-4 py-3 text-[10px] text-gray-400 font-bold text-center">Loading...</div>
                      ) : receipts
                          .filter(r => {
                            if (!reportSearch) return true
                            const q = reportSearch.toLowerCase()
                            return (
                              (r.receipt_no || '').toLowerCase().includes(q) ||
                              (r.consignor?.name || '').toLowerCase().includes(q)
                            )
                          })
                          .length === 0 ? (
                        <div className="px-4 py-3 text-[10px] text-gray-400 font-bold text-center">No records found</div>
                      ) : (
                        receipts
                          .filter(r => {
                            if (!reportSearch) return true
                            const q = reportSearch.toLowerCase()
                            return (
                              (r.receipt_no || '').toLowerCase().includes(q) ||
                              (r.consignor?.name || '').toLowerCase().includes(q)
                            )
                          })
                          .map(r => {
                            const periodString = r.from_date && r.to_date
                              ? `${formatDate(r.from_date)} — ${formatDate(r.to_date)}`
                              : formatDate(r.transaction_date)
                            const isSelected = filters.consignorReportId === r.receipt_no
                            return (
                              <div
                                key={r.id}
                                onMouseDown={() => {
                                  setFilters({ ...filters, consignorReportId: r.receipt_no })
                                  setReportSearch('')
                                  setShowReportDropdown(false)
                                  // Auto-fetch on select
                                  setTimeout(() => {
                                    setValidationError('')
                                    setError(null)
                                    setReceiptData(null)
                                    setLoading(true)
                                    axios.get(`${API_BASE_URL}/consignor-receipts/${r.receipt_no.trim()}`)
                                      .then(res => { if (res.data.success) setReceiptData(res.data.data) })
                                      .catch(err => setError(err.response?.data?.message || 'Failed to fetch details'))
                                      .finally(() => setLoading(false))
                                  }, 0)
                                }}
                                className={`px-3 py-2 cursor-pointer text-[10px] font-bold flex flex-col gap-0.5 transition-colors ${
                                  isSelected ? 'bg-green-50 text-green-800' : 'hover:bg-gray-50 text-gray-800'
                                }`}
                              >
                                <span className="font-black tracking-wide uppercase">{r.receipt_no}</span>
                                <span className="text-[9px] text-gray-400 font-medium normal-case">{r.consignor?.name} &bull; {periodString}</span>
                              </div>
                            )
                          })
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleGetDetails}
                  disabled={loading || receiptsLoading}
                  className="px-4 py-1 bg-green-600 hover:bg-black text-white rounded-lg font-black flex items-center justify-center gap-2 shadow-lg shadow-green-100 transition-all hover:scale-105 active:scale-95 text-[9px] tracking-widest uppercase disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={12} /> : <><Search size={12} /> GET DETAILS</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Display Section */}
      {receiptData && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Header Info */}
          <div className="bg-gradient-to-r from-green-50 to-white p-4 border-b border-gray-100 no-print flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-green-800 tracking-tight flex items-center gap-2">
                ID: <span className="bg-green-200/50 px-2 py-0.5 rounded border border-green-300">{receiptData.receipt_no}</span>
              </h2>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex flex-wrap gap-x-6 gap-y-1">
                <span>Date: <span className="text-gray-800">{formatDate(receiptData.transaction_date)}</span></span>
                {/* Dynamically calculate or show period */}
                <span>Period: <span className="text-blue-700">
                  {(() => {
                    if (receiptData.from_date && receiptData.to_date) {
                      return `${formatDate(receiptData.from_date)} — ${formatDate(receiptData.to_date)}`;
                    }
                    if (receiptData.waybills?.length > 0) {
                      const dates = receiptData.waybills.map(w => new Date(w.bill_date).getTime());
                      const min = new Date(Math.min(...dates));
                      const max = new Date(Math.max(...dates));
                      return `${formatDate(min)} — ${formatDate(max)}`;
                    }
                    return '-';
                  })()}
                </span></span>
                <span>Consignor: <span className="text-gray-800">{receiptData.consignor?.name}</span></span>
                <span>Branch: <span className="text-gray-800">{receiptData.branch?.branch_name}</span></span>
                <span>Amount: <span className="text-green-700 font-black tracking-normal">₹{parseFloat(receiptData.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white font-black flex items-center gap-2 border border-blue-100 transition-all text-[10px] tracking-widest uppercase"
              >
                <Edit2 size={12} /> Modify
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white font-black flex items-center gap-2 border border-rose-100 transition-all text-[10px] tracking-widest uppercase"
              >
                <Trash2 size={12} /> Delete
              </button>

              <button onClick={handlePrint} className="px-4 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-black font-black flex items-center gap-2 shadow-lg shadow-gray-200 transition-all hover:scale-105 active:scale-95 text-[10px] tracking-widest uppercase text-white!">
                <Printer size={14} /> Print
              </button>
            </div>
          </div>

          {/* Delete Confirmation Modal Overlay (Simple Inside JSX) */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-rose-100 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-3 bg-rose-50 rounded-full text-rose-600">
                    <Trash2 size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Destroy Report?</h3>
                    <p className="text-xs font-bold text-gray-500">This action will un-bundle these waybills and delete the Report ID permanently.</p>
                  </div>
                  <div className="flex gap-3 w-full pt-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors shadow-lg shadow-rose-200"
                    >
                      Delete Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-100/30 p-3 border-b border-yellow-100 no-print">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="font-black text-[9px] text-yellow-800 uppercase tracking-widest flex items-center gap-2 shrink-0">
                <div className="w-1 h-1 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
                Waybill Details
              </h3>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Filter size={10} className="text-yellow-600" />
                  <span className="text-[9px] font-black text-yellow-700 uppercase tracking-widest">Filter:</span>
                </div>

                {/* Deliver Status */}
                <select
                  value={tableFilters.deliverStatus}
                  onChange={e => setTableFilters(f => ({ ...f, deliverStatus: e.target.value }))}
                  className="px-2 py-1 border border-yellow-200 rounded-lg text-[10px] font-bold text-gray-700 bg-white focus:outline-none focus:border-yellow-400 cursor-pointer"
                >
                  <option value="">All Delivery</option>
                  <option value="delivered">✅ Delivered</option>
                  <option value="pending">⏳ Pending</option>
                </select>

                {/* Payment Status */}
                <select
                  value={tableFilters.paymentStatus}
                  onChange={e => setTableFilters(f => ({ ...f, paymentStatus: e.target.value }))}
                  className="px-2 py-1 border border-yellow-200 rounded-lg text-[10px] font-bold text-gray-700 bg-white focus:outline-none focus:border-yellow-400 cursor-pointer"
                >
                  <option value="">All Payment</option>
                  <option value="paid">💚 Paid</option>
                  <option value="partial">🟡 Partial</option>
                  <option value="unpaid">🔴 Unpaid</option>
                </select>

                {/* Clear filters button — only visible when a filter is active */}
                {(tableFilters.deliverStatus || tableFilters.paymentStatus) && (
                  <button
                    onClick={() => setTableFilters({ deliverStatus: '', paymentStatus: '' })}
                    className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors border border-yellow-200"
                  >
                    Clear
                  </button>
                )}
              </div>

              <span className="text-[9px] font-black text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full shrink-0">
                {(tableFilters.deliverStatus || tableFilters.paymentStatus)
                  ? `${filteredGcDetails.length} / ${gcDetails.length}`
                  : gcDetails.length} Records
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-center font-black text-gray-500 uppercase tracking-widest w-10">Sl No</th>
                  <th className="px-3 py-2 text-left font-black text-gray-500 uppercase tracking-widest">Bill Date</th>
                  <th className="px-3 py-2 text-left font-black text-gray-500 uppercase tracking-widest">GC Num</th>
                  <th className="px-3 py-2 text-left font-black text-gray-500 uppercase tracking-widest">Consignee</th>
                  <th className="px-3 py-2 text-left font-black text-gray-500 uppercase tracking-widest">Destination</th>
                  <th className="px-3 py-2 text-left font-black text-gray-500 uppercase tracking-widest">Deliver Status</th>
                  <th className="px-3 py-2 text-left font-black text-gray-500 uppercase tracking-widest">Type</th>
                  <th className="px-3 py-2 text-left font-black text-gray-500 uppercase tracking-widest">Invoice No</th>
                  <th className="px-3 py-2 text-right font-black text-gray-500 uppercase tracking-widest">Items</th>
                  <th className="px-3 py-2 text-right font-black text-gray-500 uppercase tracking-widest">Weight</th>
                  <th className="px-3 py-2 text-right font-black text-gray-500 uppercase tracking-widest">Freight</th>
                  <th className="px-3 py-2 text-right font-black text-gray-500 uppercase tracking-widest">DD Charges</th>
                  <th className="px-3 py-2 text-right font-black text-gray-500 uppercase tracking-widest">Handling</th>
                  <th className="px-3 py-2 text-right font-black text-gray-500 uppercase tracking-widest">Stationary</th>
                  <th className="px-3 py-2 text-right font-black text-gray-500 uppercase tracking-widest">GST</th>
                  <th className="px-3 py-2 text-right font-black text-gray-500 uppercase tracking-widest">Grand Total</th>
                  <th className="px-3 py-2 text-center font-black text-gray-500 uppercase tracking-widest">Pmt Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredGcDetails.length === 0 ? (
                  <tr>
                    <td colSpan="17" className="px-3 py-8 text-center text-gray-400 font-bold uppercase tracking-widest text-[9px]">
                      No records match the selected filters.
                    </td>
                  </tr>
                ) : filteredGcDetails.map((gc, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 text-center font-bold text-gray-500">{idx + 1}</td>
                    <td className="px-3 py-2 font-bold text-gray-700 whitespace-nowrap">{formatDate(gc.bill_date)}</td>
                    <td className="px-3 py-2 font-black text-blue-600 whitespace-nowrap">{gc.gc_number}</td>
                    <td className="px-3 py-2 font-bold text-gray-700 whitespace-nowrap uppercase">{gc.consignee?.name || gc.consignee_name || '-'}</td>
                    <td className="px-3 py-2 font-bold text-gray-600 whitespace-nowrap uppercase">{gc.destination?.city_name || '-'}</td>
                    <td className="px-3 py-2">
                      {(() => {
                         const ds = (gc.deliver_status || 'PENDING').toLowerCase();
                         const isDelivered = ds === 'delivered' || ds === 'ack_received';
                         return (
                            <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase whitespace-nowrap ${isDelivered ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                               {isDelivered ? 'DELIVERED' : (gc.deliver_status || 'PENDING')}
                            </span>
                         );
                      })()}
                    </td>
                    <td className="px-3 py-2 font-bold text-gray-600 uppercase italic whitespace-nowrap">{gc.account_type || '-'}</td>
                    <td className="px-3 py-2 font-bold text-gray-500 uppercase italic whitespace-nowrap">{gc.invoice_no || '-'}</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-700">{gc.total_articles}</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-700 whitespace-nowrap">{gc.total_weight || 0} kg</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-700">{parseFloat(gc.freight_amount || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-700">{parseFloat(gc.dd_charges || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-700">{parseFloat(gc.handling_charges || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-700">{parseFloat(gc.stationary_charges || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-700">{parseFloat(gc.gst_amount || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-black text-green-700">{parseFloat(gc.grand_total || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-center">
                      {(() => {
                        const paid = parseFloat(gc.amount_paid || 0)
                        const total = parseFloat(gc.grand_total || 0)
                        if (paid >= total && total > 0) return <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-green-100 text-green-700 whitespace-nowrap">PAID</span>
                        if (paid > 0) return <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-amber-100 text-amber-700 whitespace-nowrap">PARTIAL</span>
                        return <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-red-100 text-red-600 whitespace-nowrap">UNPAID</span>
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div> {/* END SCREEN UI */}

      {/* PRINT LAYOUT */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: static;
            width: 100%;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {receiptData && (
        <div id="print-area" className="hidden print:block p-8 bg-white">
          <div className="flex justify-between items-start border-b-3 border-black pb-2 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-black uppercase tracking-tighter italic leading-none mb-1 text-black">
                {settings.company_name}
              </h1>
              <div className="text-[9px] font-bold text-gray-600 uppercase leading-tight space-y-0.5 mt-1">
                {settings.address && <p>{settings.address}</p>}
                <div className="flex gap-3 mt-1 text-gray-800">
                  {settings.gstin && <span>GSTIN: {settings.gstin}</span>}
                  {(settings.phone || settings.mobile) && <span>PH: {settings.phone || settings.mobile}</span>}
                </div>
              </div>
            </div>
            <div className="text-right ml-4">
              <h2 className="text-lg font-black uppercase tracking-widest text-green-800 border-b-2 border-green-600 inline-block pb-1 mb-2 whitespace-nowrap">Consignor Receipt Report</h2>
              <div className="text-[9px] font-bold text-gray-500 uppercase">
                <p>Branch: <span className="text-black">{receiptData.branch?.branch_name}</span></p>
              </div>
            </div>
          </div>

          <div className="flex justify-between mb-6 text-[10px] font-bold uppercase tracking-tight gap-8">
            <div className="space-y-1 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 flex-[1.5] shadow-sm">
              <p className="text-blue-600 text-[9px] font-black mb-1.5 border-b border-blue-100 pb-1 uppercase tracking-widest">Consignor Details</p>
              <p className="text-base font-black text-black">{receiptData.consignor?.name}</p>
              {receiptData.consignor?.address && <p className="text-[9px] text-gray-600 normal-case leading-tight">{receiptData.consignor.address}</p>}
              <div className="text-[9px] font-black text-gray-700 uppercase mt-2 flex gap-4">
                {receiptData.consignor?.gst_number && <span className="bg-white px-2 py-0.5 rounded border border-gray-200">GSTIN: {receiptData.consignor.gst_number}</span>}
                {(receiptData.consignor?.phone || receiptData.consignor?.mobile) && <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-blue-800">PH: {receiptData.consignor.phone || receiptData.consignor.mobile}</span>}
              </div>
            </div>

            <div className="space-y-1.5 text-right min-w-[200px] flex flex-col justify-center border-l-2 border-gray-100 pl-8">
              <p className="text-gray-500">Receipt No: <span className="font-black text-black text-base">{receiptData.receipt_no}</span></p>
              <p className="text-gray-500">Receipt Date: <span className="font-black text-black">{formatDate(receiptData.transaction_date)}</span></p>
              
              {/* Calculate Period from Waybills */}
              {receiptData.waybills?.length > 0 && (
                <p className="text-[9px] font-black text-blue-800 uppercase tracking-tight mt-1">
                  Period: {(() => {
                    const dates = receiptData.waybills.map(w => new Date(w.bill_date).getTime());
                    const min = new Date(Math.min(...dates));
                    const max = new Date(Math.max(...dates));
                    const fmt = (d) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                    return `${fmt(min)} — ${fmt(max)}`;
                  })()}
                </p>
              )}

              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-green-800 font-black text-lg leading-none">Total: ₹{parseFloat(receiptData.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-1">Authorized Signatory</p>
              </div>
            </div>
          </div>

          <table className="w-full text-[10px] border-collapse border border-gray-400">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-400 p-1 text-center w-8">Sl No</th>
                <th className="border border-gray-400 p-1 text-left">Date</th>
                <th className="border border-gray-400 p-1 text-left">GC No</th>
                <th className="border border-gray-400 p-1 text-left">Consignee</th>
                <th className="border border-gray-400 p-1 text-left">Destination</th>
                <th className="border border-gray-400 p-1 text-left">Type</th>
                <th className="border border-gray-400 p-1 text-right">Freight</th>
                <th className="border border-gray-400 p-1 text-right">Charges</th>
                <th className="border border-gray-400 p-1 text-right">GST</th>
                <th className="border border-gray-400 p-1 text-right">Total</th>
                <th className="border border-gray-400 p-1 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {gcDetails.map((gc, i) => {
                const charges = parseFloat(gc.dd_charges || 0) + parseFloat(gc.handling_charges || 0) + parseFloat(gc.stationary_charges || 0)
                return (
                  <tr key={i}>
                    <td className="border border-gray-400 p-1 text-center font-bold">{i + 1}</td>
                    <td className="border border-gray-400 p-1 text-center">{formatDate(gc.bill_date)}</td>
                    <td className="border border-gray-400 p-1 font-bold">{gc.gc_number}</td>
                    <td className="border border-gray-400 p-1 uppercase">{gc.consignee?.name || gc.consignee_name}</td>
                    <td className="border border-gray-400 p-1 uppercase">{gc.destination?.city_name}</td>
                    <td className="border border-gray-400 p-1 uppercase text-[8px]">{gc.account_type}</td>
                    <td className="border border-gray-400 p-1 text-right">{parseFloat(gc.freight_amount || 0).toFixed(2)}</td>
                    <td className="border border-gray-400 p-1 text-right">{charges.toFixed(2)}</td>
                    <td className="border border-gray-400 p-1 text-right">{parseFloat(gc.gst_amount || 0).toFixed(2)}</td>
                    <td className="border border-gray-400 p-1 text-right font-black">{parseFloat(gc.grand_total || 0).toFixed(2)}</td>
                    <td className="border border-gray-400 p-1 text-center font-bold text-[8px]">
                      {parseFloat(gc.amount_paid || 0) >= parseFloat(gc.grand_total || 0) && parseFloat(gc.grand_total || 0) > 0 ? 'PAID' : (parseFloat(gc.amount_paid || 0) > 0 ? 'PARTIAL' : 'UNPAID')}
                    </td>
                  </tr>
                )
              })}
              <tr className="bg-gray-50 font-black break-inside-avoid">
                <td colSpan="6" className="border border-gray-400 p-1.5 text-right uppercase text-[9px]">Grand Total</td>
                <td className="border border-gray-400 p-1.5 text-right text-[9px]">
                  {gcDetails.reduce((sum, gc) => sum + parseFloat(gc.freight_amount || 0), 0).toFixed(2)}
                </td>
                <td className="border border-gray-400 p-1.5 text-right text-[9px]">
                  {gcDetails.reduce((sum, gc) => {
                    const charges = (parseFloat(gc.dd_charges || 0) + parseFloat(gc.handling_charges || 0) + parseFloat(gc.stationary_charges || 0));
                    return sum + charges;
                  }, 0).toFixed(2)}
                </td>
                <td className="border border-gray-400 p-1.5 text-right text-[9px]">
                  {gcDetails.reduce((sum, gc) => sum + parseFloat(gc.gst_amount || 0), 0).toFixed(2)}
                </td>
                <td className="border border-gray-400 p-1.5 text-right text-[10px] text-green-800">
                  {gcDetails.reduce((sum, gc) => sum + parseFloat(gc.grand_total || 0), 0).toFixed(2)}
                </td>
                <td className="border border-gray-400 p-1"></td>
              </tr>
            </tbody>
          </table>

          <div className="mt-12 flex justify-between text-[10px] font-bold uppercase tracking-widest pt-8 border-t border-dotted border-gray-300">
            <div>Prepared By: _________________</div>
            <div>Authorized Signatory: _________________</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConsignorReportView
