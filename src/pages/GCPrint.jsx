import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Search, Printer, FileText, X } from 'lucide-react'
import GCPrintReceipt from '../components/GCPrintReceipt'
import { API_BASE_URL, STORAGE_URL } from '../config/api';




function GCPrint() {
    const [gcNumber, setGcNumber] = useState('')
    const [logoUrl, setLogoUrl] = useState(null)
    const [waybill, setWaybill] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [branches, setBranches] = useState([])
    const [settingsLoading, setSettingsLoading] = useState(true)

    const [companyDetails, setCompanyDetails] = useState(null)
    const [currentUser, setCurrentUser] = useState(null)
    const [printOnlyContent, setPrintOnlyContent] = useState(false)
    const [showPrintPreview, setShowPrintPreview] = useState(false)
    const [printMode, setPrintMode] = useState('full')

    useEffect(() => {
        const userDataRaw = localStorage.getItem('user') || localStorage.getItem('admin')
        if (userDataRaw) {
            try {
                const user = JSON.parse(userDataRaw)
                setCurrentUser(user)

                // Initial set from user data
                setCompanyDetails({
                    company_name: user.transport_name || user.branch?.branch_name || 'Transport Logistics',
                    address: user.transport_address || user.branch?.branch_address || '',
                    phone: user.transport_phone || user.branch?.branch_phone || '',
                    mobile: user.transport_mobile || '',
                    email: user.email || '',
                    gstin: user.transport_gstin || user.gstin || user.gst_number || '',
                    logo_path: user.transport_logo_url || null,
                    upi_qr_path: user.upi_qr_url || null
                })

                fetchLogo()
                fetchBranches()
            } catch (e) {
                console.error("Error parsing user data", e)
            }
        }
    }, [])

    const fetchBranches = async () => {
        try {
            // Using /branches for consistency with other modules
            const response = await axios.get(`${API_BASE_URL}/branches`)
            if (response.data.success) {
                setBranches(response.data.data)
            }
        } catch (err) {
            console.error('Error fetching branches:', err)
        }
    }

    const fetchLogo = async () => {
        try {
            const endpoints = [
                `${API_BASE_URL}/settings/logo_path`,
                `${API_BASE_URL}/settings/upi_id`,
                `${API_BASE_URL}/settings/upi_account_holder`,
                `${API_BASE_URL}/settings/upi_qr_path`,
                `${API_BASE_URL}/settings/gst_number`
            ];

            const results = await Promise.allSettled(
                endpoints.map(url => fetch(url).then(res => res.ok ? res.json() : { data: null }))
            );

            const getVal = (idx) => {
                const res = results[idx];
                return (res.status === 'fulfilled') ? res.value.data : null;
            };

            const globalLogo = getVal(0);
            const globalQR = getVal(3);
            const globalGST = getVal(4);

            setCompanyDetails(prev => ({
                ...prev,
                logo_path: prev.logo_path || globalLogo,
                upi_qr_path: prev.upi_qr_path || globalQR,
                upi_id: getVal(1),
                upi_account_holder: getVal(2),
                gstin: prev.gstin || globalGST
            }))
        } catch (err) {
            console.error('Error fetching settings:', err)
        } finally {
            setSettingsLoading(false)
        }
    }

    // ... (rest of the component)



    const searchGC = async () => {
        if (!gcNumber.trim()) {
            setError('Please enter a GC Number')
            return
        }

        try {
            setLoading(true)
            setError('')

            const response = await axios.get(`${API_BASE_URL}/waybills/search/${gcNumber}`)

            if (response.data.success) {
                setWaybill(response.data.data)
            } else {
                setError(response.data.message || 'GC Number not found')
                setWaybill(null)
            }
        } catch (err) {
            setError('Error searching for GC Number')
            console.error('Error:', err)
            setWaybill(null)
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = (mode = 'full') => {
        setPrintMode(mode);
        setPrintOnlyContent(mode === 'content');
        setShowPrintPreview(true);
    }

    const executePrint = () => {
        const mode = printMode;
        const printableArea = document.getElementById('printable-receipt');
        if (!printableArea) {
            setTimeout(() => window.print(), 100);
            return;
        }

        const images = printableArea.querySelectorAll('img');
        const promises = Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                const timer = setTimeout(() => {
                    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                    resolve();
                }, 2000);

                img.onload = () => { clearTimeout(timer); resolve(); };
                img.onerror = () => { clearTimeout(timer); resolve(); };
            });
        });

        Promise.all(promises).then(() => {
            setTimeout(() => {
                // ── Suppress browser print header/footer ──
                const originalTitle = document.title;
                if (waybill?.gc_number) document.title = `GC-${waybill.gc_number}`;

                document.body.classList.add('is-printing-receipt');
                if (mode === 'content') document.body.classList.add('is-content-only');
                const cleanup = () => {
                    document.title = originalTitle; // Restore title after print
                    document.body.classList.remove('is-printing-receipt');
                    document.body.classList.remove('is-content-only');
                    window.removeEventListener('afterprint', cleanup);
                };
                window.addEventListener('afterprint', cleanup);
                window.print();
            }, 500);
        });
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-IN')
    }

    const getInitials = (name) => {
        if (!name) return 'TL'
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 3)
    }

    return (
        <div className="p-4 space-y-4">
            <div className="gc-print-main-content space-y-4 print:hidden">
            {/* Header - Hide on print */}
            <div className="flex items-center justify-between print:hidden">
                <h1 className="text-3xl font-bold text-gray-800">GC Print</h1>
                {/* Pre-load Barcode Font - Hidden from view but forces browser to load it */}
                <div style={{ fontFamily: "'Libre Barcode 128'", position: 'absolute', visibility: 'hidden', height: 0 }}>
                    PRELOAD_BARCODE
                </div>
            </div>

            {/* Search Section - Hide on print */}
            <div className="bg-white rounded-lg shadow-sm p-2 print:hidden">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-2 rounded-lg border border-green-300">
                    <div className="flex items-center gap-1">
                        <select className="px-2 py-1 text-xs border-2 border-green-600 rounded-md focus:outline-none font-semibold bg-white">
                            <option>BY GC-NUM</option>
                        </select>
                        <input
                            type="text"
                            placeholder="GC NUMBER"
                            value={gcNumber}
                            onChange={(e) => setGcNumber(e.target.value.toUpperCase())}
                            onKeyPress={(e) => e.key === 'Enter' && searchGC()}
                            className="flex-1 px-2 py-1 text-sm border-2 border-gray-300 rounded-md focus:border-green-500 focus:ring-1 focus:ring-green-200 outline-none font-medium"
                        />
                        <button
                            onClick={searchGC}
                            disabled={loading}
                            className="px-3 py-1 text-xs bg-gradient-to-r from-green-600 to-green-700 text-white rounded-md hover:from-green-700 hover:to-green-800 transition-all font-bold shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-1"
                        >
                            {loading ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search size={16} />
                                    Search
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium text-sm">
                        {error}
                    </div>
                )}
            </div>

            {/* Display Content - Shown on screen, Hidden on print */}
            {waybill && (
                <div className="bg-white rounded-lg shadow-md print:hidden">
                    {/* Header */}
                    <div className="p-6 border-b-2 border-gray-300">
                        <div className="flex items-center justify-between mb-4">
                            {logoUrl && (
                                <img src={logoUrl} alt="Company Logo" className="h-20 w-auto object-contain" />
                            )}
                            <div className="text-right">
                                <h1 className="text-3xl font-black text-gray-800">GOODS CONSIGNMENT NOTE</h1>
                                <p className="text-sm font-bold text-gray-600 mt-1">GC No: {waybill.gc_number}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-bold">Date: <span className="font-normal">{formatDate(waybill.bill_date)}</span></p>
                                <p className="font-bold">From: <span className="font-normal">{waybill.origin_branch?.branch_name || '-'}</span></p>
                            </div>
                            <div>
                                <p className="font-bold">To: <span className="font-normal">{waybill.destination?.city_name || '-'}</span></p>
                                <p className="font-bold">Invoice No: <span className="font-normal">{waybill.invoice_no || '-'}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Consignor & Consignee Details */}
                    <div className="p-6 grid grid-cols-2 gap-6 border-b border-gray-300">
                        <div>
                            <h3 className="font-black text-gray-800 mb-2 text-sm uppercase border-b pb-1">Consignor Details</h3>
                            <p className="font-bold text-sm">Name: <span className="font-normal">{waybill.consignor?.name || '-'}</span></p>
                            <p className="font-bold text-sm">Address: <span className="font-normal">{waybill.consignor?.address || '-'}</span></p>
                            <p className="font-bold text-sm">Phone: <span className="font-normal">{waybill.consignor?.mobile_no || waybill.consignor?.mobile_number || waybill.consignor?.phone || '-'}</span></p>
                            <p className="font-bold text-sm">GST: <span className="font-normal">{waybill.consignor?.gst_number || '-'}</span></p>
                        </div>
                        <div>
                            <h3 className="font-black text-gray-800 mb-2 text-sm uppercase border-b pb-1">Consignee Details</h3>
                            <p className="font-bold text-sm">Name: <span className="font-normal">{waybill.consignee?.name || '-'}</span></p>
                            <p className="font-bold text-sm">Address: <span className="font-normal">{waybill.consignee?.address || '-'}</span></p>
                            <p className="font-bold text-sm">Phone: <span className="font-normal">{waybill.consignee?.mobile_number || waybill.consignee?.mobile_no || waybill.consignee?.phone || '-'}</span></p>
                            <p className="font-bold text-sm">GST: <span className="font-normal">{waybill.consignee?.gst_number || '-'}</span></p>
                        </div>
                    </div>

                    {/* Article Details */}
                    <div className="p-6 border-b border-gray-300">
                        <h3 className="font-black text-gray-800 mb-3 text-sm uppercase">Article Details</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                                        <th className="px-3 py-2 text-left font-black border border-gray-300">Type</th>
                                        <th className="px-3 py-2 text-center font-black border border-gray-300">Qty</th>
                                        <th className="px-3 py-2 text-right font-black border border-gray-300">Rate</th>
                                        <th className="px-3 py-2 text-right font-black border border-gray-300">Total</th>
                                        <th className="px-3 py-2 text-right font-black border border-gray-300">DD.Rate</th>
                                        <th className="px-3 py-2 text-right font-black border border-gray-300">DD.Total</th>
                                        <th className="px-3 py-2 text-right font-black border border-gray-300">H.Rate</th>
                                        <th className="px-3 py-2 text-right font-black border border-gray-300">H.Total</th>
                                        <th className="px-3 py-2 text-right font-black border border-gray-300">Freight</th>
                                        <th className="px-3 py-2 text-right font-black border border-gray-300">Act.Wt</th>
                                        <th className="px-3 py-2 text-right font-black border border-gray-300">Chg.Wt</th>
                                        <th className="px-3 py-2 text-right font-black border border-gray-300">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {waybill.articles?.map((article, idx) => (
                                        <tr key={idx} className="border-b border-gray-200">
                                            <td className="px-3 py-2 border border-gray-300">{article.article_type || '-'}</td>
                                            <td className="px-3 py-2 text-center border border-gray-300">{article.no_of_articles}</td>
                                            <td className="px-3 py-2 text-right border border-gray-300">₹{parseFloat(article.freight || article.rate || 0).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right border border-gray-300">₹{parseFloat(article.total || 0).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right border border-gray-300">₹{parseFloat(article.dd_rate || 0).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right border border-gray-300">₹{parseFloat(article.dd_total || 0).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right border border-gray-300">₹{parseFloat(article.handling_rate || 0).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right border border-gray-300">₹{parseFloat(article.handling_total || 0).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right border border-gray-300">₹{parseFloat(article.freight || 0).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right border border-gray-300">{parseFloat(article.actual_weight || 0).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right border border-gray-300">{parseFloat(article.charged_weight || 0).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right font-bold border border-gray-300">₹{parseFloat(article.amount || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {waybill.article_desc && (
                            <p className="mt-3 text-sm"><span className="font-bold">Description:</span> {waybill.article_desc}</p>
                        )}
                    </div>

                    {/* Charges Summary */}
                    <div className="p-6 grid grid-cols-2 gap-6 border-b border-gray-300">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="font-bold">Total Articles:</span>
                                <span>{waybill.total_articles}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold">Freight Amount:</span>
                                <span>₹{parseFloat(waybill.freight_amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold">DD Charges:</span>
                                <span>₹{parseFloat(waybill.dd_charges).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold">Handling Charges:</span>
                                <span>₹{parseFloat(waybill.handling_charges).toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="font-bold">Stationary Charges:</span>
                                <span>₹{parseFloat(waybill.stationary_charges).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold">Total Amount:</span>
                                <span>₹{parseFloat(waybill.total_amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold">GST ({waybill.gst_percent}%):</span>
                                <span>₹{parseFloat(waybill.gst_amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t-2 border-gray-400 pt-2">
                                <span className="font-black text-base">Grand Total:</span>
                                <span className="font-black text-base">₹{parseFloat(waybill.grand_total).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="p-6 grid grid-cols-3 gap-4 text-sm border-b border-gray-300">
                        <div>
                            <p className="font-bold">E-Way Bill No:</p>
                            <p>{waybill.eway_bill_no || '-'}</p>
                        </div>
                        <div>
                            <p className="font-bold">Tax Payable By:</p>
                            <p className="capitalize">{waybill.tax_payable_by || '-'}</p>
                        </div>
                        <div>
                            <p className="font-bold">Account Type:</p>
                            <p className="uppercase">{waybill.account_type || '-'}</p>
                        </div>
                        <div>
                            <p className="font-bold">Declared Value:</p>
                            <p>₹{parseFloat(waybill.declared_value).toFixed(2)}</p>
                        </div>

                        <div>
                            <p className="font-bold">Status:</p>
                            <p className="font-bold uppercase">{waybill.status}</p>
                        </div>
                    </div>

                    {/* Remarks */}
                    {waybill.remarks && (
                        <div className="p-6 border-b border-gray-300">
                            <p className="font-bold text-sm mb-1">Remarks:</p>
                            <p className="text-sm">{waybill.remarks}</p>
                        </div>
                    )}



                    {/* Print Buttons - Hide on print */}
                    <div className="p-6 flex justify-center gap-4">
                        <button
                            onClick={() => handlePrint('full')}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-bold shadow-lg hover:shadow-xl flex items-center gap-2 active:scale-95"
                        >
                            <Printer size={20} />
                            Full Print
                        </button>
                        <button
                            onClick={() => handlePrint('content')}
                            className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-bold shadow-lg hover:shadow-xl flex items-center gap-2 active:scale-95"
                        >
                            <FileText size={20} />
                            Content Only
                        </button>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!waybill && !error && (
                <div className="bg-white rounded-lg shadow-md p-12 text-center print:hidden">
                    <FileText size={64} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Enter a GC Number and click Search to view details</p>
                </div>
            )}
            </div>

            {showPrintPreview && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in fade-in zoom-in duration-300">
                    {/* Modal Header - Fixed at top */}
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50 no-print">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                <Printer size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-800 leading-none uppercase tracking-tight">Print Preview</h2>
                                <p className="text-xs text-gray-500 font-bold mt-1">{printMode === 'content' ? 'CONTENT ONLY MODE' : 'FULL RECEIPT MODE'}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowPrintPreview(false)} 
                            className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-all text-gray-500 group"
                        >
                            <X size={28} className="group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>

                    {/* Receipt Preview - Scrollable area */}
                    <div className="flex-1 overflow-auto bg-gray-200/50 p-4 md:p-8 flex justify-center" id="printable-receipt">
                        <div className="bg-white shadow-2xl p-[5mm] md:p-[10mm] min-w-fit h-fit">
                            <GCPrintReceipt
                                waybill={waybill}
                                companyDetails={companyDetails}
                                branches={branches}
                                currentUser={currentUser}
                                storageUrl={STORAGE_URL}
                                onlyContent={printOnlyContent}
                            />
                        </div>
                    </div>

                    {/* Modal Footer with Actions - Fixed at bottom */}
                    <div className="p-6 border-t bg-white flex justify-center items-center gap-6 no-print shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                        <button
                            onClick={() => setShowPrintPreview(false)}
                            className="px-8 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-sm hover:bg-gray-200 transition-all active:scale-95 border border-gray-200"
                        >
                            Back to Search
                        </button>
                        <button
                            onClick={executePrint}
                            className="px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl font-black uppercase text-base hover:from-blue-700 hover:to-blue-900 transition-all flex items-center gap-3 shadow-xl shadow-blue-200 active:scale-95 group"
                        >
                            <Printer size={24} className="group-hover:scale-110 transition-transform" />
                            Print Now
                        </button>
                    </div>
                </div>
            )}

            {/* Print Area - Hidden on screen, shown only on print - Keep for window.print */}
            <div className="hidden">
                <div id="printable-receipt-hidden">
                    <GCPrintReceipt
                        waybill={waybill}
                        companyDetails={companyDetails}
                        branches={branches}
                        currentUser={currentUser}
                        storageUrl={STORAGE_URL}
                        onlyContent={printOnlyContent}
                    />
                </div>
            </div>

            <style>{`
                .print-only-receipt { display: none; }
                
                #printable-receipt {
                    color: #991b1b;
                }
                
                    @media print {
                    @page { size: A4 portrait; margin: 0mm; }

                    /* Hide EVERY main UI piece */
                    .gc-print-main-content,
                    .no-print {
                        display: none !important;
                    }

                    /* Hide browser header/footer */
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        overflow: visible !important;
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
                    }

                    /* Container holding all 3 copies — using flex for better vertical distribution */
                    .receipt-container {
                        display: flex !important;
                        flex-direction: column !important;
                        width: 100% !important;
                        height: 290mm !important;
                        overflow: visible !important;
                    }

                    .receipt-copy { 
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

                    /* Specific offsets for Content-Only mode - Standardized across all modules */
                    body.is-printing-receipt.is-content-only .receipt-copy-1 {
                        padding-top: 12mm !important; /* Perfect at 1.2cm */
                    }
                    body.is-printing-receipt.is-content-only .receipt-copy-2 {
                        padding-top: 6mm !important;  /* Balanced for second copy */
                    }
                    body.is-printing-receipt.is-content-only .receipt-copy-3 {
                        padding-top: 0mm !important;  /* Minimal offset for third copy */
                    }

                    /* Full print specific borders - only if NOT content-only */
                    body.is-printing-receipt:not(.is-content-only) .receipt-copy { 
                        border: 1px solid #000 !important; 
                    }

                    .text-red-700, .text-red-800 { color: #000 !important; }
                }
            `}</style>
        </div>
    )
}

export default GCPrint
