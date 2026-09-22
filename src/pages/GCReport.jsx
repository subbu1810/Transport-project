import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Calendar, Building, Search, FileText, Package, Printer, X, CheckCircle,
  Info, MapPin, Truck, User, DollarSign, Clock, Loader2, RotateCcw, Download, HelpCircle
} from 'lucide-react'
import * as XLSX from 'xlsx'
import GCReportReceipt from '../components/GCReportReceipt'
import { API_BASE_URL, STORAGE_URL } from '../config/api';
import { applyBranchOverrides } from '../utils/branchOverrides';




function GCReport() {
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    branchId: '',
    status: ''
  })
  const [branches, setBranches] = useState([])
  const [waybills, setWaybills] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [transportDetails, setTransportDetails] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    logo_path: '',
    logo: '',
    upi_qr_path: '',
    upi_id: ''
  })
  const [selectedGC, setSelectedGC] = useState(null)
  const [printingWaybill, setPrintingWaybill] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [columnFilters, setColumnFilters] = useState({
    date: '',
    gcNo: '',
    from: '',
    to: '',
    consignor: '',
    consignee: ''
  })
  const [currentUser, setCurrentUser] = useState(null)
  const [printOnlyContent, setPrintOnlyContent] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [printMode, setPrintMode] = useState('full')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [pageInput, setPageInput] = useState('1')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setCurrentUser(user)

      // If admin, pre-set the branch filter and lock it
      if (user.role !== 'superadmin' && user.branch_id) {
        setFilters(prev => ({
          ...prev,
          branchId: user.branch_id,
          fromDate: new Date().toISOString().split('T')[0],
          toDate: new Date().toISOString().split('T')[0]
        }))
      } else {
        const today = new Date().toISOString().split('T')[0]
        setFilters(prev => ({ ...prev, fromDate: today, toDate: today }))
      }
      fetchBranches()
      fetchTransportDetails(user) // Correctly pass user from within scope
    }
  }, [])

  const fetchTransportDetails = async (userData) => {
    try {
      // ── PRIORITY 1: Use transport data from the logged-in user (localStorage) ──
      // This is the most reliable and up-to-date source.
      if (userData?.transport_name) {
        setTransportDetails(applyBranchOverrides(userData, {
          name: userData.transport_name || userData.branch?.branch_name || '',
          address: userData.transport_address || userData.branch?.branch_address || '',
          phone: userData.transport_phone || userData.branch?.branch_phone || '',
          email: userData.email || '',
          gstin: userData.gst_number || '',
          logo_path: userData.transport_logo_url || null,
          upi_qr_path: userData.upi_qr_url || null,
          upi_id: null
        }))
      }

      // ── PRIORITY 2: Fetch UPI / QR details from settings (these are not in user data) ──
      // Also fetch transport name/address from settings only if user data didn't have it.
      const settingsRes = await fetch(`${API_BASE_URL}/settings/all`).then(res => res.json()).catch(() => ({ data: {} }));
      const settings = settingsRes.data || {};

      setTransportDetails(prev => {
        const logoPath = prev.logo_path || settings.logo_path || null;
        let logoUrl = null;
        if (logoPath) {
          logoUrl = logoPath.startsWith('http') ? logoPath : `${STORAGE_URL}/${logoPath.replace(/^\/+/, '')}`;
        }

        return applyBranchOverrides(userData || JSON.parse(localStorage.getItem('user') || '{}'), {
          ...prev,
          // Priotitize settings data if available to ensure correct branding
          name: settings.company_name || prev.name || '',
          address: settings.address || prev.address || '',
          phone: settings.phone || prev.phone || '',
          email: settings.email || prev.email || '',
          // Logo path and UPI details come from settings table
          logo_path: logoPath,
          logo: logoUrl,
          upi_account_holder: settings.upi_account_holder,
          upi_qr_path: prev?.upi_qr_path || settings.upi_qr_path,
          gstin: userData.transport_gstin || userData.gstin || userData.gst_number || settings.gst_number || settings.gstin || prev?.gstin || ''
        });
      });
    } catch (err) {
      console.error('Error fetching transport details:', err)
      // Final fallback: use whatever user data we have
      if (userData?.transport_name) {
        const logoUrl = userData.transport_logo_url
          ? (userData.transport_logo_url.startsWith('http') ? userData.transport_logo_url : `${STORAGE_URL}/${userData.transport_logo_url.replace(/^\/+/, '')}`)
          : null;

        setTransportDetails(applyBranchOverrides(userData, {
          name: userData.transport_name || userData.branch?.branch_name || '',
          address: userData.transport_address || '',
          phone: userData.transport_phone || '',
          logo_path: userData.transport_logo_url || null,
          logo: logoUrl,
          upi_qr_path: userData.upi_qr_url || null,
          upi_id: null,
        }))
      }
    }
  }

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/branches`)
      if (response.data.success) {
        setBranches(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching branches:', err)
    }
  }


  const fetchWaybills = async () => {
    try {
      setLoading(true)
      setError('')

      const params = { full_data: '1' }
      if (filters.fromDate) params.from_date = filters.fromDate
      if (filters.toDate) params.to_date = filters.toDate
      if (filters.branchId) params.branch_id = filters.branchId
      if (filters.status) params.status = filters.status

      const response = await axios.get(`${API_BASE_URL}/waybills`, { params })

      if (response.data.success) {
        const enrichedWaybills = response.data.data.map(wb => {
          // Calculate totals from articles if not present at root
          const actualWt = wb.actual_weight || wb.articles?.reduce((sum, art) => sum + parseFloat(art.actual_weight || 0), 0) || 0;
          const chargedWt = wb.charged_weight || wb.articles?.reduce((sum, art) => sum + parseFloat(art.charged_weight || 0), 0) || 0;
          const totArticles = wb.total_articles || wb.articles?.reduce((sum, art) => sum + (parseInt(art.no_of_articles) || 0), 0) || 0;

          return {
            ...wb,
            actual_weight: parseFloat(actualWt).toFixed(2),
            charged_weight: parseFloat(chargedWt).toFixed(2),
            total_articles: totArticles
          };
        });

        setWaybills(enrichedWaybills)
        if (enrichedWaybills.length === 0) {
          setError('No records found for the selected filters')
        }
      }
    } catch (err) {
      setError('Error fetching waybill records')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    if (waybills.length === 0) return

    const dataToExport = waybills.map((wb, index) => ({
      'SL No': index + 1,
      'Date': wb.bill_date ? new Date(wb.bill_date).toLocaleDateString('en-IN') : '-',
      'GC Number': wb.gc_number || '-',
      'Origin Branch': wb.origin_branch?.branch_name || '-',
      'Destination City': wb.destination?.city_name || '-',
      'Consignor Name': wb.consignor?.name || '-',
      'Consignor Phone': wb.consignor?.mobile_no || wb.consignor?.mobile_number || wb.consignor?.phone || '-',
      'Consignee Name': wb.consignee?.name || '-',
      'Consignee Phone': wb.consignee?.mobile_number || wb.consignee?.mobile_no || wb.consignee?.phone || '-',
      'Total Articles': wb.total_articles || 0,
      'Actual Weight (Kg)': wb.actual_weight || 0,
      'Charged Weight (Kg)': wb.charged_weight || 0,
      'Article Description': wb.article_desc || '-',
      'Invoice No': wb.invoice_no || '-',
      'Invoice Amount': parseFloat(wb.invoice_amount || 0).toFixed(2),
      'E-Way Bill No': wb.eway_bill_no || '-',
      'Value on Goods': parseFloat(wb.value_on_goods || 0).toFixed(2),
      'Tax Payable By': wb.tax_payable_by || '-',
      'Payment Mode': wb.account_type || '-',
      'Freight Amount': parseFloat(wb.freight_amount || 0).toFixed(2),
      'DD Charges': parseFloat(wb.dd_charges || 0).toFixed(2),
      'Handling Charges': parseFloat(wb.handling_charges || 0).toFixed(2),
      'Stationary Charges': parseFloat(wb.stationary_charges || 0).toFixed(2),
      'Other Charges': parseFloat(wb.other_charges || 0).toFixed(2),
      'Sub Total': parseFloat(wb.total_amount || 0).toFixed(2),
      'GST Percent': wb.gst_percent ? `${wb.gst_percent}%` : '0%',
      'GST Amount': parseFloat(wb.gst_amount || 0).toFixed(2),
      'Grand Total': parseFloat(wb.grand_total || 0).toFixed(2),
      'Status': wb.status || '-'
    }));

    const wbExcel = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Auto-adjust column widths based on headers
    const colWidths = Object.keys(dataToExport[0]).map(key => ({
      wch: Math.max(key.length + 2, 12) // Give some breathing room
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wbExcel, ws, "GC Report");
    XLSX.writeFile(wbExcel, `GC_Report_${filters.fromDate || 'all'}_to_${filters.toDate || 'all'}.xlsx`);
  }

  const handlePrint = () => {
    setPrintingWaybill(null) // Ensure report print mode
    setTimeout(() => window.print(), 100)
  }

  const handlePrintGC = (waybill, mode = 'full') => {
    setPrintingWaybill(waybill)
    setPrintMode(mode)
    setPrintOnlyContent(mode === 'content')
    setShowPrintPreview(true)
  }

  const executePrint = () => {
    const mode = printMode;
    const waybill = printingWaybill;
    
    // Select the printable area from the preview modal to check images
    const printableArea = document.getElementById('printable-receipt');
    if (!printableArea) return;

    const images = printableArea.querySelectorAll('img');
    const promises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        const timer = setTimeout(() => {
          // Fallback for slow images
          resolve();
        }, 1000); 
        img.onload = () => { clearTimeout(timer); resolve(); };
        img.onerror = () => { clearTimeout(timer); resolve(); };
      });
    });

    Promise.all(promises).then(() => {
      setTimeout(() => {
        const originalTitle = document.title;
        if (waybill?.gc_number) document.title = `GC-${waybill.gc_number}`;

        document.body.classList.add('is-printing-receipt');
        if (mode === 'content') document.body.classList.add('is-content-only');

        const cleanup = () => {
          document.title = originalTitle;
          document.body.classList.remove('is-printing-receipt');
          document.body.classList.remove('is-content-only');
          window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        window.print();
      }, 100);
    });
  }

  const getInitials = (name) => {
    if (!name) return 'GP'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN')
  }

  const GCDetailsModal = () => {
    if (!selectedGC) return null;

    const InfoRow = ({ label, value, highlight = false }) => (
      <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{label}</span>
        <span className={`text-[11px] font-bold ${highlight ? 'text-blue-600' : 'text-gray-700'}`}>{value || '-'}</span>
      </div>
    );

    return (
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden pointer-events-auto">
        <div className="relative bg-white w-full max-w-7xl h-[90vh] flex flex-col rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.3)] border border-white/20 animate-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Package size={20} />
              </div>
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">
                GC Details: <span className="text-blue-600">{selectedGC.gc_number}</span>
              </h2>
            </div>
            <button
              onClick={() => setSelectedGC(null)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Basic Details */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">Basic Information</h3>
                <div className="space-y-1">
                  <InfoRow label="GC Date" value={formatDate(selectedGC?.bill_date)} />
                  <InfoRow label="Origin" value={selectedGC?.origin_branch?.branch_name || 'N/A'} />
                  <InfoRow label="Destination" value={selectedGC?.destination?.city_name || 'N/A'} />
                  <InfoRow label="Status" value={selectedGC?.status || 'PENDING'} highlight={true} />
                  <InfoRow label="Type" value={selectedGC?.account_type || '-'} />
                  <InfoRow label="Invoice No" value={selectedGC?.invoice_no || '-'} />
                </div>
              </div>

              {/* Stakeholders */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">Parties</h3>
                <div className="space-y-4">
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                    <p className="text-[9px] font-black text-blue-500 uppercase mb-1">Consignor (Sender)</p>
                    <p className="text-[11px] font-black text-gray-800">{selectedGC?.consignor?.name || '-'}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">📞 {selectedGC?.consignor?.mobile_no || selectedGC?.consignor?.mobile_number || selectedGC?.consignor?.phone || '-'}</p>
                    <p className="text-[10px] text-gray-500 mt-1 truncate">{selectedGC?.consignor?.address || '-'}</p>
                  </div>
                  <div className="bg-green-50/50 p-3 rounded-lg border border-green-100/50">
                    <p className="text-[9px] font-black text-green-600 uppercase mb-1">Consignee (Receiver)</p>
                    <p className="text-[11px] font-black text-gray-800">{selectedGC?.consignee?.name || '-'}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">📞 {selectedGC?.consignee?.mobile_number || selectedGC?.consignee?.mobile_no || selectedGC?.consignee?.phone || '-'}</p>
                    <p className="text-[10px] text-gray-500 mt-1 truncate">{selectedGC?.consignee?.address || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">Billing Summary</h3>
                <div className="space-y-1">
                  <InfoRow label="Freight" value={`₹${selectedGC?.freight_amount || 0}`} />
                  <InfoRow label="ST Charges" value={`₹${selectedGC?.stationary_charges || 0}`} />
                  <InfoRow label="Total Amount" value={`₹${selectedGC?.total_amount || 0}`} />
                  <InfoRow label="GST Amount" value={`₹${selectedGC?.gst_amount || 0}`} />
                  <div className="flex justify-between py-2 border-t mt-2 border-dashed">
                    <span className="text-[11px] font-black text-gray-900 uppercase">Grand Total</span>
                    <span className="text-sm font-black text-blue-700">₹{parseFloat(selectedGC?.grand_total || 0).toLocaleString()}</span>
                  </div>
                  <InfoRow label="Paid" value={`₹${selectedGC?.amount_paid || 0}`} />
                  <InfoRow label="Discount" value={`₹${selectedGC?.discount || 0}`} />
                </div>
              </div>
            </div>

            {/* Articles Table */}
            <div className="mt-8">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1 mb-3">Itemized Details</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead className="bg-gray-50 text-gray-500 font-black uppercase tracking-widest border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">Description</th>
                      <th className="px-4 py-2 text-center">Qty</th>
                      <th className="px-4 py-2 text-right">Actual Wt</th>
                      <th className="px-4 py-2 text-right">Charged Wt</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-700 font-bold">
                    {selectedGC.articles?.map((art, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2">{art.article_type || 'Standard'}</td>
                        <td className="px-4 py-2 text-center">{art.no_of_articles}</td>
                        <td className="px-4 py-2 text-right">{art.actual_weight} k</td>
                        <td className="px-4 py-2 text-right">{art.charged_weight} k</td>
                        <td className="px-4 py-2 text-right font-black">₹{parseFloat(art.amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50/80 font-black border-t-2 border-gray-200">
                    <tr>
                      <td className="px-4 py-3 uppercase text-[10px] text-gray-500 font-black">Totals</td>
                      <td className="px-4 py-3 text-center text-gray-900">{selectedGC.total_articles}</td>
                      <td className="px-4 py-3 text-right text-blue-700">
                        {(selectedGC.articles?.reduce((sum, art) => sum + parseFloat(art.actual_weight || 0), 0) || 0).toFixed(2)} k
                      </td>
                      <td className="px-4 py-3 text-right text-blue-700">
                        {(selectedGC.articles?.reduce((sum, art) => sum + parseFloat(art.charged_weight || 0), 0) || 0).toFixed(2)} k
                      </td>
                      <td className="px-4 py-3 text-right text-blue-800 font-black text-xs">₹{parseFloat(selectedGC.total_amount || 0).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Inward/Delivery Track */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">Inward Tracking</h3>
                {selectedGC?.inward_at ? (
                  <div className="text-[10px] font-bold text-gray-600">
                    <p>Received at {selectedGC?.inward_branch?.branch_name || 'Branch'} on {new Date(selectedGC.inward_at).toLocaleString()}</p>
                    <p className="mt-1">Handled by: {selectedGC?.inward_by?.name || 'Authorized Staff'}</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-300 italic uppercase">Pending Inward</p>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">Delivery Status</h3>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{selectedGC?.deliver_status || 'NOT DELIVERED'}</p>
                {selectedGC?.delivered_at && (
                  <div className="text-[10px] font-bold text-gray-600 mt-1">
                    <p>Branch: {selectedGC?.delivered_branch_name || '-'}</p>
                    <p>Receiver: {selectedGC?.receiver_name || '-'}</p>
                    <p>Date: {new Date(selectedGC?.delivered_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Audit History Timeline */}
            <div className="mt-8 border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <RotateCcw size={16} className="text-rose-500" />
                <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest leading-none">Complete Audit History</h3>
              </div>

              {selectedGC.audit_logs && selectedGC.audit_logs.length > 0 ? (
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-[11px] before:w-0.5 before:bg-slate-100 before:z-0">
                  {selectedGC.audit_logs.map((log, idx) => (
                    <div key={idx} className="relative z-10 flex gap-4 pl-0.5">
                      <div className={`w-5 h-5 rounded-full flex-shrink-0 border-4 border-white shadow-sm flex items-center justify-center ${log.action === 'CREATE' ? 'bg-green-500' : 'bg-rose-500'}`}>
                        {log.action === 'CREATE' ? <CheckCircle size={8} className="text-white" /> : <RotateCcw size={8} className="text-white" />}
                      </div>
                      <div className="flex-1 bg-gray-50/50 rounded-xl p-3 border border-gray-100 group hover:border-blue-200 transition-all">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-black text-gray-800 uppercase leading-none tracking-tight">
                            {log.action === 'CREATE' ? 'INITIAL ENTRY' : 'MODIFICATION AUTHORIZED'}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">
                            {new Date(log.created_at).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-gray-600 mb-1 leading-tight">
                          By: <span className="text-blue-600 uppercase">{log.user?.name || 'Authorized Staff'}</span>
                        </p>
                        <div className="bg-white/80 p-2 rounded-lg border border-gray-100 shadow-sm">
                          <p className="text-[10.5px] font-bold text-gray-700 italic">
                            "{log.remarks || (log.action === 'CREATE' ? 'Original booking record created' : 'No dynamic reason provided')}"
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-bold italic uppercase tracking-tighter">No historical audit data available for this record</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
            <div className="flex gap-3">
              <button
                onClick={() => handlePrintGC(selectedGC, 'full')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                <Printer size={16} /> Full Print
              </button>
              <button
                onClick={() => handlePrintGC(selectedGC, 'content')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                <FileText size={16} /> Content Only
              </button>
            </div>
            <button
              onClick={() => setSelectedGC(null)}
              className="px-6 py-2 bg-gray-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-md active:scale-95"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  const HelpModal = () => {
    if (!showHelp) return null;

    return (
      <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden pointer-events-auto">
        <div className="relative bg-white w-full max-w-2xl flex flex-col rounded-2xl shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
          <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-2">
              <HelpCircle className="text-orange-600" size={20} />
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">
                GC Report - Help Guide
              </h2>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="p-1 hover:bg-orange-200 rounded-full transition-colors text-orange-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
            <section>
              <h4 className="text-xs font-black text-orange-600 uppercase mb-2 tracking-tighter uppercase">📌 Functionality</h4>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                The GC Report page allows you to view, analyze, and extract Goods Consignment data. It serves as your primary audit and summary tool for all bookings made across branches.
              </p>
            </section>

            <section>
              <h4 className="text-xs font-black text-orange-600 uppercase mb-2 tracking-tighter uppercase">🔍 Filters</h4>
              <ul className="space-y-2 text-sm text-gray-600 font-medium">
                <li className="flex gap-2">
                  <span className="text-orange-600">•</span>
                  <span><strong className="text-gray-800">Date Range:</strong> Narrow down records by selecting start and end dates.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-orange-600">•</span>
                  <span><strong className="text-gray-800">Branch Selector:</strong> (Superadmin) View reports for specific branches or consolidated across all branches.</span>
                </li>
              </ul>
            </section>

            <section>
              <h4 className="text-xs font-black text-orange-600 uppercase mb-2 tracking-tighter uppercase">⚡ Quick Actions</h4>
              <ul className="space-y-2 text-sm text-gray-600 font-medium">
                <li className="flex gap-2">
                  <span className="text-orange-600">•</span>
                  <span><strong className="text-gray-800">Get Details:</strong> Refresh the data based on your filters.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-orange-600">•</span>
                  <span><strong className="text-gray-800">Export Excel:</strong> Downloads the current report in CSV format for use in Microsoft Excel.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-orange-600">•</span>
                  <span><strong className="text-gray-800">Print Report:</strong> Generates a clean, professional PDF-ready layout of the entire list.</span>
                </li>
              </ul>
            </section>

            <section>
              <h4 className="text-xs font-black text-orange-600 uppercase mb-2 tracking-tighter uppercase">💡 Navigation Tips</h4>
              <ul className="space-y-2 text-sm text-gray-600 font-medium">
                <li className="flex gap-2 text-blue-700 bg-blue-50 p-2 rounded border border-blue-100 italic">
                  <span>✨ <strong className="uppercase tracking-tighter">Pro Tip:</strong> Double-click any row in the table to open the full detailed view of that waybill.</span>
                </li>
              </ul>
            </section>
          </div>

          <div className="p-4 bg-gray-50 border-t flex justify-end rounded-b-2xl">
            <button
              onClick={() => setShowHelp(false)}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    );
  };

  const filteredWaybills = waybills.filter(wb => {
    // Global search
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchesGlobal = (wb.gc_number || '').toLowerCase().includes(s) || 
                            (wb.consignor?.name || '').toLowerCase().includes(s) || 
                            (wb.consignee?.name || '').toLowerCase().includes(s);
      if (!matchesGlobal) return false;
    }
    
    // Column specific filters
    if (columnFilters.date && !formatDate(wb.bill_date).toLowerCase().includes(columnFilters.date.toLowerCase())) return false;
    if (columnFilters.gcNo && !(wb.gc_number || '').toLowerCase().includes(columnFilters.gcNo.toLowerCase())) return false;
    if (columnFilters.from && !(wb.origin_branch?.branch_name || '').toLowerCase().includes(columnFilters.from.toLowerCase())) return false;
    if (columnFilters.to && !(wb.destination?.city_name || '').toLowerCase().includes(columnFilters.to.toLowerCase())) return false;
    if (columnFilters.consignor && !(wb.consignor?.name || '').toLowerCase().includes(columnFilters.consignor.toLowerCase())) return false;
    if (columnFilters.consignee && !(wb.consignee?.name || '').toLowerCase().includes(columnFilters.consignee.toLowerCase())) return false;

    return true;
  });

  // Pagination Logic
  const totalItems = filteredWaybills.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
      setPageInput((totalPages || 1).toString());
    }
  }, [totalPages, currentPage]);

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      const page = parseInt(pageInput, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      } else {
        setPageInput(currentPage.toString());
      }
    }
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    setPageInput(page.toString());
  };

  const paginatedWaybills = filteredWaybills.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className={`p-2 space-y-3 ${printingWaybill ? 'is-printing-receipt' : ''}`}>
      <div className="gc-report-main-content">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-md">
            <FileText className="text-blue-600" size={16} />
          </div>
          <h1 className="text-lg font-bold text-gray-800 tracking-tight">GC Report</h1>
        </div>


      </div>

      {/* Print Header - Optimized for ~1 inch space */}
      <div className="hidden print:block text-center mb-1 select-none">
        <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-1 px-2">
          {transportDetails.logo && (
            <img src={transportDetails.logo} alt="Logo" className="h-10 w-auto object-contain" />
          )}
          <div className="flex-1 text-center px-4">
            <h1 className="text-xl font-black uppercase tracking-tight text-gray-900 leading-none mb-0.5">
              {transportDetails.name}
            </h1>
            <p className="text-[9px] font-bold text-gray-700 leading-tight">
              {transportDetails.address}
              {transportDetails.phone && ` | Contact: ${transportDetails.phone}`}
              {transportDetails.gstin && ` | GST: ${transportDetails.gstin}`}
              {transportDetails.email && ` | Email: ${transportDetails.email}`}
            </p>
          </div>
          <div className="w-24 text-right">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Audit Document</p>
          </div>
        </div>

        <div className="flex justify-between items-baseline px-2">
          <div className="text-left">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-normal underline">GOODS CONSIGNMENT REPORT</h2>
          </div>
          <div className="text-right text-[9px] font-bold text-gray-900 flex gap-4">
            <p><span>PERIOD:</span> <span className="font-black underline ml-1">{formatDate(filters.fromDate)} TO {formatDate(filters.toDate)}</span></p>
            <p><span>BRANCH:</span> <span className="font-black text-blue-800 uppercase ml-1">
              {filters.branchId ? (branches.find(b => b.id.toString() === filters.branchId.toString())?.branch_name || currentUser?.branch_name || 'Selected Branch') : (currentUser?.branch_name || 'All Branches')}
            </span></p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
        {/* Filter Section */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 p-2.5 px-3 rounded-xl border border-green-200 print:hidden shadow-sm">
          <h3 className="font-bold text-gray-800 mb-1.5 flex items-center gap-2 text-xs uppercase tracking-wider">
            <Search size={14} className="text-green-600" />
            Search WayBill Details
          </h3>
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="w-1/4 min-w-[140px]">
              <label className="block text-[10px] font-bold text-gray-600 mb-0.5 flex items-center gap-1 uppercase">
                <Calendar size={10} />
                From Date
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-200 outline-none transition-all font-medium h-8"
              />
            </div>
            <div className="w-1/4 min-w-[140px]">
              <label className="block text-[10px] font-bold text-gray-600 mb-0.5 flex items-center gap-1 uppercase">
                <Calendar size={10} />
                To Date
              </label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-200 outline-none transition-all font-medium h-8"
              />
            </div>
            {currentUser?.role === 'superadmin' ? (
              <div className="w-1/4 min-w-[140px]">
                <label className="block text-[10px] font-bold text-gray-600 mb-0.5 flex items-center gap-1 uppercase">
                  <Building size={10} />
                  Branch
                </label>
                <select
                  value={filters.branchId}
                  onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-200 outline-none transition-all font-medium h-8"
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="w-1/4 min-w-[140px]">
                <label className="block text-[10px] font-bold text-gray-600 mb-0.5 flex items-center gap-1 uppercase">
                  <Building size={10} />
                  Current Branch
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentUser?.branch_name || 'Own Branch'}
                  className="w-full px-2 py-1 text-xs border border-gray-100 bg-gray-50 rounded text-gray-500 font-bold outline-none cursor-not-allowed h-8"
                />
              </div>
            )}
            <div className="w-1/4 min-w-[140px]">
              <label className="block text-[10px] font-bold text-gray-600 mb-0.5 flex items-center gap-1 uppercase">
                <Clock size={10} />
                GC Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-200 outline-none transition-all font-medium h-8"
              >
                <option value="">All Statuses</option>
                <option value="Booked">Booked</option>
                <option value="PENDING">Pending</option>
                <option value="RECEIVED">Received</option>
                <option value="INWARDED">Inwarded</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <button
                onClick={fetchWaybills}
                disabled={loading}
                className="w-full px-4 py-1 h-8 text-xs bg-gradient-to-r from-green-600 to-green-700 text-white rounded hover:from-green-700 hover:to-green-800 transition-all font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    Get Details
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-3 rounded-xl border border-yellow-200 print:p-0 print:bg-transparent print:border-none">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <div className="flex flex-col">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Package size={20} className="text-orange-600" />
                WayBill Details View
                <button
                  onClick={() => setShowHelp(true)}
                  className="p-1 hover:bg-orange-100 rounded-full text-orange-600 transition-colors"
                  title="Page Information"
                >
                  <HelpCircle size={16} />
                </button>
              </h3>
              <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mt-0.5 ml-7">💡 Tip: Double click on any row to view full GC details</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white rounded-full text-sm font-bold text-gray-600 border border-gray-200">
                Total: {totalItems} records
              </span>
              
              {/* NEW: Quick Search Bar */}
              <div className="relative ml-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-orange-400" size={14} />
                <input 
                  type="text"
                  placeholder="Quick Search GC / Party..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-white border border-yellow-200 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500 font-bold text-gray-700 text-xs w-48 shadow-inner transition-all"
                />
              </div>

              {waybills.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition shadow-lg text-xs"
                    title="Export all data to Excel (CSV)"
                  >
                    <Download size={16} /> Export Excel
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition shadow-lg text-xs"
                  >
                    <Printer size={16} /> Print Report
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium text-xs">
              {error}
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-yellow-200">
            <table className="w-full text-sm bg-white">
              <thead className="bg-yellow-100 border-b-2 border-yellow-300">
                <tr className="text-[10px] uppercase tracking-wider">
                  <th className="px-2 py-2 text-center font-black text-gray-700">SL</th>
                  <th className="px-2 py-2 text-left font-black text-gray-700">
                    <div>Date</div>
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      className="mt-1 w-full text-[9px] px-1 py-0.5 border border-yellow-200 rounded font-normal text-gray-600 outline-none focus:border-yellow-400"
                      value={columnFilters.date}
                      onChange={e => setColumnFilters(p => ({...p, date: e.target.value}))}
                    />
                  </th>
                  <th className="px-2 py-2 text-left font-black text-gray-700">
                    <div>GC No</div>
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      className="mt-1 w-full text-[9px] px-1 py-0.5 border border-yellow-200 rounded font-normal text-gray-600 outline-none focus:border-yellow-400"
                      value={columnFilters.gcNo}
                      onChange={e => setColumnFilters(p => ({...p, gcNo: e.target.value}))}
                    />
                  </th>
                  <th className="px-2 py-2 text-left font-black text-gray-700">
                    <div>From</div>
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      className="mt-1 w-full text-[9px] px-1 py-0.5 border border-yellow-200 rounded font-normal text-gray-600 outline-none focus:border-yellow-400"
                      value={columnFilters.from}
                      onChange={e => setColumnFilters(p => ({...p, from: e.target.value}))}
                    />
                  </th>
                  <th className="px-2 py-2 text-left font-black text-gray-700">
                    <div>To</div>
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      className="mt-1 w-full text-[9px] px-1 py-0.5 border border-yellow-200 rounded font-normal text-gray-600 outline-none focus:border-yellow-400"
                      value={columnFilters.to}
                      onChange={e => setColumnFilters(p => ({...p, to: e.target.value}))}
                    />
                  </th>
                  <th className="px-2 py-2 text-left font-black text-gray-700">
                    <div>Consignor</div>
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      className="mt-1 w-full text-[9px] px-1 py-0.5 border border-yellow-200 rounded font-normal text-gray-600 outline-none focus:border-yellow-400"
                      value={columnFilters.consignor}
                      onChange={e => setColumnFilters(p => ({...p, consignor: e.target.value}))}
                    />
                  </th>
                  <th className="px-2 py-2 text-left font-black text-gray-700">
                    <div>Consignee</div>
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      className="mt-1 w-full text-[9px] px-1 py-0.5 border border-yellow-200 rounded font-normal text-gray-600 outline-none focus:border-yellow-400"
                      value={columnFilters.consignee}
                      onChange={e => setColumnFilters(p => ({...p, consignee: e.target.value}))}
                    />
                  </th>
                  <th className="px-2 py-2 text-center font-black text-gray-700 align-top">Items</th>
                  <th className="px-2 py-2 text-center font-black text-gray-700 align-top">Act Wt</th>
                  <th className="px-2 py-2 text-center font-black text-gray-700 align-top">Chg Wt</th>
                  <th className="px-2 py-2 text-left font-black text-gray-700 align-top">Freight Type</th>
                  <th className="px-2 py-2 text-right font-black text-gray-700 align-top">Amount</th>
                  <th className="px-2 py-2 text-center font-black text-gray-700 align-top">Status</th>
                  <th className="px-2 py-2 text-center font-black text-gray-700 print:hidden align-top">Audit Info</th>
                  <th className="px-2 py-2 text-center font-black text-gray-700 print:hidden align-top">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedWaybills.length === 0 ? (
                  <tr>
                    <td colSpan="15" className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <FileText size={48} className="text-gray-300" />
                        <p className="font-medium text-sm">No matching records found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedWaybills.map((waybill, index) => (
                    <tr
                      key={waybill.id || waybill.gc_number}
                      onDoubleClick={() => setSelectedGC(waybill)}
                      className="hover:bg-yellow-50 transition-colors border-b border-gray-100 text-[11px] font-medium cursor-pointer"
                    >
                      <td className="px-2 py-1.5 text-center font-bold text-gray-500">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">{formatDate(waybill.bill_date)}</td>
                      <td className="px-2 py-1.5 font-bold text-blue-800">{waybill.gc_number}</td>
                      <td className="px-2 py-1.5 truncate max-w-[100px]">{waybill.origin_branch?.branch_name || '-'}</td>
                      <td className="px-2 py-1.5 truncate max-w-[100px]">{waybill.destination?.city_name || '-'}</td>
                      <td className="px-2 py-1.5 truncate max-w-[120px]">{waybill.consignor?.name || '-'}</td>
                      <td className="px-2 py-1.5 truncate max-w-[120px]">{waybill.consignee?.name || '-'}</td>
                      <td className="px-2 py-1.5 text-center font-bold">{waybill.total_articles}</td>
                      <td className="px-2 py-1.5 text-center font-bold text-blue-700">{waybill.actual_weight || 0}</td>
                      <td className="px-2 py-1.5 text-center font-bold text-blue-700">{waybill.charged_weight || 0}</td>
                      <td className="px-2 py-1.5 uppercase text-[9px] font-black">{waybill.account_type || '-'}</td>
                      <td className="px-2 py-1.5 text-right font-bold text-green-700">
                        ₹{parseFloat(waybill.grand_total).toFixed(2)}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-sm ${waybill.status === 'Delivered' || waybill.status === 'DELIVERED' ? 'bg-green-600 text-white' :
                          ['IN_TRANSIT', 'DISPATCHED', 'In Transit'].includes(waybill.status) ? 'bg-blue-600 text-white' :
                            ['RECEIVED', 'INWARDED', 'Inwarded'].includes(waybill.status) ? 'bg-orange-500 text-white' :
                              'bg-amber-500 text-white'
                          }`}>
                          {waybill.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-center print:hidden">
                        {(() => {
                          const paymentFields = [
                            'freight_amount', 'dd_charges', 'handling_charges',
                            'stationary_charges', 'total_amount', 'gst_amount',
                            'grand_total', 'account_type', 'discount'
                          ];

                          const updateLog = waybill.audit_logs?.find(log => {
                            if (log.action !== 'UPDATE') return false;

                            // Check if any payment-related field was actually changed
                            const oldVals = log.old_values || {};
                            const newVals = log.new_values || {};

                            return paymentFields.some(field => {
                              const oldVal = parseFloat(oldVals[field] || 0);
                              const newVal = parseFloat(newVals[field] || 0);

                              if (field === 'account_type') {
                                return oldVals[field] !== newVals[field];
                              }
                              return Math.abs(oldVal - newVal) > 0.01;
                            });
                          });

                          if (!updateLog) return <span className="text-slate-300 italic">-</span>;

                          return (
                            <div className="flex flex-col gap-0.5 max-w-[150px]">
                              <p className="font-black text-rose-600 truncate leading-none mb-0.5 uppercase">
                                MOD BY: {updateLog.user?.name || 'Authorized Staff'}
                              </p>
                              <p className="text-gray-700 font-bold italic text-[8.5px] leading-[1.2] mb-1">
                                "{updateLog.remarks || 'Reason not specified'}"
                              </p>
                              <p className="text-slate-400 font-black text-[7.5px] uppercase tracking-tighter opacity-80">
                                {new Date(updateLog.created_at).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </p>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-2 py-1.5 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePrintGC(waybill, 'full'); }}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            title="Full Print (with header/footer)"
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePrintGC(waybill, 'content'); }}
                            className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-600 hover:text-white transition-all shadow-sm"
                            title="Content Only (pre-printed paper)"
                          >
                            <FileText size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {waybills.length > 0 && (
                <tfoot className="bg-yellow-100 border-t-2 border-yellow-300 font-black text-[11px] text-gray-800">
                  <tr>
                    <td colSpan="2" className="px-2 py-2 text-right uppercase tracking-wider">Total GC: {waybills.length}</td>
                    <td colSpan="5" className="px-2 py-2 text-right uppercase tracking-wider">Grand Total:</td>
                    <td className="px-2 py-2 text-center text-blue-800">
                      {waybills.reduce((sum, wb) => sum + (parseInt(wb.total_articles) || 0), 0)}
                    </td>
                    <td className="px-2 py-2 text-center text-blue-800">
                      {waybills.reduce((sum, wb) => sum + (parseFloat(wb.actual_weight) || 0), 0).toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-center text-blue-800">
                      {waybills.reduce((sum, wb) => sum + (parseFloat(wb.charged_weight) || 0), 0).toFixed(2)}
                    </td>
                    <td colSpan="1" className="px-2 py-2 text-right uppercase tracking-wider"></td>
                    <td className="px-2 py-2 text-right text-green-700">
                      ₹{waybills.reduce((sum, wb) => sum + (parseFloat(wb.grand_total) || 0), 0).toFixed(2)}
                    </td>
                    <td colSpan="3" className="px-2 py-2 print:hidden"></td>
                    <td colSpan="1" className="px-2 py-2 hidden print:table-cell"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div className="flex flex-wrap items-center justify-between mt-4 px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg print:hidden text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    goToPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded bg-white outline-none focus:border-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <div className="flex items-center gap-1 border-l pl-2 border-gray-300">
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="First Page"
                  >
                    <span className="font-bold">|&lt;</span>
                  </button>
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous Page"
                  >
                    <span className="font-bold">&lt;</span>
                  </button>
                  <div className="flex items-center gap-1 px-2">
                    <span>Page</span>
                    <input
                      type="text"
                      value={pageInput}
                      onChange={handlePageInputChange}
                      onKeyDown={handlePageInputKeyDown}
                      onBlur={() => setPageInput(currentPage.toString())}
                      className="w-12 px-1 py-0.5 text-center border border-gray-300 rounded outline-none focus:border-blue-500"
                    />
                    <span>of {totalPages}</span>
                  </div>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next Page"
                  >
                    <span className="font-bold">&gt;</span>
                  </button>
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Last Page"
                  >
                    <span className="font-bold">&gt;|</span>
                  </button>
                </div>
                <button
                  onClick={fetchWaybills}
                  className="p-1 ml-2 rounded hover:bg-gray-200 text-blue-600"
                  title="Refresh Data"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <div className="font-medium">
                Displaying {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
              </div>
            </div>
          )}
        </div>
      </div>

      <GCDetailsModal />
      <HelpModal />

      </div> {/* End of gc-report-main-content */}

      {showPrintPreview && printingWaybill && (
        <div className="gc-receipt-print-block fixed inset-0 z-[10000] flex flex-col bg-white animate-in fade-in zoom-in duration-300">
          {/* Modal Header */}
          <div className="p-4 border-b flex justify-between items-center bg-gray-50 no-print">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <Printer size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-800 leading-none uppercase tracking-tight">GC Print Preview</h2>
                <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-widest">
                  {printingWaybill.gc_number} — {printMode === 'content' ? 'CONTENT ONLY' : 'FULL RECEIPT'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                setShowPrintPreview(false)
                setPrintingWaybill(null)
              }} 
              className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-all text-gray-500 group"
            >
              <X size={28} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          {/* Receipt Preview - Scrollable area */}
          <div className="flex-1 overflow-auto bg-gray-200/50 p-4 md:p-8 flex justify-center" id="printable-receipt">
            <div className="bg-white shadow-2xl p-[5mm] md:p-[10mm] min-w-fit h-fit">
              <GCReportReceipt
                waybill={printingWaybill}
                companyDetails={transportDetails}
                branches={branches}
                currentUser={currentUser}
                storageUrl={STORAGE_URL}
                onlyContent={printOnlyContent}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-6 border-t bg-white flex justify-center items-center gap-6 no-print shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button
              onClick={() => {
                setShowPrintPreview(false)
                setPrintingWaybill(null)
              }}
              className="px-8 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-sm hover:bg-gray-200 transition-all active:scale-95 border border-gray-200"
            >
              Back to Report
            </button>
            <button
              onClick={executePrint}
              className="px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl font-black uppercase text-base hover:from-blue-700 hover:to-blue-900 transition-all flex items-center gap-3 shadow-xl shadow-blue-200 active:scale-95 group"
            >
              <Printer size={24} className="group-hover:scale-110 transition-transform" />
              Confirm & Print
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          /* ── SCENARIO A: PRINTING THE GC REPORT ── */
          /* Only apply if the specialized 'is-printing-receipt' class is ABSENT */
          body:not(.is-printing-receipt) {
            @page { size: A4 landscape; margin: 0.5in; }
            background: white !important; 
            color: black !important;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }

          html, 
          #root, 
          #root > div, 
          main, 
          .min-h-screen {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            position: relative !important;
            display: block !important;
          }

          body:not(.is-printing-receipt) aside, 
          body:not(.is-printing-receipt) header, 
          body:not(.is-printing-receipt) nav, 
          body:not(.is-printing-receipt) footer,
          body:not(.is-printing-receipt) .print\\:hidden,
          body:not(.is-printing-receipt) .gc-receipt-print-block,
          body:not(.is-printing-receipt) .fixed.bottom-0 { display: none !important; }
          
          /* Hide search input fields inside table headers on print */
          body:not(.is-printing-receipt) table input { display: none !important; }
          
          body:not(.is-printing-receipt) .p-2, 
          body:not(.is-printing-receipt) .sm\\:p-4, 
          body:not(.is-printing-receipt) .lg\\:p-6, 
          body:not(.is-printing-receipt) .pb-20, 
          body:not(.is-printing-receipt) .bg-gradient-to-br, 
          body:not(.is-printing-receipt) .overflow-x-auto { 
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
          }

          body:not(.is-printing-receipt) .hidden.print\\:block { display: block !important; }
          body:not(.is-printing-receipt) .receipt-copy { display: none !important; }

          body:not(.is-printing-receipt) table { 
            width: 100% !important; 
            border-collapse: collapse !important; 
            margin-top: 10px !important;
            table-layout: auto !important;
            border: 1.5px solid #000 !important;
          }
          body:not(.is-printing-receipt) tr { 
            page-break-inside: avoid !important;
            border-bottom: 1px solid #000 !important;
          }
          body:not(.is-printing-receipt) th, 
          body:not(.is-printing-receipt) td { 
            border: 1px solid #000 !important; 
            padding: 5px 6px !important; 
            font-size: 8.5pt !important; 
            line-height: 1.3 !important;
            color: #000 !important;
            word-wrap: break-word !important;
            vertical-align: middle !important;
          }
          body:not(.is-printing-receipt) thead { display: table-header-group !important; }
          body:not(.is-printing-receipt) th { 
            background-color: #f3f4f6 !important;
            font-weight: 900 !important;
            text-transform: uppercase !important;
            font-size: 8pt !important;
          }

          /* Force status badges and table spans to black text with no background colors */
          body:not(.is-printing-receipt) table span {
            background: transparent !important;
            color: #000 !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            font-weight: bold !important;
          }

          /* Auto Layout takes care of widths, so we don't need fixed px widths. Just hide the non-print columns */
          body:not(.is-printing-receipt) th:nth-child(14), body:not(.is-printing-receipt) td:nth-child(14) { display: none !important; }
          body:not(.is-printing-receipt) th:nth-child(15), body:not(.is-printing-receipt) td:nth-child(15) { display: none !important; }
          
          /* Handle very long text smartly in print view */
          body:not(.is-printing-receipt) td:nth-child(4),
          body:not(.is-printing-receipt) td:nth-child(5) {
            max-width: 90px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          
          body:not(.is-printing-receipt) td:nth-child(6),
          body:not(.is-printing-receipt) td:nth-child(7) {
            max-width: 150px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }

          /* Tfoot rules */
          body:not(.is-printing-receipt) tfoot { display: table-footer-group !important; }
          body:not(.is-printing-receipt) tfoot td {
            background-color: #f1f5f9 !important;
            font-weight: 900 !important;
            border-top: 2px solid #000 !important;
          }

          /* ── SCENARIO B: PRINTING THE GC RECEIPT (3 COPIES) ── */
          /* Only apply if the specialized 'is-printing-receipt' class is PRESENT */
          body.is-printing-receipt {
            background: white !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          body.is-printing-receipt .gc-receipt-print-block { 
            visibility: visible !important; 
          }

          /* COLLAPSE BACKGROUND CONTENT TO PREVENT MULTIPLE PAGES */
          body.is-printing-receipt aside,
          body.is-printing-receipt header,
          body.is-printing-receipt nav,
          body.is-printing-receipt footer,
          body.is-printing-receipt .no-print,
          body.is-printing-receipt .gc-report-main-content {
            display: none !important;
          }

          body.is-printing-receipt .gc-receipt-print-block {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 99999 !important;
            background: white !important;
            box-shadow: none !important;
          }

          /* Force the preview area to be perfectly clean and white during print */
          #printable-receipt,
          #printable-receipt > div {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            display: block !important;
            visibility: visible !important;
          }
          #printable-receipt * {
            visibility: visible !important;
          }

          body.is-printing-receipt .receipt-container {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            height: 290mm !important;
            overflow: visible !important;
          }

          body.is-printing-receipt .receipt-copy { 
            display: flex !important; 
            flex-direction: column !important;
            border: none !important;
            box-shadow: none !important;
            height: 95mm !important;
            max-height: 95mm !important;
            width: 190mm !important;
            margin: 0 auto 2mm auto !important;
            padding-top: 4mm !important; /* Default for full print */
            overflow: visible !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
          }

          /* Content-Only vertical offsets — standardized across all modules */
          body.is-printing-receipt.is-content-only .receipt-copy-1 {
            padding-top: 12mm !important; /* Perfect at 1.2cm */
          }
          body.is-printing-receipt.is-content-only .receipt-copy-2 {
            padding-top: 6mm !important;  /* Balanced for second copy */
          }
          body.is-printing-receipt.is-content-only .receipt-copy-3 {
            padding-top: 6mm !important;  /* Minimal offset for third copy */
          }

          /* Full print specific borders - only if NOT content-only */
          body.is-printing-receipt:not(.is-content-only) .receipt-copy {
            border: 1px solid #000 !important;
          }
        }
      `}</style>
    </div>
  )
}

export default GCReport
