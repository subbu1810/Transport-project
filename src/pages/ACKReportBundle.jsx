import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Printer, Loader2, FileText, Search, Package, MapPin, Calendar, User, ArrowRight, X, Clock, Eye, Layers } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';
import { applyBranchOverrides } from '../utils/branchOverrides';

function ACKReportBundle() {
  const [bundles, setBundles] = useState([])
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState([])
  const [filters, setFilters] = useState({ branch_id: '' })
  const [selectedBundle, setSelectedBundle] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [transportInfo, setTransportInfo] = useState({ name: '', subtitle: 'THE WINGS OF LOGISTICS' })

  useEffect(() => {
    fetchBranches()
    const user = JSON.parse(localStorage.getItem('user'))
    if (user) {
      if (user.role !== 'superadmin') {
        const initialFilters = { branch_id: user.branch_id }
        setFilters(initialFilters)
        fetchBundles(initialFilters)
      } else {
        fetchBundles({ branch_id: '' })
      }
      const overrides = applyBranchOverrides(user, {
        name: user.transport_name || (user.transport && user.transport.name) || '',
        subtitle: user.transport_subtitle || (user.transport && user.transport.subtitle) || 'THE WINGS OF LOGISTICS',
      });
      setTransportInfo({
        name: overrides.company_name || overrides.name,
        subtitle: overrides.subtitle || 'THE WINGS OF LOGISTICS',
      })
    } else {
      fetchBundles({ branch_id: '' })
    }
  }, [])

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/branches`)
      if (res.data.success) setBranches(res.data.data)
    } catch (e) { console.error(e) }
  }

  const fetchBundles = async (currentFilters = filters) => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/ack-bundles`, { params: currentFilters })
      if (res.data.success) setBundles(res.data.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleViewDetails = async (id) => {
    setViewLoading(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/ack-bundles/${id}`)
      if (res.data.success) setSelectedBundle(res.data.data)
    } catch (e) { console.error(e) }
    finally { setViewLoading(false) }
  }

  const filteredBundles = bundles.filter(b => 
    b.bundle_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentUser = JSON.parse(localStorage.getItem('user'))

  return (
    <div className="bg-gray-50 min-h-screen text-[11px]">
      
      {/* 🏭 Industrial Header */}
      <div className={`bg-white border-b border-gray-300 p-2 flex justify-between items-center px-4 no-print ${selectedBundle ? 'no-print' : ''}`}>
         <div className="flex items-center gap-4">
            <h1 className="text-xs font-black text-gray-800 uppercase tracking-tight">Audit Bundle History</h1>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-bold text-gray-400 uppercase italic">Branch Source:</span>
               {currentUser?.role === 'superadmin' ? (
                 <select 
                   className="bg-gray-50 border border-gray-200 text-[10px] font-black px-1 rounded outline-none h-6"
                   value={filters.branch_id}
                   onChange={e => {setFilters({...filters, branch_id: e.target.value}); fetchBundles({...filters, branch_id: e.target.value})}}
                 >
                   <option value="">ALL BRANCHES</option>
                   {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                 </select>
               ) : (
                 <span className="text-[10px] font-black text-green-700 uppercase">{currentUser?.branch_name}</span>
               )}
            </div>
         </div>
      </div>

      <div className={`p-3 ${selectedBundle ? 'no-print' : ''}`}>
         
         {/* 🔍 Search Log Bar */}
         <div className="no-print bg-white p-2 border border-gray-200 rounded shadow-sm mb-4 flex justify-between items-center px-4">
            <div className="flex items-center gap-2">
               <span className="font-black text-gray-600 uppercase italic">Archive Trace</span>
               <div className="h-4 w-[1px] bg-gray-200 mx-2"></div>
               <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-black text-[9px] uppercase">{filteredBundles.length} Bundles Found</span>
            </div>
            <div className="relative w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
               <input 
                 value={searchTerm} 
                 onChange={e => setSearchTerm(e.target.value)}
                 placeholder="Filter by Bundle ID Number..." 
                 className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded text-[10px] font-black outline-none focus:border-green-600 transition-all focus:bg-white" 
               />
            </div>
         </div>

         {/* 📊 High-Density Archive Table */}
         <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
            <table className="w-full text-left text-[11px]">
               <thead className="bg-gray-100 border-b-2 border-green-600 text-green-800 font-bold uppercase italic shadow-sm">
                  <tr>
                     <th className="p-2 pl-4">Bundle ID</th>
                     <th className="p-2 text-center">Submission Dt</th>
                     <th className="p-2 text-center">Counts</th>
                     <th className="p-2">Auditor Authenticator</th>
                     <th className="p-2">Submission Note</th>
                     <th className="p-2 text-right pr-6">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 italic">
                  {filteredBundles.map(bundle => (
                    <tr key={bundle.id} className="hover:bg-green-50/50 group transition-colors">
                       <td className="p-2 pl-4 font-black text-gray-900 group-hover:text-green-700">#{bundle.bundle_number}</td>
                       <td className="p-2 text-center font-bold text-gray-400">{new Date(bundle.bundle_date).toLocaleDateString('en-GB')}</td>
                       <td className="p-2 text-center"><span className="bg-slate-100 px-2 py-0.5 rounded font-black text-[9px] text-slate-600">{bundle.waybills_count} GCs</span></td>
                       <td className="p-2 font-black uppercase text-blue-600 text-[9px]">{bundle.creator?.full_name}</td>
                       <td className="p-2 text-gray-400 italic truncate max-w-[200px]">{bundle.remarks || '--'}</td>
                       <td className="p-2 text-right pr-6">
                          <button 
                            onClick={() => handleViewDetails(bundle.id)} 
                            className="bg-green-50 text-green-700 px-3 py-1 rounded font-black uppercase text-[9px] tracking-tighter hover:bg-green-600 hover:text-white transition-all flex items-center gap-1 ml-auto"
                          >
                             <Eye size={12} /> View Panel
                          </button>
                       </td>
                    </tr>
                  ))}
                  {!loading && filteredBundles.length === 0 && (
                    <tr>
                       <td colSpan="6" className="p-20 text-center opacity-20">
                          <Package size={40} className="mx-auto" />
                          <p className="font-black mt-2 text-[10px] uppercase">No Record Clusters</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* 📜 View/Print Portal - TOP LEVEL LAYER */}
      {selectedBundle && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in fade-in duration-200 no-print-bg">
           <div className="w-full h-full flex flex-col overflow-hidden">
              <div className="p-2 bg-green-600 text-white flex justify-between items-center px-4 no-print">
                 <span className="font-black text-[9px] uppercase tracking-widest italic">{selectedBundle.bundle_number} | Audit Preview</span>
                 <div className="flex gap-2">
                    <button onClick={() => window.print()} className="bg-white text-green-600 px-4 py-1 rounded text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all flex items-center gap-1">
                       <Printer size={12} /> Print
                    </button>
                    <button onClick={() => setSelectedBundle(null)} className="p-1 hover:bg-white/10 rounded transition-all"><X size={16} /></button>
                 </div>
              </div>
              <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-gray-50 print:bg-white print:p-0">
                 <div className="printable-report bg-white border border-gray-200 p-8 text-black shadow-inner min-h-full w-full">
                     {/* --- Report Header (Compact) --- */}
                     <div className="text-center pb-2 mb-2 border-b border-gray-200">
                        <h1 className="text-base font-black uppercase tracking-tighter text-green-700 leading-none">{transportInfo.name || 'TRANSPORT'}</h1>
                        <p className="text-[7px] font-black uppercase tracking-[0.25em] text-gray-400">{transportInfo.subtitle}</p>
                        <div className="flex justify-center items-center gap-2 text-gray-800 mt-0.5">
                           <span className="text-[9px] font-black uppercase tracking-tight">{selectedBundle.branch?.branch_name} Branch</span>
                           <span className="h-2 w-[1px] bg-gray-300"></span>
                           <span className="text-[8px] font-bold text-gray-400 uppercase">{selectedBundle.branch?.address}</span>
                        </div>
                        <div className="mt-1 font-black text-green-700 text-[9px] uppercase tracking-[0.2em]">
                          Archived Submission Record (ACK)
                        </div>
                     </div>

                    <div className="grid grid-cols-2 gap-8 text-[9px] mb-6">
                       <div className="grid grid-cols-2 border-l-4 border-green-600 pl-4 py-1 gap-y-1">
                          <span className="font-bold text-gray-400 uppercase">Bundle No:</span>
                          <span className="font-black font-mono">{selectedBundle.bundle_number}</span>
                          <span className="font-bold text-gray-400 uppercase">Audit Date:</span>
                          <span className="font-black">{new Date(selectedBundle.bundle_date).toLocaleDateString('en-GB')}</span>
                       </div>
                       <div className="text-right">
                          <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Authenticated By</p>
                          <p className="text-xs font-black uppercase text-green-700 italic">{selectedBundle.creator?.full_name}</p>
                          <p className="text-[8px] font-bold uppercase mt-1 italic opacity-40">{selectedBundle.branch?.branch_name} Branch</p>
                       </div>
                    </div>

                    <table className="w-full text-left text-[9px] border-collapse mb-8 italic">
                       <thead className="bg-gray-50 border-y border-black font-black uppercase tracking-wider">
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
                          {selectedBundle.waybills?.map((gc, idx) => (
                            <tr key={gc.id} className="border-b border-gray-50">
                               <td className="py-2 text-center font-bold text-gray-400 italic">{idx + 1}</td>
                               <td className="py-2 font-black text-green-800 italic">#{gc.gc_number}</td>
                               <td className="py-2 font-bold">{new Date(gc.bill_date).toLocaleDateString('en-GB')}</td>
                               <td className="py-2 font-black uppercase tracking-tighter">{gc.destination?.city_name}</td>
                               <td className="py-2 font-bold uppercase text-[8px] truncate max-w-[150px]">{gc.consignee?.name}</td>
                               <td className="py-2 text-right font-black pr-2">₹{parseFloat(gc.grand_total).toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="border-t border-black font-black uppercase text-xs break-inside-avoid">
                             <td colSpan="3" className="py-3">Count Cluster: {selectedBundle.waybills_count} GCs</td>
                             <td colSpan="3" className="py-3 text-right pr-2 uppercase">Audit Total: ₹{selectedBundle.waybills?.reduce((s, w) => s + parseFloat(w.grand_total), 0).toLocaleString()}</td>
                          </tr>
                       </tbody>
                    </table>

                    {selectedBundle.remarks && (
                       <div className="mt-4 p-2 border-l-4 border-gray-200 bg-gray-50 italic text-[9px] uppercase">
                          <span className="font-black text-gray-400 not-italic mr-2">Audit Notes:</span>
                          {selectedBundle.remarks}
                       </div>
                    )}

                    <div className="flex justify-between items-end mt-24 px-10 no-print-bg">
                       <div className="text-center w-36 border-t border-black pt-1 text-[8px] font-black uppercase italic">Sender Authority</div>
                       <div className="text-center w-36 border-t border-black pt-1 text-[8px] font-black uppercase italic">Receiver Head Office</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .no-print-bg { background: white !important; }
          body, html { background: white !important; margin: 0 !important; padding: 0 !important; }
          /* Reset the fixed overlay so it prints like a normal page */
          .fixed { position: static !important; background: white !important; overflow: visible !important; }
          .overflow-auto { overflow: visible !important; height: auto !important; max-height: none !important; }
          .bg-black\\/60 { background: white !important; }
          .p-4 { padding: 0 !important; }
          .bg-gray-50 { background: white !important; }
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
      `}</style>
    </div>
  )
}

export default ACKReportBundle
