import React, { useState, useEffect } from 'react'
import { Search, Printer, FileText, Filter, Calendar, MapPin, Loader2, RefreshCcw, CheckCircle2, Circle, ChevronRight, GitBranch, X } from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL, STORAGE_URL } from '../config/api';
import TripSheetReceipt from '../components/TripSheetReceipt'

function TripSheetReport() {
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    branch_id: ''
  })

  const [currentUser, setCurrentUser] = useState(null)
  const [branches, setBranches] = useState([])
  const [logo, setLogo] = useState(null)
  const [tripsheets, setTripsheets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTripId, setSelectedTripId] = useState(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [printData, setPrintData] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [columnFilters, setColumnFilters] = useState({
    tripNo: '',
    route: '',
    dispatchDate: '',
    vehicleNo: '',
    driverName: ''
  })
  const [showPreview, setShowPreview] = useState(false)
  const [expandedTripId, setExpandedTripId] = useState(null)
  const [expandedGCs, setExpandedGCs] = useState([])
  const [gcLoading, setGcLoading] = useState(false)
  const [transportInfo, setTransportInfo] = useState({
    name: '',
    address: '',
    phone: '',
    subtitle: '',
    logo: ''
  })

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
        const user = JSON.parse(userDataStr);
        // 1. Check multiple possible field names for transport logo in session
        const transportLogo = user.transport_logo_url || 
                              user.transport_logo_path || 
                              user.logo_url ||
                              user.logo_path ||
                              user.logo ||
                              (user.transport && (user.transport.logo_url || user.transport.logo_path || user.transport.logo || user.transport.url));
        
        if (transportLogo) {
          setLogo(getFullStorageUrl(transportLogo));
          return;
        }

        // 2. If not in session, try fetching by transport_id if available
        if (user.transport_id) {
          const transportRes = await axios.get(`${API_BASE_URL}/transports/${user.transport_id}`);
          if (transportRes.data.success && transportRes.data.data) {
            const t = transportRes.data.data;
            const logoToUse = t.logo_url || t.logo_path || t.logo;
            if (logoToUse) {
              setLogo(getFullStorageUrl(logoToUse));
              return;
            }
          }
        }
      }

      const response = await axios.get(`${API_BASE_URL}/settings/all`);
      if (response.data.success && response.data.data) {
        const s = response.data.data;
        setTransportInfo(prev => ({
          ...prev,
          name: s.company_name || s.name || prev.name,
          address: s.address || prev.address,
          phone: s.phone || s.mobile || prev.phone,
          gstin: s.gstin || s.gst_number || s.gst_number || prev.gstin || ''
        }));
        const globalLogo = s.logo_path || s.logo || s.company_logo || s.transport_logo;
        if (globalLogo) {
          setLogo(getFullStorageUrl(globalLogo));
        }
      }
    } catch (err) {
      console.error('Error fetching logo:', err);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user')
    let initialFilters = { ...filters }

    if (userData) {
      try {
        const user = JSON.parse(userData)
        setCurrentUser(user)
        if (user.role !== 'superadmin') {
          initialFilters.branch_id = user.branch_id
          setFilters(initialFilters)
        }
        
        // Comprehensive transport details mapping
        setTransportInfo({
          name: user.transport_name || (user.transport && user.transport.name) || 'SANVI TRANSPORT',
          address: user.transport_address || (user.transport && user.transport.address) || '',
          phone: user.transport_phone || user.transport_mobile || (user.transport && user.transport.phone) || '',
          subtitle: user.transport_subtitle || (user.transport && user.transport.subtitle) || '',
          logo: user.transport_logo_url || user.transport_logo_path || (user.transport && (user.transport.logo || user.transport.logo_path)) || '',
          gstin: user.transport_gstin || user.gstin || user.gst_number || (user.transport && (user.transport.gst_number || user.transport.gstin || user.transport.gst)) || ''
        })
      } catch (e) {
        console.error("Error parsing user data", e)
      }
    }
    fetchBranches()
    fetchLogo()
    fetchReportData(initialFilters)
  }, [])



  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches`)
      const data = await response.json()
      if (data.success) {
        const userData = localStorage.getItem('user')
        if (userData) {
          const user = JSON.parse(userData)
          if (user.role !== 'superadmin') {
            setBranches(data.data.filter(b => b.id == user.branch_id))
          } else {
            setBranches(data.data)
          }
        } else {
          setBranches(data.data)
        }
      }
    } catch (err) {
      console.error('Error fetching branches:', err)
    }
  }

  const fetchReportData = async (customFilters = null) => {
    try {
      setLoading(true)
      setError('')
      setSelectedTripId(null)

      const activeFilters = customFilters || filters
      const queryParams = new URLSearchParams({
        from_date: activeFilters.fromDate,
        to_date: activeFilters.toDate,
        trip_type: 'INTERSTATE'
      })

      // Enforce branch filter for admins even if selection is cleared
      let branchIdForFetch = activeFilters.branch_id
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        if (user.role !== 'superadmin' && !branchIdForFetch) {
          branchIdForFetch = user.branch_id
        }
      }

      if (branchIdForFetch) queryParams.append('branch_id', branchIdForFetch)

      const response = await fetch(`${API_BASE_URL}/trip-sheets?${queryParams.toString()}`)
      const data = await response.json()

      if (data.success) {
        setTripsheets(data.data)
      } else {
        setError(data.message || 'Failed to fetch report data')
      }
    } catch (err) {
      setError('Error connecting to server')
    } finally {
      setLoading(false)
    }
  }

  const handleExpandGCs = async (ts) => {
    // Toggle off if same row clicked
    if (expandedTripId === ts.id) {
      setExpandedTripId(null)
      setExpandedGCs([])
      return
    }
    setExpandedTripId(ts.id)
    // If waybills already embedded in list response and have rich nested relations (like consignor), use them directly
    if (ts.waybills && ts.waybills.length > 0 && ts.waybills[0].consignor) {
      setExpandedGCs(ts.waybills)
      return
    }
    // Otherwise fetch detail to get all nested relations
    try {
      setGcLoading(true)
      const response = await axios.get(`${API_BASE_URL}/trip-sheets/${ts.id}`)
      if (response.data.success) {
        setExpandedGCs(response.data.data.waybills || [])
      }
    } catch (err) {
      console.error('Error fetching GCs for trip:', err)
      setExpandedGCs([])
    } finally {
      setGcLoading(false)
    }
  }

  const handlePrint = async () => {
    if (!selectedTripId) {
      alert('Please select a trip sheet to preview/print')
      return
    }

    try {
      setIsPrinting(true)
      const response = await axios.get(`${API_BASE_URL}/trip-sheets/${selectedTripId}`)
      if (response.data.success) {
        setPrintData(response.data.data)
        setShowPreview(true)
      }
    } catch (err) {
      console.error('Preview fetch err:', err)
      alert('Error fetching trip sheet details')
    } finally {
      setIsPrinting(false)
    }
  }

  const triggerActualPrint = () => {
    window.print()
  }

  return (
    <>
      <div className="p-4 space-y-3 bg-gray-50 min-h-screen relative">
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-2.5 px-4 rounded-lg shadow-sm border border-gray-200 no-print">
          <div>
            <h1 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <div className="p-1 bg-green-600 rounded-[5px] text-white">
                <FileText size={16} />
              </div>
              TRIP SHEET REPORT
            </h1>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5 uppercase tracking-wider">Select and print detailed trip sheets</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={!selectedTripId || isPrinting}
              className="px-3 py-1.5 bg-gray-800 text-white rounded-[5px] hover:bg-gray-900 font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 text-xs shadow-sm"
            >
              {isPrinting ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
              PRINT SELECTED
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white p-3 px-4 rounded-lg shadow-sm border border-gray-200 no-print">
          <div className="flex items-center gap-2 mb-2">
            <Filter size={14} className="text-green-600" />
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Report Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">
                <Calendar size={10} /> From Date
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-[5px] focus:border-green-500 focus:bg-white outline-none font-bold text-gray-700 transition-all text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">
                <Calendar size={10} /> To Date
              </label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-[5px] focus:border-green-500 focus:bg-white outline-none font-bold text-gray-700 transition-all text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">
                <MapPin size={10} /> Dispatch Branch
              </label>
              <select
                value={filters.branch_id}
                onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
                disabled={currentUser?.role !== 'superadmin'}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-[5px] focus:border-green-500 focus:bg-white outline-none font-bold text-gray-700 transition-all appearance-none text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {currentUser?.role === 'superadmin' && <option value="">ALL BRANCHES</option>}
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.branch_name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => fetchReportData()}
                disabled={loading}
                className="w-full px-3 py-1.5 bg-green-600 text-white rounded-[5px] hover:bg-green-700 font-black flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50 text-xs"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <><Search size={14} /> GET DETAILS</>}
              </button>
            </div>
          </div>
        </div>

        {/* Main Table View */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden no-print">
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              TripSheet Records
            </h3>
            <div className="flex items-center gap-3">
              {/* NEW: Quick Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                <input 
                  type="text"
                  placeholder="Search Trip # / Vehicle / Driver..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 text-[10px] w-48 shadow-inner transition-all"
                />
              </div>
              <span className="text-[10px] font-black text-gray-400 bg-gray-200 px-2.5 py-1 rounded-full">{tripsheets.length} RECORDS FOUND</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-800 text-white text-[10px]">
                  <th className="px-4 py-3 text-center align-top">SEL</th>
                  <th className="px-4 py-2 text-left font-black uppercase tracking-widest">
                    <div>TripSheet No</div>
                    <input
                      type="text"
                      placeholder="Search..."
                      className="mt-1 w-full text-[9px] px-1.5 py-0.5 bg-gray-700 border border-gray-600 rounded font-normal text-white placeholder-gray-400 outline-none focus:border-green-400"
                      value={columnFilters.tripNo}
                      onChange={e => setColumnFilters(p => ({ ...p, tripNo: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                    />
                  </th>
                  <th className="px-4 py-2 text-left font-black uppercase tracking-widest">
                    <div>Route</div>
                    <input
                      type="text"
                      placeholder="Search..."
                      className="mt-1 w-full text-[9px] px-1.5 py-0.5 bg-gray-700 border border-gray-600 rounded font-normal text-white placeholder-gray-400 outline-none focus:border-green-400"
                      value={columnFilters.route}
                      onChange={e => setColumnFilters(p => ({ ...p, route: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                    />
                  </th>
                  <th className="px-4 py-2 text-left font-black uppercase tracking-widest">
                    <div>Dispatch Date</div>
                    <input
                      type="text"
                      placeholder="dd/mm/yyyy"
                      className="mt-1 w-full text-[9px] px-1.5 py-0.5 bg-gray-700 border border-gray-600 rounded font-normal text-white placeholder-gray-400 outline-none focus:border-green-400"
                      value={columnFilters.dispatchDate}
                      onChange={e => setColumnFilters(p => ({ ...p, dispatchDate: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                    />
                  </th>
                  <th className="px-4 py-2 text-left font-black uppercase tracking-widest">
                    <div>Vehicle No</div>
                    <input
                      type="text"
                      placeholder="Search..."
                      className="mt-1 w-full text-[9px] px-1.5 py-0.5 bg-gray-700 border border-gray-600 rounded font-normal text-white placeholder-gray-400 outline-none focus:border-green-400"
                      value={columnFilters.vehicleNo}
                      onChange={e => setColumnFilters(p => ({ ...p, vehicleNo: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                    />
                  </th>
                  <th className="px-4 py-2 text-left font-black uppercase tracking-widest">
                    <div>Driver Name</div>
                    <input
                      type="text"
                      placeholder="Search..."
                      className="mt-1 w-full text-[9px] px-1.5 py-0.5 bg-gray-700 border border-gray-600 rounded font-normal text-white placeholder-gray-400 outline-none focus:border-green-400"
                      value={columnFilters.driverName}
                      onChange={e => setColumnFilters(p => ({ ...p, driverName: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest align-top">Owner Name</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-widest align-top">Advance</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-widest align-top">Freight</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-widest align-top">Collection</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-widest align-top">Less Paid</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-widest align-top">Balance</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-widest align-top">Total KM</th>
                  <th className="px-4 py-3 text-center font-black uppercase tracking-widest align-top">Status</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest align-top">Ack Date</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-orange-400 italic align-top">Ack Branch</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-orange-400 italic align-top">Ack By</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-orange-400 italic align-top">Ack Time</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest align-top">Ack Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(() => {
                  const filtered = tripsheets.filter(ts => {
                    // Global search
                    if (searchTerm) {
                      const s = searchTerm.toLowerCase();
                      const matchesGlobal = (ts.trip_number || '').toLowerCase().includes(s) || 
                             (ts.vehicle?.vehicle_number || '').toLowerCase().includes(s) || 
                             (ts.driver?.name || '').toLowerCase().includes(s);
                      if (!matchesGlobal) return false;
                    }
                    // Column filters
                    if (columnFilters.tripNo && !(ts.trip_number || '').toLowerCase().includes(columnFilters.tripNo.toLowerCase())) return false;
                    if (columnFilters.route) {
                      const route = `${ts.dispatch_branch?.branch_name || ''} ${ts.alert_branch_data?.branch_name || ts.alert_branch_name || ''}`.toLowerCase();
                      if (!route.includes(columnFilters.route.toLowerCase())) return false;
                    }
                    if (columnFilters.dispatchDate) {
                      const d = ts.dispatch_date ? new Date(ts.dispatch_date).toLocaleDateString('en-GB') : '';
                      if (!d.includes(columnFilters.dispatchDate)) return false;
                    }
                    if (columnFilters.vehicleNo && !(ts.vehicle?.vehicle_number || '').toLowerCase().includes(columnFilters.vehicleNo.toLowerCase())) return false;
                    if (columnFilters.driverName && !(ts.driver?.name || '').toLowerCase().includes(columnFilters.driverName.toLowerCase())) return false;
                    return true;
                  });

                  if (filtered.length === 0) return (
                    <tr>
                      <td colSpan="19" className="px-4 py-16 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <FileText size={36} className="text-gray-200" />
                          <p className="font-black text-xs uppercase tracking-widest">No matching records</p>
                        </div>
                      </td>
                    </tr>
                  );

                  return filtered.map((ts) => (
                    <React.Fragment key={ts.id}>
                      <tr
                        className={`hover:bg-green-50/30 transition-colors cursor-pointer ${selectedTripId === ts.id ? 'bg-green-50' : ''}`}
                        onClick={() => {
                          setSelectedTripId(ts.id)
                          handleExpandGCs(ts)
                        }}
                      >
                      <td className="px-4 py-3 text-center">
                        {selectedTripId === ts.id ?
                          <CheckCircle2 size={14} className="text-green-600 mx-auto" /> :
                          <Circle size={14} className="text-gray-300 mx-auto" />
                        }
                      </td>
                      <td className="px-4 py-3 font-black text-blue-600">
                        <div className="flex items-center gap-1.5">
                          {ts.trip_number}
                          {(ts.waybills?.length > 0 || true) && (
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-colors ${
                              expandedTripId === ts.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {expandedTripId === ts.id ? '▲ GCs' : '▼ GCs'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-bold whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-green-600">{ts.dispatch_branch?.branch_name || '-'}</span>
                            <ChevronRight size={10} className="text-gray-400" />
                            <span className="text-orange-600">{ts.alert_branch_data?.branch_name || ts.alert_branch_name || 'N/A'}</span>
                          </div>
                          {ts.route && (
                            <div className="mt-1 flex items-center gap-1 text-[8px] font-black text-indigo-500 uppercase bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 w-fit">
                              <GitBranch size={8} /> {ts.route.route_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-bold whitespace-nowrap">{new Date(ts.trip_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-800 font-black tracking-tight">{ts.vehicle?.vehicle_number || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-600 font-bold">{ts.driver?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-600 font-bold">{ts.owner_name || ts.vehicle?.owner_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-black">₹{parseFloat(ts.advance_amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-black text-blue-600">₹{(ts.total_freight || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-black text-purple-600">₹{(ts.total_collection || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-black text-red-500">₹{(ts.less_paid_driver || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-black text-green-700">₹{(ts.balance_at_office || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-black text-blue-500">{(ts.total_kms || 0)} KM</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                          ts.status === 'DELIVERED' || ts.status === 'COMPLETED' || ts.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                          ts.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                          {ts.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-bold text-[10px]">
                        {ts.ack_date ? new Date(ts.ack_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-black text-[9px] uppercase italic">
                        {ts.ack_branch?.branch_name || ts.ackBranch?.branch_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-bold text-[9px] uppercase italic">
                        {ts.ack_by_admin?.name || ts.ackByAdmin?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-medium text-[9px] italic">
                        {ts.ack_timestamp ? new Date(ts.ack_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-medium text-[10px] truncate max-w-[150px]">
                        {ts.ack_remarks || '-'}
                      </td>
                    </tr>

                    {/* ── Expanded Mapped GCs Panel ── */}
                    {expandedTripId === ts.id && (
                      <tr>
                        <td colSpan="19" className="p-0 bg-blue-50/60 border-b-2 border-blue-200">
                          <div className="px-6 py-3 shadow-inner">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">
                                Mapped GC Numbers — {ts.trip_number}
                              </span>
                              {gcLoading && <Loader2 size={12} className="animate-spin text-blue-500" />}
                            </div>

                            {gcLoading ? (
                              <div className="text-[10px] text-blue-400 font-bold italic ml-4">Loading GCs...</div>
                            ) : expandedGCs.length === 0 ? (
                              <div className="text-[10px] text-gray-500 font-bold italic ml-4">No GCs mapped to this trip sheet.</div>
                            ) : (
                              <div className="overflow-x-auto ml-4 rounded-lg shadow-sm border border-blue-200">
                                <table className="w-full text-[10px] rounded-lg overflow-hidden bg-white">
                                  <thead>
                                    <tr className="bg-blue-600 text-white">
                                      <th className="px-3 py-1.5 text-left font-black uppercase tracking-wider">#</th>
                                      <th className="px-3 py-1.5 text-left font-black uppercase tracking-wider">GC No</th>
                                      <th className="px-3 py-1.5 text-left font-black uppercase tracking-wider">GC Date</th>
                                      <th className="px-3 py-1.5 text-left font-black uppercase tracking-wider">Consignor</th>
                                      <th className="px-3 py-1.5 text-left font-black uppercase tracking-wider">Consignee</th>
                                      <th className="px-3 py-1.5 text-left font-black uppercase tracking-wider">Destination</th>
                                      <th className="px-3 py-1.5 text-center font-black uppercase tracking-wider">Frt Type</th>
                                      <th className="px-3 py-1.5 text-center font-black uppercase tracking-wider">Articles</th>
                                      <th className="px-3 py-1.5 text-right font-black uppercase tracking-wider">Amount (₹)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-blue-100">
                                    {expandedGCs.map((wb, idx) => (
                                      <tr key={wb.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/40'} hover:bg-yellow-50 transition-colors`}>
                                        <td className="px-3 py-1.5 text-gray-400 font-bold">{idx + 1}</td>
                                        <td className="px-3 py-1.5 font-black text-blue-700 tracking-tight">{wb.gc_number || '-'}</td>
                                        <td className="px-3 py-1.5 text-gray-600 font-bold whitespace-nowrap">
                                          {wb.bill_date ? new Date(wb.bill_date).toLocaleDateString('en-IN') : '-'}
                                        </td>
                                        <td className="px-3 py-1.5 text-gray-700 font-bold uppercase">{wb.consignor?.name || '-'}</td>
                                        <td className="px-3 py-1.5 text-gray-700 font-bold uppercase">{wb.consignee?.name || '-'}</td>
                                        <td className="px-3 py-1.5 text-orange-600 font-black uppercase">{wb.destination?.city_name || wb.destination?.branch_name || '-'}</td>
                                        <td className="px-3 py-1.5 text-center font-black uppercase text-[9px] tracking-widest">
                                          <span className={`px-2 py-0.5 rounded-full ${wb.account_type?.toLowerCase() === 'topay' ? 'bg-red-100 text-red-700' : wb.account_type?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                              {wb.account_type || '-'}
                                          </span>
                                        </td>
                                        <td className="px-3 py-1.5 text-center font-black text-gray-800">
                                          {wb.total_articles || wb.articles?.reduce((a, c) => a + (parseInt(c.no_of_articles) || 0), 0) || 0}
                                        </td>
                                        <td className="px-3 py-1.5 text-right font-black text-green-700">
                                          ₹{parseFloat(wb.grand_total || wb.total_amount || 0).toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="bg-blue-100 border-t-2 border-blue-300">
                                      <td colSpan="7" className="px-3 py-1.5 font-black text-blue-900 uppercase text-[9px] tracking-widest text-right">Total</td>
                                      <td className="px-3 py-1.5 text-center font-black text-blue-900">
                                        {expandedGCs.reduce((a, wb) => a + (parseInt(wb.total_articles) || wb.articles?.reduce((s, c) => s + (parseInt(c.no_of_articles) || 0), 0) || 0), 0)}
                                      </td>
                                      <td className="px-3 py-1.5 text-right font-black text-green-800 text-[11px]">
                                        ₹{expandedGCs.reduce((a, wb) => a + (parseFloat(wb.grand_total || wb.total_amount) || 0), 0).toFixed(2)}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Full Page Print Preview Modal ── */}
        {showPreview && printData && (
          <div className="fixed inset-0 z-[1000] flex flex-col bg-white animate-in fade-in zoom-in duration-300 no-print">
            {/* Modal Header - Fixed at top */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 no-print">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                  <Printer size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800 leading-none uppercase tracking-tight">Trip Sheet Preview</h2>
                  <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-widest">{printData.trip_number} — Review before printing</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowPreview(false)
                  setPrintData(null)
                }} 
                className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-all text-gray-500 group"
              >
                <X size={28} className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            {/* Receipt Preview - Scrollable area */}
            <div className="flex-1 overflow-auto bg-gray-200/50 p-4 md:p-8 flex justify-center" id="printable-tripsheet">
              <div className="bg-white shadow-2xl p-[5mm] md:p-[10mm] min-w-fit h-fit">
                <TripSheetReceipt
                  printData={printData}
                  transportInfo={transportInfo}
                  logo={logo}
                />
              </div>
            </div>

            {/* Modal Footer with Actions - Fixed at bottom */}
            <div className="p-6 border-t bg-white flex justify-center items-center gap-6 no-print shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
              <button
                onClick={() => {
                  setShowPreview(false)
                  setPrintData(null)
                }}
                className="px-8 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-sm hover:bg-gray-200 transition-all active:scale-95 border border-gray-200"
              >
                Back to Report
              </button>
              <button
                onClick={triggerActualPrint}
                className="px-12 py-4 bg-gradient-to-r from-green-600 to-green-800 text-white rounded-2xl font-black uppercase text-base hover:from-green-700 hover:to-green-900 transition-all flex items-center gap-3 shadow-xl shadow-green-200 active:scale-95 group"
              >
                <Printer size={24} className="group-hover:scale-110 transition-transform" />
                Confirm & Print
              </button>
            </div>
          </div>
        )}

        {/* Hidden printable content used purely for window.print() */}
        <div className="printable-content hidden print:block" id="printable-area-hidden">
            <TripSheetReceipt
              printData={printData}
              transportInfo={transportInfo}
              logo={logo}
            />
        </div>

        <style>{`
          @media screen {
            .printable-content { display: none; }
          }
          @media print {
            body * { visibility: hidden !important; }
            .printable-content, .printable-content * { visibility: visible !important; }
            .printable-content { 
              position: absolute !important; 
              left: 0 !important; 
              top: 0 !important; 
              width: 100% !important;
              display: block !important;
            }
            .no-print { display: none !important; }
          }
        `}</style>
      </div>
    </>
  )
}

export default TripSheetReport
