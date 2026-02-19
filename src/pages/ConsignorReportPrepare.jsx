import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Loader2, AlertCircle, FileText, Printer } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function ConsignorReportPrepare() {
  const [filters, setFilters] = useState({
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    consignor: '',
    freightType: '',
    branch: ''
  })

  const [branches, setBranches] = useState([])
  const [consignors, setConsignors] = useState([])
  const [gcDetails, setGcDetails] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [branchesRes, consignorsRes] = await Promise.all([
        axios.get(`${API_URL}/branches`),
        axios.get(`${API_URL}/consignors`)
      ])
      setBranches(branchesRes.data.data || [])
      setConsignors(consignorsRes.data.data || [])

      const user = JSON.parse(localStorage.getItem('user'))
      if (user?.branch_id) {
        setFilters(prev => ({ ...prev, branch: user.branch_id.toString() }))
      }
    } catch (err) {
      console.error('Error fetching initial data:', err)
      setError('Failed to load branches and consignors')
    } finally {
      setLoading(false)
    }
  }

  const handleGetDetails = async () => {
    try {
      setFetchLoading(true)
      setError(null)
      const params = {
        from_date: filters.fromDate,
        to_date: filters.toDate,
      }
      if (filters.branch) params.branch_id = filters.branch
      if (filters.consignor) params.consignor_id = filters.consignor
      if (filters.freightType) params.account_type = filters.freightType

      const response = await axios.get(`${API_URL}/waybills`, { params })
      if (response.data.success) {
        setGcDetails(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching waybill details:', err)
      setError('Failed to fetch details')
    } finally {
      setFetchLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
  }

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const currentBranchName = branches.find(b => b.id.toString() === filters.branch)?.branch_name || 'ALL BRANCHES'
  const currentConsignorName = consignors.find(c => c.id.toString() === filters.consignor)?.name || 'ALL CONSIGNORS'

  // Totals
  const totalQty = gcDetails.reduce((sum, gc) => sum + (parseInt(gc.total_articles) || 0), 0)
  const totalWt = gcDetails.reduce((sum, gc) => sum + (parseFloat(gc.total_weight) || 0), 0)
  const totalFreight = gcDetails.reduce((sum, gc) => sum + (parseFloat(gc.freight_amount) || 0), 0)
  const totalDD = gcDetails.reduce((sum, gc) => sum + (parseFloat(gc.dd_charges) || 0), 0)
  const totalHdl = gcDetails.reduce((sum, gc) => sum + (parseFloat(gc.handling_charges) || 0), 0)
  const totalStat = gcDetails.reduce((sum, gc) => sum + (parseFloat(gc.stationary_charges) || 0), 0)
  const totalGST = gcDetails.reduce((sum, gc) => sum + (parseFloat(gc.gst_amount) || 0), 0)
  const totalGrand = gcDetails.reduce((sum, gc) => sum + (parseFloat(gc.grand_total) || 0), 0)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    )
  }

  return (
    <>
      {/* ===== PRINT STYLES ===== */}
      <style>{`
        @media print {
          /* Hide everything except the print area */
          body * {
            visibility: hidden;
          }
          #consignor-print-area,
          #consignor-print-area * {
            visibility: visible;
          }
          #consignor-print-area {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 12mm 10mm;
            background: white;
            font-family: 'Arial', sans-serif;
          }
          /* Page settings */
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          /* Report header */
          .print-header {
            display: flex !important;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #1a1a1a;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .print-company-name {
            font-size: 22pt;
            font-weight: 900;
            font-style: italic;
            color: #000;
            letter-spacing: -0.5px;
            text-transform: uppercase;
          }
          .print-company-sub {
            font-size: 7pt;
            font-weight: 700;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 2px;
          }
          .print-report-title {
            font-size: 14pt;
            font-weight: 900;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-decoration: underline;
            text-decoration-color: #16a34a;
            text-decoration-thickness: 3px;
            text-underline-offset: 4px;
          }
          .print-branch {
            font-size: 7pt;
            font-weight: 700;
            color: #444;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 4px;
          }
          /* Info boxes */
          .print-info-row {
            display: flex !important;
            gap: 16px;
            margin-bottom: 10px;
          }
          .print-info-box {
            border-left: 4px solid #16a34a;
            padding: 4px 8px;
            background: #f9fafb;
            flex: 1;
          }
          .print-info-box.blue {
            border-left-color: #2563eb;
          }
          .print-info-label {
            font-size: 6pt;
            font-weight: 700;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            display: block;
          }
          .print-info-value {
            font-size: 9pt;
            font-weight: 900;
            color: #111;
            text-transform: uppercase;
          }
          /* Table */
          .print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7.5pt;
          }
          .print-table thead tr {
            background: #f3f4f6;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
          }
          .print-table th {
            padding: 5px 4px;
            text-align: left;
            font-weight: 900;
            font-size: 7pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #000;
            white-space: nowrap;
          }
          .print-table th.right,
          .print-table td.right {
            text-align: right;
          }
          .print-table td {
            padding: 4px 4px;
            font-size: 7.5pt;
            color: #000;
            border-bottom: 0.5px solid #ddd;
            white-space: nowrap;
          }
          .print-table tr.total-row td {
            font-weight: 900;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            background: #f9fafb;
            font-size: 8pt;
          }
          .print-table tr:nth-child(even) td {
            background: #fafafa;
          }
          .print-footer {
            margin-top: 16px;
            border-top: 1px solid #ccc;
            padding-top: 6px;
            display: flex !important;
            justify-content: space-between;
            font-size: 6.5pt;
            color: #666;
          }
        }
      `}</style>

      {/* ===== SCREEN UI ===== */}
      <div className="p-4 space-y-4 no-print-wrapper">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 rounded-lg text-green-600 shadow-sm shadow-green-100">
              <FileText size={18} />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Consignor Report</h1>
          </div>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black font-black flex items-center gap-2 shadow-lg shadow-gray-200 transition-all hover:scale-105 active:scale-95 text-[10px] tracking-widest uppercase"
          >
            <Printer size={14} />
            Print Report
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 space-y-4 border border-gray-100">
          {error && (
            <div className="p-2 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-200 text-xs">
              <AlertCircle size={14} />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {/* Filter Section */}
          <div className="bg-green-50/30 p-4 rounded-xl border border-green-100 shadow-sm">
            <h3 className="font-black text-[9px] text-green-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-green-500"></div>
              Search Consignor Waybill Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">From Date</label>
                <input type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none font-bold text-gray-700 text-[11px]" />
              </div>
              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">To Date</label>
                <input type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none font-bold text-gray-700 text-[11px]" />
              </div>
              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Consignor</label>
                <select value={filters.consignor} onChange={(e) => setFilters({ ...filters, consignor: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none font-bold text-gray-700 text-[11px] uppercase">
                  <option value="">All Consignors</option>
                  {consignors.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Freight Type</label>
                <select value={filters.freightType} onChange={(e) => setFilters({ ...filters, freightType: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none font-bold text-gray-700 text-[11px] uppercase">
                  <option value="">All Types</option>
                  <option value="PAID">PAID</option>
                  <option value="TO PAY">TO PAY</option>
                  <option value="TBB">TBB</option>
                </select>
              </div>
              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Branch</label>
                <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none font-bold text-gray-700 text-[11px] uppercase">
                  <option value="">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <button
                onClick={handleGetDetails}
                disabled={fetchLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-black flex items-center gap-2 shadow-lg shadow-green-100 transition-all hover:scale-105 active:scale-95 text-[10px] tracking-widest uppercase"
              >
                {fetchLoading ? <Loader2 className="animate-spin" size={12} /> : 'GET DETAILS'}
              </button>
            </div>
          </div>

          {/* Screen Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-yellow-100/30 p-3 border-b border-yellow-100 flex items-center justify-between">
              <h3 className="font-black text-[9px] text-yellow-800 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
                GC Details View
              </h3>
              <span className="text-[9px] font-black text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">{gcDetails.length} Records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-2 py-2 text-left font-black text-gray-500 uppercase tracking-widest">Date</th>
                    <th className="px-2 py-2 text-left font-black text-gray-500 uppercase tracking-widest">GC Num</th>
                    <th className="px-2 py-2 text-left font-black text-gray-500 uppercase tracking-widest">Destination</th>
                    <th className="px-2 py-2 text-left font-black text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-2 py-2 text-left font-black text-gray-500 uppercase tracking-widest">Type</th>
                    <th className="px-2 py-2 text-left font-black text-gray-500 uppercase tracking-widest">Invoice No</th>
                    <th className="px-2 py-2 text-right font-black text-gray-500 uppercase tracking-widest">Qty</th>
                    <th className="px-2 py-2 text-right font-black text-gray-500 uppercase tracking-widest">Weight</th>
                    <th className="px-2 py-2 text-right font-black text-gray-500 uppercase tracking-widest">Freight</th>
                    <th className="px-2 py-2 text-right font-black text-gray-500 uppercase tracking-widest">DD Charges</th>
                    <th className="px-2 py-2 text-right font-black text-gray-500 uppercase tracking-widest">Handling</th>
                    <th className="px-2 py-2 text-right font-black text-gray-500 uppercase tracking-widest">Stationary</th>
                    <th className="px-2 py-2 text-right font-black text-gray-500 uppercase tracking-widest">GST</th>
                    <th className="px-2 py-2 text-right font-black text-gray-500 uppercase tracking-widest">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {gcDetails.map((gc, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-2 font-bold text-gray-700 whitespace-nowrap">{formatDate(gc.bill_date)}</td>
                      <td className="px-2 py-2 font-black text-blue-600 whitespace-nowrap">{gc.gc_number}</td>
                      <td className="px-2 py-2 font-bold text-gray-600 whitespace-nowrap uppercase">{gc.destination?.city_name || '-'}</td>
                      <td className="px-2 py-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase whitespace-nowrap ${gc.status?.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-700' :
                          gc.status?.toLowerCase() === 'ack received' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                          {gc.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-2 py-2 font-bold text-gray-600 uppercase italic whitespace-nowrap">{gc.account_type || '-'}</td>
                      <td className="px-2 py-2 font-medium text-gray-600 italic uppercase whitespace-nowrap">{gc.invoice_no || '-'}</td>
                      <td className="px-2 py-2 text-right font-bold text-gray-700">{gc.total_articles}</td>
                      <td className="px-2 py-2 text-right font-bold text-gray-700 whitespace-nowrap">{gc.total_weight || 0} kg</td>
                      <td className="px-2 py-2 text-right font-bold text-gray-700">{parseFloat(gc.freight_amount || 0).toFixed(2)}</td>
                      <td className="px-2 py-2 text-right font-bold text-gray-700">{parseFloat(gc.dd_charges || 0).toFixed(2)}</td>
                      <td className="px-2 py-2 text-right font-bold text-gray-700">{parseFloat(gc.handling_charges || 0).toFixed(2)}</td>
                      <td className="px-2 py-2 text-right font-bold text-gray-700">{parseFloat(gc.stationary_charges || 0).toFixed(2)}</td>
                      <td className="px-2 py-2 text-right font-bold text-gray-700">{parseFloat(gc.gst_amount || 0).toFixed(2)}</td>
                      <td className="px-2 py-2 text-right font-black text-green-700">{parseFloat(gc.grand_total || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {gcDetails.length > 0 && (
                    <tr className="bg-gray-100/50 font-black">
                      <td colSpan="6" className="px-2 py-3 text-right uppercase tracking-widest text-gray-600">Grand Total</td>
                      <td className="px-2 py-3 text-right text-gray-800">{totalQty}</td>
                      <td className="px-2 py-3 text-right text-gray-800">{totalWt} kg</td>
                      <td className="px-2 py-3 text-right text-gray-800">{totalFreight.toFixed(2)}</td>
                      <td className="px-2 py-3 text-right text-gray-800">{totalDD.toFixed(2)}</td>
                      <td className="px-2 py-3 text-right text-gray-800">{totalHdl.toFixed(2)}</td>
                      <td className="px-2 py-3 text-right text-gray-800">{totalStat.toFixed(2)}</td>
                      <td className="px-2 py-3 text-right text-gray-800">{totalGST.toFixed(2)}</td>
                      <td className="px-2 py-3 text-right text-green-700">{totalGrand.toFixed(2)}</td>
                    </tr>
                  )}
                  {gcDetails.length === 0 && (
                    <tr>
                      <td colSpan="14" className="px-2 py-8 text-center text-gray-400 font-bold uppercase tracking-widest bg-gray-50/50 text-[9px]">
                        No records found. Use the filters above and click GET DETAILS.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PRINT-ONLY AREA ===== */}
      <div id="consignor-print-area" style={{ display: 'none' }}>
        {/* Company Header */}
        <div className="print-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #111', paddingBottom: '8px', marginBottom: '10px' }}>
          <div>
            <div className="print-company-name" style={{ fontSize: '22pt', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
              Garuda Transport
            </div>
            <div className="print-company-sub" style={{ fontSize: '7pt', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '2px' }}>
              Waybill Delivery Logistics
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="print-report-title" style={{ fontSize: '14pt', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', textDecoration: 'underline', textDecorationColor: '#16a34a', textDecorationThickness: '3px', textUnderlineOffset: '4px' }}>
              Consignor Report
            </div>
            <div className="print-branch" style={{ fontSize: '7pt', fontWeight: '700', color: '#444', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
              Branch: {currentBranchName}
            </div>
          </div>
        </div>

        {/* Info Row */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
          <div style={{ borderLeft: '4px solid #16a34a', padding: '4px 8px', background: '#f9fafb', flex: 1 }}>
            <span style={{ fontSize: '6pt', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block' }}>Reporting Period</span>
            <span style={{ fontSize: '9pt', fontWeight: '900', color: '#111', textTransform: 'uppercase' }}>
              {formatDisplayDate(filters.fromDate)} to {formatDisplayDate(filters.toDate)}
            </span>
          </div>
          <div style={{ borderLeft: '4px solid #2563eb', padding: '4px 8px', background: '#f9fafb', flex: 1 }}>
            <span style={{ fontSize: '6pt', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block' }}>Consignor Name</span>
            <span style={{ fontSize: '9pt', fontWeight: '900', color: '#111', textTransform: 'uppercase' }}>{currentConsignorName}</span>
          </div>
          {filters.freightType && (
            <div style={{ borderLeft: '4px solid #d97706', padding: '4px 8px', background: '#f9fafb', flex: 1 }}>
              <span style={{ fontSize: '6pt', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block' }}>Freight Type</span>
              <span style={{ fontSize: '9pt', fontWeight: '900', color: '#111', textTransform: 'uppercase' }}>{filters.freightType}</span>
            </div>
          )}
          <div style={{ borderLeft: '4px solid #7c3aed', padding: '4px 8px', background: '#f9fafb', flex: 1 }}>
            <span style={{ fontSize: '6pt', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block' }}>Total Records</span>
            <span style={{ fontSize: '9pt', fontWeight: '900', color: '#111' }}>{gcDetails.length} Waybills</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderBottom: '1px solid #ccc', marginBottom: '8px' }}></div>

        {/* Report Table */}
        <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5pt' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
              <th style={{ padding: '5px 4px', textAlign: 'left', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Date</th>
              <th style={{ padding: '5px 4px', textAlign: 'left', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>GC Number</th>
              <th style={{ padding: '5px 4px', textAlign: 'left', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Destination</th>
              <th style={{ padding: '5px 4px', textAlign: 'left', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '5px 4px', textAlign: 'left', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Type</th>
              <th style={{ padding: '5px 4px', textAlign: 'left', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Invoice No</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Qty</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Weight</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Freight (₹)</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>DD Chg (₹)</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Handling (₹)</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Stationary (₹)</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>GST (₹)</th>
              <th style={{ padding: '5px 4px', textAlign: 'right', fontWeight: '900', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Grand Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {gcDetails.map((gc, idx) => (
              <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '0.5px solid #ddd' }}>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', whiteSpace: 'nowrap' }}>{formatDate(gc.bill_date)}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', fontWeight: '700', whiteSpace: 'nowrap' }}>{gc.gc_number}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{gc.destination?.city_name || '-'}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{gc.status || 'PENDING'}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{gc.account_type || '-'}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{gc.invoice_no || '-'}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textAlign: 'right' }}>{gc.total_articles}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textAlign: 'right', whiteSpace: 'nowrap' }}>{gc.total_weight || 0} kg</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textAlign: 'right' }}>{parseFloat(gc.freight_amount || 0).toFixed(2)}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textAlign: 'right' }}>{parseFloat(gc.dd_charges || 0).toFixed(2)}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textAlign: 'right' }}>{parseFloat(gc.handling_charges || 0).toFixed(2)}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textAlign: 'right' }}>{parseFloat(gc.stationary_charges || 0).toFixed(2)}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textAlign: 'right' }}>{parseFloat(gc.gst_amount || 0).toFixed(2)}</td>
                <td style={{ padding: '4px 4px', fontSize: '7.5pt', textAlign: 'right', fontWeight: '900' }}>{parseFloat(gc.grand_total || 0).toFixed(2)}</td>
              </tr>
            ))}

            {/* Grand Total Row */}
            {gcDetails.length > 0 && (
              <tr style={{ background: '#f3f4f6', borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
                <td colSpan="6" style={{ padding: '5px 4px', fontSize: '8pt', fontWeight: '900', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Grand Total
                </td>
                <td style={{ padding: '5px 4px', fontSize: '8pt', fontWeight: '900', textAlign: 'right' }}>{totalQty}</td>
                <td style={{ padding: '5px 4px', fontSize: '8pt', fontWeight: '900', textAlign: 'right', whiteSpace: 'nowrap' }}>{totalWt} kg</td>
                <td style={{ padding: '5px 4px', fontSize: '8pt', fontWeight: '900', textAlign: 'right' }}>{totalFreight.toFixed(2)}</td>
                <td style={{ padding: '5px 4px', fontSize: '8pt', fontWeight: '900', textAlign: 'right' }}>{totalDD.toFixed(2)}</td>
                <td style={{ padding: '5px 4px', fontSize: '8pt', fontWeight: '900', textAlign: 'right' }}>{totalHdl.toFixed(2)}</td>
                <td style={{ padding: '5px 4px', fontSize: '8pt', fontWeight: '900', textAlign: 'right' }}>{totalStat.toFixed(2)}</td>
                <td style={{ padding: '5px 4px', fontSize: '8pt', fontWeight: '900', textAlign: 'right' }}>{totalGST.toFixed(2)}</td>
                <td style={{ padding: '5px 4px', fontSize: '8pt', fontWeight: '900', textAlign: 'right', textDecoration: 'underline' }}>{totalGrand.toFixed(2)}</td>
              </tr>
            )}

            {gcDetails.length === 0 && (
              <tr>
                <td colSpan="14" style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '8pt' }}>
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Print Footer */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #ccc', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '6.5pt', color: '#666' }}>
          <span>Generated on: {new Date().toLocaleString('en-IN')}</span>
          <span>Garuda Transport — Waybill Delivery Logistics</span>
          <span>Branch: {currentBranchName}</span>
        </div>
      </div>
    </>
  )
}

export default ConsignorReportPrepare
