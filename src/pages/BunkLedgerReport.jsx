import React, { useState, useEffect } from 'react'
import { Printer, Loader2, BarChart3, Search, ChevronDown, Download, Filter, FileText } from 'lucide-react'
import { API_BASE_URL } from '../config/api';

function BunkLedgerReport() {
  const [filters, setFilters] = useState({
    bunk_id: '',
    from_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0]
  })

  const [masterData, setMasterData] = useState({ bunks: [] })
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [bunkSearch, setBunkSearch] = useState('')
  const [openBunkSelect, setOpenBunkSelect] = useState(false)

  useEffect(() => {
    const fetchBunks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/fuel/init-data`);
        const data = await response.json();
        if (data.success) setMasterData({ bunks: data.bunks });
      } catch (err) {
        console.error('Failed to load bunks');
      }
    };
    fetchBunks();
  }, []);

  const handleFetchReport = async (e) => {
    e.preventDefault();
    if (!filters.bunk_id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/fuel/ledger?bunk_id=${filters.bunk_id}&from_date=${filters.from_date}&to_date=${filters.to_date}`);
      const data = await response.json();
      if (data.success) {
        setReportData(data);
      }
    } catch (err) {
      console.error('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  // The API already provides the ledger with the correct running balance
  const processedLedger = reportData?.ledger || [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="w-full mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg border border-orange-100 p-6 no-print">
          <div className="flex items-center gap-3 mb-6 text-orange-900">
            <BarChart3 size={24} />
            <h1 className="text-xl font-black uppercase tracking-widest leading-none">Bunk Ledger Report</h1>
          </div>

          <form onSubmit={handleFetchReport} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-[10px] font-black text-gray-500 uppercase">Select Fuel Bunk</label>
              <div 
                className="flex items-center border border-gray-200 rounded-lg p-2.5 cursor-pointer bg-white"
                onClick={() => setOpenBunkSelect(!openBunkSelect)}
              >
                <Search size={16} className="text-gray-400 mr-2" />
                <span className={filters.bunk_id ? 'text-gray-900 font-bold text-sm' : 'text-gray-400 text-sm'}>
                  {filters.bunk_id ? masterData.bunks.find(b => b.id == filters.bunk_id)?.bunk_name : 'Select Bunk...'}
                </span>
                <ChevronDown size={16} className="ml-auto text-gray-400" />
              </div>
              
              {openBunkSelect && (
                <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-2xl z-50 max-h-60 overflow-y-auto">
                  <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                    <input 
                      type="text" autoFocus placeholder="Search bunk..."
                      className="w-full p-2 text-sm border-0 focus:ring-0"
                      value={bunkSearch} onChange={(e) => setBunkSearch(e.target.value)}
                    />
                  </div>
                  {masterData.bunks.filter(b => b.bunk_name.toLowerCase().includes(bunkSearch.toLowerCase())).map(b => (
                    <div key={b.id} className="px-4 py-2 hover:bg-orange-50 cursor-pointer text-sm font-medium" onClick={() => { setFilters({...filters, bunk_id: b.id}); setOpenBunkSelect(false); }}>
                      {b.bunk_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase">From Date</label>
              <input type="date" value={filters.from_date} onChange={(e) => setFilters({...filters, from_date: e.target.value})} className="p-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase">To Date</label>
              <input type="date" value={filters.to_date} onChange={(e) => setFilters({...filters, to_date: e.target.value})} className="p-2.5 border border-gray-200 rounded-lg text-sm" />
            </div>

            <button type="submit" className="bg-orange-600 text-white font-black py-2.5 rounded-lg hover:bg-orange-700 transition flex items-center justify-center gap-2 uppercase text-xs tracking-widest shadow-lg shadow-orange-100">
               {loading ? <Loader2 className="animate-spin" size={16} /> : <Filter size={16} />}
               Generate Report
            </button>
          </form>
        </div>

        {reportData && (
          <div className="bg-white rounded-xl shadow-lg border border-orange-100 overflow-hidden min-h-[500px]">
            {/* Report Header for Print */}
            <div className="p-8 border-b border-gray-100 bg-orange-50/20 flex flex-col items-center">
                <h1 className="text-2xl font-black text-orange-900 uppercase">Bunk Statement of Accounts</h1>
                <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">
                   {reportData.bunk?.bunk_name} | {filters.from_date} to {filters.to_date}
                </p>
                <div className="mt-6 flex gap-12 text-center">
                   <div>
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter block">Opening Balance</span>
                       <span className="text-xl font-black text-gray-800">₹{parseFloat(reportData.opening_balance).toLocaleString()}</span>
                   </div>
                   <div className="w-[1px] h-10 bg-gray-200"></div>
                   <div>
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter block underline decoration-orange-300">Net Outstanding</span>
                       <span className="text-2xl font-black text-orange-600">₹{parseFloat(reportData.closing_balance || 0).toLocaleString()}</span>
                   </div>
                </div>
            </div>

            <div className="p-8 overflow-x-auto">
              <table className="w-full text-xs font-medium">
                <thead className="bg-gray-100 text-gray-600 uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Particulars / Ref No</th>
                    <th className="px-4 py-3 text-left">Mode / Remarks</th>
                    <th className="px-4 py-3 text-right">Debit (Bill)</th>
                    <th className="px-4 py-3 text-right">Credit (Paid)</th>
                    <th className="px-4 py-3 text-right bg-orange-50/30">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {processedLedger.length === 0 ? (
                      <tr><td colSpan="6" className="p-20 text-center text-gray-400 font-bold italic">No transactions found in this period.</td></tr>
                   ) : processedLedger.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                           <div className="flex flex-col">
                              <span className="font-black text-gray-800 tracking-tight">{item.type} {item.ref_no}</span>
                           </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 italic max-w-xs truncate">{item.remarks}</td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">{item.debit > 0 ? `₹${parseFloat(item.debit).toLocaleString()}` : '-'}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">{item.credit > 0 ? `₹${parseFloat(item.credit).toLocaleString()}` : '-'}</td>
                        <td className="px-4 py-3 text-right font-black text-gray-900 bg-orange-50/10">₹{parseFloat(item.balance).toLocaleString()}</td>
                      </tr>
                   ))}
                </tbody>
              </table>

              <div className="mt-8 flex justify-end gap-3 no-print">
                 <button onClick={() => window.print()} className="bg-gray-800 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:bg-black">
                    <Printer size={16} /> Print Statement
                 </button>
                 <button className="bg-orange-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:bg-orange-700">
                    <Download size={16} /> Export Excel
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BunkLedgerReport
