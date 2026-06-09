import React, { useState, useEffect, useRef } from 'react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Search, Calendar, Loader2, Download, AlertCircle,
  Building, User, FileText, CheckCircle, Clock,
  DollarSign, PieChart as PieChartIcon, FilterX, RefreshCcw,
  ChevronUp, ChevronDown, ArrowUpDown, Eye
} from 'lucide-react'

function ConsignorHistoryReport() {
  const currentUser = JSON.parse(localStorage.getItem('user'))
  
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    consignor_id: '',
    accountType: ''       // 'paid' | 'topay' | 'account' | '' (all)
  })

  const [consignorSearch, setConsignorSearch] = useState('');
  const [openSelect, setOpenSelect] = useState(null);

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [consignors, setConsignors] = useState([])
  const [branches, setBranches] = useState([])
  const [data, setData] = useState({
    stats: {
      booking_details: { total: 0, delivered: 0, pending: 0 },
      freight_wise_booking: { account: 0, topay: 0, paid: 0 },
      payment_details: { booking_amount: 0, paid_amount: 0, balance: 0 },
      freight_wise_payment: { account: 0, topay: 0, paid: 0 }
    },
    waybills: []
  })

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'bill_date', direction: 'desc' })

  // Search State
  const [searchTerm, setSearchTerm] = useState('')
  const [columnFilters, setColumnFilters] = useState({
    date: '',
    gc_number: '',
    invoice_no: '',
    consignee: '',
    destination: ''
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [cRes, bRes] = await Promise.all([
        fetch(`${API_BASE_URL}/consignors`),
        fetch(`${API_BASE_URL}/branches`)
      ])
      const cData = await cRes.json()
      const bData = await bRes.json()

      if (cData.success) {
        if (currentUser?.role === 'consignor') {
          // Try consignor_id from localStorage first
          let assignedConsignorId = currentUser.consignor_id;

          // Fallback: fetch fresh admin record if localStorage is stale (no consignor_id)
          if (!assignedConsignorId && currentUser?.id) {
            try {
              const adminRes = await fetch(`${API_BASE_URL}/users/${currentUser.id}`);
              const adminData = await adminRes.json();
              if (adminData.success) {
                assignedConsignorId = adminData.data?.consignor_id;
                // Update localStorage with fresh data
                const updated = { ...currentUser, consignor_id: assignedConsignorId };
                localStorage.setItem('user', JSON.stringify(updated));
              }
            } catch (e) {
              console.error('Could not fetch admin details:', e);
            }
          }

          const userConsignor = cData.data.find(c => c.id == assignedConsignorId);
          setConsignors(userConsignor ? [userConsignor] : []);
          if (userConsignor) {
            setFilters(prev => ({ ...prev, consignor_id: userConsignor.id }));
          }
        } else {
          setConsignors(cData.data);
        }
      }

      if (bData.success) {
        if (currentUser?.role === 'superadmin') {
          setBranches(bData.data)
        } else {
          const userBranch = bData.data.find(b => b.id === currentUser?.branch_id)
          setBranches(userBranch ? [userBranch] : [])
        }
      }
    } catch (err) {
      console.error('Error fetching initial data:', err)
    }
  }

  const handleGetDetails = async () => {
    if (!filters.consignor_id) {
      setError('Please select a consignor first')
      return
    }

    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      params.append('consignor_id', filters.consignor_id)
      if (filters.fromDate) params.append('from_date', filters.fromDate)
      if (filters.toDate) params.append('to_date', filters.toDate)

      const response = await fetch(`${API_BASE_URL}/reports/consignor-history?${params.toString()}`)
      if (!response.ok) throw new Error('Report fetch failed')
      const d = await response.json()

      if (d.success) {
        setData(d.data)
        if (d.data.waybills.length === 0) setError('No history found for this criteria')
      } else {
        setError(d.message || 'Failed to fetch report')
      }
    } catch (err) {
      setError('Server connection error')
    } finally {
      setLoading(false)
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }

  const sortedWaybills = React.useMemo(() => {
    if (!data.waybills) return [];

    let filteredItems = data.waybills.filter(wb => {
      // Global Search
      const s = searchTerm.toLowerCase()
      if (s) {
        const matchesGlobal = String(wb.gc_number || '').toLowerCase().includes(s) || 
                              String(wb.invoice_no || '').toLowerCase().includes(s) || 
                              String(wb.consignee?.name || '').toLowerCase().includes(s) || 
                              String(wb.destination?.city_name || '').toLowerCase().includes(s);
        if (!matchesGlobal) return false;
      }
      
      // Column Filters
      if (columnFilters.date && !String(wb.bill_date || '').includes(columnFilters.date)) return false;
      if (columnFilters.gc_number && !String(wb.gc_number || '').toLowerCase().includes(columnFilters.gc_number.toLowerCase())) return false;
      if (columnFilters.invoice_no && !String(wb.invoice_no || '').toLowerCase().includes(columnFilters.invoice_no.toLowerCase())) return false;
      if (columnFilters.consignee && !String(wb.consignee?.name || '').toLowerCase().includes(columnFilters.consignee.toLowerCase())) return false;
      if (columnFilters.destination && !String(wb.destination?.city_name || '').toLowerCase().includes(columnFilters.destination.toLowerCase())) return false;

      // Account Type Filter
      if (filters.accountType) {
        const wbType = (wb.account_type || '').toLowerCase().replace(/\s/g, '');
        const selType = filters.accountType.toLowerCase().replace(/\s/g, '');
        if (!wbType.includes(selType)) return false;
      }

      return true;
    });

    let sortableItems = [...filteredItems];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle nested destination name
        if (sortConfig.key === 'destination') aVal = a.destination?.city_name || '';
        if (sortConfig.key === 'destination') bVal = b.destination?.city_name || '';
        
        // Handle nested consignee name
        if (sortConfig.key === 'consignee') aVal = a.consignee?.name || '';
        if (sortConfig.key === 'consignee') bVal = b.consignee?.name || '';

        // Date comparison for bill_date
        if (sortConfig.key === 'bill_date') {
          const dateA = new Date(aVal);
          const dateB = new Date(bVal);
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }

        // Numeric comparison for financial fields and counts
        const numericFields = ['total_articles', 'actual_weight', 'freight_amount', 'dd_charges', 'handling_charges', 'stationary_charges', 'gst_amount', 'grand_total'];
        if (numericFields.includes(sortConfig.key)) {
          const numA = parseFloat(aVal) || 0;
          const numB = parseFloat(bVal) || 0;
          return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
        }

        // String comparison fallback
        const strA = (aVal || '').toString().toLowerCase();
        const strB = (bVal || '').toString().toLowerCase();

        if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data.waybills, sortConfig, searchTerm, columnFilters, filters.accountType]);

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={10} className="ml-1 opacity-20" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={10} className="ml-1 text-blue-600" /> 
      : <ChevronDown size={10} className="ml-1 text-blue-600" />;
  }

  const exportToCSV = () => {
    if (data.waybills.length === 0) return
    const headers = [
      'Date', 'GC Number', 'Invoice No', 'Consignee', 'Destination', 'Articles', 'Weight', 'Content', 
      'Freight', 'DD Charges', 'Handling', 'St. Charges', 'GST', 'Total', 'Type'
    ]
    const csvContent = [
      headers.join(','),
      ...sortedWaybills.map(wb => [
        wb.bill_date,
        wb.gc_number,
        wb.invoice_no || 'N/A',
        `"${wb.consignee?.name || 'N/A'}"`,
        wb.destination?.city_name || 'N/A',
        wb.total_articles,
        wb.actual_weight || 0,
        `"${(wb.article_desc || '').replace(/"/g, '""')}"`,
        wb.freight_amount,
        wb.dd_charges,
        wb.handling_charges,
        wb.stationary_charges,
        wb.gst_amount,
        wb.grand_total,
        wb.account_type
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Consignor_History_${filters.consignor_id}_${new Date().getTime()}.csv`
    link.click()
  }

  const exportToPDF = () => {
    if (sortedWaybills.length === 0) return;

    const doc = new jsPDF('l', 'pt', 'a4');
    // ── Resolve consignor & branch objects ──────────────────────────────
    const consignorObj  = consignors.find(c => c.id == filters.consignor_id) || {};
    const consignorName = consignorObj.name || 'Consignor';
    const consignorAddr = consignorObj.address || '';
    const consignorPhone = [consignorObj.mobile_no, consignorObj.land_no].filter(Boolean).join(' / ');

    // Branch: prefer the branch from the filter (superadmin picks one), else user's branch
    const reportingBranch = branches.find(b => b.id === currentUser?.branch_id)
                         || branches[0]
                         || {};
    const branchName = reportingBranch.branch_name || 'All Branches';

    const pageWidth = doc.internal.pageSize.getWidth();
    const trunc = (str, n) => str && str.length > n ? str.substring(0, n - 1) + String.fromCharCode(0x2026) : (str || '');

    // ── Header ──────────────────────────────────────────────────────────
    // Title — centred, large & bold
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('CONSIGNOR HISTORY REPORT', pageWidth / 2, 26, { align: 'center' });

    // Thin line below title
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.6);
    doc.line(25, 31, pageWidth - 25, 31);

    // ── Line 1: Consignor name | address | phone ──────────────────────
    const consignorLine = [
      consignorName,
      consignorAddr ? `Address: ${trunc(consignorAddr, 70)}` : null,
      consignorPhone ? `Ph: ${consignorPhone}` : null,
    ].filter(Boolean).join('   |   ');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text(consignorLine, pageWidth / 2, 42, { align: 'center' });

    // ── Line 2: Branch | Period | Generated ──────────────────────────
    const infoLine = `Branch: ${branchName}   |   Period: ${filters.fromDate}  to  ${filters.toDate}   |   Generated: ${new Date().toLocaleString()}`;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(infoLine, pageWidth / 2, 53, { align: 'center' });

    // Divider line below header
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.6);
    doc.line(25, 60, pageWidth - 25, 60);



    // Compute totals row
    const totalFreight = sortedWaybills.reduce((s, wb) => s + parseFloat(wb.freight_amount || 0), 0);
    const totalDD = sortedWaybills.reduce((s, wb) => s + parseFloat(wb.dd_charges || 0), 0);
    const totalHandling = sortedWaybills.reduce((s, wb) => s + parseFloat(wb.handling_charges || 0), 0);
    const totalSt = sortedWaybills.reduce((s, wb) => s + parseFloat(wb.stationary_charges || 0), 0);
    const totalGST = sortedWaybills.reduce((s, wb) => s + parseFloat(wb.gst_amount || 0), 0);
    const totalGrand = sortedWaybills.reduce((s, wb) => s + parseFloat(wb.grand_total || 0), 0);
    const totalArt = sortedWaybills.reduce((s, wb) => s + parseInt(wb.total_articles || 0), 0);

    // ── Main Detail Table ───────────────────────────────────────────────
    // A4 landscape usable width: 841 - 50 (margins) = 791 pt
    // Column widths sum: 20+52+44+34+130+66+20+28+46+26+30+30+26+50+32 = 634 → fits fine
    const tableData = sortedWaybills.map((wb, i) => [
      i + 1,
      wb.bill_date || '',
      wb.gc_number || '',
      wb.invoice_no || '',
      trunc(wb.consignee?.name || 'N/A', 30),      // max 30 chars
      trunc(wb.destination?.city_name || 'N/A', 16), // max 16 chars
      wb.total_articles,
      parseFloat(wb.actual_weight    || 0).toFixed(2),
      parseFloat(wb.articles?.[0]?.freight || 0).toFixed(2),  // Freight per Kg (articles[0].freight)
      parseFloat(wb.freight_amount   || 0).toFixed(2),
      parseFloat(wb.dd_charges       || 0).toFixed(2),
      parseFloat(wb.handling_charges || 0).toFixed(2),
      parseFloat(wb.stationary_charges || 0).toFixed(2),
      parseFloat(wb.gst_amount       || 0).toFixed(2),
      parseFloat(wb.grand_total      || 0).toFixed(2),
      wb.account_type?.toUpperCase() || '',
    ]);

    const totalsRow = [
      '', 'Total', '', '', '', '', totalArt, '', '',  // extra '' for Rate column
      totalFreight.toFixed(2), totalDD.toFixed(2),
      totalHandling.toFixed(2), totalSt.toFixed(2),
      totalGST.toFixed(2), totalGrand.toFixed(2), '',
    ];

    autoTable(doc, {
      startY: 65,
      head: [['#', 'BILL DATE', 'GC NO', 'INV NO', 'CONSIGNEE', 'DESTINATION', 'ART', 'WT', 'RATE', 'FREIGHT', 'DD', 'HANDL.', 'ST.CH.', 'GST', 'TOTAL', 'TYPE']],
      body: [...tableData, totalsRow],
      theme: 'grid',
      styles: {
        fontSize: 6.5,
        cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
        lineColor: [100, 100, 100],
        lineWidth: 0.25,
        textColor: [0, 0, 0],
        overflow: 'ellipsis',   // ← single-line, no wrapping
        valign: 'middle',
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 6.5,
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        cellPadding: { top: 3, bottom: 3, left: 2.5, right: 2.5 },
      },
      bodyStyles:         { fillColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        // 16 cols: 20+52+46+32+190+94+20+28+36+56+26+30+30+26+72+34 = 792 pt (full width)
        0:  { halign: 'center', cellWidth: 20  },  // #
        1:  { halign: 'center', cellWidth: 52  },  // Bill Date
        2:  { halign: 'center', cellWidth: 46  },  // GC No
        3:  { halign: 'center', cellWidth: 32  },  // Inv No
        4:  { halign: 'left',   cellWidth: 190 },  // Consignee  (-22 to fit Rate col)
        5:  { halign: 'left',   cellWidth: 94  },  // Destination (-14 to fit Rate col)
        6:  { halign: 'center', cellWidth: 20  },  // Art
        7:  { halign: 'right',  cellWidth: 28  },  // Wt
        8:  { halign: 'right',  cellWidth: 36  },  // Rate (NEW)
        9:  { halign: 'right',  cellWidth: 56  },  // Freight
        10: { halign: 'right',  cellWidth: 26  },  // DD
        11: { halign: 'right',  cellWidth: 30  },  // Handl.
        12: { halign: 'right',  cellWidth: 30  },  // St.Ch.
        13: { halign: 'right',  cellWidth: 26  },  // GST
        14: { halign: 'right',  cellWidth: 72  },  // Total
        15: { halign: 'center', cellWidth: 34  },  // Type
      },
      didParseCell: (data) => {
        // Bold + grey background for totals row
        if (data.section === 'body' && data.row.index === tableData.length) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [218, 218, 218];
        }
      },
      margin: { left: 25, right: 25 },
    });

    // ── Signature & Seal Section — right-aligned, right after content ────
    const lastPage = doc.internal.getNumberOfPages();
    doc.setPage(lastPage);

    const pageHeight = doc.internal.pageSize.getHeight();
    const tableEndY  = doc.lastAutoTable.finalY;   // exact Y where table ended
    const sigY       = tableEndY + 10;             // 10 pt gap below table
    const sigBoxW    = 160;                        // single box width
    const sigBoxH    = 36;                         // box height
    const sigX       = pageWidth - 25 - sigBoxW;  // right-aligned (right margin = 25)

    // Dotted signature line inside box
    doc.setLineDashPattern([2, 2], 0);
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.4);
    doc.line(sigX + 12, sigY + sigBoxH - 10, sigX + sigBoxW - 12, sigY + sigBoxH - 10);
    doc.setLineDashPattern([], 0);

    // Box border
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.3);
    doc.rect(sigX, sigY, sigBoxW, sigBoxH);

    // Label below dotted line, centered in box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text('Signature & Seal', sigX + sigBoxW / 2, sigY + sigBoxH + 5, { align: 'center' });

    // ── Page numbers ────────────────────────────────────────────────────
    const pageCount = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(`Page ${p} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    }

    window.open(doc.output('bloburl'), '_blank');
  };

  return (
    <div className="p-4 space-y-4 bg-gray-50/50 min-h-screen">
      {/* Search Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <User size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-800 uppercase tracking-tight">Consignor History Analytics</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Comprehensive Client Ledger & Booking Profile</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              disabled={data.waybills.length === 0}
              className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-green-100 transition-all border border-green-100 disabled:opacity-50"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={exportToPDF}
              disabled={data.waybills.length === 0}
              className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-100 transition-all border border-red-100 disabled:opacity-50"
            >
              <FileText size={14} /> Download PDF
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                  className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-blue-500 focus:bg-white text-xs font-black outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                  className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-blue-500 focus:bg-white text-xs font-black outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Consignor</label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={12} />
                <SearchableSelect
                  placeholder="Select Consignor"
                  options={consignors.map(c => ({ id: c.id, label: c.name, raw: c }))}
                  value={filters.consignor_id}
                  onSelect={(id) => {
                    setFilters({ ...filters, consignor_id: id });
                    setOpenSelect(null);
                  }}
                  searchTerm={consignorSearch}
                  setSearchTerm={setConsignorSearch}
                  isOpen={openSelect === 'consignor'}
                  onToggle={() => setOpenSelect(openSelect === 'consignor' ? null : 'consignor')}
                  disabled={currentUser?.role === 'consignor'}
                />
              </div>
            </div>
            {/* Account Type Filter */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Type</label>
              <select
                value={filters.accountType}
                onChange={(e) => setFilters({ ...filters, accountType: e.target.value })}
                className="w-full px-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-blue-500 focus:bg-white text-xs font-black outline-none transition-all cursor-pointer"
              >
                <option value="">All Types</option>
                <option value="paid">Paid</option>
                <option value="topay">To Pay</option>
                <option value="account">Account</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGetDetails}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                GATHER DATA
              </button>
              <button
                onClick={() => setFilters({ ...filters, consignor_id: '', accountType: '' })}
                className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 border-2 border-gray-100 transition-all shadow-sm"
                title="Clear filters"
              >
                <FilterX size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-3 text-red-600">
          <AlertCircle size={16} />
          <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Booking Details */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><FileText size={14} /></div>
            <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Booking Profile</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">Total GCs</span>
              <span className="px-2 py-0.5 bg-gray-100 rounded">{data.stats.booking_details.total}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">Delivered</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">{data.stats.booking_details.delivered}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">In-Transit</span>
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">{data.stats.booking_details.pending}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Freight Wise counts */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><PieChartIcon size={14} /></div>
            <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Freight Split (Count)</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">Account</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">{data.stats.freight_wise_booking.account}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">ToPay</span>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">{data.stats.freight_wise_booking.topay}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">Paid</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{data.stats.freight_wise_booking.paid}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Payment details */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={14} /></div>
            <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Payment Ledger</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">Total Booked</span>
              <span className="text-gray-900">₹{data.stats.payment_details.booking_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">Recovered</span>
              <span className="text-emerald-600">₹{data.stats.payment_details.paid_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">Outstanding</span>
              <span className="text-red-600">₹{data.stats.payment_details.balance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Freight wise payment */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><RefreshCcw size={14} /></div>
            <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Recovered by Type</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">Account</span>
              <span className="text-amber-700">₹{data.stats.freight_wise_payment.account.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">ToPay</span>
              <span className="text-amber-700">₹{data.stats.freight_wise_payment.topay.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-gray-400 uppercase tracking-widest">Paid</span>
              <span className="text-amber-700">₹{data.stats.freight_wise_payment.paid.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Clock size={14} /> Consignment Audit Trail ({sortedWaybills.length} Records)
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-[10px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-64 bg-white font-bold"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th 
                  className="px-3 py-2 text-[9px] font-black text-gray-600 uppercase tracking-widest whitespace-nowrap hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center cursor-pointer" onClick={() => requestSort('bill_date')}>Date <SortIcon column="bill_date" /></div>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={columnFilters.date}
                      onChange={(e) => setColumnFilters(prev => ({...prev, date: e.target.value}))}
                      className="w-full min-w-[60px] text-[9px] px-1.5 py-1 border border-gray-200 rounded font-normal text-gray-700 bg-white placeholder:text-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
                    />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-[9px] font-black text-gray-600 uppercase tracking-widest whitespace-nowrap hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center cursor-pointer" onClick={() => requestSort('gc_number')}>GC No <SortIcon column="gc_number" /></div>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={columnFilters.gc_number}
                      onChange={(e) => setColumnFilters(prev => ({...prev, gc_number: e.target.value}))}
                      className="w-full min-w-[60px] text-[9px] px-1.5 py-1 border border-gray-200 rounded font-normal text-gray-700 bg-white placeholder:text-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
                    />
                  </div>
                </th>
                <th 
                   className="px-3 py-2 text-[9px] font-black text-gray-600 uppercase tracking-widest whitespace-nowrap hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center cursor-pointer" onClick={() => requestSort('invoice_no')}>Inv No <SortIcon column="invoice_no" /></div>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={columnFilters.invoice_no}
                      onChange={(e) => setColumnFilters(prev => ({...prev, invoice_no: e.target.value}))}
                      className="w-full min-w-[60px] text-[9px] px-1.5 py-1 border border-gray-200 rounded font-normal text-gray-700 bg-white placeholder:text-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
                    />
                  </div>
                </th>
                <th 
                   className="px-3 py-2 text-[9px] font-black text-gray-600 uppercase tracking-widest hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center cursor-pointer" onClick={() => requestSort('consignee')}>Consignee <SortIcon column="consignee" /></div>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={columnFilters.consignee}
                      onChange={(e) => setColumnFilters(prev => ({...prev, consignee: e.target.value}))}
                      className="w-full min-w-[80px] text-[9px] px-1.5 py-1 border border-gray-200 rounded font-normal text-gray-700 bg-white placeholder:text-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
                    />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-[9px] font-black text-gray-600 uppercase tracking-widest hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center cursor-pointer" onClick={() => requestSort('destination')}>Dest. <SortIcon column="destination" /></div>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={columnFilters.destination}
                      onChange={(e) => setColumnFilters(prev => ({...prev, destination: e.target.value}))}
                      className="w-full min-w-[80px] text-[9px] px-1.5 py-1 border border-gray-200 rounded font-normal text-gray-700 bg-white placeholder:text-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
                    />
                  </div>
                </th>
                <th 
                  onClick={() => requestSort('total_articles')}
                  className="px-3 py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest text-center cursor-pointer hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex items-center justify-center">Art. <SortIcon column="total_articles" /></div>
                </th>
                <th 
                  onClick={() => requestSort('actual_weight')}
                  className="px-3 py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest text-center cursor-pointer hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex items-center justify-center">Weight <SortIcon column="actual_weight" /></div>
                </th>
                <th 
                   onClick={() => requestSort('article_desc')}
                   className="px-3 py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest cursor-pointer hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex items-center">Content <SortIcon column="article_desc" /></div>
                </th>
                <th 
                   className="px-3 py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest text-right hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex items-center justify-end">Rate</div>
                </th>
                <th 
                  onClick={() => requestSort('freight_amount')}
                  className="px-3 py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest text-right cursor-pointer hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex items-center justify-end">Freight <SortIcon column="freight_amount" /></div>
                </th>
                <th 
                   onClick={() => requestSort('dd_charges')}
                   className="px-3 py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest text-right cursor-pointer hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex items-center justify-end">DD <SortIcon column="dd_charges" /></div>
                </th>
                <th 
                  onClick={() => requestSort('handling_charges')}
                  className="px-3 py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest text-right cursor-pointer hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex items-center justify-end">Handl. <SortIcon column="handling_charges" /></div>
                </th>
                <th 
                   onClick={() => requestSort('stationary_charges')}
                   className="px-3 py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest text-right cursor-pointer hover:bg-gray-100/50 transition-colors"
                >
                   <div className="flex items-center justify-end">St.Ch. <SortIcon column="stationary_charges" /></div>
                </th>
                <th 
                   onClick={() => requestSort('gst_amount')}
                   className="px-3 py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest text-right cursor-pointer hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex items-center justify-end">GST <SortIcon column="gst_amount" /></div>
                </th>
                <th 
                  onClick={() => requestSort('grand_total')}
                  className="px-3 py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest text-right cursor-pointer hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex items-center justify-end">Total <SortIcon column="grand_total" /></div>
                </th>
                <th className="px-3 py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest text-center">Type</th>
                <th className="px-3 py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[11px] font-bold">
              {sortedWaybills.length === 0 ? (
                <tr>
                  <td colSpan="15" className="py-20 text-center text-gray-400 italic">
                    {loading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={32} className="animate-spin text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Analyzing Consignor Data...</span>
                      </div>
                    ) : 'No waybill history found. Select a consignor and search.'}
                  </td>
                </tr>
              ) : sortedWaybills.map((wb, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group border-b border-gray-50">
                  <td className="px-3 py-2 text-gray-500 font-mono tracking-tight whitespace-nowrap">{wb.bill_date}</td>
                  <td className="px-3 py-2 text-blue-600 font-black tracking-tight whitespace-nowrap">{wb.gc_number}</td>
                  <td className="px-3 py-2 text-gray-600 font-bold whitespace-nowrap tracking-tight">{wb.invoice_no || '---'}</td>
                  <td className="px-3 py-2 uppercase text-gray-700 font-black tracking-tight" title={wb.consignee?.name}>{wb.consignee?.name || 'N/A'}</td>
                  <td className="px-3 py-2 uppercase text-gray-500">{wb.destination?.city_name || 'N/A'}</td>
                  <td className="px-3 py-2 text-center text-gray-900">{wb.total_articles}</td>
                  <td className="px-3 py-2 text-center text-gray-600 italic">{wb.actual_weight || 0} Kg</td>
                  <td className="px-3 py-2 text-gray-400 italic text-[10px] max-w-[150px] truncate" title={wb.article_desc}>{wb.article_desc || '---'}</td>
                  <td className="px-3 py-2 text-right text-gray-900 font-bold">
                    ₹{parseFloat(wb.articles?.[0]?.rate || (wb.total_articles > 0 ? (wb.freight_amount / wb.total_articles) : 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600">₹{parseFloat(wb.freight_amount || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-600">₹{parseFloat(wb.dd_charges || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-600">₹{parseFloat(wb.handling_charges || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-600">₹{parseFloat(wb.stationary_charges || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-600">₹{parseFloat(wb.gst_amount || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-900 font-black">₹{parseFloat(wb.grand_total).toLocaleString()}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${wb.account_type?.toLowerCase() === 'account' ? 'bg-purple-100 text-purple-700' :
                        wb.account_type?.toLowerCase() === 'topay' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                      }`}>
                      {wb.account_type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {wb.delivery_proof ? (
                      <a 
                        href={`${STORAGE_URL}/${wb.delivery_proof}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-all text-[8px] font-black uppercase tracking-widest"
                      >
                        <Eye size={10} /> POD
                      </a>
                    ) : (
                      <span className="text-[8px] text-gray-300 font-black uppercase opacity-50 italic">No POD</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Helper component for Searchable Selection
const SearchableSelect = ({ placeholder, options, value, onSelect, searchTerm, setSearchTerm, isOpen, onToggle, disabled }) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef(null);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.id.toString() === value?.toString());

  useEffect(() => {
    if (isOpen) {
      const idx = filteredOptions.findIndex(opt => opt.id.toString() === value?.toString());
      setActiveIndex(idx >= 0 ? idx : 0);
    } else {
      setActiveIndex(-1);
    }
  }, [isOpen, searchTerm]);

  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listRef.current) {
      const activeElement = listRef.current.children[activeIndex];
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [activeIndex, isOpen]);

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        onToggle();
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        setActiveIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
        e.preventDefault();
        break;
      case 'ArrowUp':
        setActiveIndex(prev => Math.max(prev - 1, 0));
        e.preventDefault();
        break;
      case 'PageDown':
        setActiveIndex(prev => Math.min(prev + 10, filteredOptions.length - 1));
        e.preventDefault();
        break;
      case 'PageUp':
        setActiveIndex(prev => Math.max(prev - 10, 0));
        e.preventDefault();
        break;
      case 'Enter':
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          onSelect(filteredOptions[activeIndex].id);
          setSearchTerm('');
        } else {
          onToggle();
        }
        e.preventDefault();
        break;
      case 'Escape':
        onToggle();
        e.preventDefault();
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <div 
        onClick={disabled ? undefined : onToggle}
        tabIndex={disabled ? "-1" : "0"}
        className={`w-full pl-8 pr-2 py-1.5 text-xs font-black border-2 rounded-lg cursor-pointer flex justify-between items-center transition-all outline-none
          ${disabled ? 'bg-gray-100 border-gray-100 cursor-not-allowed opacity-80' : 
            isOpen ? 'bg-white border-blue-500 ring-2 ring-blue-100 shadow-sm' : 'bg-gray-50 border-gray-100'}
          ${!disabled && !isOpen && 'focus:border-blue-500 focus:bg-white'}
          ${!selectedOption && !searchTerm ? 'text-gray-400' : 'text-gray-800'}`}
      >
        <div className="truncate overflow-hidden flex-1">
          {isOpen ? (
            <input
              autoFocus
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full outline-none bg-transparent"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            selectedOption ? selectedOption.label : placeholder
          )}
        </div>
        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={onToggle}></div>
          <div 
            ref={listRef}
            className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onSelect(opt.id);
                    setSearchTerm('');
                  }}
                  className={`px-3 py-2 text-[10px] font-black cursor-pointer transition-colors border-b border-gray-50 flex items-center justify-between
                    ${activeIndex === index ? 'bg-blue-600 text-white' : 
                      (value?.toString() === opt.id.toString() ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50 text-gray-700 hover:text-blue-600')}`}
                >
                  <span className="truncate uppercase tracking-widest">{opt.label}</span>
                  {value?.toString() === opt.id.toString() && (
                    <svg className={`w-3 h-3 ${activeIndex === index ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-400 text-[10px] font-black uppercase tracking-widest italic">
                No consignor found
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ConsignorHistoryReport
