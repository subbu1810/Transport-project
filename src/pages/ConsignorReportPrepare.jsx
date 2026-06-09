import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Loader2, AlertCircle, FileText, Printer, Save, X, Edit2, Search } from 'lucide-react'
import { useTabs } from '../contexts/TabContext'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function ConsignorReportPrepare() {
  const [filters, setFilters] = useState({
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    consignor: '',
    freightType: '',
    branch: ''
  })

  const [branches, setBranches] = useState([])
  const [consignors, setConsignors] = useState([])
  const [gcDetails, setGcDetails] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedGCs, setSelectedGCs] = useState([])
  const [generatingId, setGeneratingId] = useState(false)
  const [tableSearch, setTableSearch] = useState('')
  const [consignorSearch, setConsignorSearch] = useState('')
  const [isConsignorDropdownOpen, setIsConsignorDropdownOpen] = useState(false)
  const [toast, setToast] = useState({ show: false, type: '', message: '' })
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

  const showToast = (type, message) => {
    setToast({ show: true, type, message })
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 5000)
  }

  const { tabData, clearTabData, switchTab } = useTabs()
  const [editMode, setEditMode] = useState(false)
  const [receiptId, setReceiptId] = useState(null)
  const [receiptNo, setReceiptNo] = useState('')
  const [originalWaybills, setOriginalWaybills] = useState([])

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

    fetchInitialData()
    fetchSystemSettings()
  }, [])

  useEffect(() => {
    if (filters.consignor && consignors.length > 0) {
      const selected = consignors.find(c => c.id.toString() === filters.consignor.toString());
      if (selected) {
        setConsignorSearch(selected.name);
      }
    } else {
      setConsignorSearch('');
    }
  }, [filters.consignor, consignors])

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

  // Watch for incoming Tab Data (Redirects from other tabs)
  useEffect(() => {
    const s = tabData['consignor-report-prepare']
    if (s?.editMode) {
      setEditMode(true)
      setReceiptId(s.receiptId)
      setReceiptNo(s.receiptNo)
      setFilters({
        fromDate: s.transactionDate,
        toDate: s.transactionDate,
        consignor: s.consignorId.toString(),
        branch: s.branchId.toString(),
        freightType: ''
      })
      const sortedWaybills = [...s.selectedWaybills].sort((a, b) => new Date(a.bill_date) - new Date(b.bill_date))
      setOriginalWaybills(sortedWaybills)
      setGcDetails(sortedWaybills)
      setSelectedGCs(sortedWaybills.map(w => w.id))

      // Clear data once consumed so it doesn't re-trigger on every render
      clearTabData('consignor-report-prepare')
    }
  }, [tabData, clearTabData])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [branchesRes, consignorsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/branches`),
        axios.get(`${API_BASE_URL}/consignors`)
      ])
      setBranches(branchesRes.data.data || [])
      setConsignors(consignorsRes.data.data || [])

      const user = JSON.parse(localStorage.getItem('user'))
      if (user?.branch_id) {
        setFilters(prev => ({ ...prev, branch: user.branch_id.toString() }))
      }
    } catch (err) {
      console.error('Error fetching initial data:', err)
      setError('Failed to load branches and consignors')
    } finally {
      setLoading(false)
    }
  }

  const handleGetDetails = async () => {
    try {
      setFetchLoading(true)
      setError(null)
      const params = {
        from_date: filters.fromDate,
        to_date: filters.toDate,
        exclude_receipted: 1, // Exclude GCs already in a Consignor Receipt
      }
      if (filters.branch) params.branch_id = filters.branch
      if (filters.consignor) params.consignor_id = filters.consignor
      if (filters.freightType) params.account_type = filters.freightType

      const response = await axios.get(`${API_BASE_URL}/waybills`, { params })
      if (response.data.success) {
        let results = response.data.data

        // If in edit mode, merge with original waybills that might not be in the search results
        if (editMode) {
          const newIds = new Set(results.map(r => r.id))
          const missingOriginals = originalWaybills.filter(ow => !newIds.has(ow.id))
          results = [...missingOriginals, ...results]
        }

        // Sort by date ascending
        results.sort((a, b) => new Date(a.bill_date) - new Date(b.bill_date))

        setGcDetails(results)
        // In edit mode, we keep original selections unless manually changed
        if (!editMode) setSelectedGCs([])
        // NOTE: Do NOT clear toast/success message here — it was set just before this call
      }
    } catch (err) {
      console.error('Error fetching waybill details:', err)
      setError('Failed to fetch details')
    } finally {
      setFetchLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedGCs(gcDetails.map(gc => gc.id))
    } else {
      setSelectedGCs([])
    }
  }

  const handleSelectGC = (id) => {
    if (selectedGCs.includes(id)) {
      setSelectedGCs(selectedGCs.filter(gcId => gcId !== id))
    } else {
      setSelectedGCs([...selectedGCs, id])
    }
  }

  const handleGenerateReceipt = async () => {
    if (selectedGCs.length === 0) {
      showToast('error', 'Please select at least one GC to bundle.')
      return
    }

    if (!filters.branch || !filters.consignor) {
      showToast('error', 'Please select a specific Branch and Consignor before generating.')
      return
    }

    try {
      setGeneratingId(true)
      setError(null)
      const selectedWaybills = gcDetails
        .filter(gc => selectedGCs.includes(gc.id))
        .map(gc => ({
          id: gc.id,
          amount: parseFloat(gc.grand_total) || 0
        }))

      const payload = {
        branch_id: filters.branch,
        consignor_id: filters.consignor,
        transaction_date: filters.fromDate,
        from_date: filters.fromDate,
        to_date: filters.toDate,
        waybills: selectedWaybills
      }

      let response;
      if (editMode) {
        response = await axios.put(`${API_BASE_URL}/consignor-receipts/${receiptId}`, payload)
      } else {
        response = await axios.post(`${API_BASE_URL}/consignor-receipts/generate`, payload)
      }

      if (response.data.success) {
        const msg = editMode
          ? `✅ Report ${receiptNo} updated successfully!`
          : `✅ Consignor Report generated! Receipt No: ${response.data.data.receipt_no}`
        showToast('success', msg)
        if (!editMode) {
          setSelectedGCs([])
          handleGetDetails()
        }
      }
    } catch (err) {
      console.error('Error saving report:', err)
      showToast('error', err.response?.data?.message || 'Failed to save Consignor Report. Please try again.')
    } finally {
      setGeneratingId(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
  }

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const currentBranchName = branches.find(b => b.id.toString() === filters.branch)?.branch_name || 'ALL BRANCHES'
  const currentConsignorName = consignors.find(c => c.id.toString() === filters.consignor)?.name || 'ALL CONSIGNORS'

  // Dynamic consignor filtering based on selected branch
  const filteredConsignors = consignors.filter(c => {
    if (!filters.branch) return false;
    return c.branch_id?.toString() === filters.branch.toString();
  });

  // Client-side search filter
  const filteredGcDetails = tableSearch.trim()
    ? gcDetails.filter(gc => {
        const q = tableSearch.toLowerCase()
        return (
          gc.gc_number?.toLowerCase().includes(q) ||
          (gc.consignor?.name || gc.consignor_name || '').toLowerCase().includes(q) ||
          (gc.destination?.city_name || '').toLowerCase().includes(q) ||
          (gc.invoice_no || '').toLowerCase().includes(q)
        )
      })
    : gcDetails

  // Totals (always computed on full gcDetails for the summary row)
  const totalQty = gcDetails.reduce((sum, gc) => sum + (parseInt(gc.total_articles) || 0), 0)
  const totalWt = gcDetails.reduce((sum, gc) => sum + (parseFloat(gc.total_weight) || 0), 0)
  const totalFreight = gcDetails.reduce((sum, gc) => sum + (parseFloat(gc.freight_amount) || 0), 0)
  const totalDD = gcDetails.reduce((sum, gc) => sum + (parseFloat(gc.dd_charges) || 0), 0)
  const totalHdl = gcDetails.reduce((sum, gc) => sum + (parseFloat(gc.handling_charges) || 0), 0)
  const totalStat = gcDetails.reduce((sum, gc) => sum + (parseFloat(gc.stationary_charges) || 0), 0)
  const totalGST = gcDetails.reduce((sum, gc) => sum + (parseFloat(gc.gst_amount) || 0), 0)
  const totalGrand = gcDetails.reduce((sum, gc) => sum + (parseFloat(gc.grand_total) || 0), 0)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    )
  }

  return (
    <>
      {/* ===== TOAST NOTIFICATION ===== */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[999] flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl border max-w-sm w-full animate-in slide-in-from-right-4 duration-300 ${
          toast.type === 'success'
            ? 'bg-white border-green-200 shadow-green-100'
            : 'bg-white border-red-200 shadow-red-100'
        }`}>
          <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
            toast.type === 'success' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {toast.type === 'success'
              ? <span className="text-green-600 font-black text-sm">✓</span>
              : <span className="text-red-600 font-black text-sm">!</span>
            }
          </div>
          <div className="flex-1">
            <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${
              toast.type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {toast.type === 'success' ? 'Success' : 'Error'}
            </p>
            <p className="text-xs font-semibold text-gray-700 leading-snug">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast({ show: false, type: '', message: '' })}
            className="text-gray-300 hover:text-gray-500 transition-colors mt-0.5"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {/* ===== PRINT STYLES ===== */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #consignor-print-area,
          #consignor-print-area * { visibility: visible; }
          #consignor-print-area {
            position: static;
            width: 100%; height: auto;
            margin: 0; padding: 12mm 10mm;
            background: white;
            font-family: 'Arial', sans-serif;
          }
          @page { size: A4 landscape; margin: 8mm; }
          .print-header {
            display: flex !important;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #1a1a1a;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .print-company-name {
            font-size: 22pt; font-weight: 900; font-style: italic;
            color: #000; letter-spacing: -0.5px; text-transform: uppercase;
          }
          .print-company-sub {
            font-size: 7pt; font-weight: 700; color: #555;
            text-transform: uppercase; letter-spacing: 2px; margin-top: 2px;
          }
          .print-report-title {
            font-size: 14pt; font-weight: 900; color: #000;
            text-transform: uppercase; letter-spacing: 2px;
            text-decoration: underline; text-decoration-color: #16a34a;
            text-decoration-thickness: 3px; text-underline-offset: 4px;
          }
          .print-branch {
            font-size: 7pt; font-weight: 700; color: #444;
            text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;
          }
          .print-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
          .print-table thead tr { background: #f3f4f6; border-top: 2px solid #000; border-bottom: 2px solid #000; }
          .print-table th {
            padding: 5px 4px; text-align: left; font-weight: 900;
            font-size: 7pt; text-transform: uppercase; letter-spacing: 0.5px;
            color: #000; white-space: nowrap;
          }
          .print-table th.right, .print-table td.right { text-align: right; }
          .print-table td {
            padding: 4px 4px; font-size: 7.5pt; color: #000;
            border-bottom: 0.5px solid #ddd; white-space: nowrap;
          }
          .print-table tr.total-row td {
            font-weight: 900; border-top: 2px solid #000;
            border-bottom: 2px solid #000; background: #f9fafb; font-size: 8pt;
          }
          .print-table tr:nth-child(even) td { background: #fafafa; }
          .print-footer {
            margin-top: 16px; border-top: 1px solid #ccc; padding-top: 6px;
            display: flex !important; justify-content: space-between;
            font-size: 6.5pt; color: #666;
          }
        }
      `}</style>

      {/* ===== SCREEN UI ===== */}
      <div className="p-4 space-y-4 no-print-wrapper">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 rounded-lg text-green-600 shadow-sm shadow-green-100">
              <FileText size={18} />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Consignor Report Prepare</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => switchTab('consignor-report-view')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black font-black flex items-center gap-2 shadow-lg shadow-gray-200 transition-all hover:scale-105 active:scale-95 text-[10px] tracking-widest uppercase"
            >
              <Printer size={14} />
              Print Report
            </button>
          </div>
        </div>

        {editMode && (
          <div className="bg-blue-600 p-3 rounded-xl flex items-center justify-between shadow-lg shadow-blue-100 animate-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg text-white">
                <Edit2 size={18} />
              </div>
              <div className="text-white">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Editing Mode</p>
                <h2 className="text-sm font-black tracking-tight">MANAGING REPORT: {receiptNo}</h2>
              </div>
            </div>
            <button
              onClick={() => { setEditMode(false); switchTab('consignor-report-view'); }}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/20 transition-all"
            >
              Cancel Edit
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-4 space-y-4 border border-gray-100">
          {error && (
            <div className="p-2 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-200 text-xs">
              <AlertCircle size={14} />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {/* Filter Section */}
          <div className="bg-green-50/30 p-4 rounded-xl border border-green-100 shadow-sm">
            <h3 className="font-black text-[9px] text-green-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-green-500"></div>
              Search Consignor Waybill Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">From Date</label>
                <input type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none font-bold text-gray-700 text-[11px]" />
              </div>
              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">To Date</label>
                <input type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none font-bold text-gray-700 text-[11px]" />
              </div>
              <div className="relative">
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Consignor</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={filters.branch ? "Search consignor..." : "Select Branch First"}
                    disabled={!filters.branch}
                    value={consignorSearch}
                    onFocus={() => setIsConsignorDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsConsignorDropdownOpen(false), 200)}
                    onChange={(e) => {
                      setConsignorSearch(e.target.value)
                      if (!e.target.value) setFilters(prev => ({ ...prev, consignor: '' }))
                    }}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none font-bold text-gray-700 text-[11px] uppercase disabled:bg-gray-100 disabled:cursor-not-allowed text-ellipsis overflow-hidden whitespace-nowrap"
                  />
                  {filters.consignor && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, consignor: '' }))
                        setConsignorSearch('')
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                {(isConsignorDropdownOpen || consignorSearch) && !filters.consignor && filters.branch && (
                  <div className="absolute left-0 right-0 w-full z-[100] bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                    {filteredConsignors.filter(c => c.name?.toLowerCase().includes(consignorSearch.toLowerCase())).length === 0 ? (
                      <div className="p-2 text-[10px] text-gray-400 text-center font-bold">No results</div>
                    ) : (
                      filteredConsignors
                        .filter(c => c.name?.toLowerCase().includes(consignorSearch.toLowerCase()))
                        .slice(0, 15)
                        .map(c => (
                          <div
                            key={c.id}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setFilters(prev => ({ ...prev, consignor: c.id.toString() }))
                              setConsignorSearch(c.name)
                              setIsConsignorDropdownOpen(false)
                            }}
                            className="px-3 py-2 hover:bg-green-50 cursor-pointer text-[11px] font-bold text-gray-700 border-b border-gray-50 last:border-0 transition-colors uppercase text-ellipsis overflow-hidden whitespace-nowrap"
                          >
                            {c.name}
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Freight Type</label>
                <select value={filters.freightType} onChange={(e) => setFilters({ ...filters, freightType: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none font-bold text-gray-700 text-[11px] uppercase">
                  <option value="">All Types</option>
                  <option value="paid">PAID</option>
                  <option value="topay">TO PAY</option>
                  <option value="account">ACCOUNT</option>
                </select>
              </div>
              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Branch</label>
                <select
                  value={filters.branch}
                  onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                  disabled={JSON.parse(localStorage.getItem('user'))?.role !== 'superadmin'}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none font-bold text-gray-700 text-[11px] uppercase disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleGetDetails}
              disabled={fetchLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-black flex items-center gap-2 shadow-lg shadow-green-100 transition-all hover:scale-105 active:scale-95 text-[10px] tracking-widest uppercase"
            >
              {fetchLoading ? <Loader2 className="animate-spin" size={12} /> : 'GET DETAILS'}
            </button>

            <button
              onClick={handleGenerateReceipt}
              disabled={generatingId || selectedGCs.length === 0}
              className={`px-4 py-2 ${editMode ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'} text-white rounded-lg font-black flex items-center gap-2 transition-all hover:scale-105 active:scale-95 text-[10px] tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {generatingId ? <Loader2 className="animate-spin" size={12} /> : (
                <>{editMode ? <Save size={12} /> : null} {editMode ? 'UPDATE REPORT' : 'GENERATE CONSIGNOR ID'}</>
              )}
            </button>
          </div>
          {/* Success/error messages now handled by toast — removed inline div */}
        </div>

        {/* Screen Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-yellow-100/30 p-3 border-b border-yellow-100 flex items-center justify-between gap-3">
            <h3 className="font-black text-[9px] text-yellow-800 uppercase tracking-widest flex items-center gap-2 shrink-0">
              <div className="w-1 h-1 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
              GC Details View
            </h3>
            {/* Search Bar */}
            <div className="flex-1 max-w-xs relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
              <input
                type="text"
                placeholder="Search GC No, Consignor, Destination, Invoice..."
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 border border-yellow-200 rounded-lg focus:outline-none focus:border-yellow-400 text-[10px] font-medium bg-white text-gray-700 placeholder:text-gray-400"
              />
              {tableSearch && (
                <button
                  onClick={() => setTableSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={11} />
                </button>
              )}
            </div>
            <span className="text-[9px] font-black text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full shrink-0">
              {tableSearch ? `${filteredGcDetails.length} / ${gcDetails.length}` : gcDetails.length} Records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-2 py-2 text-center w-8">
                    <input
                      type="checkbox"
                      checked={filteredGcDetails.length > 0 && filteredGcDetails.every(gc => selectedGCs.includes(gc.id))}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedGCs(prev => [...new Set([...prev, ...filteredGcDetails.map(gc => gc.id)])])
                        } else {
                          const filteredIds = new Set(filteredGcDetails.map(gc => gc.id))
                          setSelectedGCs(prev => prev.filter(id => !filteredIds.has(id)))
                        }
                      }}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </th>
                  <th className="px-2 py-2 text-center font-black text-gray-500 uppercase tracking-widest w-8">Sl No</th>
                  <th className="px-2 py-2 text-left font-black text-gray-500 uppercase tracking-widest">Date</th>
                  <th className="px-2 py-2 text-left font-black text-gray-500 uppercase tracking-widest">GC Num</th>
                  <th className="px-2 py-2 text-left font-black text-gray-500 uppercase tracking-widest">Consignor</th>
                  <th className="px-2 py-2 text-left font-black text-gray-500 uppercase tracking-widest">Consignee</th>
                  <th className="px-2 py-2 text-left font-black text-gray-500 uppercase tracking-widest">Destination</th>
                  <th className="px-2 py-2 text-left font-black text-gray-500 uppercase tracking-widest">Status</th>
                  <th className="px-2 py-2 text-left font-black text-gray-500 uppercase tracking-widest">Type</th>
                  <th className="px-2 py-2 text-left font-black text-gray-500 uppercase tracking-widest">Invoice No</th>
                  <th className="px-2 py-2 text-right font-black text-gray-500 uppercase tracking-widest">Qty</th>
                  <th className="px-2 py-2 text-right font-black text-gray-500 uppercase tracking-widest">Weight</th>
                  <th className="px-2 py-2 text-right font-black text-gray-500 uppercase tracking-widest">Freight</th>
                  <th className="px-2 py-2 text-right font-black text-gray-500 uppercase tracking-widest">DD Charges</th>
                  <th className="px-2 py-2 text-right font-black text-gray-500 uppercase tracking-widest">Handling</th>
                  <th className="px-2 py-2 text-right font-black text-gray-500 uppercase tracking-widest">Stationary</th>
                  <th className="px-2 py-2 text-right font-black text-gray-500 uppercase tracking-widest">GST</th>
                  <th className="px-2 py-2 text-right font-black text-gray-500 uppercase tracking-widest">Grand Total</th>
                  <th className="px-2 py-2 text-center font-black text-gray-500 uppercase tracking-widest">Pmt Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredGcDetails.map((gc, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedGCs.includes(gc.id)}
                        onChange={() => handleSelectGC(gc.id)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </td>
                    <td className="px-2 py-2 text-center font-bold text-gray-500">{idx + 1}</td>
                    <td className="px-2 py-2 font-bold text-gray-700 whitespace-nowrap">{formatDate(gc.bill_date)}</td>
                    <td className="px-2 py-2 font-black text-blue-600 whitespace-nowrap">{gc.gc_number}</td>
                    <td className="px-2 py-2 font-bold text-purple-700 whitespace-nowrap uppercase">{gc.consignor?.name || gc.consignor_name || '-'}</td>
                    <td className="px-2 py-2 font-bold text-indigo-700 whitespace-nowrap uppercase">{gc.consignee?.name || gc.consignee_name || '-'}</td>
                    <td className="px-2 py-2 font-bold text-gray-600 whitespace-nowrap uppercase">{gc.destination?.city_name || '-'}</td>
                    <td className="px-2 py-2">
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase whitespace-nowrap ${gc.status?.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-700' :
                        gc.status?.toLowerCase() === 'ack received' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                        {gc.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-2 py-2 font-bold text-gray-600 uppercase italic whitespace-nowrap">{gc.account_type || '-'}</td>
                    <td className="px-2 py-2 font-medium text-gray-600 italic uppercase whitespace-nowrap">{gc.invoice_no || '-'}</td>
                    <td className="px-2 py-2 text-right font-bold text-gray-700">{gc.total_articles}</td>
                    <td className="px-2 py-2 text-right font-bold text-gray-700 whitespace-nowrap">{gc.total_weight || 0} kg</td>
                    <td className="px-2 py-2 text-right font-bold text-gray-700">{parseFloat(gc.freight_amount || 0).toFixed(2)}</td>
                    <td className="px-2 py-2 text-right font-bold text-gray-700">{parseFloat(gc.dd_charges || 0).toFixed(2)}</td>
                    <td className="px-2 py-2 text-right font-bold text-gray-700">{parseFloat(gc.handling_charges || 0).toFixed(2)}</td>
                    <td className="px-2 py-2 text-right font-bold text-gray-700">{parseFloat(gc.stationary_charges || 0).toFixed(2)}</td>
                    <td className="px-2 py-2 text-right font-bold text-gray-700">{parseFloat(gc.gst_amount || 0).toFixed(2)}</td>
                    <td className="px-2 py-2 text-right font-black text-green-700">{parseFloat(gc.grand_total || 0).toFixed(2)}</td>
                    <td className="px-2 py-2 text-center">
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
                {gcDetails.length > 0 && (
                  <tr className="bg-gray-100/50 font-black">
                    <td colSpan="10" className="px-2 py-3 text-right uppercase tracking-widest text-gray-600">Grand Total</td>
                    <td className="px-2 py-3 text-right text-gray-800">{totalQty}</td>
                    <td className="px-2 py-3 text-right text-gray-800">{totalWt} kg</td>
                    <td className="px-2 py-3 text-right text-gray-800">{totalFreight.toFixed(2)}</td>
                    <td className="px-2 py-3 text-right text-gray-800">{totalDD.toFixed(2)}</td>
                    <td className="px-2 py-3 text-right text-gray-800">{totalHdl.toFixed(2)}</td>
                    <td className="px-2 py-3 text-right text-gray-800">{totalStat.toFixed(2)}</td>
                    <td className="px-2 py-3 text-right text-gray-800">{totalGST.toFixed(2)}</td>
                    <td className="px-2 py-3 text-right text-green-700">{totalGrand.toFixed(2)}</td>
                    <td className="px-2 py-3 text-center text-gray-500 text-[9px] font-black uppercase tracking-widest">
                      {gcDetails.filter(g => parseFloat(g.amount_paid || 0) >= parseFloat(g.grand_total || 0) && parseFloat(g.grand_total || 0) > 0).length} Paid
                    </td>
                  </tr>
                )}
                {filteredGcDetails.length === 0 && (
                  <tr>
                    <td colSpan="18" className="px-2 py-8 text-center text-gray-400 font-bold uppercase tracking-widest bg-gray-50/50 text-[9px]">
                      {gcDetails.length === 0
                        ? 'No records found. Use the filters above and click GET DETAILS.'
                        : `No results match "${tableSearch}". Try a different search.`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== PRINT-ONLY AREA ===== */}
      <div id="consignor-print-area" style={{ display: 'none' }}>
        {/* Company Header */}
        <div className="print-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #111', paddingBottom: '8px', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}>
            <div className="print-company-name" style={{ fontSize: '20pt', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.5px', color: '#000', lineHeight: '1.2' }}>
              {settings.company_name}
            </div>
            <div className="print-company-sub" style={{ fontSize: '7pt', fontWeight: '700', color: '#444', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px', maxWidth: '500px' }}>
              {settings.address && <div>{settings.address}</div>}
              <div style={{ marginTop: '2px' }}>
                {settings.gstin && <span style={{ marginRight: '10px' }}>GSTIN: {settings.gstin}</span>}
                {(settings.phone || settings.mobile) && <span>PH: {settings.phone || settings.mobile}</span>}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="print-report-title" style={{ fontSize: '14pt', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', textDecoration: 'underline', textDecorationColor: '#16a34a', textDecorationThickness: '3px', textUnderlineOffset: '4px' }}>
              Consignor Report
            </div>
            <div className="print-branch" style={{ fontSize: '7pt', fontWeight: '700', color: '#444', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
              Branch: {currentBranchName}
            </div>
          </div>
        </div>

        {/* Info Row - Clean Header Details */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '12px' }}>
          {/* Consignor Info Box */}
          <div style={{ borderLeft: '4px solid #2563eb', padding: '6px 12px', background: '#f8fafc', flex: 1.5, borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '6pt', fontWeight: '900', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '4px', borderBottom: '1px solid #e2e8f0', pb: '2px' }}>Consignor Details</span>
            <span style={{ fontSize: '10pt', fontWeight: '900', color: '#000', textTransform: 'uppercase', display: 'block', lineHeight: '1.2' }}>{currentConsignorName}</span>
            {(() => {
              const c = consignors.find(c => c.id.toString() === filters.consignor);
              if (c) {
                return (
                  <>
                    <span style={{ fontSize: '7pt', fontWeight: '500', color: '#475569', display: 'block', marginTop: '2px' }}>{c.address}</span>
                    <div style={{ fontSize: '7pt', fontWeight: '900', color: '#334155', marginTop: '4px', display: 'flex', gap: '15px' }}>
                      {c.gst_number && <span style={{ background: '#fff', padding: '1px 4px', border: '1px solid #e2e8f0', borderRadius: '2px' }}>GST: {c.gst_number}</span>}
                      {(c.phone || c.mobile) && <span style={{ color: '#1e40af' }}>PH: {c.phone || c.mobile}</span>}
                    </div>
                  </>
                )
              }
              return null;
            })()}
          </div>

          {/* Report Summary Box */}
          <div style={{ borderLeft: '4px solid #16a34a', padding: '6px 12px', background: '#f8fafc', flex: 1, borderRadius: '4px', textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontSize: '6pt', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Reporting Period</span>
              <span style={{ fontSize: '9pt', fontWeight: '900', color: '#0f172a' }}>{formatDisplayDate(filters.fromDate)} to {formatDisplayDate(filters.toDate)}</span>
            </div>
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
              <span style={{ fontSize: '7pt', fontWeight: '900', color: '#166534' }}>Total: {gcDetails.length} Waybills</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderBottom: '1px solid #ccc', marginBottom: '8px' }}></div>

        {/* Report Table */}
        <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5pt' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
              <th style={{ padding: '5px 4px', textAlign: 'center', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', width: '25px' }}>Sl No</th>
              <th style={{ padding: '5px 4px', textAlign: 'left', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Date</th>
              <th style={{ padding: '5px 4px', textAlign: 'left', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>GC Number</th>
              <th style={{ padding: '5px 4px', textAlign: 'left', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Consignee</th>
              <th style={{ padding: '5px 4px', textAlign: 'left', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Destination</th>
              <th style={{ padding: '5px 4px', textAlign: 'left', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '5px 4px', textAlign: 'left', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Type</th>
              <th style={{ padding: '5px 4px', textAlign: 'left', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Invoice No</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Qty</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Weight</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Freight (₹)</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>DD Chg (₹)</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Handling (₹)</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Stationary (₹)</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>GST (₹)</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Grand Total (₹)</th>
              <th style={{ padding: '5px 4px', textAlign: 'center', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Pmt Status</th>
            </tr>
          </thead>
          <tbody>
            {[...gcDetails].sort((a, b) => new Date(a.bill_date) - new Date(b.bill_date)).map((gc, idx) => (
              <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '0.5px solid #ddd' }}>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textAlign: 'center', fontWeight: '900' }}>{idx + 1}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', whiteSpace: 'nowrap' }}>{formatDate(gc.bill_date)}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', fontWeight: '700', whiteSpace: 'nowrap' }}>{gc.gc_number}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', fontWeight: '700', whiteSpace: 'nowrap' }}>{gc.consignee?.name || gc.consignee_name || '-'}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{gc.destination?.city_name || '-'}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{gc.status || 'PENDING'}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{gc.account_type || '-'}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{gc.invoice_no || '-'}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textAlign: 'right' }}>{gc.total_articles}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textAlign: 'right', whiteSpace: 'nowrap' }}>{gc.total_weight || 0} kg</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textAlign: 'right' }}>{parseFloat(gc.freight_amount || 0).toFixed(2)}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textAlign: 'right' }}>{parseFloat(gc.dd_charges || 0).toFixed(2)}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textAlign: 'right' }}>{parseFloat(gc.handling_charges || 0).toFixed(2)}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textAlign: 'right' }}>{parseFloat(gc.stationary_charges || 0).toFixed(2)}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textAlign: 'right' }}>{parseFloat(gc.gst_amount || 0).toFixed(2)}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textAlign: 'right', fontWeight: '900' }}>{parseFloat(gc.grand_total || 0).toFixed(2)}</td>
                <td style={{
                  padding: '4px 4px', fontSize: '7.5pt', textAlign: 'center', fontWeight: '900', textTransform: 'uppercase',
                  color: parseFloat(gc.amount_paid || 0) >= parseFloat(gc.grand_total || 0) && parseFloat(gc.grand_total || 0) > 0 ? '#15803d' :
                    parseFloat(gc.amount_paid || 0) > 0 ? '#b45309' : '#dc2626'
                }}>
                  {parseFloat(gc.amount_paid || 0) >= parseFloat(gc.grand_total || 0) && parseFloat(gc.grand_total || 0) > 0 ? 'PAID' :
                    parseFloat(gc.amount_paid || 0) > 0 ? 'PARTIAL' : 'UNPAID'}
                </td>
              </tr>
            ))}

            {/* Grand Total Row */}
            {gcDetails.length > 0 && (
              <tr style={{ background: '#f3f4f6', borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
                <td colSpan="8" style={{ padding: '5px 4px', fontSize: '8pt', fontWeight: '900', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Grand Total
                </td>
                <td style={{ padding: '5px 4px', fontSize: '8pt', fontWeight: '900', textAlign: 'right' }}>{totalQty}</td>
                <td style={{ padding: '5px 4px', fontSize: '8pt', fontWeight: '900', textAlign: 'right', whiteSpace: 'nowrap' }}>{totalWt} kg</td>
                <td style={{ padding: '5px 4px', fontSize: '8pt', fontWeight: '900', textAlign: 'right' }}>{totalFreight.toFixed(2)}</td>
                <td style={{ padding: '5px 4px', fontSize: '8pt', fontWeight: '900', textAlign: 'right' }}>{totalDD.toFixed(2)}</td>
                <td style={{ padding: '5px 4px', fontSize: '8pt', fontWeight: '900', textAlign: 'right' }}>{totalHdl.toFixed(2)}</td>
                <td style={{ padding: '5px 4px', fontSize: '8pt', fontWeight: '900', textAlign: 'right' }}>{totalStat.toFixed(2)}</td>
                <td style={{ padding: '5px 4px', fontSize: '8pt', fontWeight: '900', textAlign: 'right' }}>{totalGST.toFixed(2)}</td>
                <td style={{ padding: '5px 4px', fontSize: '8pt', fontWeight: '900', textAlign: 'right', textDecoration: 'underline' }}>{totalGrand.toFixed(2)}</td>
                <td style={{ padding: '5px 4px', fontSize: '7pt', fontWeight: '900', textAlign: 'center', color: '#15803d' }}>
                  {gcDetails.filter(g => parseFloat(g.amount_paid || 0) >= parseFloat(g.grand_total || 0) && parseFloat(g.grand_total || 0) > 0).length}/{gcDetails.length} Paid
                </td>
              </tr>
            )}

            {gcDetails.length === 0 && (
              <tr>
                <td colSpan="17" style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '8pt' }}>
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Print Footer */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #ccc', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '6.5pt', color: '#666' }}>
          <span>Generated on: {new Date().toLocaleString('en-IN')}</span>
          <span>{settings.company_name || 'Transport Company'} — Waybill Delivery Logistics</span>
          <span>Branch: {currentBranchName}</span>
        </div>
      </div>
    </>
  )
}

export default ConsignorReportPrepare
