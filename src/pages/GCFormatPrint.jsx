import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Printer, FileText, ShieldCheck, Download } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api'

function GCFormatPrint() {
    const [companyDetails, setCompanyDetails] = useState(null)
    const [branches, setBranches] = useState([])
    const [loading, setLoading] = useState(true)
    const [imgErrors, setImgErrors] = useState({})

    useEffect(() => {
        const userDataRaw = localStorage.getItem('user') || localStorage.getItem('admin')
        if (userDataRaw) {
            try {
                const user = JSON.parse(userDataRaw)
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
            } catch (e) {
                console.error("Error parsing user data", e)
            }
        }
        fetchSettings()
        fetchBranches()
    }, [])

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

    const fetchSettings = async () => {
        try {
            const endpoints = [
                `${API_BASE_URL}/settings/logo_path`,
                `${API_BASE_URL}/settings/upi_qr_path`,
                `${API_BASE_URL}/settings/transport_name`,
                `${API_BASE_URL}/settings/transport_address`,
                `${API_BASE_URL}/settings/transport_phone`,
                `${API_BASE_URL}/settings/transport_email`,
                `${API_BASE_URL}/settings/gst_number`
            ];

            const results = await Promise.allSettled(
                endpoints.map(url => fetch(url).then(res => res.ok ? res.json() : { data: null }))
            );

            const getVal = (idx) => {
                const res = results[idx];
                return (res.status === 'fulfilled') ? res.value.data : null;
            };

            setCompanyDetails(prev => ({
                ...prev,
                logo_path: prev?.logo_path || getVal(0),
                upi_qr_path: prev?.upi_qr_path || getVal(1),
                company_name: getVal(2) || prev?.company_name,
                address: getVal(3) || prev?.address,
                phone: getVal(4) || prev?.phone,
                email: getVal(5) || prev?.email,
                gstin: prev?.gstin || getVal(6)
            }))
        } catch (err) {
            console.error('Error fetching settings:', err)
        } finally {
            setLoading(false)
        }
    }

    const getFullStorageUrl = (path, type = 'logo') => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const cleanPath = path.replace(/^\/+/, '');
        if (cleanPath.includes('/')) {
            return `${STORAGE_URL || ''}/${cleanPath}`;
        }
        const folder = type === 'qr' ? 'qr_codes' : 'logos';
        return `${STORAGE_URL || ''}/${folder}/${cleanPath}`;
    }

    const handleImgError = (key) => setImgErrors(prev => ({ ...prev, [key]: true }));

    const handlePrint = () => {
        window.print();
    }

    const transportGST = companyDetails?.gstin || companyDetails?.gst_number || '';
    
    // Ultra compact branch string
    const branchStr = branches
        .filter(b => b.branch_name)
        .map(b => `${b.branch_name}${b.phone ? `-${b.phone}` : ''}`)
        .join(', ');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-red-800 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    const brandingColor = '#991b1b'; // Deep Maroon/Red as per image

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg text-red-800">
                    <ShieldCheck size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">GC Format Bulk Print</h1>
                    <p className="text-gray-500 text-sm font-medium italic">Generate pixel-perfect blank GC stationery for pre-printed paper.</p>
                </div>
            </div>

            {/* Main Action Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-10 shadow-sm flex flex-col items-center text-center space-y-8">
                <div className="p-4 bg-red-50 rounded-full text-red-800 shadow-inner">
                    <Printer size={48} />
                </div>

                <div className="max-w-md">
                    <h2 className="text-2xl font-black text-gray-800 mb-2">Ready to Print?</h2>
                    <p className="text-gray-500 font-medium">This will generate 3 sections per sheet, exactly matching your deep-red official branding.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button
                        onClick={handlePrint}
                        className="flex items-center justify-center gap-3 px-12 py-5 bg-red-800 text-white rounded-2xl font-black text-xl hover:bg-red-900 transition-all shadow-xl shadow-red-200 hover:scale-[1.02] active:scale-95"
                    >
                        <Download size={24} />
                        PRINT COLOR STATIONERY
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pt-6 border-t border-gray-50">
                    <div className="flex gap-3 items-center p-4 bg-gray-50 rounded-2xl">
                        <FileText className="text-red-800" size={20} />
                        <span className="text-sm font-bold text-gray-600">Optimized for A4 Size</span>
                    </div>
                    <div className="flex gap-3 items-center p-4 bg-gray-50 rounded-2xl">
                        <ShieldCheck className="text-red-800" size={20} />
                        <span className="text-sm font-bold text-gray-600">3 Copies (90.2mm each)</span>
                    </div>
                </div>
            </div>

            {/* Hidden Print Content */}
            <div id="blank-gc-format" className="hidden print:block bg-white font-sans" style={{ color: brandingColor }}>
                {[1, 2, 3].map((copyIdx) => (
                    <div key={copyIdx} className="blank-gc-copy relative flex flex-col h-[90.2mm] overflow-hidden px-[8mm] pt-4 mb-[4mm]" style={{ boxSizing: 'border-box' }}>
                        
                        {/* ── ULTRA COMPACT HEADER (DEEP RED) ── */}
                        <div className="flex justify-between items-center pt-0.5 pb-1" style={{ borderBottom: `1.5px solid ${brandingColor}` }}>
                            {/* Logo */}
                            <div className="w-10 h-10 flex-shrink-0">
                                {(companyDetails?.logo_path) && !imgErrors[`logo_${copyIdx}`] ? (
                                    <div className="w-10 h-10 overflow-hidden">
                                        <img
                                            src={getFullStorageUrl(companyDetails.logo_path)}
                                            alt=""
                                            className="w-full h-full object-contain"
                                            onError={() => handleImgError(`logo_${copyIdx}`)}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 border border-dashed rounded-full flex items-center justify-center text-[8px] font-black opacity-30" style={{ borderColor: brandingColor }}>LOGO</div>
                                )}
                            </div>

                            {/* Center branding */}
                            <div className="flex-1 text-center px-3 flex flex-col gap-0" style={{ color: brandingColor }}>
                                <h1 className="text-[23px] font-black uppercase tracking-tighter leading-none m-0 p-0 transform scale-y-110">
                                    {companyDetails?.company_name}
                                </h1>
                                <p className="text-[8px] font-black leading-none mt-1.5 line-clamp-1 max-w-[420px] mx-auto">
                                    {companyDetails?.address} {companyDetails?.phone && `Cell: ${companyDetails.phone}`}
                                </p>
                                {branchStr && (
                                    <p className="text-[7px] font-bold leading-tight mt-1 line-clamp-1 max-w-[480px] mx-auto opacity-90 italic">
                                        <span className="font-black">Branches: </span>{branchStr}
                                    </p>
                                )}
                            </div>

                            {/* Right block: COPY NAME and GST & Gmail BESIDE QR */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <div className="text-right flex flex-col justify-center leading-none" style={{ color: brandingColor }}>
                                    <p className="text-[7.5px] font-black uppercase tracking-tighter mb-1.5 underline decoration-red-800/30">
                                        {copyIdx === 1 ? 'CONSIGNOR' : copyIdx === 2 ? 'CONSIGNEE' : 'OFFICE'} COPY
                                    </p>
                                    <p className="text-[8.5px] font-bold uppercase tracking-tight whitespace-nowrap mb-0.5">
                                        GST NO:<span className="font-black ml-0.5 text-[9.5px]">{transportGST || 'Pending'}</span>
                                    </p>
                                    <p className="text-[7.5px] font-bold lowercase italic whitespace-nowrap">
                                        {companyDetails?.email}
                                    </p>
                                </div>

                                <div className="border p-0.5 rounded bg-white w-12 h-12 flex items-center justify-center overflow-hidden flex-shrink-0" style={{ borderColor: brandingColor }}>
                                    {companyDetails?.upi_qr_path && !imgErrors[`qr_${copyIdx}`] ? (
                                        <img
                                            src={getFullStorageUrl(companyDetails.upi_qr_path, 'qr')}
                                            alt=""
                                            className="w-full h-full object-contain"
                                            onError={() => handleImgError(`qr_${copyIdx}`)}
                                        />
                                    ) : (
                                        <div className="text-[6px] font-black text-black/40 text-center uppercase leading-tight">QR<br/>PAY</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── SPACER FOR PHYSICAL TABLE CONTENT ── */}
                        <div className="flex-1"></div>

                        {/* ── FOOTER ── */}
                        <div className="w-full border-t pb-1.5 pt-1 mt-auto" style={{ borderColor: brandingColor }}>
                            <p className="text-[9.5px] font-extrabold text-center uppercase tracking-normal leading-none" style={{ color: brandingColor }}>
                                Note : 1) We are not responsible for Damage, Leakage of goods 2) Unloading by party 3) Booked at owner's risk
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 0; 
                    }
                    body { 
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print, header, nav, footer, button, .print\\:hidden, #main-dashboard-header, #sidebar {
                        display: none !important;
                    }
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    #blank-gc-format {
                        display: block !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        margin: 0 !important;
                        padding: 2mm 0 !important;
                        position: absolute;
                        top: 0;
                        left: 0;
                        background: white;
                    }
                    .blank-gc-copy {
                        height: 90.2mm !important;
                        max-height: 90.2mm !important;
                        page-break-inside: avoid !important;
                        box-sizing: border-box !important;
                        border-bottom: 2px dashed #ddd !important;
                        margin-bottom: 4mm !important;
                    }
                    .blank-gc-copy:last-child {
                        border-bottom: none !important;
                        margin-bottom: 0 !important;
                    }
                }

                @media screen {
                    #blank-gc-format {
                        display: none;
                    }
                }
            `}</style>
        </div>
    )
}

export default GCFormatPrint
