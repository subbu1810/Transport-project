import React, { useState, useEffect } from 'react'
import { Search, Loader2, AlertCircle, FileText, Download, Calendar, Filter, Database, BarChart3 } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function WaybillReportPage() {
  const [filters, setFilters] = useState({
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    status: '',
    account_type: ''
  })

  const [waybills, setWaybills] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [branches, setBranches] = useState([])
  const [columnSearch, setColumnSearch] = useState({
    date: '', gcNum: '', origin: '', destination: '', consignor: '', consignee: '', qty: '', weight: '', amount: '', status: '', account_type: ''
  })

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      if (user.role !== 'superadmin' && user.branch_id) {
        setFilters(prev => ({ ...prev, branch_id: user.branch_id }));
      }
    }
    fetchBranches();
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches`)
      const data = await response.json()
      if (data.success) {
        const userString = localStorage.getItem('user');
        if (userString) {
          const user = JSON.parse(userString);
          if (user.role !== 'superadmin') {
            setBranches(data.data.filter(b => b.id == user.branch_id));
          } else {
            setBranches(data.data);
          }
        } else {
          setBranches(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching branches:', err)
    }
  }

  const handleGetDetails = async () => {
    try {
      setLoading(true)
      setError('')

      const queryParams = new URLSearchParams()
      if (filters.fromDate) queryParams.append('from_date', filters.fromDate)
      if (filters.toDate) queryParams.append('to_date', filters.toDate)
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.account_type) queryParams.append('account_type', filters.account_type)
      if (filters.branch_id) queryParams.append('branch_id', filters.branch_id)

      const response = await fetch(`${API_BASE_URL}/waybills?${queryParams.toString()}`)
      const data = await response.json()

      if (data.success) {
        setWaybills(data.data)
        if (data.data.length === 0) {
          setError('No waybills found for the selected criteria')
        }
      } else {
        setError(data.message || 'Failed to fetch report')
      }
    } catch (err) {
      console.error('Error fetching waybill report:', err)
      setError('Error connecting to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    // Simple CSV export logic
    if (waybills.length === 0) return

    const headers = [
      'Bill Date', 'GC Number', 'Origin', 'Destination', 'Consignor', 'Consignee',
      'Articles', 'Weight', 'Freight', 'Status', 'Delivery Status', 'Total Amount'
    ]

    const csvContent = [
      headers.join(','),
      ...waybills.map(wb => [
        wb.bill_date,
        wb.gc_number,
        wb.origin_branch?.branch_name || '-',
        wb.destination?.city_name || '-',
        wb.consignor?.name || '-',
        wb.consignee?.name || '-',
        wb.total_articles,
        wb.actual_weight || 0,
        wb.freight_amount,
        wb.status,
        wb.deliver_status,
        wb.grand_total
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Waybill_Report_${filters.fromDate}_to_${filters.toDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredWaybills = waybills.filter(wb => {
    const sDate = !columnSearch.date || (wb.bill_date ? new Date(wb.bill_date).toLocaleDateString('en-GB') : '').includes(columnSearch.date);
    const sGcNum = !columnSearch.gcNum || (wb.gc_number || '').toLowerCase().includes(columnSearch.gcNum.toLowerCase());
    const sOrigin = !columnSearch.origin || (wb.origin_branch?.branch_name || '').toLowerCase().includes(columnSearch.origin.toLowerCase());
    const sDest = !columnSearch.destination || (wb.destination?.city_name || '').toLowerCase().includes(columnSearch.destination.toLowerCase());
    const sConsignor = !columnSearch.consignor || (wb.consignor?.name || '').toLowerCase().includes(columnSearch.consignor.toLowerCase());
    const sConsignee = !columnSearch.consignee || (wb.consignee?.name || '').toLowerCase().includes(columnSearch.consignee.toLowerCase());
    const sQty = !columnSearch.qty || (wb.total_articles || '').toString().includes(columnSearch.qty);
    const sWeight = !columnSearch.weight || (wb.actual_weight || '').toString().includes(columnSearch.weight);
    const sAmount = !columnSearch.amount || (wb.grand_total || '').toString().includes(columnSearch.amount);
    const sAccountType = !columnSearch.account_type || (wb.account_type || '').toLowerCase().includes(columnSearch.account_type.toLowerCase());
    const sStatus = !columnSearch.status || (wb.status || 'PENDING').toLowerCase().includes(columnSearch.status.toLowerCase());

    return sDate && sGcNum && sOrigin && sDest && sConsignor && sConsignee && sQty && sWeight && sAmount && sAccountType && sStatus;
  });

  return (
    <div className="p-3 space-y-3 bg-gray-50/50 min-h-screen">
      {/* Header and Filter Combined for Space Efficiency */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
              <BarChart3 size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-800 uppercase tracking-tight">Waybill Report</h1>
              <p className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">Generate and export consignment data</p>
            </div>
          </div>

          <div className="flex-1 min-w-[300px]">
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-3 items-end">
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider ml-0.5">From</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                    className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-xs font-bold font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider ml-0.5">To</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                  <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                    className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-xs font-bold font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider ml-0.5">Branch</label>
                <div className="relative">
                    <Database className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                    {JSON.parse(localStorage.getItem('user'))?.role === 'superadmin' ? (
                      <select
                        value={filters.branch_id || ''}
                        onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
                        className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-xs font-bold appearance-none cursor-pointer"
                      >
                        <option value="">All Branches</option>
                        {branches.map(branch => (
                          <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        readOnly
                        value={JSON.parse(localStorage.getItem('user'))?.branch_name || 'Own Branch'}
                        className="w-full pl-8 pr-2 py-1.5 bg-gray-100 border-2 border-gray-100 rounded-lg text-gray-500 font-bold text-xs cursor-not-allowed uppercase"
                      />
                    )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider ml-0.5">Status</label>
                <div className="relative">
                  <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-xs font-bold appearance-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">PENDING</option>
                    <option value="DISPATCHED">DISPATCHED</option>
                    <option value="RECEIVED">RECEIVED</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider ml-0.5">Account Type</label>
                <div className="relative">
                  <Database className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                  <select
                    value={filters.account_type}
                    onChange={(e) => setFilters({ ...filters, account_type: e.target.value })}
                    className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-xs font-bold appearance-none"
                  >
                    <option value="">All Types</option>
                    <option value="PAID">PAID</option>
                    <option value="TOPAY">TOPAY</option>
                    <option value="ACCOUNT">ACCOUNT</option>
                    <option value="TBB">TBB</option>
                  </select>
                </div>
              </div>
              <div className="md:col-span-5 lg:col-span-1">
                <button
                  onClick={handleGetDetails}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-blue-100 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  GET DATA
                </button>
              </div>
            </div>
          </div>
        </div>
        {error && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2 text-red-600">
            <AlertCircle size={12} />
            <p className="text-[9px] font-black uppercase tracking-wider">{error}</p>
          </div>
        )}

        <div className="overflow-hidden">
          <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Results View ({filteredWaybills.length} Records)</h3>
            <button
              onClick={exportToExcel}
              disabled={waybills.length === 0}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Download size={11} /> Export CSV
            </button>
          </div>

          <div className="overflow-x-auto max-h-[calc(100vh-160px)] scrollbar-thin scrollbar-thumb-gray-200">
            <table className="w-full text-[10px] border-collapse">
              <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-3 py-2 text-left font-black text-gray-900 uppercase tracking-wider border border-gray-200">Date</th>
                  <th className="px-3 py-2 text-left font-black text-gray-900 uppercase tracking-wider border border-gray-200">GC Num</th>
                  <th className="px-3 py-2 text-left font-black text-gray-900 uppercase tracking-wider border border-gray-200">Origin</th>
                  <th className="px-3 py-2 text-left font-black text-gray-900 uppercase tracking-wider border border-gray-200">Destination</th>
                  <th className="px-3 py-2 text-left font-black text-gray-900 uppercase tracking-wider border border-gray-200">Consignor</th>
                  <th className="px-3 py-2 text-left font-black text-gray-900 uppercase tracking-wider border border-gray-200">Consignee</th>
                  <th className="px-3 py-2 text-center font-black text-gray-900 uppercase tracking-wider border border-gray-200">Qty</th>
                  <th className="px-3 py-2 text-right font-black text-gray-900 uppercase tracking-wider border border-gray-200">Weight</th>
                  <th className="px-3 py-2 text-right font-black text-gray-900 uppercase tracking-wider border border-gray-200">Amount</th>
                  <th className="px-3 py-2 text-center font-black text-gray-900 uppercase tracking-wider border border-gray-200">Acct Type</th>
                  <th className="px-3 py-2 text-center font-black text-gray-900 uppercase tracking-wider border border-gray-200">Status</th>
                </tr>
                <tr className="bg-gray-50 border border-gray-200">
                  <th className="px-1 py-1 border border-gray-200"><input type="text" placeholder="Search..." className="w-full text-[10px] p-1 border border-gray-300 rounded font-normal text-gray-800 focus:outline-none focus:border-blue-500" value={columnSearch.date} onChange={e => setColumnSearch({...columnSearch, date: e.target.value})} /></th>
                  <th className="px-1 py-1 border border-gray-200"><input type="text" placeholder="Search..." className="w-full text-[10px] p-1 border border-gray-300 rounded font-normal text-gray-800 focus:outline-none focus:border-blue-500" value={columnSearch.gcNum} onChange={e => setColumnSearch({...columnSearch, gcNum: e.target.value})} /></th>
                  <th className="px-1 py-1 border border-gray-200"><input type="text" placeholder="Search..." className="w-full text-[10px] p-1 border border-gray-300 rounded font-normal text-gray-800 focus:outline-none focus:border-blue-500" value={columnSearch.origin} onChange={e => setColumnSearch({...columnSearch, origin: e.target.value})} /></th>
                  <th className="px-1 py-1 border border-gray-200"><input type="text" placeholder="Search..." className="w-full text-[10px] p-1 border border-gray-300 rounded font-normal text-gray-800 focus:outline-none focus:border-blue-500" value={columnSearch.destination} onChange={e => setColumnSearch({...columnSearch, destination: e.target.value})} /></th>
                  <th className="px-1 py-1 border border-gray-200"><input type="text" placeholder="Search..." className="w-full text-[10px] p-1 border border-gray-300 rounded font-normal text-gray-800 focus:outline-none focus:border-blue-500" value={columnSearch.consignor} onChange={e => setColumnSearch({...columnSearch, consignor: e.target.value})} /></th>
                  <th className="px-1 py-1 border border-gray-200"><input type="text" placeholder="Search..." className="w-full text-[10px] p-1 border border-gray-300 rounded font-normal text-gray-800 focus:outline-none focus:border-blue-500" value={columnSearch.consignee} onChange={e => setColumnSearch({...columnSearch, consignee: e.target.value})} /></th>
                  <th className="px-1 py-1 border border-gray-200"><input type="text" placeholder="Search..." className="w-full text-[10px] p-1 border border-gray-300 rounded font-normal text-gray-800 focus:outline-none focus:border-blue-500 text-center" value={columnSearch.qty} onChange={e => setColumnSearch({...columnSearch, qty: e.target.value})} /></th>
                  <th className="px-1 py-1 border border-gray-200"><input type="text" placeholder="Search..." className="w-full text-[10px] p-1 border border-gray-300 rounded font-normal text-gray-800 focus:outline-none focus:border-blue-500 text-right" value={columnSearch.weight} onChange={e => setColumnSearch({...columnSearch, weight: e.target.value})} /></th>
                  <th className="px-1 py-1 border border-gray-200"><input type="text" placeholder="Search..." className="w-full text-[10px] p-1 border border-gray-300 rounded font-normal text-gray-800 focus:outline-none focus:border-blue-500 text-right" value={columnSearch.amount} onChange={e => setColumnSearch({...columnSearch, amount: e.target.value})} /></th>
                  <th className="px-1 py-1 border border-gray-200"><input type="text" placeholder="Search..." className="w-full text-[10px] p-1 border border-gray-300 rounded font-normal text-gray-800 focus:outline-none focus:border-blue-500 text-center" value={columnSearch.account_type} onChange={e => setColumnSearch({...columnSearch, account_type: e.target.value})} /></th>
                  <th className="px-1 py-1 border border-gray-200"><input type="text" placeholder="Search..." className="w-full text-[10px] p-1 border border-gray-300 rounded font-normal text-gray-800 focus:outline-none focus:border-blue-500 text-center" value={columnSearch.status} onChange={e => setColumnSearch({...columnSearch, status: e.target.value})} /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredWaybills.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-3 py-20 text-center text-gray-400 font-medium bg-white">
                      {loading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 size={24} className="animate-spin text-blue-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Fetching records...</span>
                        </div>
                      ) : 'No data available or no matching results found.'}
                    </td>
                  </tr>
                ) : (
                  filteredWaybills.map((wb, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-3 py-2 border border-gray-200 text-gray-500 whitespace-nowrap">{wb.bill_date ? new Date(wb.bill_date).toLocaleDateString('en-GB') : '-'}</td>
                      <td className="px-3 py-2 border border-gray-200 font-black text-blue-600">{wb.gc_number}</td>
                      <td className="px-3 py-2 border border-gray-200 text-gray-600 font-bold whitespace-nowrap">{wb.origin_branch?.branch_name || '-'}</td>
                      <td className="px-3 py-2 border border-gray-200 text-gray-600 font-bold whitespace-nowrap">{wb.destination?.city_name || '-'}</td>
                      <td className="px-3 py-2 border border-gray-200 text-gray-600 font-medium truncate max-w-[100px]">{wb.consignor?.name || '-'}</td>
                      <td className="px-3 py-2 border border-gray-200 text-gray-600 font-medium truncate max-w-[100px]">{wb.consignee?.name || '-'}</td>
                      <td className="px-3 py-2 border border-gray-200 text-center font-black">{wb.total_articles}</td>
                      <td className="px-3 py-2 border border-gray-200 text-right text-gray-500">{wb.actual_weight || 0}k</td>
                      <td className="px-3 py-2 border border-gray-200 text-right font-black text-gray-900">₹{parseFloat(wb.grand_total || 0).toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 border border-gray-200 text-center text-xs font-bold whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full ${wb.account_type?.toLowerCase() === 'topay' ? 'bg-red-100 text-red-700' : wb.account_type?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                          {wb.account_type || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2 border border-gray-200 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest ${wb.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                          wb.status === 'RECEIVED' ? 'bg-blue-100 text-blue-700' :
                            wb.status === 'DISPATCHED' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                          }`}>
                          {wb.status || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredWaybills.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td colSpan="6" className="px-3 py-2 border border-gray-300 text-right font-black text-gray-700 uppercase tracking-widest text-[10px]">Total</td>
                    <td className="px-3 py-2 border border-gray-300 text-center font-black text-gray-900">{filteredWaybills.reduce((s, wb) => s + (parseInt(wb.total_articles) || 0), 0)}</td>
                    <td className="px-3 py-2 border border-gray-300 text-right font-black text-gray-900">{filteredWaybills.reduce((s, wb) => s + (parseFloat(wb.actual_weight) || 0), 0)}k</td>
                    <td className="px-3 py-2 border border-gray-300 text-right font-black text-gray-900">₹{filteredWaybills.reduce((s, wb) => s + (parseFloat(wb.grand_total) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td colSpan="2" className="px-3 py-2 border border-gray-300"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WaybillReportPage
