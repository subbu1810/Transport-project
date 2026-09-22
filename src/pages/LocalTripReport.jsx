import React, { useState, useEffect } from 'react'
import { Search, Printer, FileText, Filter, Calendar, MapPin, Loader2, RefreshCcw, CheckCircle2, Circle, ChevronRight, Truck } from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL, STORAGE_URL } from '../config/api';
import { applyBranchOverrides } from '../utils/branchOverrides';

function LocalTripReport() {
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
        const transportLogo = user.transport_logo_url || 
                              user.transport_logo_path || 
                              user.logo_url ||
                              (user.transport && (user.transport.logo_url || user.transport.logo_path));
        
        if (transportLogo) {
          setLogo(getFullStorageUrl(transportLogo));
          return;
        }
      }

      const response = await axios.get(`${API_BASE_URL}/settings/all`);
      if (response.data.success && response.data.data) {
        const s = response.data.data;
        const globalLogo = s.logo_path || s.logo;
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
        
        const overrides = applyBranchOverrides(user, {
          name: user.transport_name || (user.transport && user.transport.name) || 'SANVI TRANSPORT',
          address: user.transport_address || (user.transport && user.transport.address) || '',
          phone: user.transport_phone || user.transport_mobile || (user.transport && user.transport.phone) || '',
          subtitle: user.transport_subtitle || (user.transport && user.transport.subtitle) || '',
          logo: user.transport_logo_url || (user.transport && user.transport.logo) || ''
        });
        
        setTransportInfo({
          name: overrides.company_name || overrides.name,
          address: overrides.address,
          phone: overrides.phone,
          subtitle: overrides.subtitle,
          logo: overrides.logo_path || overrides.logo
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
        setBranches(data.data)
      }
    } catch (err) { console.error('Error fetching branches:', err) }
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
        trip_type: 'LOCAL'
      })

      if (activeFilters.branch_id) queryParams.append('branch_id', activeFilters.branch_id)

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
    if (expandedTripId === ts.id) {
      setExpandedTripId(null)
      setExpandedGCs([])
      return
    }
    setExpandedTripId(ts.id)
    if (ts.waybills && ts.waybills.length > 0 && ts.waybills[0].consignor) {
      setExpandedGCs(ts.waybills)
      return
    }
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
      alert('Please select a local trip to print')
      return
    }

    try {
      setIsPrinting(true)
      const response = await axios.get(`${API_BASE_URL}/trip-sheets/${selectedTripId}`)
      if (response.data.success) {
        setPrintData(response.data.data)
        setTimeout(() => {
          window.print()
          setPrintData(null)
          setIsPrinting(false)
        }, 1000)
      }
    } catch (err) {
      console.error('Print fetch err:', err)
      setIsPrinting(false)
    }
  }

  return (
    <div className="p-4 space-y-3 bg-gray-50 min-h-screen relative">
      <div className="flex justify-between items-center bg-white p-2.5 px-4 rounded-lg shadow-sm border border-gray-200 no-print">
        <div>
          <h1 className="text-lg font-black text-purple-800 flex items-center gap-2">
            <div className="p-1 bg-purple-600 rounded-[5px] text-white">
              <Truck size={16} />
            </div>
            LOCAL TRIP REPORT
          </h1>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5 uppercase tracking-wider">Review local distribution & delivery trips</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            disabled={!selectedTripId || isPrinting}
            className="px-3 py-1.5 bg-purple-800 text-white rounded-[5px] hover:bg-purple-900 font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 text-xs shadow-sm"
          >
            {isPrinting ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
            PRINT SELECTED
          </button>
        </div>
      </div>

      <div className="bg-white p-3 px-4 rounded-lg shadow-sm border border-gray-200 no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">
              <Calendar size={10} /> From Date
            </label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-[5px] focus:border-purple-500 focus:bg-white outline-none font-bold text-gray-700 transition-all text-xs"
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
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-[5px] focus:border-purple-500 focus:bg-white outline-none font-bold text-gray-700 transition-all text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">
              <MapPin size={10} /> Branch
            </label>
            <select
              value={filters.branch_id}
              onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
              disabled={currentUser?.role !== 'superadmin'}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-[5px] focus:border-purple-500 focus:bg-white outline-none font-bold text-gray-700 transition-all appearance-none text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              className="w-full px-3 py-1.5 bg-purple-600 text-white rounded-[5px] hover:bg-purple-700 font-black flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50 text-xs"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <><Search size={14} /> GET DETAILS</>}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-purple-900 text-white text-[10px]">
                <th className="px-4 py-3 text-center">SEL</th>
                <th className="px-4 py-3 text-left font-black uppercase tracking-widest">Trip No</th>
                <th className="px-4 py-3 text-left font-black uppercase tracking-widest">Route</th>
                <th className="px-4 py-3 text-left font-black uppercase tracking-widest">Date</th>
                <th className="px-4 py-3 text-left font-black uppercase tracking-widest">Vehicle</th>
                <th className="px-4 py-3 text-left font-black uppercase tracking-widest">Driver</th>
                <th className="px-4 py-3 text-right font-black uppercase tracking-widest">Advance</th>
                <th className="px-4 py-3 text-right font-black uppercase tracking-widest">Freight</th>
                <th className="px-4 py-3 text-right font-black uppercase tracking-widest">Collected</th>
                <th className="px-4 py-3 text-right font-black uppercase tracking-widest">KMs</th>
                <th className="px-4 py-3 text-center font-black uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tripsheets.length > 0 ? (
                tripsheets.map((ts) => (
                  <React.Fragment key={ts.id}>
                    <tr
                      className={`hover:bg-purple-50/30 transition-colors cursor-pointer ${selectedTripId === ts.id ? 'bg-purple-50' : ''}`}
                      onClick={() => {
                        setSelectedTripId(ts.id)
                        handleExpandGCs(ts)
                      }}
                    >
                      <td className="px-4 py-3 text-center">
                        {selectedTripId === ts.id ?
                          <CheckCircle2 size={14} className="text-purple-600 mx-auto" /> :
                          <Circle size={14} className="text-gray-300 mx-auto" />
                        }
                      </td>
                      <td className="px-4 py-3 font-black text-purple-700">
                        <div className="flex items-center gap-1.5">
                          {ts.trip_number}
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-purple-100 text-purple-700">
                            {expandedTripId === ts.id ? '▲ GCs' : '▼ GCs'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-bold uppercase tracking-tighter">LOCAL DELIVERY</td>
                      <td className="px-4 py-3 text-gray-600 font-bold">{new Date(ts.trip_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-800 font-black">{ts.vehicle?.vehicle_number}</td>
                      <td className="px-4 py-3 text-gray-600 font-bold">{ts.driver?.name}</td>
                      <td className="px-4 py-3 text-right text-orange-600 font-black">₹{parseFloat(ts.advance_amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-black text-purple-600">₹{(ts.total_freight || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-black text-green-600">₹{(ts.total_collection || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-black">{(ts.total_kms || 0)} KM</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${ts.verification_date ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {ts.verification_date ? 'VERIFIED' : 'PENDING'}
                        </span>
                      </td>
                    </tr>
                    {expandedTripId === ts.id && (
                      <tr>
                        <td colSpan="11" className="p-4 bg-purple-50/40">
                            <div className="bg-white rounded-lg border border-purple-100 overflow-hidden">
                                <table className="w-full text-[10px]">
                                    <thead className="bg-purple-100/50">
                                        <tr>
                                            <th className="px-3 py-1.5 text-left font-black uppercase">GC No</th>
                                            <th className="px-3 py-1.5 text-left font-black uppercase">Consignee</th>
                                            <th className="px-3 py-1.5 text-left font-black uppercase">Destination</th>
                                            <th className="px-3 py-1.5 text-center font-black uppercase">Articles</th>
                                            <th className="px-3 py-1.5 text-right font-black uppercase">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-purple-50">
                                        {expandedGCs.map(gc => (
                                            <tr key={gc.id}>
                                                <td className="px-3 py-1.5 font-bold text-purple-700">{gc.gc_number}</td>
                                                <td className="px-3 py-1.5 text-gray-600 uppercase">{gc.consignee?.name || '-'}</td>
                                                <td className="px-3 py-1.5 text-gray-500 italic">{gc.destination?.city_name || '-'}</td>
                                                <td className="px-3 py-1.5 text-center font-black">{gc.total_articles}</td>
                                                <td className="px-3 py-1.5 text-right font-black">₹{parseFloat(gc.grand_total).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="px-4 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                    No Local Trips Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {printData && (
        <div className="printable-content">
             <div className="border-2 border-black p-4 space-y-4">
                <div className="flex justify-between border-b-2 border-black pb-2">
                    <div className="text-center flex-1">
                        <h1 className="text-2xl font-black uppercase tracking-widest">{transportInfo.name}</h1>
                        <p className="text-[10px] font-bold">{transportInfo.address}</p>
                        <p className="text-[10px] font-black uppercase mt-1">Local Trip Sheet Report - {printData.trip_number}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 text-[11px] font-black">
                    <p>Trip No: {printData.trip_number}</p>
                    <p className="text-right">Date: {new Date(printData.trip_date).toLocaleDateString()}</p>
                    <p>Vehicle: {printData.vehicle?.vehicle_number}</p>
                    <p className="text-right">Driver: {printData.driver?.name}</p>
                </div>
                <table className="w-full text-[10px] border-collapse">
                    <thead>
                        <tr className="border-y-2 border-black uppercase">
                            <th className="text-left p-1">GC No</th>
                            <th className="text-left p-1">Consignee</th>
                            <th className="text-center p-1">Articles</th>
                            <th className="text-right p-1">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {printData.waybills?.map(wb => (
                            <tr key={wb.id} className="border-b border-gray-200 font-bold">
                                <td className="p-1">{wb.gc_number}</td>
                                <td className="p-1 uppercase">{wb.consignee?.name}</td>
                                <td className="p-1 text-center">{wb.total_articles}</td>
                                <td className="p-1 text-right italic">₹{parseFloat(wb.grand_total || wb.total_amount).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-black font-black uppercase">
                            <td colSpan="2" className="p-1">Total Collection</td>
                            <td className="text-center p-1">{printData.waybills?.reduce((a,c) => a + (parseInt(c.total_articles) || 0), 0)}</td>
                            <td className="text-right p-1">₹{parseFloat(printData.total_collection || 0).toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
                <div className="pt-12 flex justify-between text-[10px] font-black uppercase">
                    <p>Driver Signature</p>
                    <p>Office Signature</p>
                </div>
             </div>
        </div>
      )}

      <style>{`
        @media screen { .printable-content { display: none; } }
        @media print {
            aside, header, nav, footer, .no-print { display: none !important; }
            body { background: white !important; }
            .printable-content { display: block !important; width: 100% !important; margin: 0; padding: 10mm; }
            @page { size: auto; margin: 0; }
        }
      `}</style>
    </div>
  )
}

export default LocalTripReport
