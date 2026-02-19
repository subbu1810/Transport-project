import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Search, Printer, FileText } from 'lucide-react'

const API_BASE_URL = 'http://localhost:8000/api/v1'

function GCPrint() {
    const [gcNumber, setGcNumber] = useState('')
    const [logoUrl, setLogoUrl] = useState(null)
    const [waybill, setWaybill] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [companyDetails, setCompanyDetails] = useState(null)

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            try {
                const user = JSON.parse(userData)
                setCompanyDetails({
                    company_name: user.transport_name,
                    address: user.transport_address,
                    phone: user.transport_phone,
                    email: user.email,
                    // Keeping these if they exist in user object or can be fetched, otherwise might be undefined
                    owner_name: user.name, // Using user name as owner name for now as per login response
                    logo_path: null // Logo path is not in login response, might need separate fetch or ignore
                })

                // If logo is needed, we might still need to fetch it or store it in local storage during login
                // For now, let's keep the logo fetch if available or separate
                fetchLogo()
            } catch (e) {
                console.error("Error parsing user data", e)
            }
        }
    }, [])

    const fetchLogo = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/settings/logo_path`)
            if (response.data.success && response.data.data) {
                setLogoUrl(`http://localhost:8000/storage/${response.data.data}`)
                // Update companyDetails with logo path for print view
                setCompanyDetails(prev => ({
                    ...prev,
                    logo_path: response.data.data
                }))
            }
        } catch (err) {
            console.error('Error fetching logo:', err)
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

    const handlePrint = () => {
        window.print()
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
            {/* Header - Hide on print */}
            <div className="flex items-center justify-between print:hidden">
                <h1 className="text-3xl font-bold text-gray-800">GC Print</h1>
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
                            <p className="font-bold text-sm">Phone: <span className="font-normal">{waybill.consignor?.phone || '-'}</span></p>
                            <p className="font-bold text-sm">GST: <span className="font-normal">{waybill.consignor?.gst_number || '-'}</span></p>
                        </div>
                        <div>
                            <h3 className="font-black text-gray-800 mb-2 text-sm uppercase border-b pb-1">Consignee Details</h3>
                            <p className="font-bold text-sm">Name: <span className="font-normal">{waybill.consignee?.name || '-'}</span></p>
                            <p className="font-bold text-sm">Address: <span className="font-normal">{waybill.consignee?.address || '-'}</span></p>
                            <p className="font-bold text-sm">Phone: <span className="font-normal">{waybill.consignee?.phone || '-'}</span></p>
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
                                            <td className="px-3 py-2 text-right border border-gray-300">₹{parseFloat(article.rate).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right border border-gray-300">₹{parseFloat(article.total).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right border border-gray-300">₹{parseFloat(article.handling_rate).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right border border-gray-300">₹{parseFloat(article.handling_total).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right border border-gray-300">₹{parseFloat(article.freight).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right border border-gray-300">{parseFloat(article.actual_weight).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right border border-gray-300">{parseFloat(article.charged_weight).toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right font-bold border border-gray-300">₹{parseFloat(article.amount).toFixed(2)}</td>
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
                            <p className="font-bold">Roading Clerk:</p>
                            <p>{waybill.roading_clerk || '-'}</p>
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

                    {/* Footer Signatures */}
                    <div className="p-6 grid grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="border-t-2 border-gray-400 pt-2 mt-16">
                                <p className="font-bold text-sm">Consignor Signature</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="border-t-2 border-gray-400 pt-2 mt-16">
                                <p className="font-bold text-sm">Authorized Signature</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="border-t-2 border-gray-400 pt-2 mt-16">
                                <p className="font-bold text-sm">Consignee Signature</p>
                            </div>
                        </div>
                    </div>

                    {/* Print Button - Hide on print */}
                    <div className="p-6 flex justify-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-bold shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                            <Printer size={20} />
                            Print GC
                        </button>
                    </div>
                </div>
            )}

            {/* Print Area - Hidden on screen, shown only on print */}
            {waybill && (
                <div id="printable-receipt" className="receipt-container print:block hidden">
                    {[1, 2, 3].map((copyNum) => (
                        <div key={copyNum} className="receipt-copy">
                            {/* Copy Label */}
                            <div className="receipt-label">
                                {copyNum === 1 ? 'CONSIGNOR COPY' : copyNum === 2 ? 'CONSIGNEE COPY' : 'OFFICE COPY'}
                            </div>

                            {/* Header */}
                            <div className="receipt-header">
                                <div className="header-left">
                                    <span className="owner-name text-[8px] font-extrabold uppercase">{companyDetails?.owner_name || ''}</span>
                                    <div className="logo-box">
                                        {getInitials(companyDetails?.company_name || 'Transport Logistics')}
                                    </div>
                                </div>
                                <div className="header-center">
                                    <h1 className="company-name text-xl font-black uppercase tracking-tight leading-none mb-1">{companyDetails?.company_name || 'TRANSPORT LOGISTICS'}</h1>
                                    <p className="address-text text-[9px] font-bold leading-tight">
                                        {companyDetails?.address}
                                    </p>
                                    <p className="address-text text-[9px] font-bold mt-0.5">
                                        {companyDetails?.phone && `Cell: ${companyDetails.phone}`}
                                        {companyDetails?.alternate_phone && `, ${companyDetails.alternate_phone}`}
                                    </p>
                                    {/* Keep hardcoded branches if dynamic list not available, or remove if cleaner look desired. Removing for compact dynamic look as requested. */}
                                </div>
                                <div className="header-right">
                                    <div className="contact-info text-[7px] font-extrabold">Email : {companyDetails?.email}</div>
                                    <div className="contact-info text-[7px] font-extrabold">GSTIN: {companyDetails?.gstin}</div>
                                    {companyDetails?.logo_path && (
                                        <div className="qr-box border-none mt-1">
                                            <img
                                                src={`http://localhost:8000/storage/${companyDetails.logo_path}`}
                                                alt="Logo"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* GC Details Grid */}
                            <div className="details-table">
                                <table className="w-full text-[10px] font-bold border-t border-b border-red-800">
                                    <tbody>
                                        <tr>
                                            <td className="w-1/4 py-1">GC Number:</td>
                                            <td className="w-1/4 text-red-700">{waybill.gc_number}</td>
                                            <td className="w-1/4">Invoice No:</td>
                                            <td className="w-1/4">{waybill.invoice_no || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td className="py-1">Date:</td>
                                            <td>{formatDate(waybill.bill_date)}</td>
                                            <td>Consignee:</td>
                                            <td>{waybill.consignee?.name}</td>
                                        </tr>
                                        <tr>
                                            <td className="py-1">Consignor:</td>
                                            <td>{waybill.consignor?.name}</td>
                                            <td>To:</td>
                                            <td>{waybill.destination?.city_name}</td>
                                        </tr>
                                        <tr>
                                            <td className="py-1">From:</td>
                                            <td>{waybill.origin_branch?.branch_name || 'SINDHANUR'}</td>
                                            <td>Payable By:</td>
                                            <td className="uppercase">{waybill.tax_payable_by}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Articles Table */}
                            <table className="w-full mt-2 border-collapse text-[10px] font-bold">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-red-800 text-red-800">
                                        <th className="text-left py-1">Article Type</th>
                                        <th className="text-right py-1">Qty</th>
                                        <th className="text-right py-1">Rate</th>
                                        <th className="text-right py-1">Freight</th>
                                        <th className="text-right py-1">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {waybill.articles?.map((art, idx) => (
                                        <tr key={idx} className="border-b border-gray-100 last:border-b-0">
                                            <td className="py-0.5">{art.article_type}</td>
                                            <td className="text-right py-0.5">{art.no_of_articles}</td>
                                            <td className="text-right py-0.5">{parseFloat(art.rate).toFixed(2)}</td>
                                            <td className="text-right py-0.5">{parseFloat(art.freight).toFixed(2)}</td>
                                            <td className="text-right py-0.5">{parseFloat(art.amount).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals Section */}
                            <div className="flex justify-end mt-2 text-[10px] font-bold text-gray-800">
                                <div className="w-48">
                                    <div className="flex justify-between border-b border-gray-200">
                                        <span>Sub Total:</span>
                                        <span>₹{waybill.total_amount}</span>
                                    </div>
                                    {parseFloat(waybill.gst_amount) > 0 && (
                                        <div className="flex justify-between border-b border-gray-200">
                                            <span>GST ({waybill.gst_percent}%):</span>
                                            <span>₹{waybill.gst_amount}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-red-800 text-xl font-black mt-1">
                                        <span>TOTAL:</span>
                                        <span className="underline border-double border-b-2 border-red-800">₹{waybill.grand_total}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Note */}
                            <div className="footer-note">
                                Note : 1) We are not responsible for Damage, Leakage of goods 2) Unloading by party 3) Booked at owner's risk
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!waybill && !error && (
                <div className="bg-white rounded-lg shadow-md p-12 text-center print:hidden">
                    <FileText size={64} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Enter a GC Number and click Search to view details</p>
                </div>
            )}

            <style>{`
                #printable-receipt {
                    color: #991b1b;
                    margin-top: 20px;
                }
                .receipt-copy {
                    border: 1px solid #991b1b;
                    padding: 20px 8px 5px 8px;
                    margin-bottom: 5px;
                    position: relative;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    box-sizing: border-box;
                }
                .receipt-label {
                    position: absolute;
                    top: 2px;
                    right: 8px;
                    font-size: 9px;
                    font-weight: 800;
                    color: #991b1b;
                    font-style: italic;
                }
                .receipt-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 5px;
                    border-bottom: 1.5px solid #991b1b;
                    padding-bottom: 2px;
                }
                .header-left { width: 15%; }
                .header-center { width: 70%; text-align: center; }
                .header-right { width: 15%; text-align: right; }
                
                .owner-name { font-size: 8px; font-weight: 800; display: block; }
                .logo-box { width: 40px; height: 40px; border: 1.5px solid #991b1b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px; margin-top: 5px; }
                .company-name { font-size: 20px; font-weight: 950; margin: 0; line-height: 1; letter-spacing: -1px; }
                .address-text { font-size: 8px; font-weight: 700; margin-top: 2px; line-height: 1.2; }
                .contact-info { font-size: 7px; font-weight: 800; line-height: 1.1; }
                .qr-box { width: 40px; height: 40px; border: 1px solid #991b1b; margin-left: auto; margin-top: 2px; }
                
                .footer-note { 
                    border-top: 1px dashed #991b1b; 
                    margin-top: 5px; 
                    padding-top: 2px; 
                    font-size: 7px; 
                    font-weight: 800; 
                    text-align: center; 
                    font-style: italic;
                }

                @media print {
                    @page { size: A4; margin: 5mm; }
                    body * { visibility: hidden !important; }
                    #printable-receipt, #printable-receipt * { visibility: visible !important; }
                    #printable-receipt {
                        position: fixed;
                        top: 2mm;
                        left: 2mm;
                        right: 2mm;
                        display: block !important;
                    }
                    .receipt-copy {
                        height: 90mm;
                        margin-bottom: 5mm;
                        page-break-inside: avoid;
                        border: 1px solid #991b1b !important;
                    }
                    .text-red-700 { color: #991b1b !important; }
                    .text-red-800 { color: #991b1b !important; }
                }
            `}</style>
        </div>
    )
}

export default GCPrint
