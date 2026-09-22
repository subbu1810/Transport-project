import React, { useState, useEffect } from 'react'
import {
    Search, Package, Truck, Box, AlertCircle, X, Printer, Loader2,
    MapPin, History, CheckCircle, ChevronRight, FileText, CreditCard,
    Image as ImageIcon, Calendar, User, ArrowRight, Zap, Info, Archive, HelpCircle, Trash2
} from 'lucide-react'
import axios from 'axios'
import GCPrintReceipt from '../components/GCPrintReceipt'
import { API_BASE_URL, STORAGE_URL } from '../config/api';
import { applyBranchOverrides } from '../utils/branchOverrides';




const statusConfig = {
    'PENDING': { color: 'bg-amber-100 text-amber-700 border-amber-300', dot: 'bg-amber-400' },
    'DISPATCHED': { color: 'bg-blue-100 text-blue-700 border-blue-300', dot: 'bg-blue-500' },
    'LOCAL_TRIP': { color: 'bg-purple-100 text-purple-700 border-purple-300', dot: 'bg-purple-500' },
    'RECEIVED': { color: 'bg-teal-100 text-teal-700 border-teal-300', dot: 'bg-teal-500' },
    'INWARDED': { color: 'bg-teal-100 text-teal-700 border-teal-300', dot: 'bg-teal-500' },
    'Delivered': { color: 'bg-green-100 text-green-700 border-green-300', dot: 'bg-green-500' },
    'RTO (Return to Origin)': { color: 'bg-red-100 text-red-700 border-red-300', dot: 'bg-red-500' },
    'Out for Delivery': { color: 'bg-cyan-100 text-cyan-700 border-cyan-300', dot: 'bg-cyan-500' },
    'Arrived at Destination': { color: 'bg-indigo-100 text-indigo-700 border-indigo-300', dot: 'bg-indigo-500' },
}

