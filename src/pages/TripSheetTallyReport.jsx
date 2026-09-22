import React, { useState, useEffect } from 'react'
import { 
  Search, Printer, FileText, Filter, Calendar, MapPin, 
  Loader2, HelpCircle, CheckCircle2, Download, 
  Activity, TrendingUp, TrendingDown, DollarSign
} from 'lucide-react'
import * as XLSX from 'xlsx'
import axios from 'axios'
import { API_BASE_URL, STORAGE_URL } from '../config/api';
import { applyBranchOverrides } from '../utils/branchOverrides';

function TripSheetTallyReport() {
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    status: '',
    branch_id: ''
  })

  const [tripsheets, setTripsheets] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [settings, setSettings] = useState({
    company_name: 'Transport Logistics',
    address: '',
    phone: '',
    logo_path: ''
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setCurrentUser(user)
        if (user.role !== 'superadmin') {
          setFilters(prev => ({ ...prev, branch_id: user.branch_id }))
        }
      } catch (e) {
        console.error("Error parsing user data", e)
      }
    }
    fetchBranches()
    fetchSystemSettings()
    fetchReportData()
  }, [])

  const fetchSystemSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/all`);
      if (response.data.success) {
        const s = response.data.data;
        const userData = JSON.parse(localStorage.getItem('user')) || {};
        const overrides = applyBranchOverrides(userData, {
          company_name: userData.transport_name || s.company_name || s.transport_name || 'Transport Logistics',
          address: userData.transport_address || s.address || s.transport_address || '',
          phone: userData.transport_phone || s.phone || s.transport_phone || '',
          logo_path: userData.transport_logo_url || s.logo_path || ''
        });
        setSettings({
          company_name: overrides.company_name,
          address: overrides.address,
          phone: overrides.phone,
          logo_path: overrides.logo_path || overrides.logo
        });
      }
    } catch (err) { console.error('Settings err:', err); }
  };

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/branches`)
      if (response.data.success) {
        const userData = JSON.parse(localStorage.getItem('user'))
        if (userData?.role !== 'superadmin') {
          setBranches(response.data.data.filter(b => b.id == userData.branch_id))
        } else {
          setBranches(response.data.data)
        }
      }
    } catch (err) { console.error('Branches err:', err) }
  }

  const fetchReportData = async () => {
    try {
      setLoading(true)
      setError('')
      const params = {
        from_date: filters.fromDate,
        to_date: filters.toDate,
      }
      if (filters.status) params.status = filters.status
      if (filters.branch_id) params.branch_id = filters.branch_id

      const response = await axios.get(`${API_BASE_URL}/trip-sheets`, { params })
      if (response.data.success) {
        setTripsheets(response.data.data)
      } else {
        setError(response.data.message || 'Failed to fetch tally data')
      }
    } catch (err) {
      setError('Connection failure. Check network.')
    } finally {
      setLoading(false)
    }
  }

  const totals = tripsheets.reduce((acc, ts) => {
    acc.advance += parseFloat(ts.advance_amount || 0)
    acc.freight += parseFloat(ts.total_freight || 0)
    return acc
  }, { advance: 0, freight: 0 })

  const handlePrint = () => {
    window.print()
  }

  const exportToExcel = () => {
    if (tripsheets.length === 0) return
    const dataToExport = tripsheets.map(ts => ({
      'Tripsheet No': ts.trip_number,
      'Dispatch Date': ts.trip_date ? new Date(ts.trip_date).toLocaleDateString() : '-',
      'Vehicle No': ts.vehicle?.vehicle_number || '-',
      'Driver Name': ts.driver?.name || '-',
      'Advance': ts.advance_amount,
      'Freight': ts.total_freight,
      'Status': ts.status,
      'Ack Date': ts.ack_date ? new Date(ts.ack_date).toLocaleDateString() : '-',
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(dataToExport)
    XLSX.utils.book_append_sheet(wb, ws, "Trip Sheet Tally")
    XLSX.writeFile(wb, `TripSheet_Tally_${filters.fromDate}_to_${filters.toDate}.xlsx`)
  }

  return (
    <div className="p-3 space-y-3 bg-gray-50/50 min-h-screen printable-area">
      {/* PROFESSIONAL PRINT HEADER */}
      <div className="hidden print:block mb-6 border-b-2 border-gray-800 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            {settings.logo_path && (
               <img 
                 src={settings.logo_path.startsWith('http') ? settings.logo_path : `${STORAGE_URL}/${settings.logo_path}`} 
                 alt="Logo" 
                 className="h-14 w-auto object-contain"
               />
            )}
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 leading-none">
                {settings.company_name}
              </h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">
                {settings.address} {settings.phone && `| Contact: ${settings.phone}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block bg-gray-900 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest mb-2">Audit Tally</div>
            <h2 className="text-lg font-black text-gray-800 uppercase leading-none tracking-tighter">Trip Sheet Settlement Report</h2>
            <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
              Period: {new Date(filters.fromDate).toLocaleDateString('en-IN')} — {new Date(filters.toDate).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Control Hub */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 no-print">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-600 rounded-lg text-white shadow-lg shadow-green-100">
              <Activity size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-800 uppercase tracking-tight leading-none">Trip Sheet Tally Report</h1>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Operational Audit & Settlement Review</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={exportToExcel}
              disabled={tripsheets.length === 0}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 h-[34px]"
            >
              <Download size={12} /> Excel Export
            </button>
            <button
              onClick={handlePrint}
              disabled={tripsheets.length === 0}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 h-[34px]"
            >
              <Printer size={12} /> Print Audit
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-50/50">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Period From</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                  className="w-full pl-8 pr-2 py-1.5 bg-white border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-all text-xs font-bold"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Period To</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                  className="w-full pl-8 pr-2 py-1.5 bg-white border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-all text-xs font-bold"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Fleet Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-all text-xs font-bold appearance-none"
              >
                <option value="">CONSOLIDATED VIEW</option>
                <option value="PENDING">PENDING</option>
                <option value="LOADED">LOADED</option>
                <option value="IN-TRANSIT">IN-TRANSIT</option>
                <option value="DELIVERED">DELIVERED</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Source Branch</label>
              <select
                value={filters.branch_id}
                onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
                disabled={currentUser?.role !== 'superadmin'}
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-all text-xs font-bold appearance-none disabled:bg-gray-100"
              >
                {currentUser?.role === 'superadmin' && <option value="">ALL GLOBAL BRANCHES</option>}
                {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
              </select>
            </div>
            <button
              onClick={fetchReportData}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md shadow-green-100 h-[34px] disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Crunch Data
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Audit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-green-200 transition-colors border-b-4 border-b-green-500">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Trip Advance</p>
            <h4 className="text-2xl font-black text-gray-900 tracking-tighter">₹{totals.advance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
            <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold mt-1 uppercase">
              <TrendingUp size={12} />
              <span>Capital Outflow</span>
            </div>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl shadow-inner group-hover:bg-green-100 transition-all">
            <DollarSign size={28} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors border-b-4 border-b-blue-600">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Gross Freight (Tally)</p>
            <h4 className="text-2xl font-black text-gray-900 tracking-tighter">₹{totals.freight.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
            <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold mt-1 uppercase">
              <TrendingDown size={12} />
              <span>Gross Load Value</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner group-hover:bg-blue-100 transition-all">
             <Activity size={28} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors border-b-4 border-b-indigo-600">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 text-indigo-600">Active Audit Scale</p>
            <h4 className="text-2xl font-black text-gray-900 tracking-tighter">{tripsheets.length} <span className="text-sm">Trips</span></h4>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter italic">Total entries under scrutiny</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner group-hover:bg-indigo-100 transition-all">
            <FileText size={28} />
          </div>
        </div>
      </div>

      {/* Main Ledger Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center no-print">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Historical Scrutiny View</h3>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-4 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">TS Number</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Date</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Vehicle</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Branch</th>
                <th className="px-4 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-4 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Advance (₹)</th>
                <th className="px-4 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Freight (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                   <td colSpan="7" className="px-6 py-32 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-green-600" size={32} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Fleet Ledger...</span>
                      </div>
                   </td>
                </tr>
              ) : tripsheets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-24 text-center text-gray-300">
                    <p className="text-xs font-black uppercase tracking-widest italic">Zero matches found in this date range</p>
                  </td>
                </tr>
              ) : (
                tripsheets.map((ts) => (
                  <tr key={ts.id} className="hover:bg-green-50/20 transition-all group border-b border-gray-50 last:border-0 grow-on-hover">
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-blue-700 uppercase tracking-tighter">{ts.trip_number}</span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase italic leading-none truncate max-w-[100px]">{ts.driver?.name || 'NA'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[11px] font-bold text-gray-600 font-mono italic">{ts.trip_date ? new Date(ts.trip_date).toLocaleDateString('en-IN') : '-'}</span>
                    </td>
                    <td className="px-4 py-4 font-black text-gray-800 tracking-tighter text-xs">
                       {ts.vehicle?.vehicle_number || '-'}
                    </td>
                    <td className="px-4 py-4 uppercase text-[10px] font-bold text-gray-400">
                      {ts.dispatch_branch?.branch_name || 'Direct'}
                    </td>
                    <td className="px-4 py-4 text-center">
                       <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm ${
                        ts.status === 'DELIVERED' ? 'bg-emerald-600 text-white' :
                        ts.status === 'IN-TRANSIT' ? 'bg-blue-600 text-white' :
                        'bg-amber-500 text-white'
                      }`}>
                        {ts.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-xs font-black text-emerald-700 italic tabular-nums">
                      ₹{parseFloat(ts.advance_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 text-right text-xs font-black text-blue-700 italic tabular-nums">
                      ₹{parseFloat(ts.total_freight || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* NON-REPEATING AUDIT FOOTER */}
        {tripsheets.length > 0 && !loading && (
          <div className="bg-gray-900 text-white p-4 flex flex-col md:flex-row justify-between items-center gap-4 print:bg-black print:border-t-4 print:border-gray-900">
             <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-green-500 rounded-full print:bg-white" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] italic opacity-80">Mathematical Consolidation</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Audit based on {tripsheets.length} trips</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-12 items-center bg-gray-800/50 p-4 rounded-xl border border-gray-700 print:bg-black print:border-white print:p-0 print:gap-8">
               <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Advance Scutiny</p>
                <p className="text-sm font-black italic tabular-nums text-emerald-400">₹{totals.advance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right border-l border-gray-700 pl-12 print:border-black">
                <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Gross Freight Total</p>
                <p className="text-3xl font-black text-white tabular-nums tracking-tighter shadow-green-500/20 drop-shadow-lg">
                  ₹{totals.freight.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

       {/* Help Modal */}
       {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 no-print">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-green-100">
             <div className="p-6 bg-gray-900 text-white flex justify-between items-center">
               <h2 className="text-sm font-black uppercase tracking-widest">Report Guide</h2>
               <button onClick={() => setShowHelp(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                <X size={18} />
               </button>
             </div>
             <div className="p-6 space-y-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-100 italic text-[11px] font-bold text-green-800">
                  Observe the consolidated advance amounts against the gross freight to evaluate branch capital rotation.
                </div>
                <ul className="space-y-3 text-[10px] font-bold uppercase text-gray-500 tracking-tight">
                  <li className="flex items-center gap-3"><CheckCircle2 size={14} className="text-green-600" /> Verify trip numbers with physical manifests.</li>
                  <li className="flex items-center gap-3"><CheckCircle2 size={14} className="text-green-600" /> Monitor "Pending" trips to avoid fleet stagnation.</li>
                  <li className="flex items-center gap-3"><CheckCircle2 size={14} className="text-green-600" /> Print report daily for physical account filing.</li>
                </ul>
             </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { background: white !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .grow-on-hover:hover { transform: translateX(2px); }
      `}</style>
    </div>
  )
}

export default TripSheetTallyReport
