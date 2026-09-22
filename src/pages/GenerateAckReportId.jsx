import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Search, CheckCircle, AlertCircle, Loader2, Package, Calendar, 
  MapPin, User, FileText, Info, Clock, HelpCircle, X, 
  Layers, Printer, ArrowRight, Filter, ChevronRight, FileCheck, History,
  ExternalLink, Building2, DownloadCloud, Eye
} from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';
import { applyBranchOverrides } from '../utils/branchOverrides';

function GenerateAckReportId() {
  const [activeTab, setActiveTab] = useState('generate') 
  const [loading, setLoading] = useState(false)
  const [popup, setPopup] = useState({ show: false, message: '', type: 'success' })
  const [currentUser, setCurrentUser] = useState(null)
  const [branches, setBranches] = useState([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [logo, setLogo] = useState(null)
  const [transportInfo, setTransportInfo] = useState({
    name: 'SANVI TRANSPORT',
    address: '',
    phone: '',
    subtitle: 'THE WINGS OF LOGISTICS',
    logo: ''
  })

  // Tab 2: Generate Bundle
  const [awaitingBundles, setAwaitingBundles] = useState([])
  const [selectedWaybillIds, setSelectedWaybillIds] = useState([])
  const [bundleRemarks, setBundleRemarks] = useState('')
  const [bundleSearch, setBundleSearch] = useState('')

  // Tab 3: History
  const [bundles, setBundles] = useState([])
  const [historySearch, setHistorySearch] = useState('')
  const [selectedBundle, setSelectedBundle] = useState(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    setCurrentUser(user)
    if (user) {
      const initialBranch = user.role === 'superadmin' ? '' : user.branch_id
      setSelectedBranchId(initialBranch)
      fetchBranches()
      if (user.role !== 'superadmin') {
         refreshAllData(user.branch_id, user.branch_code)
      }
      
      // Dynamic transport details mapping
      const overrides = applyBranchOverrides(user, {
        name: user.transport_name || (user.transport && user.transport.name) || 'SANVI TRANSPORT',
        address: user.transport_address || (user.transport && user.transport.address) || '',
        phone: user.transport_phone || user.transport_mobile || (user.transport && user.transport.phone) || '',
        subtitle: user.transport_subtitle || (user.transport && user.transport.subtitle) || 'THE WINGS OF LOGISTICS',
        logo: user.transport_logo_url || user.transport_logo_path || (user.transport && (user.transport.logo || user.transport.logo_path)) || ''
      });
      
      setTransportInfo({
        name: overrides.company_name || overrides.name,
        address: overrides.address,
        phone: overrides.phone,
        subtitle: overrides.subtitle,
        logo: overrides.logo_path || overrides.logo
      })
      fetchLogo()
    }
  }, [])

  const getFullStorageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/^\/+/, '');
    return `${STORAGE_URL}/${cleanPath}`;
  };

  const fetchLogo = async () => {
    try {
      const uStr = localStorage.getItem('user');
      if (uStr) {
        const u = JSON.parse(uStr);
        const l = u.transport_logo_url || u.transport_logo_path || (u.transport && (u.transport.logo || u.transport.logo_path || u.transport.logo_url));
        if (l) {
          setLogo(getFullStorageUrl(l));
          return;
        }
      }
      const res = await axios.get(`${API_BASE_URL}/settings/all`);
      if (res.data.success && res.data.data) {
        const s = res.data.data;
        const gl = s.logo_path || s.logo || s.company_logo;
        if (gl) setLogo(getFullStorageUrl(gl));
      }
    } catch (e) {
      console.error('Logo err:', e);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/branches`)
      if (res.data.success) setBranches(res.data.data)
    } catch (e) { console.error(e) }
  }

  const showPopup = (message, type = 'success') => {
    setPopup({ show: true, message, type })
    setTimeout(() => setPopup({ show: false, message: '', type: 'success' }), 3000)
  }

  const refreshAllData = (branchId, branchCode) => {
    if (activeTab === 'generate') fetchAwaitingBundles(branchId)
    if (activeTab === 'history') fetchBundles(branchId)
  }

  useEffect(() => {
    if (currentUser && (selectedBranchId || currentUser.branch_id)) {
       const branchObj = branches.find(b => b.id == selectedBranchId)
       refreshAllData(selectedBranchId || currentUser.branch_id, branchObj?.branch_code || currentUser.branch_code)
    }
  }, [selectedBranchId, activeTab])

  const fetchAwaitingBundles = async (branchId) => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/ack-bundles/awaiting`, { params: { branch_id: branchId } })
      if (res.data.success) setAwaitingBundles(res.data.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleGenerateBundle = async () => {
    if (selectedWaybillIds.length === 0) return
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/ack-bundles`, {
        branch_id: selectedBranchId || currentUser.branch_id,
        bundle_date: new Date().toISOString().split('T')[0],
        created_by: currentUser?.id,
        waybill_ids: selectedWaybillIds,
        remarks: bundleRemarks
      })
      if (res.data.success) {
        showPopup(`Bundle ${res.data.data.bundle_number} Created`)
        setSelectedWaybillIds([])
        setBundleRemarks('')
        fetchAwaitingBundles(selectedBranchId || currentUser.branch_id)
      } else {
        showPopup(res.data.message || 'Failed to create bundle', 'error')
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to create bundle'
      showPopup(msg, 'error')
    }
    finally { setLoading(false) }
  }

  const fetchBundles = async (branchId) => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/ack-bundles`, { params: { branch_id: branchId } })
      if (res.data.success) setBundles(res.data.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleViewBundle = async (id) => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/ack-bundles/${id}`)
      if (res.data.success) setSelectedBundle(res.data.data)
    } catch (e) { showPopup('Error', 'error') }
    finally { setLoading(false) }
  }

  const filteredBundles = bundles.filter(b => 
    b.bundle_number.toLowerCase().includes(historySearch.toLowerCase())
  )

  return (
    <div className="bg-gray-50 min-h-screen text-[11px]">
      
      {/* 🔮 Success Notification (Compact Green) */}
      {popup.show && (
        <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-4 no-print">
          <div className={`px-4 py-1.5 rounded shadow-lg border text-white font-bold flex items-center gap-2 ${
            popup.type === 'success' ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'
          }`}>
             {popup.type === 'success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
             <span>{popup.message}</span>
          </div>
        </div>
      )}

      {/* 🏭 Industrial Header (Green Theme) - HIDDEN ON PRINT */}
      <div className={`bg-white border-b border-gray-300 p-2 flex justify-between items-center px-4 ${selectedBundle ? 'no-print' : ''}`}>
        <div className="flex items-center gap-4">
           <h1 className="text-xs font-black text-gray-800 uppercase tracking-tight">ACK Workflow Dashboard</h1>
           <div className="h-4 w-[1px] bg-gray-200"></div>
           <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-gray-400 uppercase">Branch:</span>
              {currentUser?.role === 'superadmin' ? (
                <select 
                  className="bg-gray-50 border border-gray-200 text-[10px] font-bold px-1 rounded outline-none h-6"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                >
                  <option value="">ALL BRANCHES</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                </select>
              ) : (
                <span className="text-[10px] font-black text-green-700 uppercase">{currentUser?.branch_name}</span>
              )}
           </div>
        </div>
        <div className="flex bg-gray-100 p-0.5 rounded no-print">
           {['generate', 'history'].map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-6 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all ${
                 activeTab === tab ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'
               }`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      <div className={`p-3 ${selectedBundle ? 'no-print' : ''}`}>

        {/* --- 📦 TAB: BUNDLE --- */}
        {activeTab === 'generate' && (
          <div className="space-y-3">
             {(() => {
                const filteredAwaitingBundles = awaitingBundles.filter(gc => {
                   const term = bundleSearch.toLowerCase();
                   return (gc.gc_number || '').toLowerCase().includes(term) ||
                          (gc.destination?.city_name || '').toLowerCase().includes(term);
                });
                const allFilteredSelected = filteredAwaitingBundles.length > 0 && filteredAwaitingBundles.filter(g => !g.payment_pending).every(g => selectedWaybillIds.includes(g.id)) && filteredAwaitingBundles.some(g => !g.payment_pending);

                return (
                  <>
                    <div className="bg-white p-2 border border-gray-300 rounded flex justify-between items-center px-4">
                       <div className="flex items-center gap-4">
                          <span className="font-black text-gray-600 uppercase tracking-tight">
                             Pending Bundle GCs ({filteredAwaitingBundles.length === awaitingBundles.length ? awaitingBundles.length : `${filteredAwaitingBundles.length}/${awaitingBundles.length}`})
                          </span>
                          <div className="relative w-56">
                             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                             <input 
                                value={bundleSearch} 
                                onChange={e => setBundleSearch(e.target.value)} 
                                placeholder="Search GC ID, Destination..." 
                                className="w-full pl-8 pr-2 py-1 bg-gray-50 border border-gray-200 rounded text-[10px] font-bold outline-none focus:border-green-600 focus:bg-white transition-all" 
                             />
                          </div>
                       </div>
                       {selectedWaybillIds.length > 0 && <span className="text-green-600 font-black uppercase font-mono italic">{selectedWaybillIds.length} Selections Made</span>}
                    </div>

                    <div className="bg-white border border-gray-200 rounded overflow-hidden">
                       <table className="w-full text-[10px] text-left">
                          <thead className="bg-green-600 text-white font-black uppercase tracking-[0.1em]">
                             <tr>
                                <th className="p-2 w-10 text-center">
                                  <input 
                                     type="checkbox" 
                                     className="accent-green-900" 
                                     checked={allFilteredSelected} 
                                     onChange={(e) => { 
                                        if (e.target.checked) {
                                           const newSelected = Array.from(new Set([...selectedWaybillIds, ...filteredAwaitingBundles.filter(g => !g.payment_pending).map(g => g.id)]));
                                           setSelectedWaybillIds(newSelected);
                                        } else {
                                           const filteredIds = filteredAwaitingBundles.map(g => g.id);
                                           setSelectedWaybillIds(selectedWaybillIds.filter(id => !filteredIds.includes(id)));
                                        }
                                     }} 
                                  />
                                </th>
                                <th className="p-2">GC ID</th>
                                <th className="p-2">Booking Date</th>
                                <th className="p-2">Destination</th>
                                <th className="p-2 text-right pr-4">Freight (₹)</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                             {filteredAwaitingBundles.map(gc => {
                                const isBlocked = gc.payment_pending === true;
                                return (
                                  <tr key={gc.id} className={`
                                    ${isBlocked
                                      ? 'bg-red-50 opacity-70 cursor-not-allowed'
                                      : selectedWaybillIds.includes(gc.id)
                                        ? 'bg-green-50'
                                        : 'hover:bg-green-50/50'
                                    }
                                  `}>
                                     <td className="p-2 text-center">
                                       <input
                                         type="checkbox"
                                         className="accent-green-600"
                                         disabled={isBlocked}
                                         checked={selectedWaybillIds.includes(gc.id)}
                                         onChange={() => {
                                           if (isBlocked) return;
                                           if (selectedWaybillIds.includes(gc.id))
                                             setSelectedWaybillIds(selectedWaybillIds.filter(id => id !== gc.id));
                                           else
                                             setSelectedWaybillIds([...selectedWaybillIds, gc.id]);
                                         }}
                                       />
                                     </td>
                                     <td className="p-2 font-black text-gray-900 uppercase italic pl-4">
                                       #{gc.gc_number}
                                       {isBlocked && (
                                         <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 text-[8px] font-black rounded uppercase tracking-wide border border-red-200">
                                           💳 Payment Pending
                                         </span>
                                       )}
                                     </td>
                                     <td className="p-2 font-bold text-gray-400">{new Date(gc.bill_date).toLocaleDateString('en-GB')}</td>
                                     <td className="p-2 font-black text-green-700 uppercase italic">{gc.destination?.city_name}</td>
                                     <td className="p-2 text-right font-black text-gray-900 pr-4">
                                       {gc.grand_total}
                                       {isBlocked && (
                                         <span className="block text-[8px] text-red-500 font-bold">Balance: ₹{(gc.grand_total - (gc.amount_paid || 0)).toFixed(2)}</span>
                                       )}
                                     </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                       </table>
                    </div>
                  </>
                );
             })()}

             {selectedWaybillIds.length > 0 && (
                <div className="bg-white p-4 border border-green-600 rounded flex gap-4 items-center">
                   <div className="flex-1">
                       <p className="text-[8px] font-black uppercase text-green-600 mb-0.5 ml-1 italic">Submission Remarks / Staff ID</p>
                       <input value={bundleRemarks} onChange={e => setBundleRemarks(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-2 text-xs font-black focus:bg-white outline-none" />
                   </div>
                   <button onClick={handleGenerateBundle} className="bg-green-600 text-white px-10 py-3 rounded font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-green-700 flex items-center gap-2">
                     <Layers size={14} /> Commit Submission
                   </button>
                </div>
             )}
          </div>
        )}

        {/* --- 📜 TAB: HISTORY --- */}
        {activeTab === 'history' && (
           <div className="space-y-4">
              <div className="bg-white border border-gray-300 rounded overflow-hidden">
                 <div className="p-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center sm:px-4">
                    <span className="font-black text-gray-600 uppercase italic">Archive Trace</span>
                    <div className="relative w-48">
                       <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300" size={12} />
                       <input value={historySearch} onChange={e => setHistorySearch(e.target.value)} placeholder="Search IDs" className="w-full pl-6 pr-2 py-1 bg-white border border-gray-200 rounded text-[9px] font-black outline-none" />
                    </div>
                 </div>
                 <table className="w-full text-[10px] text-left">
                    <thead className="bg-gray-100 border-b-2 border-green-600 text-green-800 font-bold uppercase italic shadow-sm">
                       <tr>
                          <th className="p-2 pl-4">Bundle ID</th>
                          <th className="p-2">Submission Dt</th>
                          <th className="p-2">Count</th>
                          <th className="p-2">Auditor</th>
                          <th className="p-2">Remarks</th>
                          <th className="p-2 text-right pr-4">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {filteredBundles.map(bundle => (
                         <tr key={bundle.id} className="hover:bg-green-50/30 group">
                            <td className="p-2 pl-4 font-black text-gray-900 italic">{bundle.bundle_number}</td>
                            <td className="p-2 font-bold text-gray-400">{new Date(bundle.bundle_date).toLocaleDateString('en-GB')}</td>
                            <td className="p-2"><span className="bg-gray-200 px-2 py-0.5 rounded font-black text-[9px]">{bundle.waybills_count}</span></td>
                            <td className="p-2 font-black uppercase text-blue-600 text-[8px]">{bundle.creator?.full_name}</td>
                            <td className="p-2 text-gray-400 italic italic truncate max-w-[150px]">{bundle.remarks || '-'}</td>
                            <td className="p-2 text-right pr-4">
                               <button onClick={() => handleViewBundle(bundle.id)} className="text-green-700 hover:text-black font-black uppercase tracking-tighter italic flex items-center justify-end gap-1 ml-auto text-[9px]">
                                  <Eye size={10} /> View Panel
                               </button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

      </div>

      {/* View/Print Portal - ISOLATED LAYER */}
      {selectedBundle && (
        <div id="printable-area" className="fixed inset-0 z-[100] flex flex-col bg-white animate-in fade-in duration-200 no-print-bg">
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
              <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-gray-50 print:p-0 print:bg-white">
                 <div className="printable-report bg-white border border-gray-200 p-6 text-black shadow-inner min-h-full w-full">
                    <div className="text-center pb-2 mb-2">
                       <h1 className="text-lg font-black uppercase tracking-tighter text-green-700 leading-none">{transportInfo.name}</h1>
                       <p className="text-[7px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">{transportInfo.subtitle}</p>
                        <div className="flex justify-center items-center gap-2 text-gray-800 text-[8px] mb-1">
                           <span className="font-black uppercase tracking-tight">{selectedBundle.branch?.branch_name} Branch</span>
                           {selectedBundle.branch?.address && (
                             <>
                               <span className="h-2 w-[1px] bg-gray-300"></span>
                               <span className="font-bold text-gray-400 uppercase">{selectedBundle.branch?.address}</span>
                             </>
                           )}
                        </div>
                       <div className="border-y border-gray-200 py-1 font-black text-green-700 text-[9px] uppercase tracking-[0.2em]">
                         Submission Bundle Report (ACK)
                       </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-[9px] pb-2 mb-3 border-b border-gray-200">
                       <div><span className="font-bold opacity-50 uppercase">Bundle ID:</span> <span className="font-black italic text-green-800">{selectedBundle.bundle_number}</span></div>
                       <div><span className="font-bold opacity-50 uppercase">Date:</span> <span className="font-bold">{new Date(selectedBundle.bundle_date).toLocaleDateString('en-GB')}</span></div>
                       <div><span className="font-bold opacity-50 uppercase">Branch:</span> <span className="font-black text-green-700 uppercase italic">{selectedBundle.branch?.branch_name}</span></div>
                       <div><span className="font-bold opacity-50 uppercase">Creator:</span> <span className="font-bold italic">{selectedBundle.creator?.full_name}</span></div>
                    </div>
                    <table className="w-full text-left text-[9px] mb-6 border-collapse">
                       <thead>
                          <tr className="border-y border-black bg-gray-100 italic">
                             <th className="py-2 px-1 w-6 text-center">SI</th>
                             <th className="py-2 px-1">GC Identifier</th>
                             <th className="py-2 px-1">Book Date</th>
                             <th className="py-2 px-1">Destination</th>
                             <th className="py-2 px-1">Consignee</th>
                             <th className="py-2 px-1 text-right pr-2">Freight (₹)</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {selectedBundle.waybills?.map((w, i) => (
                            <tr key={w.id} className="border-b border-gray-50">
                               <td className="py-1.5 px-1 text-center font-bold text-gray-400">{i + 1}</td>
                               <td className="py-1.5 px-1 font-black text-green-800 italic">#{w.gc_number}</td>
                               <td className="py-1.5 px-1 font-bold">{new Date(w.bill_date).toLocaleDateString('en-GB')}</td>
                               <td className="py-1.5 px-1 font-black uppercase italic tracking-tighter">{w.destination?.city_name}</td>
                               <td className="py-1.5 px-1 italic truncate max-w-[120px]">{w.consignee?.name}</td>
                               <td className="py-1.5 px-1 font-black text-right pr-2">{w.grand_total}</td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-black font-black uppercase text-[10px] bg-gray-50 italic">
                             <td colSpan="3" className="py-2.5 px-2">Total GC: {selectedBundle.waybills?.length || 0}</td>
                             <td colSpan="3" className="py-2.5 px-2 text-right pr-2 uppercase">Total Amount: ₹{selectedBundle.waybills?.reduce((s, w) => {
                                const val = parseFloat(w.grand_total);
                                return s + (isNaN(val) ? 0 : val);
                             }, 0).toLocaleString()}</td>
                          </tr>
                       </tbody>
                    </table>
                    {selectedBundle.remarks && (
                       <div className="mb-10 text-[8px] border-l-4 border-green-600 p-2 italic bg-green-50 uppercase">
                          <span className="not-italic mr-2 font-black">Audit Observations:</span>
                          {selectedBundle.remarks}
                       </div>
                    )}
                    <div className="flex justify-between mt-20 px-10">
                       <div className="text-center w-24 border-t border-black pt-1 text-[8px] font-black uppercase">Branch Seal</div>
                       <div className="text-center w-24 border-t border-black pt-1 text-[8px] font-black uppercase">Official Receiver</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, html { background: white !important; margin: 0 !important; padding: 0 !important; }
          /* Reset the fixed overlay so it prints as a normal page flow */
          .fixed { position: static !important; background: white !important; overflow: visible !important; }
          .overflow-auto { overflow: visible !important; height: auto !important; max-height: none !important; }
          .bg-gray-50 { background: white !important; }
          .p-4 { padding: 0 !important; }
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
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
      `}</style>
    </div>
  )
}

export default GenerateAckReportId
