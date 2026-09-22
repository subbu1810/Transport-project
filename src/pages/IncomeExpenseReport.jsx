import React, { useState, useEffect } from 'react'
import { 
  Search, Loader2, AlertCircle, TrendingUp, TrendingDown, 
  DollarSign, Calendar, Database, Filter, Download, 
  Printer, PieChart, ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL, STORAGE_URL } from '../config/api';
import { applyBranchOverrides } from '../utils/branchOverrides';

function IncomeExpenseReport() {
  const currentUser = JSON.parse(localStorage.getItem('user'))

  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    branch_id: currentUser?.role !== 'superadmin' ? currentUser?.branch_id : '',
    transaction_type: ''
  })

  const [reportData, setReportData] = useState([])
  const [entries, setEntries] = useState([])
  const [totals, setTotals] = useState({ total_credit: 0, total_debit: 0, net_balance: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [branches, setBranches] = useState([])
  const [settings, setSettings] = useState({
    company_name: 'Transport Logistics',
    address: '',
    phone: '',
    logo_path: ''
  })

  useEffect(() => {
    fetchBranches()
    fetchSystemSettings()
    handleGetDetails()
  }, [])

  const fetchSystemSettings = async () => {
    try {
      // 1. Initial load from user context
      if (currentUser) {
        const overrides = applyBranchOverrides(currentUser, {
          company_name: currentUser.transport_name || 'Transport Logistics',
          address: currentUser.transport_address || '',
          phone: currentUser.transport_phone || '',
          logo_path: currentUser.transport_logo_url || ''
        });
        setSettings(prev => ({
          ...prev,
          company_name: overrides.company_name,
          address: overrides.address,
          phone: overrides.phone,
          logo_path: overrides.logo_path || overrides.logo
        }))
      }

      // 2. Fetch from global settings for consistency
      const response = await axios.get(`${API_BASE_URL}/settings/all`);
      if (response.data.success) {
        const s = response.data.data;
        const userData = JSON.parse(localStorage.getItem('user')) || {};
        const overrides = applyBranchOverrides(userData, {
          company_name: s.transport_name || s.company_name,
          address: s.transport_address || s.address,
          phone: s.transport_phone || s.phone,
          logo_path: s.logo_path
        });
        setSettings(prev => ({
          ...prev,
          company_name: prev.company_name || overrides.company_name,
          address: prev.address || overrides.address,
          phone: prev.phone || overrides.phone,
          logo_path: prev.logo_path || overrides.logo_path || overrides.logo
        }));
      }
    } catch (err) { console.error('Error fetching settings:', err); }
  };

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/branches`)
      if (response.data.success) {
        if (currentUser?.role === 'superadmin') {
          setBranches(response.data.data)
        } else {
          const userBranch = response.data.data.find(b => b.id === currentUser?.branch_id)
          setBranches(userBranch ? [userBranch] : [])
        }
      }
    } catch (err) { console.error('Error:', err) }
  }

  const handleGetDetails = async () => {
    try {
      setLoading(true)
      setError('')

      const queryParams = new URLSearchParams()
      queryParams.append('from_date', filters.fromDate)
      queryParams.append('to_date', filters.toDate)
      if (filters.branch_id) queryParams.append('branch_id', filters.branch_id)
      if (filters.transaction_type) queryParams.append('transaction_type', filters.transaction_type)

      const response = await axios.get(`${API_BASE_URL}/cash-book/report?${queryParams.toString()}`)
      const data = response.data

      if (data.success) {
        setReportData(data.data.report)
        setTotals(data.data.totals)
        setEntries(data.data.entries || [])
      } else {
        setError(data.message || 'Failed to fetch report')
      }
    } catch (err) {
      setError('Connection error or server failure')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const exportToCSV = () => {
    if (entries.length === 0) return
    const headers = ['Voucher No', 'Date', 'Account Head', 'Type', 'Branch', 'Paid To / Received From', 'Mode', 'Amount', 'Remarks']
    const csvContent = [
      headers.join(','),
      ...entries.map(item => [
        `"${item.voucher_no || ''}"`,
        `"${item.transaction_date || ''}"`,
        `"${item.account_head?.name || 'Unknown'}"`,
        `"${item.transaction_type}"`,
        `"${item.branch?.branch_name || 'N/A'}"`,
        `"${item.paid_to_receive_from || ''}"`,
        `"${item.mode_of_pay || ''}"`,
        item.amount,
        `"${(item.remarks || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.setAttribute('href', URL.createObjectURL(blob))
    link.setAttribute('download', `Detailed_Income_Expense_Report_${filters.fromDate}_to_${filters.toDate}.csv`)
    link.click()
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="p-3 space-y-3 bg-gray-50/50 min-h-screen printable-area">
      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block mb-4 border-2 border-black p-3 text-center">
        <h1 className="text-2xl font-black uppercase text-black leading-none mb-1">
          {settings.company_name}
        </h1>
        <p className="text-[10px] font-bold text-black uppercase">
          {settings.address} {settings.phone && ` | MOB: ${settings.phone}`}
        </p>
        {settings.gstin && (
          <div className="text-[10px] font-bold text-black border-t border-black mt-2 pt-1 text-left">
            GSTIN : {settings.gstin}
          </div>
        )}
        <div className="text-xs font-bold text-black border-t-2 border-black mt-2 pt-2 uppercase tracking-wide underline">
          INCOME & EXPENSE STATEMENT ({formatDate(filters.fromDate)} TO {formatDate(filters.toDate)})
        </div>
      </div>

      {/* Control Hub */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 no-print">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
              <Activity size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-800 uppercase tracking-tight">Income / Expense Report</h1>
              <p className="text-[10px] text-gray-400 font-medium leading-none mt-0.5 uppercase tracking-widest">Financial Aggregate View</p>
            </div>
          </div>

          <div className="flex-1 min-w-[300px]">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 items-end">
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider ml-0.5">Start Period</label>
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
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider ml-0.5">End Period</label>
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
                  <select
                    value={filters.branch_id}
                    onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
                    disabled={currentUser?.role !== 'superadmin'}
                    className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-xs font-bold appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {currentUser?.role === 'superadmin' && <option value="">All Branches</option>}
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider ml-0.5">Voucher Type</label>
                <div className="relative">
                  <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                  <select
                    value={filters.transaction_type}
                    onChange={(e) => setFilters({ ...filters, transaction_type: e.target.value })}
                    className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-xs font-bold appearance-none"
                  >
                    <option value="">Consolidated</option>
                    <option value="CREDIT">Incomes Only</option>
                    <option value="DEBIT">Expenses Only</option>
                  </select>
                </div>
              </div>
              <div className="md:col-span-4 lg:col-span-1">
                <button
                  onClick={handleGetDetails}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-gray-200 disabled:opacity-50 h-[34px]"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  Compute
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-4 my-2 p-2 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2 text-rose-600">
            <AlertCircle size={14} />
            <p className="text-[10px] font-black uppercase tracking-wider">{error}</p>
          </div>
        )}
      </div>

      {/* Aggregate Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 no-print">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-colors border-b-4 border-b-emerald-500">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 text-emerald-600">Total Income</p>
            <h4 className="text-2xl font-black text-gray-900 tracking-tighter">₹{parseFloat(totals.total_credit || 0).toLocaleString('en-IN')}</h4>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-1">
              <ArrowUpRight size={12} />
              <span>Cash / Bank Inflow</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner group-hover:bg-emerald-100 transition-all">
            <TrendingUp size={28} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-rose-200 transition-colors border-b-4 border-b-rose-500">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 text-rose-600">Total Expense</p>
            <h4 className="text-2xl font-black text-gray-900 tracking-tighter">₹{parseFloat(totals.total_debit || 0).toLocaleString('en-IN')}</h4>
            <div className="flex items-center gap-1 text-[10px] text-rose-600 font-bold mt-1">
              <ArrowDownRight size={12} />
              <span>Operating Costs</span>
            </div>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shadow-inner group-hover:bg-rose-100 transition-all">
            <TrendingDown size={28} />
          </div>
        </div>

        <div className={`bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors border-b-4 ${totals.net_balance >= 0 ? 'border-b-blue-600' : 'border-b-orange-600'}`}>
          <div>
            <p className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1 ${totals.net_balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net Operating Profit</p>
            <h4 className="text-2xl font-black text-gray-900 tracking-tighter">
              ₹{parseFloat(totals.net_balance).toLocaleString('en-IN')}
            </h4>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">Consolidated Liquid Balance</p>
          </div>
          <div className={`p-3 rounded-2xl shadow-inner transition-all ${totals.net_balance >= 0 ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' : 'bg-orange-50 text-orange-600 group-hover:bg-orange-100'}`}>
            <DollarSign size={28} />
          </div>
        </div>
      </div>
      {/* Transaction Ledger Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 flex justify-between items-center border-b border-gray-100 no-print">
          <div className="flex items-center gap-2">
            <PieChart size={16} className="text-gray-400" />
            <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Detailed Cash Ledger ({entries.length} Entries)</h3>
          </div>
          <div className="flex items-center gap-2 no-print">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
            >
              <Printer size={12} /> Print Audit
            </button>
            <button
              onClick={exportToCSV}
              disabled={entries.length === 0}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download size={12} /> Data Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '8%' }} />
            </colgroup>
            <thead className="bg-gray-100/80 border-b border-gray-200">
              <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Voucher No</th>
                <th className="px-4 py-4">Account Head</th>
                <th className="px-4 py-4">Branch</th>
                <th className="px-4 py-4">Paid To / Recd From</th>
                <th className="px-4 py-4">Remarks</th>
                <th className="px-4 py-4 text-center">Mode</th>
                <th className="px-4 py-4 text-center">Type</th>
                <th className="px-6 py-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={42} className="animate-spin text-blue-600 opacity-20" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Crunching Period Balances...</span>
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <Activity size={48} className="text-gray-200" />
                      </div>
                      <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No financial data detected for this period</p>
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/20 transition-all group">
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      {formatDate(item.transaction_date)}
                    </td>
                    <td className="px-4 py-3 text-xs font-black text-gray-900 font-mono">
                      {item.voucher_no}
                    </td>
                    <td className="px-4 py-3">
                       <span className="text-xs font-bold text-gray-900 uppercase">{item.account_head?.name || 'Unknown'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {item.branch?.branch_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-800 font-semibold">
                      {item.paid_to_receive_from || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate" title={item.remarks}>
                      {item.remarks || '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold border border-gray-200">{item.mode_of_pay}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest ${item.transaction_type === 'CREDIT' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}>
                        {item.transaction_type === 'CREDIT' ? 'INCOME' : 'EXPENSE'}
                      </span>
                    </td>
                    <td className={`px-6 py-3 text-right text-xs font-black tabular-nums ${item.transaction_type === 'CREDIT' ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                      ₹{parseFloat(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PERIOD AUDIT SUMMARY BLOCK - Outside table to prevent repetition on every printed page */}
        {entries.length > 0 && !loading && (
          <div className="bg-gray-900 text-white p-4 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-600 rounded-full print:bg-white" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] italic opacity-80">Period Audit Result</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">
                  {entries.length} Posts Analyzed
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-8 items-center bg-gray-800/50 p-4 rounded-xl border border-gray-700 print:bg-black print:border-white print:p-0 print:gap-4">
              <div className="text-right">
                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${totals.net_balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                  {totals.net_balance >= 0 ? 'Operating Profit' : 'Operating Deficit'}
                </p>
                <div className="flex items-center justify-end gap-2">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${totals.net_balance >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`} />
                   <p className="text-sm font-black italic uppercase tracking-tighter">Status Verified</p>
                </div>
              </div>
              
              <div className="text-right border-l border-gray-700 pl-8 print:border-black">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Net Liquidity</p>
                <p className={`text-3xl font-black tabular-nums tracking-tighter shadow-blue-500/20 drop-shadow-lg ${totals.net_balance < 0 ? 'text-orange-400' : 'text-white'}`}>
                  ₹{parseFloat(totals.net_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest no-print">
        Designed for Industrial Logistics Audit & Compliance
      </div>

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0.5in; }
          body { background: white !important; color: black !important; margin: 0 !important; padding: 0.5in !important; }
          .no-print { display: none !important; }
          .printable-area { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
          .printable-area > * { margin-top: 0 !important; margin-bottom: 0 !important; }
          
          /* Remove borders, shadows, background styles */
          .bg-white { border: none !important; box-shadow: none !important; background: transparent !important; margin-top: 0 !important; }
          .shadow-sm { box-shadow: none !important; }
          
          /* Simple Black & White Table with clean borders */
          table { 
            width: 100% !important; 
            border-collapse: separate !important; 
            border-spacing: 0 !important; 
            font-size: 8.5pt !important; 
            table-layout: fixed !important; 
            border-left: 1px solid black !important;
            border-right: 1px solid black !important;
            border-bottom: 1px solid black !important;
          }
          th { 
            border-top: 1px solid black !important; 
            border-bottom: 1px solid black !important; 
            border-right: 1px solid black !important; 
            background: #f3f4f6 !important; 
            color: black !important; 
            -webkit-print-color-adjust: exact; 
            padding: 6px 8px !important; 
            font-weight: bold !important; 
            text-transform: uppercase !important; 
          }
          th:last-child {
            border-right: none !important;
          }
          td { 
            border-bottom: 1px solid black !important; 
            border-right: 1px solid black !important; 
            padding: 6px 8px !important; 
            color: black !important; 
          }
          td:last-child {
            border-right: none !important;
          }
          tr { page-break-inside: avoid !important; }
          
          /* Prevent wrapping for compact columns */
          td:nth-child(1), td:nth-child(2), td:nth-child(7), td:nth-child(8), td:nth-child(9),
          th:nth-child(1), th:nth-child(2), th:nth-child(7), th:nth-child(8), th:nth-child(9) {
            white-space: nowrap !important;
          }
          
          /* Handle text wrapping for remarks and names */
          td:nth-child(3), td:nth-child(4), td:nth-child(5), td:nth-child(6) {
            word-break: break-word !important;
            white-space: normal !important;
          }
          
          /* Clean up badges (make them simple text without background pill colors) */
          .bg-emerald-100, .bg-rose-100, .bg-gray-100 { 
            background: transparent !important; 
            border: none !important; 
            padding: 0 !important; 
            color: black !important; 
            font-weight: bold !important;
          }
          .text-emerald-700, .text-rose-700 { color: black !important; }
        }
      `}</style>
    </div>
  )
}

export default IncomeExpenseReport