function StatusBadge({ status }) {
    const cfg = statusConfig[status] || { color: 'bg-gray-100 text-gray-600 border-gray-300', dot: 'bg-gray-400' }
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${cfg.color}`}>
            <span className={`w-1 h-1 rounded-full ${cfg.dot}`}></span>
            {status || 'UNKNOWN'}
        </span>
    )
}

function InfoRow({ label, value, accent }) {
    return (
        <div className="flex flex-col gap-0">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
            <span className={`text-[11px] font-bold text-gray-800 truncate leading-tight ${accent || ''}`}>{value || '—'}</span>
        </div>
    )
}

function SectionCard({ title, icon: Icon, color = 'blue', children }) {
    const colors = {
        blue: 'from-blue-600 to-blue-700',
        green: 'from-emerald-600 to-emerald-700',
        purple: 'from-purple-600 to-purple-700',
        amber: 'from-amber-500 to-orange-600',
        slate: 'from-slate-600 to-slate-800',
    }
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className={`bg-gradient-to-r ${colors[color]} px-4 py-2 flex items-center gap-2`}>
                <div className="p-1 bg-white/20 rounded-lg">
                    <Icon size={12} className="text-white" />
                </div>
                <h3 className="text-white font-black text-[10px] uppercase tracking-widest">{title}</h3>
            </div>
            <div className="flex-1">{children}</div>
        </div>
    )
}

function GCTracking() {
    const [gcNumber, setGcNumber] = useState('')
    const [trackingData, setTrackingData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [companyDetails, setCompanyDetails] = useState(null)
    const [allBranches, setAllBranches] = useState([])
    const [currentUser, setCurrentUser] = useState(null)

    const [showTripModal, setShowTripModal] = useState(false)
    const [selectedTripFullData, setSelectedTripFullData] = useState(null)
    const [loadingTrip, setLoadingTrip] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [showAckModal, setShowAckModal] = useState(false)
    const [showHelp, setShowHelp] = useState(false)
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' })
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [cancelReason, setCancelReason] = useState('')
    const [isCancelling, setIsCancelling] = useState(false)
    const [printOnlyContent, setPrintOnlyContent] = useState(false)

    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type })
        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000)
    }

    React.useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setCurrentUser(JSON.parse(userData))
        }

        const fetchInitialData = async () => {
            try {
                // Fetch Company Details from settings
                const settingsRes = await fetch(`${API_BASE_URL}/settings/all`);
                const settingsData = await settingsRes.json();
                const settings = settingsData.success ? settingsData.data : {};

                const userData = JSON.parse(localStorage.getItem('user')) || {};

                const globalLogo = settings.logo_path || null;
                const globalQR = settings.upi_qr_path || null;

                setCompanyDetails(applyBranchOverrides(userData, {
                    company_name: userData.transport_name || settings.company_name || userData.branch?.branch_name || 'Transport Logistics',
                    address: userData.transport_address || settings.address || userData.branch?.branch_address || '',
                    phone: userData.transport_phone || settings.phone || userData.branch?.branch_phone || '',
                    mobile: userData.transport_mobile || settings.mobile || '',
                    email: userData.email || settings.email || '',
                    gstin: userData.transport_gstin || userData.gstin || userData.gst_number || settings.gst_number || settings.gstin || '',
                    logo_path: userData.transport_logo_url || globalLogo,
                    upi_qr_path: userData.upi_qr_url || globalQR,
                }));

                // Fetch Branches
                const branchResp = await fetch(`${API_BASE_URL}/branches`);
                const branchData = await branchResp.json();
                if (branchData.success) {
                    setAllBranches(branchData.data);
                }
            } catch (err) {
                console.error('Error fetching tracking init data:', err);
            }
        };

        fetchInitialData();
    }, [])

    const handleSearch = async (e) => {
        e.preventDefault()
        if (!gcNumber.trim()) return
        setLoading(true)
        setError('')
        setTrackingData(null)
        try {
            const response = await fetch(`${API_BASE_URL}/waybills/search/${gcNumber}`)
            const data = await response.json()
            if (data.success && data.data) {
                // ── Consignor Role Restriction ──
                if (currentUser?.role === 'consignor') {
                    // Get the consignor_id from localStorage (or fetch fresh if stale)
                    let userConsignorId = currentUser.consignor_id

                    if (!userConsignorId && currentUser?.id) {
                        try {
                            const adminRes = await fetch(`${API_BASE_URL}/users/${currentUser.id}`)
                            const adminData = await adminRes.json()
                            if (adminData.success) {
                                userConsignorId = adminData.data?.consignor_id
                                const updated = { ...currentUser, consignor_id: userConsignorId }
                                localStorage.setItem('user', JSON.stringify(updated))
                                setCurrentUser(updated)
                            }
                        } catch (e) {
                            console.error('Could not fetch admin details:', e)
                        }
                    }

                    const gcConsignorId = data.data.consignor_id || data.data.consignor?.id
                    if (!userConsignorId || String(gcConsignorId) !== String(userConsignorId)) {
                        setError('Access Denied: This GC does not belong to your account.')
                        showToast('You are not authorized to track this GC number.', 'error')
                        return
                    }
                }
                setTrackingData(data.data)
            } else {
                setError('GC Number not found')
                showToast('The GC Number you entered does not exist in our records.', 'error')
            }
        } catch (err) {
            console.error('Error fetching GC details:', err)
            setError('Failed to fetch tracking details. Please try again.')
            showToast('Server connection failed. Please check your network.', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleViewTripSheet = async (tripId) => {
        if (!tripId) { showToast('No specific Trip ID found for this record.', 'warning'); return }
        try {
            setLoadingTrip(true)
            setShowTripModal(true)
            setSelectedTripFullData(null)
            const response = await fetch(`${API_BASE_URL}/trip-sheets/${tripId}`)
            const data = await response.json()
            if (data.success) {
                setSelectedTripFullData(data.data)
            } else {
                showToast('Trip Sheet details not found or could not be loaded.', 'error')
                setShowTripModal(false)
            }
        } catch (err) {
            console.error('Error fetching trip details:', err)
            showToast('Error connecting to the server for trip details.', 'error')
            setShowTripModal(false)
        } finally {
            setLoadingTrip(false)
        }
    }

    const formatDate = (dateString, fallback = '—') => {
        if (!dateString) return fallback
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return fallback
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    const handlePrint = (mode = 'full') => {
        setPrintOnlyContent(mode === 'content');
        const printableArea = document.getElementById('printable-receipt');
        if (!printableArea) {
            window.print();
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
                document.body.classList.add('is-printing-receipt');
                if (mode === 'content') document.body.classList.add('is-content-only');

                const cleanup = () => {
                    document.body.classList.remove('is-printing-receipt');
                    document.body.classList.remove('is-content-only');
                    window.removeEventListener('afterprint', cleanup);
                };
                window.addEventListener('afterprint', cleanup);
                window.print();
            }, 500);
        });
    }

    const handlePrintTrip = () => {
        document.body.classList.add('is-printing-trip');
        const cleanup = () => {
            document.body.classList.remove('is-printing-trip');
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        setTimeout(() => window.print(), 200);
    }

    const handleCancelGC = async () => {
        if (!trackingData?.id) return
        
        const statusUpper = trackingData.status?.toUpperCase()
        const deliverStatusUpper = trackingData.deliver_status?.toUpperCase()

        if (statusUpper === 'DELIVERED' || deliverStatusUpper === 'DELIVERED' || statusUpper === 'CANCELLED' || deliverStatusUpper === 'CANCELLED') {
            showToast(`Cannot cancel a waybill that is already delivered or cancelled.`, 'error')
            return
        }

        if (!cancelReason.trim()) {
            setShowCancelModal(true)
            return
        }

        setIsCancelling(true)
        try {
            const response = await axios.post(`${API_BASE_URL}/waybills/${trackingData.id}/cancel`, {
                cancel_reason: cancelReason,
                branch_id: currentUser?.branch_id,
                role: currentUser?.role
            })

            if (response.data.success) {
                showToast('Waybill cancelled successfully! Financial entries reversed.', 'success')
                setShowCancelModal(false)
                setCancelReason('')
                setTrackingData(null)
                setGcNumber('')
            } else {
                showToast(response.data.message || 'Cancellation failed.', 'error')
            }
        } catch (err) {
            console.error('Cancellation error:', err)
            showToast(err.response?.data?.message || 'Error occurred during cancellation.', 'error')
        } finally {
            setIsCancelling(false)
        }
    }

    return (
        <div className="bg-gradient-to-br from-slate-50 via-blue-50/20 to-emerald-50/10 p-3 font-sans text-gray-900 w-full overflow-x-hidden">
            <div className="w-full max-w-[1440px] mx-auto space-y-3 gc-track-main-content">

                {/* ── HERO SEARCH HEADER ── */}
                <div className="relative overflow-hidden rounded-2xl shadow-xl no-print" style={{ background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 60%, #1b5e20 100%)' }}>
                    {/* Decorative blobs */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(255,255,255,0.05)' }}></div>
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(0,0,0,0.08)' }}></div>

                    <div className="relative z-10 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Left: Title */}
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl border" style={{ background: 'rgba(251,192,45,0.2)', borderColor: 'rgba(251,192,45,0.35)' }}>
                                <Zap size={16} style={{ color: '#fbc02d' }} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-black text-white tracking-tight">GC Live Tracking</h1>
                                    <button
                                        onClick={() => setShowHelp(true)}
                                        className="p-1 rounded-full transition-all border"
                                        style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.55)' }}
                                        title="Tracking Guide"
                                    >
                                        <HelpCircle size={13} />
                                    </button>
                                </div>
                                <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Real-time shipment status &amp; journey history</p>
                            </div>
                        </div>

                        {/* Right: Search */}
                        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                                <input
                                    type="text"
                                    value={gcNumber}
                                    onChange={(e) => setGcNumber(e.target.value.toUpperCase())}
                                    placeholder="Enter GC Number..."
                                    className="w-full pl-9 pr-3 py-2 font-bold rounded-xl outline-none tracking-wider text-xs transition-all"
                                    style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.22)', color: 'white' }}
                                    onFocus={e => e.target.style.background = 'rgba(255,255,255,0.22)'}
                                    onBlur={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !gcNumber}
                                className="flex items-center gap-1.5 px-4 py-2 font-black rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs whitespace-nowrap"
                                style={{ background: 'linear-gradient(135deg, #fbc02d, #f9a825)', color: '#1b2e0a' }}
                            >
                                {loading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                                {loading ? 'Searching...' : 'Track GC'}
                            </button>
                        </form>
                    </div>

                    {error && (
                        <div className="relative z-10 mx-6 mb-4 flex items-center gap-2 px-3 py-2 rounded-lg text-red-200 text-xs font-bold" style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)' }}>
                            <AlertCircle size={13} />
                            {error}
                        </div>
                    )}
                </div>

                {/* ── EMPTY STATE ── */}
                {!trackingData && !loading && !error && (
                    <div className="flex flex-col items-center justify-center py-20 text-center no-print animate-in fade-in zoom-in duration-500">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <Package size={28} className="text-slate-300" />
                        </div>
                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Track Your Shipment</h3>
                        <p className="text-gray-400 text-[11px] font-medium mt-1">Enter a GC Number above to see real-time tracking details</p>
                    </div>
                )}

                {/* ── RESULTS ── */}
                {trackingData && (
                    <div id="printable-report" className="space-y-5 animate-in fade-in slide-in-from-bottom-6 duration-500">

                        {/* GC Identity Banner */}
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg no-print">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
                                    <FileText size={20} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest leading-none mb-1">Goods Consignment Note</p>
                                    <h2 className="text-white text-xl font-black tracking-tight">{trackingData.gc_number}</h2>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="text-right">
                                    <p className="text-slate-400 text-[8px] uppercase font-black mb-0.5">Current Status</p>
                                    <StatusBadge status={trackingData.status} />
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-400 text-[8px] uppercase font-black mb-0.5">Payment</p>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${trackingData.amount_paid > 0 ? 'bg-green-100 text-green-700 border-green-300' : 'bg-rose-100 text-rose-700 border-rose-300'}`}>
                                        {trackingData.amount_paid > 0 ? '✓ PAID' : '✗ UNPAID'}
                                    </span>
                                </div>
                                <div className="flex gap-2 no-print">
                                    <button onClick={() => handlePrint('full')} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/20 active:scale-95 flex items-center gap-2 text-[10px] font-black uppercase" title="Full Print">
                                        <Printer size={14} /> Full
                                    </button>
                                    <button onClick={() => handlePrint('content')} className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-all border border-emerald-500/30 active:scale-95 flex items-center gap-2 text-[10px] font-black uppercase" title="Content Only">
                                        <FileText size={14} /> Content
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── ROW 1: Consignor & Consignee ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Consignor */}
                            <SectionCard title="Consignor Details" icon={User} color="blue">
                                <div className="p-4 space-y-2.5">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 bg-blue-50 rounded-xl flex-shrink-0">
                                            <User size={18} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 text-xs uppercase">{trackingData.consignor?.name || '—'}</p>
                                            {(trackingData.consignor?.mobile_no || trackingData.consignor?.mobile_number || trackingData.consignor?.phone) && (
                                                <p className="text-xs text-gray-500 font-medium mt-0.5">📞 {trackingData.consignor.mobile_no || trackingData.consignor.mobile_number || trackingData.consignor.phone}</p>
                                            )}
                                            {trackingData.consignor?.address && (
                                                <p className="text-xs text-gray-400 font-medium mt-0.5 italic">{trackingData.consignor.address}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                                        <InfoRow label="Bill Date" value={formatDate(trackingData.bill_date)} />
                                        <InfoRow label="From Branch" value={trackingData.origin_branch?.branch_name} />
                                        <InfoRow label="Invoice No" value={trackingData.invoice_no} />
                                        <InfoRow label="Declared Value" value={trackingData.declared_value ? `₹ ${trackingData.declared_value}` : null} />
                                    </div>
                                </div>
                            </SectionCard>

                            {/* Consignee */}
                            <SectionCard title="Consignee Details" icon={MapPin} color="green">
                                <div className="p-4 space-y-2.5">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 bg-emerald-50 rounded-xl flex-shrink-0">
                                            <MapPin size={18} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 text-xs uppercase">{trackingData.consignee?.name || '—'}</p>
                                            {(trackingData.consignee?.mobile_number || trackingData.consignee?.mobile_no || trackingData.consignee?.phone) && (
                                                <p className="text-xs text-gray-500 font-medium mt-0.5">📞 {trackingData.consignee.mobile_number || trackingData.consignee.mobile_no || trackingData.consignee.phone}</p>
                                            )}
                                            {trackingData.consignee?.address && (
                                                <p className="text-xs text-gray-400 font-medium mt-0.5 italic">{trackingData.consignee.address}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                                        <InfoRow label="Destination" value={trackingData.destination?.city_name} />
                                        <InfoRow label="Account Type" value={trackingData.account_type?.toUpperCase()} />
                                        <InfoRow label="Tax Payable By" value={trackingData.tax_payable_by?.toUpperCase()} />
                                        <InfoRow label="Booked By" value={trackingData.roading_clerk?.toUpperCase() || 'ADMIN'} />
                                    </div>
                                </div>
                            </SectionCard>
                        </div>

                        {/* ── ROW 2: Transit History ── */}
                        <SectionCard title="Transit History" icon={History} color="slate">
                            <div className="p-4 bg-slate-50">
                                {trackingData.transits?.length > 0 ? (
                                    <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 pb-2">
                                        {trackingData.transits.map((transit, idx) => {
                                            let dotColor = 'bg-slate-400';
                                            let IconComponent = Package;
                                            if (transit.status === 'BOOKED') { dotColor = 'bg-blue-500'; IconComponent = FileText; }
                                            if (transit.status === 'DISPATCHED') { dotColor = 'bg-amber-500'; IconComponent = Truck; }
                                            if (transit.status === 'INWARDED') { dotColor = 'bg-purple-500'; IconComponent = Package; }
                                            if (transit.status === 'DELIVERED') { dotColor = 'bg-green-500'; IconComponent = CheckCircle; }

                                            return (
                                                <div key={transit.id || idx} className="relative pl-6">
                                                    {/* Dot */}
                                                    <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full ${dotColor} border-4 border-slate-50 flex items-center justify-center`}>
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                    </div>
                                                    
                                                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <IconComponent size={14} className={dotColor.replace('bg-', 'text-')} />
                                                                <span className={`text-[10px] font-black uppercase tracking-widest ${dotColor.replace('bg-', 'text-')}`}>
                                                                    {transit.status}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400">{formatDate(transit.created_at)} {new Date(transit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        
                                                        <p className="text-xs font-bold text-slate-800">
                                                            {transit.branch?.branch_name || `Branch #${transit.branch_id}`}
                                                        </p>
                                                        
                                                        {transit.trip_sheet && (
                                                            <div className="mt-2 bg-slate-50 p-2 rounded border border-slate-100 flex justify-between items-center">
                                                                <span className="text-[10px] font-bold text-slate-600">Trip: {transit.trip_sheet.trip_number}</span>
                                                                <button
                                                                    onClick={() => handleViewTripSheet(transit.trip_sheet.id)}
                                                                    className="text-[9px] font-black text-blue-600 uppercase hover:underline"
                                                                >
                                                                    View Details
                                                                </button>
                                                            </div>
                                                        )}
                                                        
                                                        {transit.remarks && (
                                                            <p className="mt-1 text-[10px] text-slate-500 italic">{transit.remarks}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                                        <div className="p-3 bg-slate-100 rounded-full border border-dashed border-slate-200"><History size={24} className="text-slate-300" /></div>
                                        <div>
                                            <p className="text-sm font-black text-slate-400 uppercase">No Transit History</p>
                                            <p className="text-xs text-slate-300 font-medium">Tracking data is not available for this GC. Older GCs might not have transit history recorded.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </SectionCard>

                        {/* ── Article Info Table ── */}
                        <SectionCard title="Article Info" icon={Box} color="slate">
                            <div className="overflow-x-auto">
                                <table className="w-full text-center text-[11px] font-bold border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-gray-200 text-[10px] text-gray-500 uppercase">
                                            <th rowSpan={2} className="border-r border-gray-200 px-3 py-1.5">Article Type</th>
                                            <th rowSpan={2} className="border-r border-gray-200 px-3 py-1.5">No. of Articles</th>
                                            <th colSpan={2} className="border-r border-gray-200 px-3 py-0.5 border-b border-gray-200">DD</th>
                                            <th colSpan={2} className="border-r border-gray-200 px-3 py-0.5 border-b border-gray-200">Handling</th>
                                            <th rowSpan={2} className="border-r border-gray-200 px-3 py-1.5">Freight</th>
                                            <th rowSpan={2} className="border-r border-gray-200 px-3 py-1.5">Act Wt</th>
                                            <th rowSpan={2} className="border-r border-gray-200 px-3 py-1.5">Charged Wt</th>
                                            <th rowSpan={2} className="px-3 py-1.5">Amount</th>
                                        </tr>
                                        <tr className="bg-slate-50 border-b border-gray-200 text-[10px] text-gray-400">
                                            <th className="border-r border-gray-200 px-3 py-0.5">Rate</th>
                                            <th className="border-r border-gray-200 px-3 py-0.5">Total</th>
                                            <th className="border-r border-gray-200 px-3 py-0.5">Rate</th>
                                            <th className="border-r border-gray-200 px-3 py-0.5">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {trackingData.articles?.map((art, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors text-gray-800">
                                                <td className="border-r border-gray-200 px-3 py-2 uppercase font-bold">{art.article_type || '—'}</td>
                                                <td className="border-r border-gray-200 px-3 py-2">{art.no_of_articles || 0}</td>
                                                <td className="border-r border-gray-200 px-3 py-2 text-gray-400">{art.freight || art.rate || 0}</td>
                                                <td className="border-r border-gray-200 px-3 py-2">{trackingData.dd_charges || 0}</td>
                                                <td className="border-r border-gray-200 px-3 py-2 text-gray-400">{art.handling_rate || 0}</td>
                                                <td className="border-r border-gray-200 px-3 py-2">{art.handling_total || 0}</td>
                                                <td className="border-r border-gray-200 px-3 py-2">{art.freight || 0}</td>
                                                <td className="border-r border-gray-200 px-3 py-2">{art.actual_weight || 0}</td>
                                                <td className="border-r border-gray-200 px-3 py-2">{art.charged_weight || 0}</td>
                                                <td className="px-3 py-2 text-emerald-700 font-black">₹ {art.amount || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-50 text-[9px] font-black text-gray-500 uppercase border-t-2 border-gray-200">
                                            <td className="border-r border-gray-200 px-2 py-1.5 min-w-[60px]">Total Articles</td>
                                            <td className="border-r border-gray-200 px-2 py-1.5">Act Weight</td>
                                            <td className="border-r border-gray-200 px-2 py-1.5">Chg Weight</td>
                                            <td className="border-r border-gray-200 px-2 py-1.5">Freight</td>
                                            <td className="border-r border-gray-200 px-2 py-1.5">DD</td>
                                            <td className="border-r border-gray-200 px-2 py-1.5">Handling</td>
                                            <td className="border-r border-gray-200 px-2 py-1.5">Stationary</td>
                                            <td className="border-r border-gray-200 px-2 py-1.5">Total Amt</td>
                                            <td className="border-r border-gray-200 px-2 py-1.5">GST %</td>
                                            <td className="border-r border-gray-200 px-2 py-1.5">GST Amt</td>
                                            <td colSpan={1} className="px-2 py-1.5 font-black text-gray-800">Grand Total</td>
                                        </tr>
                                        <tr className="bg-white text-[10px] font-black text-gray-900 border-t border-gray-200">
                                            <td className="border-r border-gray-200 px-2 py-2">{trackingData.total_articles || 0}</td>
                                            <td className="border-r border-gray-200 px-2 py-2 text-blue-700">{trackingData.actual_weight || 0} k</td>
                                            <td className="border-r border-gray-200 px-2 py-2 text-blue-700">{trackingData.charged_weight || 0} k</td>
                                            <td className="border-r border-gray-200 px-2 py-2">{trackingData.freight_amount || 0}</td>
                                            <td className="border-r border-gray-200 px-2 py-2">{trackingData.dd_charges || 0}</td>
                                            <td className="border-r border-gray-200 px-2 py-2">{trackingData.handling_charges || 0}</td>
                                            <td className="border-r border-gray-200 px-2 py-2">{trackingData.stationary_charges || 0}</td>
                                            <td className="border-r border-gray-200 px-2 py-2">{trackingData.total_amount || 0}</td>
                                            <td className="border-r border-gray-200 px-2 py-2">{trackingData.gst_percent || 0}%</td>
                                            <td className="border-r border-gray-200 px-2 py-2">{trackingData.gst_amount || 0}</td>
                                            <td colSpan={1} className="px-2 py-2 text-emerald-700 bg-emerald-50 font-black text-sm whitespace-nowrap">₹ {trackingData.grand_total || 0}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Additional GC Info Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-0 border-t border-gray-100 bg-slate-50/50">
                                {[
                                    { label: 'Invoice No', value: trackingData.invoice_no || '—' },
                                    { label: 'Declared Value', value: trackingData.declared_value ? `₹ ${trackingData.declared_value}` : '—' },
                                    { label: 'Tax Payable By', value: trackingData.tax_payable_by?.toUpperCase() || '—' },
                                    { label: 'Account Type', value: trackingData.account_type?.toUpperCase() || '—' },
                                    { label: 'Booked By', value: trackingData.roading_clerk?.toUpperCase() || 'ADMIN' },
                                    { label: 'Consignor Report ID', value: trackingData.consignor_receipts && trackingData.consignor_receipts.length > 0 ? trackingData.consignor_receipts[0].receipt_no : '—' },
                                    { label: 'ACK Report Bundle ID', value: trackingData.ack_bundle ? trackingData.ack_bundle.bundle_number : '—' },
                                    { label: 'Remarks', value: trackingData.remarks || 'NO REMARKS' },
                                ].map((item, idx) => (
                                    <div key={idx} className="px-3 py-2 border-r border-b lg:border-b-0 border-gray-200 last:border-r-0">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                                        <p className="text-[10px] font-bold text-gray-700 uppercase truncate leading-none">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        {/* ── Action Buttons ── */}
                        <div className="flex flex-wrap items-center justify-center gap-2.5 no-print">
                            <button onClick={() => handlePrint('full')} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-black text-[10px] uppercase rounded-lg shadow-sm active:scale-95 transition-all">
                                <Printer size={14} /> Full Print
                            </button>
                            <button onClick={() => handlePrint('content')} className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[10px] uppercase rounded-lg shadow-sm active:scale-95 transition-all">
                                <FileText size={14} /> Content Only
                            </button>
                            <button
                                onClick={() => {
                                    if (trackingData.trip_sheets?.length > 0) {
                                        handleViewTripSheet(trackingData.trip_sheets[0].id)
                                    } else {
                                        showToast('No Trip Sheet or Inward record exists for this GC yet.', 'warning')
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-[10px] uppercase rounded-lg shadow-sm active:scale-95 transition-all"
                            >
                                <Truck size={14} /> TripSheet / Inward Details
                            </button>
                            <button onClick={() => setShowPaymentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-[10px] uppercase rounded-lg shadow-sm active:scale-95 transition-all">
                                <CreditCard size={14} /> Payment Details
                            </button>
                            <button onClick={() => setShowAckModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black text-[10px] uppercase rounded-lg shadow-sm active:scale-95 transition-all">
                                <ImageIcon size={14} /> View ACK / POD
                            </button>
                            {(currentUser?.role === 'superadmin' || Number(currentUser?.branch_id) === Number(trackingData?.origin_branch_id)) && 
                                trackingData?.status?.toUpperCase() !== 'CANCELLED' && 
                                trackingData?.status?.toUpperCase() !== 'DELIVERED' && 
                                trackingData?.deliver_status?.toUpperCase() !== 'DELIVERED' && (
                                <button 
                                    onClick={() => setShowCancelModal(true)} 
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase rounded-lg shadow-sm active:scale-95 transition-all"
                                >
                                    <Trash2 size={14} /> Cancel GC
                                </button>
                            )}
                        </div>

                        {/* ── Live Journey Timeline ── */}
                        <SectionCard title="Live Shipment Journey Tracking" icon={History} color="slate">
                            <div className="p-5">
                                <div className="relative">
                                    {/* Vertical line */}
                                    <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500 via-amber-400 to-emerald-500 opacity-20 rounded-full"></div>

                                    <div className="space-y-4">
                                        {/* Stage 1: Booking */}
                                        <div className="relative flex items-start gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg shadow-blue-200 z-10 border-2 border-white">
                                                <Package size={14} className="text-white" />
                                            </div>
                                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex-1">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">📦 Booking Stage</span>
                                                    <span className="text-[8px] font-bold text-gray-400">{formatDate(trackingData.bill_date)}</span>
                                                </div>
                                                <h4 className="text-xs font-black text-gray-800">SHIPMENT BOOKED</h4>
                                                <p className="text-[10px] text-gray-500 font-medium mt-0.5">{trackingData.origin_branch?.branch_name?.toUpperCase()} → {trackingData.destination?.city_name?.toUpperCase()}</p>
                                            </div>
                                        </div>

                                        {/* Stage 2: Each Transit */}
                                        {trackingData.trip_sheets?.map((ts, idx) => (
                                            <div key={idx} className="relative flex items-start gap-4">
                                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-200 z-10 border-2 border-white">
                                                    <Truck size={14} className="text-white" />
                                                </div>
                                                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex-1">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">🚛 Transit Stage {idx > 0 ? `#${idx + 1}` : ''}</span>
                                                        <span className="text-[8px] font-bold text-gray-400">{formatDate(ts.trip_date || ts.dispatch_date || ts.created_at)}</span>
                                                    </div>
                                                    <h4 className="text-xs font-black text-gray-800 uppercase">In Transit — <span className="text-amber-700">{ts.trip_number}</span></h4>
                                                    <div className="flex gap-2 mt-0.5 text-[10px] text-gray-500 font-medium">
                                                        {ts.vehicle?.vehicle_number && <span>🚌 {ts.vehicle.vehicle_number}</span>}
                                                        {ts.driver?.name && <span>👤 {ts.driver.name}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Stage 3: Arrived (only if inwarded) */}
                                        {trackingData.inward_at && (
                                            <div className="relative flex items-start gap-4">
                                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-teal-200 z-10 border-2 border-white">
                                                    <MapPin size={14} className="text-white" />
                                                </div>
                                                <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-3 flex-1">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-[8px] font-black text-teal-600 uppercase tracking-widest">📍 Destination Stage</span>
                                                        <span className="text-[8px] font-bold text-gray-400">{formatDate(trackingData.inward_at)}</span>
                                                    </div>
                                                    <h4 className="text-xs font-black text-gray-800">ARRIVED AT DESTINATION</h4>
                                                    <p className="text-[10px] text-teal-600 font-black mt-0.5 uppercase">{trackingData.inward_branch?.branch_name || 'Destination Branch'}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Stage: Failed Delivery / Redirection Attempts */}
                                        {(trackingData.delivery_attempts || trackingData.deliveryAttempts || []).map((attempt, idx) => (
                                            <div key={`attempt-${idx}`} className="relative flex items-start gap-4">
                                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-rose-500 to-rose-700 rounded-full flex items-center justify-center shadow-lg shadow-rose-200 z-10 border-2 border-white">
                                                    <AlertCircle size={14} className="text-white" />
                                                </div>
                                                <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3 flex-1">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest">⚠️ Delivery Attempt</span>
                                                        <span className="text-[8px] font-bold text-gray-400">{formatDate(attempt.created_at)}</span>
                                                    </div>
                                                    <h4 className="text-xs font-black text-rose-700 uppercase">{attempt.status}</h4>
                                                    <p className="text-[10px] text-gray-600 font-medium mt-0.5">Reason: <strong className="text-gray-800">{attempt.reason || 'N/A'}</strong></p>
                                                    {attempt.branch_name && (
                                                        <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">Attempted By: {attempt.branch_name}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Stage 4: Delivered */}
                                        {(trackingData.status === 'Delivered' || trackingData.status === 'DELIVERED' || trackingData.status === 'delivered') && (
                                            <div className="relative flex items-start gap-4">
                                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center shadow-lg shadow-green-200 z-10 border-2 border-white">
                                                    <CheckCircle size={14} className="text-white" />
                                                </div>
                                                <div className="bg-green-50/50 border border-green-200 rounded-xl p-3 flex-1">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">✅ Delivery Stage</span>
                                                        <span className="text-[8px] font-bold text-gray-400">{formatDate(trackingData.delivered_at)}</span>
                                                    </div>
                                                    <h4 className="text-xs font-black text-green-700 uppercase">Successfully Delivered</h4>
                                                    {trackingData.receiver_name && (
                                                        <p className="text-[10px] text-gray-500 font-medium mt-0.5">Received by: <strong>{trackingData.receiver_name}</strong></p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {trackingData.consignor_receipts?.length > 0 && (
                                            <div className="relative flex items-start gap-4">
                                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center shadow-lg shadow-violet-200 z-10 border-2 border-white">
                                                    <FileText size={14} className="text-white" />
                                                </div>
                                                <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-3 flex-1">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-[8px] font-black text-violet-600 uppercase tracking-widest">🧾 Billing Stage</span>
                                                        <span className="text-[8px] font-bold text-gray-400">{formatDate(trackingData.consignor_receipts[0].transaction_date)}</span>
                                                    </div>
                                                    <h4 className="text-xs font-black text-violet-700 uppercase">Consignor Report Prepared</h4>
                                                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">Report ID: <strong className="text-violet-800">{trackingData.consignor_receipts[0].receipt_no}</strong></p>
                                                </div>
                                            </div>
                                        )}

                                        {trackingData.ack_bundle && (
                                            <div className="relative flex items-start gap-4">
                                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 z-10 border-2 border-white">
                                                    <Archive size={14} className="text-white" />
                                                </div>
                                                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex-1">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">📂 Archiving Stage</span>
                                                        <span className="text-[8px] font-bold text-gray-400">{formatDate(trackingData.ack_bundle.bundle_date)}</span>
                                                    </div>
                                                    <h4 className="text-xs font-black text-indigo-700 uppercase">ACK Bundled / POD Scanned</h4>
                                                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">Report ID (ACK Bundle): <strong className="text-indigo-800">{trackingData.ack_bundle.bundle_number}</strong></p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Pending state at end of timeline */}
                                        {!trackingData.inward_at && !trackingData.status?.toUpperCase()?.includes('DELIVERED') && (
                                            <div className="relative flex items-start gap-4">
                                                <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white z-10">
                                                    <MapPin size={12} className="text-gray-400" />
                                                </div>
                                                <div className="border border-dashed border-gray-200 rounded-xl p-3 flex-1">
                                                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Awaiting Arrival…</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </SectionCard>

                    </div>
                )}
            </div>

            {/* Standardized Receipt for Printing - OUTSIDE main content so display:none doesn't hide it */}
            {trackingData && (
                <div id="printable-receipt" className="print-only-receipt">
                    <GCPrintReceipt
                        waybill={trackingData}
                        companyDetails={companyDetails}
                        branches={allBranches}
                        currentUser={currentUser}
                        storageUrl={STORAGE_URL}
                        onlyContent={printOnlyContent}
                    />
                </div>
            )}

            {/* ── TRIP SHEET MODAL ── */}
            {showTripModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
                    <div className="bg-white w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-white/15 rounded-lg"><Truck size={14} className="text-white" /></div>
                                <h2 className="text-white font-black text-xs uppercase tracking-widest">TripSheet / Inward Details</h2>
                            </div>
                            <button
                                onClick={() => { setShowTripModal(false); setSelectedTripFullData(null); }}
                                className="p-2 hover:bg-white/10 text-white/70 hover:text-white transition-colors rounded-lg"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto bg-gray-50 p-4">
                            {loadingTrip ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-400">
                                    <Loader2 size={36} className="animate-spin text-emerald-500" />
                                    <span className="font-bold text-xs uppercase">Retrieving Trip Records...</span>
                                </div>
                            ) : selectedTripFullData ? (
                                <div className="space-y-4" id="printable-trip-details">
                                    {/* Trip header info */}
                                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">{companyDetails?.company_name || 'Transport Company'} — Trip Sheet Details</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <InfoRow label="TripSheet No" value={selectedTripFullData.trip_number} />
                                            <InfoRow label="TripSheet Date" value={formatDate(selectedTripFullData.trip_date)} />
                                            <InfoRow label="Vehicle No" value={selectedTripFullData.vehicle?.vehicle_number} />
                                            <InfoRow label="Driver Name" value={selectedTripFullData.driver?.name} />
                                            <InfoRow label="Owner Name" value={selectedTripFullData.owner_name} />
                                            <InfoRow label="Advance Amount" value={selectedTripFullData.advance_amount ? `₹ ${parseFloat(selectedTripFullData.advance_amount).toFixed(2)}` : null} />
                                            <InfoRow label="LR No" value={selectedTripFullData.lr_number || '0'} />
                                            <InfoRow label="CR No" value={selectedTripFullData.cr_number || '0'} />
                                        </div>
                                    </div>

                                    {/* History table */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="bg-slate-700 px-5 py-3">
                                            <h3 className="text-white text-[11px] font-black uppercase tracking-widest">Inward History Details (GC Journey)</h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-[11px] font-bold text-center">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-gray-200 text-[10px] text-gray-500 uppercase">
                                                        <th className="border-r border-gray-200 px-3 py-1.5">Branch</th>
                                                        <th className="border-r border-gray-200 px-3 py-1.5">Booking Type</th>
                                                        <th className="border-r border-gray-200 px-3 py-1.5">Inward Date</th>
                                                        <th className="border-r border-gray-200 px-3 py-1.5">Dispatch Date</th>
                                                        <th className="border-r border-gray-200 px-3 py-1.5">TripSheet No</th>
                                                        <th className="border-r border-gray-200 px-3 py-1.5">Vehicle No</th>
                                                        <th className="border-r border-gray-200 px-3 py-1.5">Driver Name</th>
                                                        <th className="border-r border-gray-200 px-3 py-1.5">Status</th>
                                                        <th className="border-r border-gray-200 px-3 py-1.5">Expected Delivery Date</th>
                                                        <th className="px-3 py-1.5">Remarks</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {trackingData && (() => {
                                                        const originTripSheet = trackingData.trip_sheets?.find(ts => 
                                                            Number(ts.dispatch_branch_id) === Number(trackingData.origin_branch_id)
                                                        ) || (
                                                            Number(selectedTripFullData?.dispatch_branch_id) === Number(trackingData.origin_branch_id)
                                                                ? selectedTripFullData
                                                                : null
                                                        ) || trackingData.trip_sheets?.[0];
                                                        
                                                        const firstDispatchDate = originTripSheet?.trip_date || originTripSheet?.dispatch_date || null;
                                                        const firstTripNo = originTripSheet?.trip_number || '—';
                                                        const firstVehicleNo = originTripSheet?.vehicle?.vehicle_number || '—';
                                                        const firstDriverName = originTripSheet?.driver?.name || '—';
                                                        
                                                        const nextInwardDate = trackingData.transits && trackingData.transits.length > 0 
                                                            ? (['INWARDED', 'RECEIVED'].includes(trackingData.transits[0].status) 
                                                                ? trackingData.transits[0].created_at 
                                                                : (trackingData.inward_at || trackingData.transits[0].created_at))
                                                            : trackingData.inward_at;
                                                        
                                                        return (
                                                            <tr className="hover:bg-slate-50 transition-colors">
                                                                <td className="border-r border-gray-200 px-3 py-2 uppercase font-bold">{trackingData.origin_branch?.branch_name}</td>
                                                                <td className="border-r border-gray-200 px-3 py-2 uppercase">{trackingData.account_type || 'NORMAL'}</td>
                                                                <td className="border-r border-gray-200 px-3 py-2">{formatDate(trackingData.created_at)}</td>
                                                                <td className="border-r border-gray-200 px-3 py-2">{formatDate(firstDispatchDate)}</td>
                                                                <td className="border-r border-gray-200 px-3 py-2 text-blue-700 font-black">{firstTripNo}</td>
                                                                <td className="border-r border-gray-200 px-3 py-2 uppercase">{firstVehicleNo}</td>
                                                                <td className="border-r border-gray-200 px-3 py-2 uppercase">{firstDriverName}</td>
                                                                <td className="border-r border-gray-200 px-3 py-2">
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                                                                        BOOKED
                                                                    </span>
                                                                </td>
                                                                <td className="border-r border-gray-200 px-3 py-2">{formatDate(nextInwardDate)}</td>
                                                                <td className="px-3 py-2 text-gray-400 italic font-normal">Consignment Booked</td>
                                                            </tr>
                                                        );
                                                    })()}
                                                    {(() => {
                                                        if (!trackingData.transits || trackingData.transits.length === 0) {
                                                            return (
                                                                <tr className="hover:bg-slate-50 transition-colors">
                                                                    <td className="border-r border-gray-200 px-3 py-2 uppercase font-bold">{trackingData.origin_branch?.branch_name}</td>
                                                                    <td className="border-r border-gray-200 px-3 py-2 uppercase">{trackingData.account_type || 'NORMAL'}</td>
                                                                    <td className="border-r border-gray-200 px-3 py-2">{formatDate(trackingData.inward_at)}</td>
                                                                    <td className="border-r border-gray-200 px-3 py-2">{formatDate(selectedTripFullData?.trip_date)}</td>
                                                                    <td className="border-r border-gray-200 px-3 py-2 text-blue-700 font-black">{selectedTripFullData?.trip_number}</td>
                                                                    <td className="border-r border-gray-200 px-3 py-2 uppercase">{selectedTripFullData?.vehicle?.vehicle_number}</td>
                                                                    <td className="border-r border-gray-200 px-3 py-2 uppercase">{selectedTripFullData?.driver?.name}</td>
                                                                    <td className="border-r border-gray-200 px-3 py-2"><StatusBadge status={trackingData.status} /></td>
                                                                    <td className="border-r border-gray-200 px-3 py-2">{formatDate(trackingData.delivered_at || trackingData.inward_at)}</td>
                                                                    <td className="px-3 py-2 text-gray-400 italic font-normal">{trackingData.remarks || '—'}</td>
                                                                </tr>
                                                            );
                                                        }

                                                        const transitsToRender = [];
                                                        trackingData.transits.forEach(transit => {
                                                            const isDelivered = ['DELIVERED', 'Delivered'].includes(transit.status);
                                                            if (isDelivered && transitsToRender.length > 0) {
                                                                const lastT = transitsToRender[transitsToRender.length - 1];
                                                                const lastBranchName = lastT.branch?.branch_name || trackingData.origin_branch?.branch_name;
                                                                const currentBranchName = transit.branch?.branch_name || trackingData.origin_branch?.branch_name;
                                                                
                                                                if (lastBranchName === currentBranchName) {
                                                                    lastT.display_status = 'DELIVERED';
                                                                    if (transit.remarks) lastT.display_remarks = transit.remarks;
                                                                    lastT.delivered_at_override = transit.created_at;
                                                                    return;
                                                                }
                                                            }
                                                            transitsToRender.push({ ...transit, display_status: transit.status, display_remarks: transit.remarks });
                                                        });

                                                        return transitsToRender.map((transit, idx) => {
                                                            const nextTransit = transitsToRender[idx + 1];
                                                            const expectedDelDate = nextTransit 
                                                                ? (['INWARDED', 'RECEIVED'].includes(nextTransit.status) 
                                                                    ? nextTransit.created_at 
                                                                    : (trackingData.inward_at || nextTransit.created_at))
                                                                : (['DELIVERED', 'Delivered'].includes(transit.display_status) || ['DELIVERED', 'Delivered'].includes(trackingData.status)
                                                                    ? (transit.delivered_at_override || trackingData.delivered_at)
                                                                    : null);
                                                                    
                                                            return (
                                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                                    <td className="border-r border-gray-200 px-3 py-2 uppercase font-bold">{transit.branch?.branch_name || trackingData.origin_branch?.branch_name}</td>
                                                                    <td className="border-r border-gray-200 px-3 py-2 uppercase">{trackingData.account_type || 'NORMAL'}</td>
                                                                    <td className="border-r border-gray-200 px-3 py-2">{['INWARDED', 'RECEIVED'].includes(transit.status) ? formatDate(transit.created_at) : (formatDate(trackingData.inward_at || trackingData.created_at) || '—')}</td>
                                                                    <td className="border-r border-gray-200 px-3 py-2">{['DISPATCHED', 'LOCAL_TRIP'].includes(transit.status) ? formatDate(transit.created_at) : (formatDate(transit.trip_sheet?.trip_date || (transit.trip_sheet_id == selectedTripFullData?.id ? selectedTripFullData?.trip_date : null)) || '—')}</td>
                                                                    <td className="border-r border-gray-200 px-3 py-2 text-blue-700 font-black">{transit.trip_sheet?.trip_number || (transit.trip_sheet_id == selectedTripFullData?.id ? selectedTripFullData?.trip_number : '—')}</td>
                                                                    <td className="border-r border-gray-200 px-3 py-2 uppercase">{transit.trip_sheet?.vehicle?.vehicle_number || (transit.trip_sheet_id == selectedTripFullData?.id ? selectedTripFullData?.vehicle?.vehicle_number : '—')}</td>
                                                                    <td className="border-r border-gray-200 px-3 py-2 uppercase">{transit.trip_sheet?.driver?.name || (transit.trip_sheet_id == selectedTripFullData?.id ? selectedTripFullData?.driver?.name : '—')}</td>
                                                                    <td className="border-r border-gray-200 px-3 py-2"><StatusBadge status={transit.display_status} /></td>
                                                                    <td className="border-r border-gray-200 px-3 py-2">{formatDate(expectedDelDate)}</td>
                                                                    <td className="px-3 py-2 text-gray-400 italic font-normal">{transit.display_remarks || transit.remarks || '—'}</td>
                                                                </tr>
                                                            );
                                                        });
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center no-print">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase italic">* Report for GC: {trackingData.gc_number}</p>
                                        <button onClick={handlePrintTrip} className="flex items-center gap-2 px-5 py-2 bg-slate-700 text-white font-black text-[11px] uppercase rounded-xl shadow-md hover:bg-slate-800 active:scale-95 transition-all">
                                            <Printer size={14} /> Print
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* ── PAYMENT MODAL ── */}
            {showPaymentModal && trackingData && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-white/20 rounded-lg"><CreditCard size={14} className="text-white" /></div>
                                <h2 className="text-white font-black text-xs uppercase tracking-widest">Payment Ledger</h2>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <span className="text-sm font-black text-gray-600 uppercase tracking-wide">Grand Total</span>
                                    <span className="text-xl font-black text-gray-900">₹ {trackingData.grand_total}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
                                    <span className="text-sm font-black text-green-700 uppercase tracking-wide">Amount Paid</span>
                                    <span className="text-xl font-black text-green-700">₹ {trackingData.amount_paid}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                                    <span className="text-sm font-black text-red-700 uppercase tracking-wide">Balance Due</span>
                                    <span className="text-xl font-black text-red-700">₹ {(trackingData.grand_total - trackingData.amount_paid).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                                <InfoRow label="Account Type" value={trackingData.account_type?.toUpperCase()} />
                                <InfoRow label="Tax Payable By" value={trackingData.tax_payable_by?.toUpperCase()} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ACK / POD MODAL ── */}
            {showAckModal && trackingData && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 no-print">
                    <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100">
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-white/15 rounded-lg"><ImageIcon size={14} className="text-white" /></div>
                                <h2 className="text-white font-black text-xs uppercase tracking-widest">Acknowledgement / POD</h2>
                            </div>
                            <button onClick={() => setShowAckModal(false)} className="p-2 hover:bg-white/10 text-white/70 hover:text-white transition-colors rounded-lg">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="bg-slate-100 flex-1 min-h-[320px] flex items-center justify-center p-4">
                            {trackingData.delivery_proof ? (
                                trackingData.delivery_proof.toLowerCase().endsWith('.pdf') ? (
                                    <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
                                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FileText size={32} className="text-red-500" />
                                        </div>
                                        <p className="text-gray-800 font-black text-sm uppercase mb-3">PDF Delivery Document</p>
                                        <a
                                            href={`${STORAGE_URL}/${trackingData.delivery_proof}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-6 py-2 bg-red-600 text-white font-black text-[11px] uppercase rounded-xl hover:bg-red-700 transition-all shadow-md"
                                        >
                                            <Printer size={14} /> Open PDF to Print/View
                                        </a>
                                    </div>
                                ) : (
                                    <img
                                        src={`${STORAGE_URL}/${trackingData.delivery_proof}`}
                                        alt="Proof of Delivery"
                                        className="max-w-full max-h-[65vh] rounded-xl shadow-lg border border-gray-200"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://placehold.co/600x400/f1f5f9/94a3b8?text=Image+Load+Error';
                                        }}
                                    />
                                )
                            ) : (
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <ImageIcon size={32} className="text-gray-300" />
                                    </div>
                                    <p className="text-gray-500 font-black text-sm uppercase">No POD Image Uploaded Yet</p>
                                    <p className="text-gray-400 text-xs font-medium mt-1">Upload via Update Delivery Status</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-white flex justify-end">
                            <button onClick={() => setShowAckModal(false)} className="px-6 py-2.5 bg-slate-800 text-white font-black text-xs uppercase rounded-xl shadow hover:bg-slate-900 active:scale-95 transition-all">Close</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 5mm; }
                    /* Only apply receipt logic IF the is-printing-receipt class is on the body */
                    body:not(.is-printing-receipt) .no-print,
                    body:not(.is-printing-receipt) aside,
                    body:not(.is-printing-receipt) header,
                    body:not(.is-printing-receipt) nav,
                    body:not(.is-printing-receipt) footer { display: none !important; }

                    body.is-printing-receipt * { visibility: hidden !important; }
                    body.is-printing-receipt #printable-receipt, 
                    body.is-printing-receipt #printable-receipt * { 
                        visibility: visible !important; 
                    }
                    body.is-printing-receipt #printable-receipt {
                        position: fixed !important;
                        top: 2mm !important;
                        left: 2mm !important;
                        right: 2mm !important;
                        width: calc(100% - 4mm) !important;
                        display: block !important;
                        visibility: visible !important;
                    }
                    body.is-printing-receipt .receipt-copy {
                        height: 95mm !important;
                        margin-bottom: 0 !important;
                        padding: 1mm !important;
                        page-break-inside: avoid !important;
                        border: 1.5px solid #991b1b !important;
                        box-sizing: border-box !important;
                        display: flex !important;
                        flex-direction: column !important;
                        overflow: hidden !important;
                        visibility: visible !important;
                    }
                    body.is-printing-receipt .text-red-700 { color: #991b1b !important; }
                    body.is-printing-receipt .text-red-800 { color: #991b1b !important; }

                    /* Trip Modal Printing */
                    body.is-printing-trip .no-print,
                    body.is-printing-trip aside,
                    body.is-printing-trip header,
                    body.is-printing-trip nav,
                    body.is-printing-trip footer,
                    body.is-printing-trip .gc-track-main-content { display: none !important; }

                    body.is-printing-trip #printable-trip-details {
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        display: block !important;
                        background: white !important;
                        padding: 10mm !important;
                        visibility: visible !important;
                    }
                    body.is-printing-trip #printable-trip-details * {
                        visibility: visible !important;
                    }
                }
            `}</style>

            {/* ── TOAST ── */}
            {toast.show && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[999]">
                    <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border-2 ${toast.type === 'error' ? 'bg-red-600 border-red-400 text-white' : toast.type === 'warning' ? 'bg-orange-500 border-orange-300 text-white' : 'bg-green-600 border-green-400 text-white'}`}>
                        <AlertCircle size={16} />
                        <span className="font-black text-[11px] uppercase tracking-wide">{toast.message}</span>
                        <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 hover:opacity-70">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}
            {/* ── CANCEL GC MODAL ── */}
            {showCancelModal && trackingData && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-red-100">
                        <div className="p-6 bg-gradient-to-r from-red-600 to-red-800 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Trash2 size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight">Cancel Waybill</h2>
                                    <p className="text-red-100 text-[10px] font-bold uppercase tracking-widest">{trackingData.gc_number}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-4">
                                <AlertCircle className="text-red-600 shrink-0" size={20} />
                                <p className="text-xs text-red-800 font-medium leading-relaxed">
                                    <strong>Warning:</strong> Cancelling this waybill will reverse all financial entries and mark it as void. This action cannot be undone.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason for Cancellation</label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Enter detailed reason for cancellation..."
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl h-24 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
                            <button
                                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                                className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-500 font-black text-xs uppercase rounded-xl hover:bg-gray-100 transition-all"
                            >
                                Nevermind
                            </button>
                            <button
                                onClick={handleCancelGC}
                                disabled={isCancelling || !cancelReason.trim()}
                                className="flex-1 px-6 py-3 bg-red-600 text-white font-black text-xs uppercase rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isCancelling ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Help Modal */}
            {showHelp && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-emerald-100">
                        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <HelpCircle size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Tracking Guide</h2>
                                    <p className="text-emerald-100 text-xs">How to interpret shipment status & journey</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowHelp(false)}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-700 font-bold uppercase text-xs tracking-wider">
                                        <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">✓</span>
                                        Status Badges
                                    </div>
                                    <ul className="space-y-3 text-sm text-gray-600 ml-10">
                                        <li>• <span className="font-semibold text-emerald-600">DISPATCHED:</span> Currently on a vehicle moving to a hub.</li>
                                        <li>• <span className="font-semibold text-teal-600">INWARDED:</span> Safely arrived at the destination branch.</li>
                                        <li>• <span className="font-semibold text-green-600">Delivered:</span> Final delivery completed to the consignee.</li>
                                    </ul>
                                </section>

                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-blue-700 font-bold uppercase text-xs tracking-wider">
                                        <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">ℹ</span>
                                        Journey Timeline
                                    </div>
                                    <ul className="space-y-3 text-sm text-gray-600 ml-10">
                                        <li>• The <span className="font-semibold text-gray-800">Timeline</span> shows every milestone from booking to delivery.</li>
                                        <li>• Click on <span className="font-semibold text-amber-600">TripSheet Details</span> to see vehicle and driver info for any transit.</li>
                                    </ul>
                                </section>

                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-purple-700 font-bold uppercase text-xs tracking-wider">
                                        <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">★</span>
                                        Quick Actions
                                    </div>
                                    <ul className="space-y-3 text-sm text-gray-600 ml-10">
                                        <li>• <span className="font-semibold text-gray-800">Print Waybill:</span> Generates a PDF of the booking receipt.</li>
                                        <li>• <span className="font-semibold text-gray-800">View ACK/POD:</span> Displays the digital scan of Proof of Delivery (if uploaded).</li>
                                    </ul>
                                </section>

                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-orange-700 font-bold uppercase text-xs tracking-wider">
                                        <span className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">⚡</span>
                                        Live Updates
                                    </div>
                                    <div className="ml-10">
                                        <p className="text-xs text-gray-500 leading-relaxed italic">
                                            The data on this page is "Live". As soon as a branch scans the barcode or marks a delivery, it reflects here instantly.
                                        </p>
                                    </div>
                                </section>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setShowHelp(false)}
                                className="px-6 py-2 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-all shadow-lg"
                            >
                                Got It!
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                .print-only-receipt { display: none; }

                @media print {
                    /* Hide EVERYTHING except the printable block when 'is-printing-receipt' is active */
                    body.is-printing-receipt .gc-track-main-content,
                    body.is-printing-receipt .no-print,
                    body.is-printing-receipt nav,
                    body.is-printing-receipt header,
                    body.is-printing-receipt footer {
                        display: none !important;
                    }

                    body.is-printing-receipt .print-only-receipt {
                        display: block !important;
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        z-index: 99999 !important;
                        background: white !important;
                        visibility: visible !important;
                    }

                    body.is-printing-receipt .receipt-container {
                        display: flex !important;
                        flex-direction: column !important;
                        width: 100% !important;
                        height: 287mm !important;
                        overflow: hidden !important;
                    }

                    /* Content Only Mode specific overrides */
                    body.is-printing-receipt.is-content-only .receipt-copy {
                        border: none !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </div>
    )
}

export default GCTracking
