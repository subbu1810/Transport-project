import React, { useState, useEffect, useMemo } from 'react'
import { Search, Printer, FileText, Filter, Calendar, MapPin, Loader2, Download, HelpCircle, X, CheckSquare, Clock, AlertCircle, FileCheck, Package } from 'lucide-react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function AckStatusReport() {
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    branchId: JSON.parse(localStorage.getItem('user'))?.role !== 'superadmin' ? JSON.parse(localStorage.getItem('user'))?.branch_id : '',
    status: ''
  })

  const [branches, setBranches] = useState([])
  const [reportData, setReportData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      const response = await axios.get(`${API_BASE_URL}/branches`)
      if (response.data.success) {
        if (user?.role === 'superadmin') {
          setBranches(response.data.data)
        } else {
          const userBranch = response.data.data.find(b => b.id === user?.branch_id)
          setBranches(userBranch ? [userBranch] : [])
        }
      }
    } catch (err) { console.error(err) }
  }

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/reports/ack-status`, {
        params: {
          from_date: filters.fromDate,
          to_date: filters.toDate,
          branch_id: filters.branchId,
          status: filters.status
        }
      })
      if (response.data.success) {
        setReportData(response.data.data)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filteredData = useMemo(() => {
    return reportData.filter(item =>
      item.gc_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.consignee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.destination?.city_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [reportData, searchTerm])

  const stats = useMemo(() => {
    const total = reportData.length
    const acknowledged = reportData.filter(item => item.ack_bundle_id).length
    const pending = total - acknowledged
    return { total, acknowledged, pending }
  }, [reportData])

  const handleExportExcel = () => {
    const exportData = filteredData.map(item => ({
      'GC Number': item.gc_number,
      'Date': new Date(item.bill_date).toLocaleDateString('en-GB'),
      'Consignee': item.consignee?.name,
      'Destination': item.destination?.city_name,
      'Freight': item.grand_total,
      'Bundle No': item.ack_bundle?.bundle_number || 'PENDING',
      'Bundle Date': item.ack_bundle?.bundle_date ? new Date(item.ack_bundle.bundle_date).toLocaleDateString('en-GB') : '-'
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'AckReport')
    XLSX.writeFile(wb, `ACK_STATUS_REPORT.xlsx`)
  }

  return (
    <div className="bg-gray-50 min-h-screen text-[11px]">
      
      {/* 🏭 Industrial Header */}
      <div className="bg-white border-b border-gray-300 p-2 flex justify-between items-center px-4 no-print">
         <div className="flex items-center gap-4">
            <h1 className="text-xs font-black text-gray-800 uppercase tracking-tight">ACK Status Archive</h1>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <div className="flex gap-4">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-gray-400 uppercase leading-none">Total GCs</span>
                  <span className="text-xs font-black text-gray-900">{stats.total}</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-green-600 uppercase leading-none">Acknowledged</span>
                  <span className="text-xs font-black text-green-700">{stats.acknowledged}</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-red-500 uppercase leading-none">In-Transit</span>
                  <span className="text-xs font-black text-red-600">{stats.pending}</span>
               </div>
            </div>
         </div>
         <div className="flex gap-2">
            <button onClick={handleExportExcel} className="bg-gray-50 text-gray-600 border border-gray-200 px-4 py-1.5 rounded font-black uppercase text-[9px] hover:bg-green-600 hover:text-white transition-all flex items-center gap-1">
               <Download size={12} /> Excel Export
            </button>
            <button onClick={() => window.print()} className="bg-green-600 text-white px-4 py-1.5 rounded font-black uppercase text-[9px] hover:bg-black transition-all flex items-center gap-1">
               <Printer size={12} /> Print Trace
            </button>
         </div>
      </div>

      <div className="p-3">
         
         {/* 🖨️ Professional Print Header (Visible ONLY on Print) */}
         <div className="hidden print:block mb-8 border-b-4 border-slate-900 pb-6">
            <div className="flex justify-between items-start">
               <div>
                  <h1 className="text-3xl font-black text-slate-900 leading-none uppercase tracking-tighter">Garuda Transport System.</h1>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Logistics Excellence & Total Audit Control</p>
                  <div className="flex gap-10 mt-6">
                     <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Issuing Branch</span>
                        <span className="text-[11px] font-black text-slate-900 uppercase">{branches.find(b => b.id == filters.branchId)?.branch_name || 'All Consolidated Branches'}</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Reporting Period</span>
                        <span className="text-[11px] font-black text-slate-900 uppercase">{new Date(filters.fromDate).toLocaleDateString('en-GB')} - {new Date(filters.toDate).toLocaleDateString('en-GB')}</span>
                     </div>
                  </div>
               </div>
               <div className="text-right">
                  <div className="bg-slate-900 text-white px-6 py-2 rounded-xl">
                     <h2 className="text-sm font-black uppercase tracking-widest">ACK Status Report</h2>
                  </div>
                  <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-tight italic">Generated on {new Date().toLocaleString()}</p>
               </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-8 bg-slate-50 p-4 border border-slate-200">
               <div className="text-center">
                  <span className="text-[8px] font-black text-slate-400 uppercase">Total Consignments</span>
                  <p className="text-sm font-black text-slate-900">{stats.total}</p>
               </div>
               <div className="text-center border-x border-slate-200">
                  <span className="text-[8px] font-black text-slate-400 uppercase">Authenticated</span>
                  <p className="text-sm font-black text-emerald-600">{stats.acknowledged}</p>
               </div>
               <div className="text-center">
                  <span className="text-[8px] font-black text-slate-400 uppercase">In-Transit (Pending)</span>
                  <p className="text-sm font-black text-rose-600">{stats.pending}</p>
               </div>
            </div>
         </div>

         {/* 🔍 Filter Trace - High Density */}
         <div className="bg-white p-3 border border-gray-200 rounded shadow-sm mb-4 no-print">
            <div className="flex flex-wrap items-end gap-3">
               <div className="flex-1 min-w-[150px] space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Range From</label>
                  <input type="date" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded font-black text-[11px] outline-none focus:border-green-600 focus:bg-white" />
               </div>
               <div className="flex-1 min-w-[150px] space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Range To</label>
                  <input type="date" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded font-black text-[11px] outline-none focus:border-green-600 focus:bg-white" />
               </div>
               <div className="flex-1 min-w-[180px] space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Branch Matrix</label>
                  <select value={filters.branchId} onChange={e => setFilters({...filters, branchId: e.target.value})} className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded font-black text-[11px] outline-none appearance-none cursor-pointer focus:border-green-600">
                     <option value="">ALL BRANCHES</option>
                     {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                  </select>
               </div>
               <div className="flex-1 min-w-[150px] space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Status Filter</label>
                  <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded font-black text-[11px] outline-none focus:border-green-600">
                     <option value="">ALL STATUS</option>
                     <option value="pending">PENDING ONLY</option>
                     <option value="acknowledged">ACKNOWLEDGED ONLY</option>
                  </select>
               </div>
               <button onClick={fetchReportData} disabled={loading} className="bg-green-600 text-white px-8 h-[31px] rounded font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all flex items-center gap-2">
                  {loading ? <Loader2 size={12} className="animate-spin" /> : 'Run Trace'}
               </button>
            </div>
         </div>

         {/* 📊 Data Grid */}
         <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
            <div className="p-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center sm:px-4 no-print">
               <div className="flex items-center gap-2">
                  <FileText size={14} className="text-gray-400" />
                  <span className="font-black text-gray-600 uppercase italic">History Log</span>
               </div>
               <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                  <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Live Filter by GC / Consignee" className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-black outline-none focus:border-green-600" />
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left text-[11px]">
                  <thead className="bg-green-600 text-white font-black uppercase italic tracking-[0.05em]">
                     <tr>
                        <th className="p-2 pl-4 w-12 text-center">S.No</th>
                        <th className="p-2">GC ID</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Consignee</th>
                        <th className="p-2 text-right">Freight (₹)</th>
                        <th className="p-2 text-center">Audit Status</th>
                        <th className="p-2">Submission Ref</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 italic">
                     {filteredData.map((item, index) => (
                       <tr key={item.id} className="hover:bg-green-50/50 group transition-colors">
                          <td className="p-2 pl-4 font-bold text-gray-400 text-center">{index + 1}</td>
                          <td className="p-2 font-black text-gray-800">{item.gc_number}</td>
                          <td className="p-2 font-bold text-gray-400">{new Date(item.bill_date).toLocaleDateString('en-GB')}</td>
                          <td className="p-2 font-black uppercase text-[9px] truncate max-w-[200px]">{item.consignee?.name}</td>
                          <td className="p-2 text-right font-black text-gray-700 pr-4">₹{parseFloat(item.grand_total).toLocaleString()}</td>
                          <td className="p-2 text-center">
                             <span className={`px-2 py-0.5 rounded font-black text-[8px] uppercase tracking-widest ${
                                item.ack_bundle_id ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
                             }`}>
                                {item.ack_bundle_id ? 'Authenticated' : 'In-Transit'}
                             </span>
                          </td>
                          <td className="p-2">
                             {item.ack_bundle?.bundle_number ? (
                               <div className="flex flex-col">
                                  <span className="font-black text-blue-600 text-[9px]">{item.ack_bundle.bundle_number}</span>
                                  <span className="text-[7px] font-bold text-gray-300">{new Date(item.ack_bundle.bundle_date).toLocaleDateString('en-GB')}</span>
                               </div>
                             ) : (
                               <span className="text-gray-300 italic">--</span>
                             )}
                          </td>
                       </tr>
                     ))}
                     {filteredData.length === 0 && (
                       <tr>
                          <td colSpan="6" className="p-10 text-center opacity-20">
                             <Package size={40} className="mx-auto mb-2" />
                             <p className="font-black uppercase tracking-widest">No Record Clusters Found</p>
                          </td>
                       </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .hidden.print\\:block { display: block !important; }
          body { background: white !important; font-family: 'Inter', sans-serif; }
          .bg-gray-50, .bg-white, .bg-slate-50 { background: white !important; border-color: #e2e8f0 !important; }
          .p-3 { padding: 0 !important; }
          table { width: 100% !important; border-collapse: collapse !important; border: 1px solid #000 !important; table-layout: fixed; }
          thead { display: table-header-group; background: #f1f5f9 !important; }
          th { border: 1px solid #000 !important; padding: 6px !important; color: black !important; font-size: 9px !important; }
          td { border: 1px solid #000 !important; padding: 6px !important; color: black !important; font-size: 9px !important; word-wrap: break-word; }
          .text-green-600, .text-red-500, .text-emerald-600, .text-rose-600 { color: black !important; font-weight: bold !important; border: none !important; background: none !important; }
          tr { page-break-inside: avoid; }
          @page { size: portrait; margin: 10mm; }
        }
      `}</style>
    </div>
  )
}

export default AckStatusReport
