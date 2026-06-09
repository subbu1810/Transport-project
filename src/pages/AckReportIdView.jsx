import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Search, Loader2, FileText, CheckCircle2, AlertCircle, Printer, Download, Eye, X, Clock } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function AckReportIdView() {
  const [filters, setFilters] = useState({ ackReportId: '' })
  const [loading, setLoading] = useState(false)
  const [bundles, setBundles] = useState([])
  const [bundleData, setBundleData] = useState(null)
  const [popup, setPopup] = useState({ show: false, message: '', type: 'success' })
  const [transportInfo, setTransportInfo] = useState({ name: '', subtitle: 'THE WINGS OF LOGISTICS' })

  useEffect(() => {
    fetchBundles()
    // Load transport name from localStorage
    const user = JSON.parse(localStorage.getItem('user')) || JSON.parse(localStorage.getItem('admin'))
    if (user) {
      setTransportInfo({
        name: user.transport_name || (user.transport && user.transport.name) || '',
        subtitle: user.transport_subtitle || (user.transport && user.transport.subtitle) || 'THE WINGS OF LOGISTICS',
      })
    }
  }, [])

  const fetchBundles = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user')) || JSON.parse(localStorage.getItem('admin'))
      const params = {}
      if (user && user.role !== 'superadmin') {
        params.branch_id = user.branch_id
      }
      const res = await axios.get(`${API_BASE_URL}/ack-bundles`, { params })
      if (res.data.success) {
        setBundles(res.data.data)
      }
    } catch (e) { console.error(e) }
  }

  const showPopup = (message, type = 'success') => {
    setPopup({ show: true, message, type })
    setTimeout(() => setPopup({ show: false, message: '', type: 'success' }), 3000)
  }

  const handleSearch = async (forcedId = null) => {
    const idToSearch = (forcedId && typeof forcedId === 'string') ? forcedId : filters.ackReportId
    if (!idToSearch) {
      showPopup('Please select an ID', 'error')
      return
    }

    setLoading(true)
    setBundleData(null)
    try {
      const res = await axios.get(`${API_BASE_URL}/ack-bundles/search`, {
        params: { bundle_number: idToSearch }
      })
      if (res.data.success) {
        setBundleData(res.data.data)
      }
    } catch (e) {
      showPopup('Record not found', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!bundleData || !bundleData.waybills) return
    let csvContent = "data:text/csv;charset=utf-8,Date,GC Num,Destination,Consignee,Freight,Total\n"
      + bundleData.waybills.map(wb => [
        new Date(wb.bill_date).toLocaleDateString('en-GB'),
        wb.gc_number,
        wb.destination?.city_name || '',
        wb.consignee?.name || '',
        wb.freight_amount,
        wb.grand_total
      ].join(",")).join("\n")
    const link = document.createElement("a")
    link.href = encodeURI(csvContent)
    link.download = `ACK_${bundleData.bundle_number}.csv`
    link.click()
  }

  return (
    <div className="bg-gray-50 min-h-screen text-[11px]">
      
      {/* 🔮 Quick Popup */}
      {popup.show && (
        <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-4 no-print">
          <div className={`px-4 py-1.5 rounded shadow-lg border text-white font-black flex items-center gap-2 ${
            popup.type === 'success' ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'
          }`}>
             {popup.type === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
             <span>{popup.message}</span>
          </div>
        </div>
      )}

      {/* 🏭 High-Density Header */}
      <div className="bg-white border-b border-gray-300 p-2 flex justify-between items-center px-4 no-print">
         <div className="flex items-center gap-4">
            <h1 className="text-xs font-black text-gray-800 uppercase tracking-tight">Audit Report Explorer</h1>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <span className="text-[9px] font-bold text-gray-400 uppercase italic">Detailed Lookup Tool</span>
         </div>
         <div className="flex gap-2">
            {bundleData && (
               <>
                  <button onClick={handleExport} className="bg-gray-50 text-green-700 border border-green-100 px-3 py-1 rounded font-black uppercase text-[10px] hover:bg-green-600 hover:text-white transition-all">Export CSV</button>
                  <button onClick={() => window.print()} className="bg-green-600 text-white px-3 py-1 rounded font-black uppercase text-[10px] hover:bg-black transition-all">Print Audit</button>
               </>
            )}
         </div>
      </div>

      <div className="p-3">
        {/* 🔍 Search Row - Compact */}
        <div className="no-print bg-white p-3 border border-gray-200 rounded shadow-sm mb-4 flex flex-col md:flex-row items-end gap-3">
           <div className="flex-1 w-full space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Selection Trace ID</label>
              <div className="relative">
                 <select
                   value={filters.ackReportId}
                   onChange={(e) => {
                     setFilters({ ackReportId: e.target.value })
                     if (e.target.value) handleSearch(e.target.value)
                   }}
                   className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded font-black text-gray-700 text-[11px] outline-none focus:border-green-600 transition-all appearance-none cursor-pointer"
                 >
                   <option value="">SELECT BUNDLE BY DATE</option>
                   {bundles.map(b => (
                     <option key={b.id} value={b.bundle_number}>
                       {b.bundle_number} — {new Date(b.bundle_date).toLocaleDateString('en-GB')} ({b.waybills_count} GCs)
                     </option>
                   ))}
                 </select>
                 <Eye size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              </div>
           </div>
           <button
             onClick={() => handleSearch()}
             disabled={loading}
             className="bg-green-600 text-white px-8 py-2 rounded font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all disabled:opacity-50 h-[32px] flex items-center gap-2"
           >
             {loading ? <Loader2 size={12} className="animate-spin" /> : <><Search size={14} /> Fetch</>}
           </button>
        </div>

        {/* 📜 Result Section - Industrial Table */}
        {bundleData ? (
          <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden animate-in fade-in duration-300">
             <div className="p-2 bg-green-50 border-b border-green-100 flex justify-between items-center px-4 no-print">
                <div className="flex items-center gap-4">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-green-700 uppercase">IDENTIFIER</span>
                      <span className="font-black text-gray-900 uppercase italic">#{bundleData.bundle_number}</span>
                   </div>
                   <div className="h-6 w-[1px] bg-green-200"></div>
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-green-700 uppercase">AUDIT DATE</span>
                      <span className="font-black text-gray-700 italic">{new Date(bundleData.bundle_date).toLocaleDateString('en-GB')}</span>
                   </div>
                </div>
                <span className="bg-green-600 text-white px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">{bundleData.status}</span>
             </div>

             <div id="ack-printable-area" className="px-6 pt-3 pb-2 printable-report bg-white text-black font-sans">
                {/* --- Report Header (Compact) --- */}
                <div className="text-center pb-2 mb-2 border-b border-gray-200">
                   <h1 className="text-base font-black uppercase tracking-tighter text-green-700 leading-none">{transportInfo.name || bundleData.branch?.transport?.name || 'TRANSPORT'}</h1>
                   <p className="text-[7px] font-black uppercase tracking-[0.25em] text-gray-400">{transportInfo.subtitle}</p>
                   <div className="flex justify-center items-center gap-2 text-gray-800 mt-0.5">
                      <span className="text-[9px] font-black uppercase">{bundleData.branch?.branch_name} Branch</span>
                      <span className="h-2 w-[1px] bg-gray-300"></span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase">{bundleData.branch?.address}</span>
                   </div>
                   <div className="mt-1 font-black text-green-700 text-[9px] uppercase tracking-[0.2em]">
                     Final Submission Record (ACK)
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[9px] mb-3">
                   <div className="grid grid-cols-2 border-l-4 border-green-600 pl-3 py-0.5 gap-y-0.5">
                      <span className="font-bold text-gray-400 uppercase">Bundle No:</span>
                      <span className="font-black font-mono">{bundleData.bundle_number}</span>
                      <span className="font-bold text-gray-400 uppercase">Audit Date:</span>
                      <span className="font-black">{new Date(bundleData.bundle_date).toLocaleDateString('en-GB')}</span>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-gray-400 uppercase">Authenticated By</p>
                      <p className="text-xs font-black uppercase text-green-700">{bundleData.creator?.full_name}</p>
                      <p className="text-[8px] font-bold uppercase italic">{bundleData.branch?.branch_name} Branch</p>
                   </div>
                </div>

                <table className="w-full text-left text-[9px] border-collapse mb-8">
                   <thead className="bg-gray-50 border-y border-black font-black uppercase italic">
                      <tr>
                         <th className="py-2 px-1 w-6 text-center">SI</th>
                         <th className="py-2 px-1">GC ID</th>
                         <th className="py-2 px-1">Book Date</th>
                         <th className="py-2 px-1">Destination</th>
                         <th className="py-2 px-1">Consignee</th>
                         <th className="py-2 px-1 text-right">Freight (₹)</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {bundleData.waybills?.map((gc, idx) => (
                        <tr key={gc.id} className="border-b border-gray-50">
                           <td className="py-2 text-center font-bold text-gray-400 italic">{idx + 1}</td>
                           <td className="py-2 font-black text-green-800 italic">#{gc.gc_number}</td>
                           <td className="py-2 font-bold">{new Date(gc.bill_date).toLocaleDateString('en-GB')}</td>
                           <td className="py-2 font-black uppercase tracking-tighter">{gc.destination?.city_name}</td>
                           <td className="py-2 font-bold uppercase text-[8px] truncate max-w-[150px]">{gc.consignee?.name}</td>
                           <td className="py-2 text-right font-black pr-2">{gc.grand_total}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-black font-black uppercase text-xs italic break-inside-avoid">
                         <td colSpan="3" className="py-3">Count: {bundleData.waybills?.length} GCs</td>
                         <td colSpan="3" className="py-3 text-right pr-2">Total Value: ₹{bundleData.waybills?.reduce((s, w) => s + parseFloat(w.grand_total), 0).toLocaleString()}</td>
                      </tr>
                   </tbody>
                </table>

                {bundleData.remarks && (
                   <div className="mt-4 p-2 border-l-4 border-gray-200 bg-gray-50 italic text-[9px] uppercase">
                      <span className="font-black text-gray-400 not-italic mr-2">Audit Notes:</span>
                      {bundleData.remarks}
                   </div>
                )}

                <div className="flex justify-between items-end mt-20 px-8">
                   <div className="text-center w-32 border-t border-black pt-1 text-[8px] font-black uppercase italic">Sender Seal</div>
                   <div className="text-center w-32 border-t border-black pt-1 text-[8px] font-black uppercase italic">HO Receiver Sign</div>
                </div>
             </div>
          </div>
        ) : !loading && (
          <div className="no-print h-[400px] flex flex-col items-center justify-center bg-white border border-gray-200 rounded text-gray-300">
             <FileText size={40} className="mb-2 opacity-20" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Enter an Audit Trace ID to view record details</p>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, html { background: white !important; margin: 0 !important; padding: 0 !important; }
          .bg-gray-50 { background: white !important; }
          .p-3 { padding: 0 !important; }
          .shadow-sm, .shadow-inner { box-shadow: none !important; }
          .border { border-color: #ccc !important; }
          #ack-printable-area {
            padding: 0 !important;
          }
          .printable-report {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
            padding: 1cm !important;
            margin: 0 auto !important;
            width: 19cm !important;
            max-width: 19cm !important;
            box-sizing: border-box !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #ccc !important;
            padding: 6px 8px !important;
          }
          @page { size: A4 portrait; margin: 1cm; }
        }
      `}</style>
    </div>
  )
}

export default AckReportIdView
