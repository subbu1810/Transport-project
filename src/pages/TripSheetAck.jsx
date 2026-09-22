import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE_URL, STORAGE_URL } from '../config/api';
import {
  CheckCircle2, Search, Loader2, AlertCircle, ShieldCheck, X,
  FileText, MapPin, Printer, IndianRupee, TrendingDown, Package,
  ChevronDown, ChevronUp, Banknote, AlertTriangle, DollarSign, RotateCcw, GitBranch, Camera, UploadCloud
} from 'lucide-react'
import { applyBranchOverrides } from '../utils/branchOverrides';

/**
 * TripSheetAck has been merged with TripSheetVerification.
 * It now handles arrival acknowledgment and financial verification in one step.
 */
function TripSheetAck() {
  const [user, setUser] = useState(null)
  const [branches, setBranches] = useState([])
  const [filters, setFilters] = useState({
    branch_id: '',
    from_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    search: ''
  })
  const [tripsheets, setTripsheets] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [expandedTripId, setExpandedTripId] = useState(null)
  const [logo, setLogo] = useState(null)
  const [printData, setPrintData] = useState(null)
  const [transportInfo, setTransportInfo] = useState({
    name: 'Logistics Transport',
    address: '',
    phone: '',
    logo: ''
  })

  // Per-trip topay form state: { [tripId]: { topay_collected, topay_payment_mode, verification_remarks } }
  const [topayForms, setTopayForms] = useState({})

  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null })

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    let currentFilters = { ...filters }
    if (userStr) {
      const userData = JSON.parse(userStr)
      setUser(userData)
      if (userData.role !== 'superadmin' && userData.branch_id) {
        currentFilters.branch_id = userData.branch_id
        setFilters(currentFilters)
      }
      // Dynamic transport details mapping
      const overrides = applyBranchOverrides(userData, {
        name: userData.transport_name || (userData.transport && userData.transport.name) || 'SANVI TRANSPORT',
        address: userData.transport_address || (userData.transport && userData.transport.address) || '',
        phone: userData.transport_phone || userData.transport_mobile || (userData.transport && userData.transport.phone) || '',
        subtitle: userData.transport_subtitle || (userData.transport && userData.transport.subtitle) || '',
        logo: userData.transport_logo_url || userData.transport_logo_path || (userData.transport && (userData.transport.logo || userData.transport.logo_path)) || ''
      });
      setTransportInfo({
        name: overrides.company_name || overrides.name,
        address: overrides.address,
        phone: overrides.phone,
        subtitle: overrides.subtitle,
        logo: overrides.logo_path || overrides.logo
      });
    }
    fetchBranches()
    fetchLogo()
    // Explicitly pass currentFilters to ensure we have the correct initial values
    fetchAwaitingVerification(currentFilters)
  }, [])

  const resetFilters = () => {
    const defaultFilters = {
      branch_id: user?.role === 'superadmin' ? '' : user?.branch_id || '',
      from_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      to_date: new Date().toISOString().split('T')[0]
    }
    setFilters(defaultFilters)
    fetchAwaitingVerification(defaultFilters)
  }

  // ─── Fetch helpers ─────────────────────────────────────────────────────────
  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/branches`)
      if (res.data.success) setBranches(res.data.data)
    } catch (e) { console.error(e) }
  }

  const getFullStorageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/^\/+/, '');
    return `${STORAGE_URL}/${cleanPath}`;
  };

  const fetchLogo = async () => {
    try {
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        // Check multiple possible field names for transport logo
        const transportLogo = userData.transport_logo_url || 
                              userData.transport_logo_path || 
                              (userData.transport && (userData.transport.logo || userData.transport.logo_path || userData.transport.logo_url));
        if (transportLogo) {
          setLogo(getFullStorageUrl(transportLogo));
          return;
        }
      }

      // Fallback to global settings if transport logo is not found
      const res = await axios.get(`${API_BASE_URL}/settings/all`);
      if (res.data.success && res.data.data) {
        const settings = res.data.data;
        const globalLogo = settings.logo_path || settings.logo || settings.company_logo;
        if (globalLogo) {
          setLogo(getFullStorageUrl(globalLogo));
        }
      }
    } catch (err) {
      console.error('Error fetching logo:', err);
    }
  };

  const fetchAwaitingVerification = async (currentFilters = filters) => {
    try {
      setLoading(true)
      setExpandedTripId(null)
      const userObj = user || JSON.parse(localStorage.getItem('user'))
      const params = {
        branch_id: (userObj?.role === 'superadmin') ? (currentFilters.branch_id || undefined) : userObj?.branch_id,
        from_date: currentFilters.from_date,
        to_date: currentFilters.to_date,
        search: currentFilters.search
      }
      const res = await axios.get(`${API_BASE_URL}/trip-sheets/awaiting-verification`, { params })
      if (res.data.success) {
        setTripsheets(res.data.data)
        // Pre-fill topay forms with expected amounts
        const forms = {}
        res.data.data.forEach(ts => {
          const toPayGcs = (ts.waybills || []).filter(wb => wb.account_type?.toLowerCase() === 'topay')
          const expected = toPayGcs.reduce((s, wb) => s + (parseFloat(wb.grand_total || wb.total_amount) || 0), 0)
          forms[ts.id] = {
            topay_collected: expected.toFixed(2),
            topay_payment_mode: 'CASH',
            verification_remarks: '',
            delivered_gc_ids: ts.trip_type === 'LOCAL' ? (ts.waybills || []).map(wb => wb.id) : toPayGcs.map(wb => wb.id), // Default selection logic
            opening_km: ts.opening_km || 0,
            closing_km: '',
            rate_per_km: ts.rate_per_km || ts.vehicle?.rate_per_km || 0,
            total_freight: (parseFloat(ts.total_freight) || 0).toFixed(2),
            less_paid_driver: ts.less_paid_driver || 0,
            advance_amount: ts.advance_amount || 0,
            balance_at_office: (parseFloat(ts.total_freight) || 0) - (ts.advance_amount || 0) - (ts.less_paid_driver || 0)
          }
        })
        setTopayForms(forms)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  // ─── Verify action ─────────────────────────────────────────────────────────
  const handleVerify = (ts) => {
    const form = topayForms[ts.id] || {}
    const selectedIds = form.delivered_gc_ids || []
    const toPayGcs = (ts.waybills || []).filter(wb => wb.account_type?.toLowerCase() === 'topay')
    const deliveredGcs = toPayGcs.filter(wb => selectedIds.includes(wb.id))
    
    const expected = deliveredGcs.reduce((s, wb) => s + (parseFloat(wb.grand_total || wb.total_amount) || 0), 0)
    const collected = parseFloat(form.topay_collected) || 0
    const shortfall = Math.max(0, expected - collected)

    let confirmMsg = `Acknowledge & Verify Trip Sheet ${ts.trip_number}?`
    if (toPayGcs.length > 0) {
      confirmMsg += `\n\n📦 Total To Pay GCs: ${toPayGcs.length}\n✅ Marked Delivered: ${deliveredGcs.length}\n💰 Expected: ₹${expected.toFixed(2)}\n💵 Collected: ₹${collected.toFixed(2)}`
      if (shortfall > 0)
        confirmMsg += `\n⚠️ Shortfall of ₹${shortfall.toFixed(2)} will be noted.`
      confirmMsg += '\n\nA Cash Book CREDIT entry will be created for the collected amount.'
    }

    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Confirm Shipment Settlement',
      message: confirmMsg,
      onConfirm: () => {
        setModal(m => ({ ...m, isOpen: false }))
        processVerification(ts.id)
      }
    })
  }

  const processVerification = async (id) => {
    try {
      setSubmitLoading(true)
      const u = JSON.parse(localStorage.getItem('user'))
      const form = topayForms[id] || {}
      const res = await axios.post(`${API_BASE_URL}/trip-sheets/${id}/verify`, {
        verification_date: new Date().toISOString().split('T')[0],
        verified_by: u?.id,
        topay_collected: parseFloat(form.topay_collected) || 0,
        topay_payment_mode: form.topay_payment_mode || 'CASH',
        verification_remarks: form.verification_remarks || '',
        delivered_gc_ids: form.delivered_gc_ids || [], // Pass selected IDs
        branch_id: u?.branch_id,
        opening_km: parseFloat(form.opening_km) || 0,
        closing_km: parseFloat(form.closing_km) || 0,
        total_kms: (parseFloat(form.closing_km) || 0) - (parseFloat(form.opening_km) || 0),
        rate_per_km: parseFloat(form.rate_per_km) || 0,
        total_freight: parseFloat(form.total_freight) || 0,
        less_paid_driver: parseFloat(form.less_paid_driver) || 0,
        balance_at_office: (parseFloat(form.total_freight) || 0) - (parseFloat(form.advance_amount) || 0) - (parseFloat(form.less_paid_driver) || 0)
      })

      if (res.data.success) {
        const d = res.data.data
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Settlement Completed!',
          message: `Trip sheet finalized successfully!\n\n` +
            (d.gcs_paid > 0
              ? `✅ ${d.gcs_paid} To Pay GCs marked as PAID\n💵 ₹${parseFloat(d.topay_collected).toFixed(2)} posted to Cash Book\n`
              : 'No To Pay GCs found.') +
            (d.shortfall > 0 ? `\n⚠️ Shortfall of ₹${parseFloat(d.shortfall).toFixed(2)} recorded in remarks.` : ''),
          onConfirm: () => {
            setModal(m => ({ ...m, isOpen: false }))
            fetchAwaitingVerification()
          }
        })
      }
    } catch (err) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Settlement Failed',
        message: err.response?.data?.message || 'Failed to settle trip sheet',
        onConfirm: () => setModal(m => ({ ...m, isOpen: false }))
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  // ─── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/trip-sheets/${id}`)
      if (res.data.success) {
        setPrintData(res.data.data)
        setTimeout(() => { window.print(); setPrintData(null) }, 500)
      }
    } catch { alert('Error fetching print data') }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const updateTopayForm = (tripId, key, value) => {
    setTopayForms(prev => ({ ...prev, [tripId]: { ...prev[tripId], [key]: value } }))
  }

  const getToPayGcs = (ts) => (ts.waybills || []).filter(wb => wb.account_type?.toLowerCase() === 'topay')
  const getExpected = (ts) => {
    const form = topayForms[ts.id] || {}
    const selectedIds = form.delivered_gc_ids || []
    return getToPayGcs(ts)
      .filter(wb => selectedIds.includes(wb.id))
      .reduce((s, wb) => s + (parseFloat(wb.grand_total || wb.total_amount) || 0), 0)
  }

  const toggleGcDelivery = (tripId, gcId) => {
    const currentList = topayForms[tripId]?.delivered_gc_ids || []
    let newList
    if (currentList.includes(gcId)) {
      newList = currentList.filter(id => id !== gcId)
    } else {
      newList = [...currentList, gcId]
    }
    updateTopayForm(tripId, 'delivered_gc_ids', newList)
    
    // Auto-update the expected amount in the collected field too for convenience
    const ts = tripsheets.find(t => t.id === tripId)
    const selectedToPayGcs = getToPayGcs(ts).filter(wb => newList.includes(wb.id))
    const total = selectedToPayGcs.reduce((s, wb) => s + (parseFloat(wb.grand_total || wb.total_amount) || 0), 0)
    updateTopayForm(tripId, 'topay_collected', total.toFixed(2))
  }

  const toggleAllGcs = (tripId) => {
    const ts = tripsheets.find(t => t.id === tripId)
    // On local trips, "All" means all GCs. On regular trips, "All" means all To-Pay GCs.
    const allRelevantGcs = ts.trip_type === 'LOCAL' ? (ts.waybills || []) : getToPayGcs(ts)
    const allIds = allRelevantGcs.map(wb => wb.id)
    const currentList = topayForms[tripId]?.delivered_gc_ids || []
    
    const newList = currentList.length === allIds.length ? [] : allIds
    updateTopayForm(tripId, 'delivered_gc_ids', newList)
    
    // Total is always based on To-Pay GCs only (financial collection)
    const selectedToPayGcs = getToPayGcs(ts).filter(wb => newList.includes(wb.id))
    const total = (newList.length > 0) 
      ? selectedToPayGcs.reduce((s, wb) => s + (parseFloat(wb.grand_total || wb.total_amount) || 0), 0)
      : 0
    updateTopayForm(tripId, 'topay_collected', total.toFixed(2))
  }

  const handlePodUpload = async (waybillId, file) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('pod_file', file);
    formData.append('user_id', user?.id);
    
    try {
      setSubmitLoading(true);
      const response = await axios.post(`${API_BASE_URL}/waybills/${waybillId}/upload-pod`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setModal({
          isOpen: true,
          type: 'success',
          title: 'POD Captured!',
          message: 'Proof of Delivery has been securely uploaded.',
        });
        fetchAwaitingVerification();
      }
    } catch (err) {
      console.error('Error uploading POD:', err);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Upload Failed',
        message: err.response?.data?.message || 'Failed to upload POD'
      });
    } finally {
      setSubmitLoading(false);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-4 space-y-4 relative">
      <div className="no-print space-y-4">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-100">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Trip Sheet Ack & Settlement</h1>
                <button 
                  onClick={() => fetchAwaitingVerification()}
                  disabled={loading}
                  className="p-1 px-1.5 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-all text-blue-600 disabled:opacity-50"
                  title="Refresh Audit Data"
                >
                  <RotateCcw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Acknowledge arrival & settle finances in one step</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-3 space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                <MapPin size={12} className="text-blue-500" /> Branch
              </label>
              <select
                id="branch-filter"
                value={filters.branch_id}
                onChange={e => setFilters({ ...filters, branch_id: e.target.value })}
                disabled={user?.role !== 'superadmin'}
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-bold text-gray-700 text-sm disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {user?.role === 'superadmin' && <option value="">ALL BRANCHES</option>}
                {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
              </select>
            </div>
            
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                FROM DATE
              </label>
              <input 
                id="date-from"
                type="date" 
                value={filters.from_date}
                onChange={e => setFilters({ ...filters, from_date: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-bold text-gray-700 text-sm transition-all" 
              />
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                TO DATE
              </label>
              <input 
                id="date-to"
                type="date" 
                value={filters.to_date}
                onChange={e => setFilters({ ...filters, to_date: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-bold text-gray-700 text-sm transition-all" 
              />
            </div>

            <div className="md:col-span-3">
              <button 
                id="search-btn"
                onClick={() => fetchAwaitingVerification()} 
                disabled={loading}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-100 disabled:opacity-50 text-[10px] uppercase tracking-widest h-[46px]"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <><Search size={16} /> GET DETAILS</>}
              </button>
            </div>

            <div className="md:col-span-12 space-y-1.5 pt-2 border-t border-dashed border-gray-100">
               <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                 <ShieldCheck size={12} /> Quick Find (Trip No or Vehicle) — <span className="text-gray-400">Bypasses Date Filter</span>
               </label>
               <input 
                 type="text"
                 placeholder="Search TSBLR2 or KA39..."
                 value={filters.search}
                 onChange={e => {
                   const newFilters = { ...filters, search: e.target.value };
                   setFilters(newFilters);
                   // Debounce or just wait for Enter? Let's just update and let them click Get Details
                 }}
                 onKeyDown={e => e.key === 'Enter' && fetchAwaitingVerification()}
                 className="w-full px-4 py-3 bg-blue-50/50 border-2 border-blue-100 rounded-xl focus:border-blue-500 outline-none font-black text-blue-700 text-sm placeholder:text-blue-300 transition-all shadow-inner"
               />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {/* Table Header */}
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Trips Awaiting Settlement
              </h3>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                {tripsheets.length} PENDING
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-800 text-white text-[10px]">
                    <th className="px-4 py-3 text-left font-black uppercase tracking-widest">TS No</th>
                    <th className="px-4 py-3 text-left font-black uppercase tracking-widest">Date</th>
                    <th className="px-4 py-3 text-left font-black uppercase tracking-widest">Vehicle</th>
                    <th className="px-4 py-3 text-right font-black uppercase tracking-widest">Freight</th>
                    <th className="px-4 py-3 text-right font-black uppercase tracking-widest">Advance</th>
                    <th className="px-4 py-3 text-right font-black uppercase tracking-widest">Driver Pay</th>
                    <th className="px-4 py-3 text-right font-black uppercase tracking-widest">To Pay GCs</th>
                    <th className="px-4 py-3 text-right font-black uppercase tracking-widest">To Pay Amt</th>
                    <th className="px-4 py-3 text-center font-black uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tripsheets.length > 0 ? tripsheets.map(ts => {
                    const toPayGcs = getToPayGcs(ts)
                    const expectedTopay = getExpected(ts)
                    const totalFreight = parseFloat(ts.total_freight) || 0
                    const advance = parseFloat(ts.advance_amount) || 0
                    const driverPay = parseFloat(ts.less_paid_driver) || 0
                    const isExpanded = expandedTripId === ts.id

                    return (
                      <React.Fragment key={ts.id}>
                        <tr
                          className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/50' : ''}`}
                          onClick={() => setExpandedTripId(isExpanded ? null : ts.id)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="font-black text-blue-600 uppercase tracking-tighter">{ts.trip_number}</div>
                              {ts.trip_type === 'LOCAL' && (
                                <span className="bg-purple-100 text-purple-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-purple-200 uppercase tracking-widest">LOCAL</span>
                              )}
                            </div>
                            <div className={`inline-block mt-0.5 text-[8px] px-1.5 py-0.5 rounded-sm font-black uppercase tracking-widest border ${ts.ack_date ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                {ts.dispatch_branch?.city_name || ts.dispatchBranch?.branch_name} → {ts.destination_branch_data?.branch_name || ts.destinationBranch?.branch_name}
                            </div>
                            {ts.route && (
                              <div className="mt-1 flex items-center gap-1 text-[8px] font-black text-indigo-500 uppercase bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 w-fit">
                                <GitBranch size={8} /> {ts.route.route_name}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500 font-bold whitespace-nowrap">{new Date(ts.trip_date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-gray-800 font-black tracking-tight">{ts.vehicle?.vehicle_number}</td>
                          <td className="px-4 py-3 text-right font-black text-blue-600">₹{totalFreight.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-bold text-orange-600">₹{advance.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-bold text-red-500">₹{driverPay.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            {toPayGcs.length > 0
                              ? <span className="bg-amber-100 text-amber-700 font-black px-2 py-0.5 rounded-full text-[10px]">{toPayGcs.length} GCs</span>
                              : <span className="text-gray-300 font-bold">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-black text-amber-600">
                            {expectedTopay > 0 ? `₹${expectedTopay.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <button onClick={e => { e.stopPropagation(); handlePrint(ts.id) }}
                                className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-800 hover:text-white transition-all shadow-sm" title="Print">
                                <Printer size={14} />
                              </button>
                              <button onClick={e => { e.stopPropagation(); setExpandedTripId(isExpanded ? null : ts.id) }}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Expand">
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* ── Expanded To Pay Panel ── */}
                        {isExpanded && (
                          <tr>
                            <td colSpan="9" className="p-0">
                              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-t-2 border-amber-200 p-5 space-y-4">

                                <div className="flex items-center gap-2 mb-1">
                                  <div className="p-1.5 bg-amber-500 rounded-lg text-white">
                                    <IndianRupee size={14} />
                                  </div>
                                  <h4 className="font-black text-amber-800 uppercase tracking-widest text-xs">
                                    To Pay Collection — {ts.trip_number}
                                  </h4>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                  {/* Left: GC breakdown table */}
                                  <div className="lg:col-span-2">
                                    {(ts.waybills || []).length > 0 ? (
                                      <div className="bg-white rounded-xl border border-amber-200 overflow-hidden shadow-sm">
                                        <div className="bg-amber-100/50 px-3 py-2 border-b border-amber-200">
                                          <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
                                            <Package size={10} /> ALL GCS ON THIS TRIP
                                          </span>
                                        </div>
                                        <table className="w-full text-xs">
                                          <thead>
                                            <tr className="bg-amber-50 text-[10px] text-amber-600 font-black uppercase tracking-widest border-b border-amber-100">
                                              <th className="px-3 py-2 text-center w-10">
                                                <input 
                                                  type="checkbox" 
                                                  checked={(ts.trip_type === 'LOCAL' ? (ts.waybills || []) : toPayGcs).length > 0 && topayForms[ts.id]?.delivered_gc_ids?.length === (ts.trip_type === 'LOCAL' ? (ts.waybills || []).length : toPayGcs.length)}
                                                  onChange={() => toggleAllGcs(ts.id)}
                                                  className="cursor-pointer"
                                                  title={ts.trip_type === 'LOCAL' ? "Select All GCs for Delivery" : "Select All To-Pay GCs"}
                                                />
                                              </th>
                                              <th className="px-3 py-2 text-left">GC No</th>
                                              <th className="px-3 py-2 text-left">Type</th>
                                              <th className="px-3 py-2 text-left">Consignee</th>
                                              <th className="px-3 py-2 text-left">Destination</th>
                                              <th className="px-3 py-2 text-right">Amount</th>
                                              <th className="px-3 py-2 text-center w-24">POD</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-amber-50">
                                            {(ts.waybills || []).map(wb => {
                                              const isToPay = wb.account_type?.toLowerCase() === 'topay';
                                              const isSelected = topayForms[ts.id]?.delivered_gc_ids?.includes(wb.id);
                                              
                                              return (
                                              <tr key={wb.id} 
                                                className={`hover:bg-amber-50/40 transition-colors ${isToPay ? 'cursor-pointer' : 'opacity-60 bg-gray-50/30'} ${isToPay && !isSelected ? 'opacity-50 grayscale' : ''}`}
                                                onClick={() => isToPay && toggleGcDelivery(ts.id, wb.id)}
                                              >
                                                <td className="px-3 py-2 text-center">
                                                  {(isToPay || ts.trip_type === 'LOCAL') ? (
                                                    <input 
                                                      type="checkbox" 
                                                      checked={isSelected}
                                                      onChange={(e) => { e.stopPropagation(); toggleGcDelivery(ts.id, wb.id) }}
                                                      className="cursor-pointer"
                                                    />
                                                  ) : (
                                                    <span className="text-gray-300 text-[10px] font-bold">—</span>
                                                  )}
                                                </td>
                                                <td className="px-3 py-2 font-black text-gray-800">{wb.gc_number}</td>
                                                <td className="px-3 py-2 font-bold">
                                                  <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-tighter ${
                                                    isToPay ? 'bg-amber-100 text-amber-700' : 
                                                    wb.account_type?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                  }`}>
                                                    {wb.account_type || '-'}
                                                  </span>
                                                </td>
                                                <td className="px-3 py-2 text-gray-600 font-medium truncate max-w-[120px]">{wb.consignee?.name || '—'}</td>
                                                <td className="px-3 py-2 text-gray-500 font-medium">{wb.destination?.city_name || '—'}</td>
                                                <td className="px-3 py-2 text-right font-black text-amber-700">
                                                  {isToPay ? `₹${parseFloat(wb.grand_total || wb.total_amount || 0).toFixed(2)}` : '—'}
                                                </td>
                                                <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                                  {wb.delivery_proof ? (
                                                    <a 
                                                       href={getFullStorageUrl(wb.delivery_proof)} 
                                                       target="_blank" 
                                                       rel="noreferrer"
                                                       className="flex items-center justify-center gap-1 text-[8px] font-black text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 uppercase hover:bg-green-100 transition-all"
                                                    >
                                                       <CheckCircle2 size={10} /> VIEW POD
                                                    </a>
                                                  ) : (
                                                    <label className="flex items-center justify-center gap-1 text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 uppercase cursor-pointer hover:bg-blue-100 transition-all">
                                                       <UploadCloud size={10} /> UPLOAD
                                                       <input 
                                                          type="file" 
                                                          className="hidden" 
                                                          accept="image/*,application/pdf"
                                                          onChange={(e) => handlePodUpload(wb.id, e.target.files[0])}
                                                       />
                                                    </label>
                                                  )}
                                                </td>
                                              </tr>
                                              );
                                            })}
                                          </tbody>
                                          <tfoot>
                                            <tr className="bg-amber-100 border-t-2 border-amber-300">
                                              <td colSpan="6" className="px-3 py-2 font-black text-amber-800 uppercase text-[10px] tracking-widest">Expected Collection Total (Selected To-Pay GCs)</td>
                                              <td className="px-3 py-2 text-right font-black text-amber-800 text-sm">₹{expectedTopay.toFixed(2)}</td>
                                            </tr>
                                          </tfoot>
                                        </table>
                                      </div>
                                    ) : (
                                      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
                                        <Package size={28} className="mx-auto mb-2 opacity-30" />
                                        <p className="font-bold text-xs">No GCs in this trip</p>
                                        <p className="text-[10px] mt-1">Please check the trip sheet entry</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Right: Collection form */}
                                  <div className="space-y-3">
                                    <div className="bg-white rounded-xl border border-amber-200 p-4 space-y-3 shadow-sm text-xs">
                                      <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <Banknote size={10} /> RECORD COLLECTION
                                      </h5>

                                      {/* Summary badges */}
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-100">
                                          <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Expected</div>
                                          <div className="font-black text-amber-700 text-sm">₹{expectedTopay.toFixed(2)}</div>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-2 text-center border border-green-100">
                                          <div className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-1">Collected</div>
                                          <div className="font-black text-green-700 text-sm">
                                            ₹{parseFloat(topayForms[ts.id]?.topay_collected || 0).toFixed(2)}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Shortfall warning */}
                                      {(() => {
                                        const shortfall = Math.max(0, expectedTopay - (parseFloat(topayForms[ts.id]?.topay_collected) || 0))
                                        return shortfall > 0 && (
                                          <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5">
                                            <AlertTriangle size={12} className="text-red-500 shrink-0" />
                                            <span className="text-[10px] font-bold text-red-600">Shortfall: ₹{shortfall.toFixed(2)}</span>
                                          </div>
                                        )
                                      })()}

                                      <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Actual Collected (₹)</label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={topayForms[ts.id]?.topay_collected || ''}
                                          onChange={e => updateTopayForm(ts.id, 'topay_collected', e.target.value)}
                                          className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 outline-none font-bold text-gray-800 text-sm bg-white"
                                          placeholder="0.00"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Mode</label>
                                        <select
                                          value={topayForms[ts.id]?.topay_payment_mode || 'CASH'}
                                          onChange={e => updateTopayForm(ts.id, 'topay_payment_mode', e.target.value)}
                                          className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 outline-none font-bold text-gray-700 text-sm bg-white"
                                        >
                                          <option value="CASH">Cash</option>
                                          <option value="UPI">UPI</option>
                                          <option value="CHEQUE">Cheque</option>
                                          <option value="NEFT">NEFT / Bank Transfer</option>
                                        </select>
                                      </div>

                                      <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Remarks (optional)</label>
                                        <input
                                          type="text"
                                          value={topayForms[ts.id]?.verification_remarks || ''}
                                          onChange={e => updateTopayForm(ts.id, 'verification_remarks', e.target.value)}
                                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 outline-none font-medium text-gray-700 text-sm bg-white"
                                          placeholder="Any notes..."
                                        />
                                      </div>

                                      {/* KM Tracking Section */}
                                      <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-3 space-y-3 mt-2">
                                        <h5 className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
                                          <TrendingDown size={10} className="rotate-180" /> KM TRACKING
                                        </h5>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-1">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Opening KM</label>
                                            <div className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-bold text-gray-500 text-xs">
                                                {topayForms[ts.id]?.opening_km || 0}
                                            </div>
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest ml-1">Closing KM</label>
                                            <input
                                              type="number"
                                              value={topayForms[ts.id]?.closing_km || ''}
                                              onChange={e => updateTopayForm(ts.id, 'closing_km', e.target.value)}
                                              className="w-full px-3 py-1.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none font-bold text-gray-800 text-xs bg-white"
                                              placeholder="Reading"
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Financial Payout Section */}
                                      <div className="bg-orange-50/50 rounded-xl border border-orange-100 p-3 space-y-3 mt-2">
                                        <h5 className="text-[9px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1.5">
                                          <IndianRupee size={10} /> FINAL PAYOUT
                                        </h5>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-1">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Total Freight</label>
                                            <div className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-bold text-gray-500 text-xs">
                                              ₹{parseFloat(topayForms[ts.id]?.total_freight || 0).toLocaleString()}
                                            </div>
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-1">Dest. Payment</label>
                                            <input
                                              type="number"
                                              value={topayForms[ts.id]?.less_paid_driver || ''}
                                              onChange={e => updateTopayForm(ts.id, 'less_paid_driver', e.target.value)}
                                              className="w-full px-3 py-1.5 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-100 outline-none font-bold text-gray-800 text-xs bg-white"
                                              placeholder="Paid here"
                                            />
                                          </div>
                                        </div>

                                        <div className="bg-white p-2 border border-orange-200 rounded-lg flex justify-between items-center text-[10px] font-black uppercase shadow-inner">
                                            <span className="text-orange-800">Bal At Office:</span>
                                            <span className="text-sm text-green-700">₹{((parseFloat(topayForms[ts.id]?.total_freight) || 0) - (parseFloat(topayForms[ts.id]?.advance_amount) || 0) - (parseFloat(topayForms[ts.id]?.less_paid_driver) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                      </div>

                                      <button
                                        onClick={() => handleVerify(ts)}
                                        disabled={submitLoading}
                                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-blue-100 disabled:opacity-50 text-[10px] uppercase tracking-widest mt-2"
                                      >
                                        {submitLoading
                                          ? <Loader2 size={16} className="animate-spin" />
                                          : <><CheckCircle2 size={16} /> SETTLE & RELEASE VEHICLE</>}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  }) : (
                    <tr>
                      <td colSpan="9" className="px-4 py-12 text-center text-gray-400 font-black uppercase tracking-widest text-xs">
                        {loading ? 'Searching Records...' : 'No Pending Shipments Found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Print overlay ── */}
      {printData && (
        <div className="printable-content">
          <div className="header-box border-2 border-black mb-4">
            <div className="flex justify-between items-start p-4 border-b-2 border-black">
              <div className="w-24">
                {logo ? (
                   <img src={logo} alt="Logo" className="h-16 w-auto object-contain" />
                ) : (
                  <div className="w-16 h-16 bg-gray-50 border border-gray-200 flex items-center justify-center text-[8px] text-gray-300 font-bold uppercase italic">
                    NO LOGO
                  </div>
                )}
              </div>
              <div className="text-center flex-1 pr-6">
                <h1 className="text-2xl font-black tracking-tighter border-2 border-black px-6 py-1 inline-block uppercase">
                  {transportInfo.name}
                </h1>
                <p className="text-[10px] font-bold mt-2 uppercase leading-tight">
                   {transportInfo.address || (printData.dispatch_branch?.address + ' ' + printData.dispatch_branch?.city)}
                   {transportInfo.phone && ` | PH: ${transportInfo.phone}`}
                </p>
              </div>
              <div className="w-32 flex flex-col items-end gap-1">
                <div className="border-2 border-black p-1 text-[10px] font-black w-full text-center uppercase tracking-tighter">TRIP ID: {printData.id}</div>
              </div>
            </div>
            <h2 className="text-center font-black uppercase py-2 text-sm tracking-widest bg-gray-50 border-b-2 border-black">
              TRIPSHEET FINAL SETTLEMENT — {printData.trip_number}
            </h2>
            <div className="grid grid-cols-3 text-[11px] font-bold">
              <div className="border-r border-b border-black p-1.5 flex justify-between"><span className="text-gray-500 text-[9px]">TS No:</span><span>{printData.trip_number}</span></div>
              <div className="border-r border-b border-black p-1.5 flex justify-between"><span className="text-gray-500 text-[9px]">Date:</span><span>{new Date(printData.trip_date).toLocaleDateString('en-GB')}</span></div>
              <div className="border-b border-black p-1.5 flex justify-between"><span className="text-gray-500 text-[9px]">Vehicle:</span><span className="font-black">{printData.vehicle?.vehicle_number}</span></div>
              <div className="border-r border-b border-black p-1.5 flex justify-between"><span className="text-gray-500 text-[9px]">Driver:</span><span>{printData.driver?.name}</span></div>
              <div className="border-r border-b border-black p-1.5 flex justify-between"><span className="text-gray-500 text-[9px]">Owner:</span><span>{printData.owner_name || printData.vehicle?.owner_name || 'N/A'}</span></div>
              <div className="border-b border-black p-1.5 flex justify-between"><span className="text-gray-500 text-[9px]">LR No:</span><span>{printData.lr_number || '0'}</span></div>
              <div className="border-r border-black p-1.5 flex justify-between"><span className="text-gray-500 text-[9px]">CR No:</span><span>{printData.cr_number || '0'}</span></div>
              <div className="border-r border-black p-1.5 flex justify-between"><span className="text-gray-500 text-[9px]">Lorry Freight:</span><span>₹{(parseFloat(printData.total_freight) || 0).toFixed(2)}</span></div>
              <div className="p-1.5 flex justify-between"><span className="text-gray-500 text-[9px]">Advance:</span><span>₹{parseFloat(printData.advance_amount || 0).toFixed(2)}</span></div>
            </div>
          </div>

          <table className="w-full border-2 border-black text-[10px] mb-4">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-black">
                <th className="border-r border-black px-1 py-2 w-8 text-center uppercase tracking-tighter">SI</th>
                <th className="border-r border-black px-2 py-2 text-left uppercase tracking-tighter">GC NO</th>
                <th className="border-r border-black px-2 py-2 text-center w-16 uppercase tracking-tighter">Articles</th>
                <th className="border-r border-black px-2 py-2 text-left uppercase tracking-tighter">Consignor</th>
                <th className="border-r border-black px-2 py-2 text-center uppercase tracking-tighter">Destination</th>
                <th className="border-r border-black px-2 py-2 text-center w-16 uppercase tracking-tighter">Type</th>
                <th className="px-2 py-2 text-right font-black uppercase tracking-tighter">Amount</th>
              </tr>
            </thead>
            <tbody>
              {printData.waybills?.map((gc, idx) => (
                <tr key={gc.id} className="border-b border-black">
                  <td className="border-r border-black px-1 py-1.5 text-center font-bold">{idx + 1}</td>
                  <td className="border-r border-black px-2 py-1.5 font-black uppercase">{gc.gc_number}</td>
                  <td className="border-r border-black px-2 py-1.5 text-center">{gc.total_articles || 0}</td>
                  <td className="border-r border-black px-2 py-1.5 uppercase truncate max-w-[150px]">{gc.consignor?.name || '—'}</td>
                  <td className="border-r border-black px-2 py-1.5 text-center text-[9px] uppercase">{gc.destination?.city_name || '—'}</td>
                  <td className={`border-r border-black px-2 py-1.5 text-center font-black text-[9px] ${gc.account_type?.toLowerCase() === 'topay' ? 'text-amber-700 bg-amber-50' : 'text-gray-500'}`}>
                    {gc.account_type?.toUpperCase() || '—'}
                  </td>
                  <td className="px-2 py-1.5 text-right font-black">Rs {(parseFloat(gc.total_amount) || 0).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-black font-black bg-gray-100">
                <td colSpan="4" className="border-r border-black px-4 py-2 uppercase text-[11px] tracking-tight">SHIPMENT TOTALS</td>
                <td colSpan="2" className="border-r border-black px-2 py-2 text-right text-amber-700 uppercase tracking-tighter text-[9px]">
                  Total To Pay Collected: Rs {(printData.waybills?.filter(w => w.account_type?.toLowerCase() === 'topay').reduce((s, w) => s + (parseFloat(w.grand_total || w.total_amount) || 0), 0) || 0).toFixed(2)}
                </td>
                <td className="px-2 py-2 text-right text-[12px]">
                  Rs {(printData.waybills?.reduce((s, w) => s + (parseFloat(w.grand_total || w.total_amount) || 0), 0) || 0).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="grid grid-cols-3 border-2 border-black text-[10px] font-bold mb-4 uppercase">
            <div className="space-y-3 p-4 border-r border-black">
              <p className="flex justify-between font-black text-blue-800 tracking-tight">Total Freight: <span>Rs {(parseFloat(printData.total_freight) || 0).toFixed(2)}</span></p>
              <p className="flex justify-between font-black text-amber-700 tracking-tight">To Pay Collected: <span>Rs {(parseFloat(printData.total_collection) || 0).toFixed(2)}</span></p>
            </div>
            <div className="space-y-3 p-4 border-r border-black">
              <p className="flex justify-between tracking-tight">Advance Rs: <span>Rs {(parseFloat(printData.advance_amount) || 0).toFixed(2)}</span></p>
              <p className="flex justify-between text-red-700 tracking-tight">Less paid Driver: <span>Rs {(parseFloat(printData.less_paid_driver) || 0).toFixed(2)}</span></p>
            </div>
            <div className="space-y-1 p-4 bg-green-50/50">
              <p className="flex justify-between font-black text-green-800 tracking-tight">Bal. at Office: <span>Rs {(parseFloat(printData.balance_at_office) || 0).toFixed(2)}</span></p>
              <div className="pt-2 border-t border-green-200 mt-2 space-y-1">
                <p className="flex justify-between text-[8px] opacity-70">Opening: <span>{printData.opening_km || '0'} KM</span></p>
                <p className="flex justify-between text-[8px] opacity-70">Closing: <span>{printData.closing_km || '0'} KM</span></p>
                <p className="flex justify-between font-black text-blue-800">Total KM Run: <span>{(parseFloat(printData.total_kms) || 0)} KM</span></p>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-end font-black text-[10px] uppercase pt-16">
            <div className="text-center">
              <div className="w-32 border-b-2 border-black mb-1.5 mx-auto" />
              SIGN. OF DRIVER
            </div>
            <div className="text-center flex-1 mx-8 border-2 border-black p-5 bg-gray-50/50">
              <p className="mb-8 text-[12px] font-black text-blue-900 tracking-tighter">FOR {printData.dispatch_branch?.branch_name?.toUpperCase()}</p>
              <p className="text-gray-300 font-bold mb-0.5 tracking-tighter text-[7px]">------------------------------------------------------------</p>
              <div className="font-bold text-[8px] tracking-widest text-gray-400">AUTHORIZED AUDITOR / OFFICER SIGNATORY</div>
            </div>
            <div className="text-center">
              <div className="w-40 border-b-2 border-black mb-1.5 mx-auto" />
              OFFICE SIGNATURE & SEAL
            </div>
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm no-print">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-8 text-center space-y-4 ${modal.type === 'confirm' ? 'bg-blue-50/50' : modal.type === 'success' ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
              <div className="flex justify-center">
                {modal.type === 'confirm' && <div className="p-4 bg-blue-100 rounded-full text-blue-600"><AlertCircle size={40} /></div>}
                {modal.type === 'success' && <div className="p-4 bg-green-100 rounded-full text-green-600"><CheckCircle2 size={40} /></div>}
                {modal.type === 'error' && <div className="p-4 bg-red-100 rounded-full text-red-600"><X size={40} /></div>}
              </div>
              <h2 className={`text-2xl font-black ${modal.type === 'confirm' ? 'text-blue-900' : modal.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>{modal.title}</h2>
              <p className="text-gray-600 font-medium leading-relaxed whitespace-pre-line text-xs uppercase tracking-tight">{modal.message}</p>
            </div>
            <div className="p-6 bg-white flex gap-3">
              {modal.type === 'confirm' && (
                <button onClick={() => setModal(m => ({ ...m, isOpen: false }))}
                  className="flex-1 px-6 py-3 border-2 border-gray-100 rounded-xl text-gray-500 font-black hover:bg-gray-50 transition-all text-sm uppercase">
                  CANCEL
                </button>
              )}
              <button onClick={modal.onConfirm}
                className={`flex-1 px-6 py-3 rounded-xl text-white font-black shadow-lg transition-all hover:scale-105 active:scale-95 text-sm uppercase ${modal.type === 'confirm' ? 'bg-blue-600 hover:bg-blue-700' : modal.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {modal.type === 'confirm' ? 'YES, SETTLE' : 'OKAY'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media screen { .printable-content { display: none; } }
        @media print {
          aside, header, nav, footer, .no-print,
          [role="complementary"], [role="navigation"], [role="banner"],
          .sidebar, #sidebar, .header, #header { display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
          body, html, #root, .flex.h-screen { background: white !important; height: auto !important; width: 210mm !important; display: block !important; overflow: visible !important; margin: 0 auto !important; padding: 0 !important; }
          .flex-1.flex.flex-col, .flex-1.overflow-hidden, .flex-1.overflow-auto, main, .main-content { display: block !important; overflow: visible !important; width: 100% !important; height: auto !important; padding: 0 !important; margin: 0 !important; position: static !important; }
          .printable-content { display: block !important; width: 210mm !important; min-height: 297mm !important; background: white !important; margin: 0 !important; padding: 15mm !important; position: relative !important; box-sizing: border-box !important; z-index: 9999 !important; }
          @page { size: A4 portrait; margin: 0mm; }
        }
      `}</style>
    </div>
  )
}

export default TripSheetAck
