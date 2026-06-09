import React, { useState, useEffect, useMemo } from 'react'
import { 
  Search, Printer, FileText, Filter, Calendar, MapPin, Loader2, Download, HelpCircle, X, 
  CheckCircle, Clock, RefreshCcw, FilterX, Building, LayoutGrid
} from 'lucide-react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function WaybillTallyReport() {
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    branchId: ''
  })

  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')))
  const [branches, setBranches] = useState([])
  const [settings, setSettings] = useState({
    company_name: '',
    address: '',
    phone: '',
    gstin: '',
    logo_path: ''
  })
  const [waybills, setWaybills] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    // 1. Priority Initial Load from LocalStorage
    if (currentUser) {
      setSettings(prev => ({
        ...prev,
        company_name: currentUser.transport_name || '',
        address: currentUser.transport_address || '',
        phone: currentUser.transport_phone || '',
        gstin: currentUser.gst_number || currentUser.transport_gstin || '',
        logo_path: currentUser.transport_logo_url || ''
      }))
    }

    if (currentUser?.role !== 'superadmin' && currentUser?.branch_id) {
      setFilters(prev => ({ ...prev, branchId: currentUser.branch_id.toString() }))
    }
    fetchMeta()
    fetchReportData()
  }, [])

  const fetchMeta = async () => {
    try {
      const [brResp, setResp] = await Promise.all([
        axios.get(`${API_BASE_URL}/branches`),
        axios.get(`${API_BASE_URL}/settings/all`)
      ])
      
      if (brResp.data.success) setBranches(brResp.data.data)
      
      if (setResp.data.success) {
        const s = setResp.data.data
        setSettings(prev => ({
          ...prev,
          company_name: prev.company_name || s.transport_name || s.company_name || 'Transport Logistics',
          address: prev.address || s.transport_address || s.address || '',
          phone: prev.phone || s.transport_phone || s.phone || '',
          gstin: prev.gstin || s.gst_number || s.gstin || '',
          logo_path: prev.logo_path || s.logo_path || ''
        }))
      }
    } catch (err) { console.error('Error fetching meta:', err) }
  }

  const fetchReportData = async () => {
    try {
      setLoading(true)
      setError('')
      const params = {
        from_date: filters.fromDate,
        to_date: filters.toDate
      }
      if (filters.branchId) params.branch_id = filters.branchId
      
      // EXCLUDE CANCELLED GCs from the Tally Report to ensure financial accuracy
      const response = await axios.get(`${API_BASE_URL}/waybills`, { params })
      if (response.data.success) {
        // Filter out CANCELLED waybills on the client side for safety
        const activeWaybills = response.data.data.filter(wb => wb.status?.toUpperCase() !== 'CANCELLED');
        setWaybills(activeWaybills)
      } else {
        setError(response.data.message || 'Failed to fetch waybill tally')
      }
    } catch (err) {
      setError('Connection failure. Check if server is running.')
    } finally { setLoading(false) }
  }

  const exportToExcel = () => {
    if (waybills.length === 0) return
    const dataToExport = waybills.map(wb => ({
      'Bill Date': new Date(wb.bill_date).toLocaleDateString('en-GB'),
      'GC Num': wb.gc_number,
      'Destination': wb.destination?.city_name || 'N/A',
      'Consignor': wb.consignor?.name || 'N/A',
      'GST No': wb.consignor?.gst_number || 'N/A',
      'Consignee': wb.consignee?.name || 'N/A',
      'Articles': wb.total_articles,
      'Freight': wb.freight_amount,
      'DD Charges': wb.dd_charges,
      'Handling': wb.handling_charges,
      'GST': wb.gst_amount,
      'Grand Total': wb.grand_total,
      'Status': wb.status
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(dataToExport)
    XLSX.utils.book_append_sheet(wb, ws, "Tally Audit")
    XLSX.writeFile(wb, `Financial_Tally_Audit_${new Date().getTime()}.xlsx`)
  }

  const totals = useMemo(() => ({
    articles: waybills.reduce((sum, wb) => sum + (parseInt(wb.total_articles) || 0), 0),
    freight: waybills.reduce((sum, wb) => sum + (parseFloat(wb.freight_amount) || 0), 0),
    dd: waybills.reduce((sum, wb) => sum + (parseFloat(wb.dd_charges) || 0), 0),
    handling: waybills.reduce((sum, wb) => sum + (parseFloat(wb.handling_charges) || 0), 0),
    gst: waybills.reduce((sum, wb) => sum + (parseFloat(wb.gst_amount) || 0), 0),
    grand: waybills.reduce((sum, wb) => sum + (parseFloat(wb.grand_total) || 0), 0)
  }), [waybills]);

  return (
    <div className="p-3 space-y-3 bg-gray-50/50 min-h-screen printable-area">
      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block mb-6 border-b-2 border-gray-800 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            {settings.logo_path && (
              <img src={`${STORAGE_URL}/${settings.logo_path}`} alt="Logo" className="w-16 h-16 object-contain" />
            )}
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 leading-none">
                {settings.company_name}
              </h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase mt-1 max-w-[400px]">
                {settings.address}
              </p>
              <div className="flex gap-4 mt-1 border-t border-gray-100 pt-1">
                <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">
                  Contact: {settings.phone || 'N/A'}
                </p>
                {settings.gstin && (
                  <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">
                    GSTIN: {settings.gstin}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="px-3 py-1 bg-gray-100 text-gray-800 text-[10px] font-black uppercase tracking-[0.2em] mb-2 border border-gray-300">Waybill Tally</span>
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">
              {filters.branchId ? branches.find(b => b.id.toString() === filters.branchId)?.branch_name : 'ALL BRANCHES'}
            </h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
              Period: {new Date(filters.fromDate).toLocaleDateString('en-GB')} to {new Date(filters.toDate).toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>
      </div>

      {/* Search Hub */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 no-print">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-100">
              <LayoutGrid size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-800 uppercase tracking-tight">Waybill Tally Report</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Consolidated Revenue Audit & Reconciliation</p>
            </div>
            <button onClick={() => setShowHelp(true)} className="p-1.5 text-blue-400 hover:text-blue-600 transition-colors">
              <HelpCircle size={18} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToExcel}
              disabled={waybills.length === 0}
              className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-green-100 transition-all border border-green-100 disabled:opacity-50"
            >
              <Download size={14} /> DOWNLOAD EXCEL
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-md shadow-gray-200"
            >
              <Printer size={14} /> PRINT AUDIT
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 leading-none">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                  className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-blue-500 text-xs font-black outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 leading-none">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                  className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-blue-500 text-xs font-black outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 leading-none">Audit Branch</label>
              <div className="relative">
                <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                <select
                  value={filters.branchId}
                  onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
                  disabled={currentUser?.role !== 'superadmin'}
                  className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-blue-500 text-xs font-black outline-none transition-all appearance-none uppercase italic"
                >
                  {currentUser?.role === 'superadmin' && <option value="">Global Network</option>}
                  {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchReportData}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-blue-100"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                VIEW REPORT
              </button>
              <button
                onClick={() => setFilters({ ...filters, branchId: '' })}
                className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 border-2 border-gray-100 transition-all shadow-sm"
              >
                <FilterX size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-3 text-red-600 no-print">
          <Activity size={16} />
          <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      {/* Financial Ledger Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border-none print:shadow-none">
        <div className="px-4 py-3 bg-gray-900 border-b border-gray-800 flex justify-between items-center no-print">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.25em]">Audit Trail</h3>
          </div>
          <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-500/20">
            {waybills.length} GCs Consolidated
          </span>
        </div>

        <div className="overflow-x-auto min-h-[500px] print:min-h-0">
          <table className="w-full text-left print:text-black">
            <thead>
              <tr className="bg-gray-800 text-white text-[9px] uppercase tracking-widest italic font-black print:bg-black print:italic-none">
                <th className="px-3 py-4 border-r border-gray-700 print:border-black">S.N.</th>
                <th className="px-4 py-4 border-r border-gray-700 print:border-black whitespace-nowrap">Date</th>
                <th className="px-4 py-4 border-r border-gray-700 print:border-black whitespace-nowrap">GC Number</th>
                <th className="px-4 py-4 border-r border-gray-700 print:border-black">Destination</th>
                <th className="px-4 py-4 border-r border-gray-700 print:border-black">Client Detail</th>
                <th className="px-4 py-4 border-r border-gray-700 print:border-black text-center">Status</th>
                <th className="px-4 py-4 border-r border-gray-700 print:border-black text-right">Freight</th>
                <th className="px-4 py-4 border-r border-gray-700 print:border-black text-right">DD</th>
                <th className="px-4 py-4 border-r border-gray-700 print:border-black text-right">GST</th>
                <th className="px-4 py-4 text-right bg-blue-900/20 text-blue-400 print:bg-gray-200 print:text-black">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[11px] font-bold print:divide-black">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-24 text-center text-gray-400 italic">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-100 rounded-full animate-spin border-t-indigo-600"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Crunching Audit Numbers...</span>
                    </div>
                  </td>
                </tr>
              ) : waybills.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-24 text-center text-gray-300 italic uppercase font-black text-[10px] tracking-widest">
                    No active waybills found for the selected period
                  </td>
                </tr>
              ) : (
                waybills.map((wb, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors group print:hover:bg-transparent">
                    <td className="px-3 py-3 text-gray-400 font-mono print:text-black print:border-r print:border-black text-center">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono tracking-tight print:text-black print:border-r print:border-black whitespace-nowrap">{new Date(wb.bill_date).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3 text-indigo-600 font-black tracking-tighter print:text-black print:border-r print:border-black">{wb.gc_number}</td>
                    <td className="px-4 py-3 uppercase text-gray-700 tracking-tight print:text-black print:border-r print:border-black">{wb.destination?.city_name || 'Direct'}</td>
                    <td className="px-4 py-3 print:border-r print:border-black">
                      <div className="flex flex-col leading-tight max-w-[200px]">
                        <span className="text-[10px] font-black uppercase truncate">{wb.consignor?.name}</span>
                        <span className="text-[9px] text-gray-400 font-bold truncate">To: {wb.consignee?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center print:border-r print:border-black">
                      <div className="flex items-center justify-center gap-1.5 leading-none">
                        {wb.status?.toUpperCase() === 'DELIVERED' ? (
                          <span className="text-[9px] font-black text-green-600 uppercase flex items-center gap-1">
                            {/* CheckCircle removed for print to keep it simple */}
                            Delivered
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-amber-600 uppercase flex items-center gap-1">
                             {wb.status || 'Booked'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 tabular-nums print:text-black print:border-r print:border-black">{parseFloat(wb.freight_amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-orange-600 tabular-nums print:text-black print:border-r print:border-black">{parseFloat(wb.dd_charges || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-indigo-600 tabular-nums print:text-black print:border-r print:border-black">{parseFloat(wb.gst_amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-blue-700 bg-blue-50/30 font-black tabular-nums print:text-black print:bg-gray-100 font-bold">
                      {parseFloat(wb.grand_total).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FINANCIAL SUMMARY BLOCK - Outside table to prevent repetition on every page */}
        {waybills.length > 0 && (
          <div className="bg-gray-900 text-white p-4 flex flex-col md:flex-row justify-between items-center gap-4 print:bg-black">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-600 rounded-full print:bg-white" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] italic opacity-80">Mathematical Consolidation</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Legitimate Audit Total based on active GCs</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-8 items-center bg-gray-800/50 p-4 rounded-xl border border-gray-700 print:bg-black print:border-white print:p-0 print:gap-4">
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Freight Total</p>
                <p className="text-sm font-black italic tabular-nums">₹{totals.freight.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">DD Total</p>
                <p className="text-sm font-black italic tabular-nums text-orange-400 print:text-white">₹{totals.dd.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">GST Total</p>
                <p className="text-sm font-black italic tabular-nums text-indigo-400 print:text-white">₹{totals.gst.toLocaleString()}</p>
              </div>
              <div className="text-right border-l border-gray-700 pl-8 print:border-black">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Grand Consolidation</p>
                <p className="text-3xl font-black text-white tabular-nums tracking-tighter shadow-blue-500/20 drop-shadow-lg">
                  ₹{totals.grand.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100">
            <div className="p-5 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="text-lg font-black uppercase tracking-tight">Audit Protocol</h2>
              <button onClick={() => setShowHelp(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm text-gray-600 font-bold">
              <div className="flex gap-4">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><HelpCircle /></div>
                <div>
                  <h4 className="font-black text-gray-800 uppercase text-xs mb-1">Financial Reconciliation</h4>
                  <p className="text-[11px] leading-relaxed">This tally report filters out all <span className="text-red-500">CANCELLED</span> waybills to ensure the consolidated totals exactly match your bank deposits and branch cash collection.</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-end">
              <button onClick={() => setShowHelp(false)} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Understood</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page { size: portrait; margin: 10mm; }
          .no-print { display: none !important; }
          .bg-white { border: none !important; }
          .shadow-sm { box-shadow: none !important; }
          .p-3 { padding: 0 !important; }
          table { width: 100% !important; border-collapse: collapse !important; font-size: 8pt !important; }
          th { background: #1f2937 !important; color: white !important; -webkit-print-color-adjust: exact; padding: 6pt !important; }
          td { border-bottom: 1px solid #e5e7eb !important; padding: 4pt !important; }
          tfoot td { background: #1f2937 !important; color: white !important; -webkit-print-color-adjust: exact; }
          .bg-blue-600 { background: #2563eb !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}

export default WaybillTallyReport
