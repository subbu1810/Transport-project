import React, { useState } from 'react';
import { Search, MapPin, Calendar, CheckCircle2, AlertCircle, Building2, ChevronDown, Filter, HelpCircle, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const UpdateDelivery = () => {
    const [gcNumber, setGcNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deliveryData, setDeliveryData] = useState(null);
    const [status, setStatus] = useState('Arrived at Destination');
    const [remarks, setRemarks] = useState('');
    const [receiverName, setReceiverName] = useState('');
    const [discount, setDiscount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [cashReceived, setCashReceived] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isEligible, setIsEligible] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [selectedBranchName, setSelectedBranchName] = useState('');
    const [filterBranchId, setFilterBranchId] = useState('');
    const [notDeliveredReason, setNotDeliveredReason] = useState('');
    const [notDeliveredReasonOther, setNotDeliveredReasonOther] = useState('');
    const [rtoReason, setRtoReason] = useState('');
    const [rtoReasonOther, setRtoReasonOther] = useState('');
    const [redirectBranch, setRedirectBranch] = useState('');
    const [redirectReason, setRedirectReason] = useState('');
    const [redirectReasonOther, setRedirectReasonOther] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successModalData, setSuccessModalData] = useState({ title: '', text: '' });
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalData, setErrorModalData] = useState({ title: '', text: '' });
    const [showHelp, setShowHelp] = useState(false);

    const NOT_DELIVERED_REASONS = [
        'Party Refused to Accept',
        'Party Not Available / Absent',
        'Incorrect / Incomplete Address',
        'Payment Not Ready (To Pay)',
        'Damaged / Rejected by Consignee',
        'Natural Calamity / Road Block',
        'Other'
    ];

    const RTO_REASONS = [
        'Address Not Found',
        'Consignee Relocated',
        'Consignee Refused Delivery',
        'Duplicate Shipment',
        'Damaged in Transit',
        'Incorrect Consignee Details',
        'Consignee Requested Return',
        'Other'
    ];

    React.useEffect(() => {
        const adminInfo = JSON.parse(localStorage.getItem('user')) || JSON.parse(localStorage.getItem('admin'));
        if (adminInfo) {
            setCurrentUser(adminInfo);
            setSelectedBranchId(adminInfo.branch_id || '');
            setSelectedBranchName(adminInfo.branch_name || '');
            if (adminInfo.role === 'superadmin') {
                fetchBranches();
            } else {
                setFilterBranchId(adminInfo.branch_id || '');
            }
        }
    }, []);

    const fetchBranches = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/branches`);
            const data = await response.json();
            if (data.success) setBranches(data.data);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const DELIVERABLE_STATUSES = ['BOOKED', 'PENDING', 'DISPATCHED', 'RECEIVED', 'INWARDED', 'LOCAL_TRIP', 'Arrived at Destination', 'Out for Delivery'];

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setDeliveryData(null);
        setMessage({ type: '', text: '' });
        setShowSuccessModal(false);
        setIsEligible(false);

        try {
            const response = await fetch(`${API_BASE_URL}/waybills/search/${gcNumber}`);
            const data = await response.json();

            if (data.success) {
                const gc = data.data;
                setDeliveryData(gc);
                setStatus('Delivered');
                setRemarks(gc.remarks || '');
                setReceiverName(gc.receiver_name || '');
                setDiscount(gc.discount?.toString() || '');

                const activeBranchId = filterBranchId ? parseInt(filterBranchId) : null;
                if (activeBranchId) {
                    const bookedHere = gc.origin_branch_id === activeBranchId;
                    const inwardedHere = gc.inward_branch_id === activeBranchId;
                    if (!bookedHere && !inwardedHere) {
                        const activeBranchName = branches.find(b => b.id === activeBranchId)?.branch_name || selectedBranchName || 'your branch';
                        setIsEligible(false);
                        setMessage({ type: 'error', text: `Branch Mismatch - ${gcNumber} was not booked or inwarded at ${activeBranchName}. You cannot update delivery for this GC.` });
                        return;
                    }
                }

                const currentStatus = (gc.status || '').toUpperCase();
                const isDelivered = currentStatus === 'DELIVERED';

                if (isDelivered) {
                    setIsEligible(false);
                    setMessage({ type: 'success', text: `GC ${gcNumber} has already been DELIVERED on ${gc.delivered_at || 'a previous date'}.` });
                } else {
                    const activeBranchId2 = filterBranchId ? parseInt(filterBranchId) : null;
                    const bookedHere = activeBranchId2 && gc.origin_branch_id === activeBranchId2;
                    let eligible = DELIVERABLE_STATUSES.some(s => s.toUpperCase() === currentStatus);
                    if (currentStatus === 'BOOKED' && !bookedHere) eligible = false;
                    setIsEligible(eligible);
                    if (!eligible) {
                        const errorMsg = (currentStatus === 'BOOKED' || currentStatus === 'PENDING' || currentStatus === 'DISPATCHED')
                            ? `GC is currently "${gc.status}" - direct delivery is only allowed at the Origin Branch for this status.`
                            : `GC status is "${gc.status}" - only Inwarded or Local Trip GCs can be delivered.`;
                        setMessage({ type: 'error', text: errorMsg });
                    }
                }
            } else {
                setMessage({ type: 'error', text: data.message || 'GC not found' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Connection failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        const isNotDelivered = status === 'Not Delivered';
        const isRTO = status === 'RTO (Return to Origin)';
        const isRedirected = status === 'Redirected';

        if (isNotDelivered && !notDeliveredReason) { setMessage({ type: 'error', text: 'Please select a reason for non-delivery' }); return; }
        if (isNotDelivered && notDeliveredReason === 'Other' && !notDeliveredReasonOther.trim()) { setMessage({ type: 'error', text: 'Please specify the reason in the remarks field' }); return; }
        if (isRTO && !rtoReason) { setMessage({ type: 'error', text: 'Please select a reason for RTO' }); return; }
        if (isRTO && rtoReason === 'Other' && !rtoReasonOther.trim()) { setMessage({ type: 'error', text: 'Please specify the RTO reason' }); return; }
        if (isRedirected && !redirectBranch) { setMessage({ type: 'error', text: 'Please select a target branch for redirection' }); return; }
        if (isRedirected && !redirectReason) { setMessage({ type: 'error', text: 'Please select a reason for redirecting' }); return; }
        if (isRedirected && redirectReason === 'Other' && !redirectReasonOther.trim()) { setMessage({ type: 'error', text: 'Please specify the redirect reason' }); return; }

        setUpdating(true);

        const finalRemarks = isNotDelivered
            ? (notDeliveredReason === 'Other' ? notDeliveredReasonOther : notDeliveredReason)
            : isRTO
                ? (rtoReason === 'Other' ? rtoReasonOther : rtoReason)
                : isRedirected
                    ? (redirectReason === 'Other' ? redirectReasonOther : redirectReason)
                    : remarks;

        const formData = new FormData();
        formData.append('gc_number', gcNumber);
        formData.append('status', status);
        formData.append('remarks', finalRemarks);
        formData.append('receiver_name', status === 'Delivered' ? receiverName : '');
        formData.append('discount', status === 'Delivered' ? (parseFloat(discount) || 0) : 0);
        if (isRedirected) formData.append('redirect_branch_id', redirectBranch);
        formData.append('delivered_branch_id', selectedBranchId);
        formData.append('delivered_branch_name', selectedBranchName);
        if (status === 'Delivered' && deliveryData?.account_type === 'topay') {
            formData.append('payment_method', paymentMethod);
            formData.append('cash_received', cashReceived ? 'true' : 'false');
        }

        try {
            const response = await fetch(`${API_BASE_URL}/waybills/update-delivery-status`, { method: 'POST', body: formData });
            const data = await response.json();

            if (data.success) {
                if (status === 'Not Delivered') {
                    setSuccessModalData({ title: 'Failure Recorded', text: 'GC reverted to INWARDED for next day delivery.' });
                } else if (status === 'Redirected') {
                    setSuccessModalData({ title: 'GC Redirected', text: 'Target branch updated and GC safely reverted to INWARDED.' });
                } else if (status === 'RTO (Return to Origin)') {
                    setSuccessModalData({ title: 'RTO Initiated', text: 'GC target flipped to origin and safely reverted to INWARDED for return transit.' });
                } else {
                    setSuccessModalData({ title: 'Success', text: 'Delivery status updated successfully!' });
                }
                setShowSuccessModal(true);
                setDeliveryData(data.data);
                setNotDeliveredReason(''); setNotDeliveredReasonOther('');
                setRtoReason(''); setRtoReasonOther('');
                setRedirectBranch(''); setRedirectReason(''); setRedirectReasonOther('');
                const updatedStatus = (data.data.status || '').toUpperCase();
                setIsEligible(DELIVERABLE_STATUSES.some(s => s.toUpperCase() === updatedStatus));
            } else {
                setErrorModalData({ title: 'Update Failed', text: data.message || 'The server encountered an error while processing the delivery update.' });
                setShowErrorModal(true);
            }
        } catch (error) {
            setErrorModalData({ title: 'Connection Error', text: 'Failed to reach the server. Please check your internet connection or try again later.' });
            setShowErrorModal(true);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="p-3 bg-gray-50 min-h-screen">
            <div className="w-full">
                <div className="flex items-center gap-2 mb-3">
                    <h1 className="text-lg font-black text-gray-800 flex items-center gap-1.5">
                        <CheckCircle2 className="text-green-600" size={18} />
                        Update Delivery Status
                    </h1>
                    <button onClick={() => setShowHelp(true)} className="p-1 bg-white text-green-600 rounded-full shadow-sm hover:shadow-md hover:bg-green-50 transition-all border border-green-100 group" title="Delivery Guide">
                        <HelpCircle size={14} className="group-hover:scale-110 transition-transform" />
                    </button>
                </div>

                {message.text && !showSuccessModal && (
                    <div className={`mb-3 p-2.5 rounded-lg flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                        {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                        <p className="text-xs font-bold">{message.text}</p>
                    </div>
                )}

                {/* Branch Filter Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2.5 mb-3">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="p-1.5 bg-green-100 rounded-lg text-green-700"><Filter size={12} /></div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Branch</span>
                        </div>
                        {currentUser?.role === 'superadmin' ? (
                            <div className="flex items-center gap-2 flex-1">
                                <div className="relative w-56">
                                    <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                                    <select
                                        value={filterBranchId}
                                        onChange={(e) => {
                                            const branchId = e.target.value;
                                            setFilterBranchId(branchId);
                                            const branch = branches.find(b => b.id.toString() === branchId);
                                            setSelectedBranchId(branchId);
                                            setSelectedBranchName(branch ? branch.branch_name : '');
                                            setDeliveryData(null);
                                            setMessage({ type: '', text: '' });
                                        }}
                                        className="w-full pl-7 pr-3 py-1 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-500 outline-none font-bold text-gray-700 text-xs appearance-none bg-gray-50 cursor-pointer"
                                    >
                                        <option value="">-- All Branches --</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name} ({b.branch_code})</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={10} />
                                </div>
                                {filterBranchId && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase">
                                        Filtering: {branches.find(b => b.id.toString() === filterBranchId)?.branch_name || 'Branch'}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
                                    <Building2 size={12} className="text-green-600" />
                                    <span className="font-black text-green-800 text-xs uppercase">{selectedBranchName || 'Your Branch'}</span>
                                    <span className="ml-1 px-1 py-0.2 bg-green-600 text-white text-[8px] font-black rounded uppercase">Locked</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={gcNumber}
                                onChange={(e) => setGcNumber(e.target.value)}
                                placeholder="Enter GC Number (e.g., GC-12345)"
                                className="w-full pl-8 pr-3 py-1 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 outline-none font-medium text-xs transition-all"
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading} className="px-4 py-1.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-xs">
                            {loading ? 'Searching...' : 'Search GC'}
                        </button>
                    </form>
                </div>

                {/* GC Details */}
                {deliveryData && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                            {/* Header */}
                            <div className="bg-green-600 px-6 py-4 flex justify-between items-center">
                                <h2 className="text-white font-bold text-lg">GC Details: {deliveryData.gc_number}</h2>
                                <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider border ${isEligible ? 'bg-white/20 text-white border-white/30' : 'bg-red-400 text-white border-red-300'}`}>
                                    {deliveryData.status}
                                </span>
                            </div>

                            {/* Status context banners */}
                            {(!isEligible && (deliveryData.status || '').toUpperCase() === 'DELIVERED') && (
                                <div className="bg-green-50 border-b-4 border-green-500 px-6 py-4 flex items-center gap-4">
                                    <div className="p-2 bg-green-100 rounded-full"><CheckCircle2 className="text-green-600 shrink-0" size={24} /></div>
                                    <div>
                                        <p className="text-base font-black text-green-900 uppercase tracking-tight">Fully Delivered</p>
                                        <p className="text-xs text-green-700 font-bold">This shipment has been successfully delivered and processed. All records are finalized.</p>
                                    </div>
                                </div>
                            )}
                            {(!isEligible && (deliveryData.status || '').toUpperCase() !== 'DELIVERED') && (
                                <div className="bg-amber-50 border-b-4 border-amber-500 px-6 py-4 flex items-center gap-4">
                                    <div className="p-2 bg-amber-100 rounded-full"><AlertCircle className="text-amber-600 shrink-0" size={24} /></div>
                                    <div>
                                        <p className="text-base font-black text-amber-900 uppercase tracking-tight">Delivery Not Allowed</p>
                                        <p className="text-xs text-amber-700 font-bold">Current Status: <span className="underline decoration-amber-400 decoration-2 underline-offset-2">{deliveryData.status}</span>. Needs Inward or Local Trip assignment.</p>
                                    </div>
                                </div>
                            )}

                            {/* GC Info */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-green-50 rounded-lg text-green-600"><Calendar size={18} /></div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Booking Date</p>
                                            <p className="text-gray-800 font-medium">{deliveryData.bill_date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-green-50 rounded-lg text-green-600"><MapPin size={18} /></div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Route</p>
                                            <p className="text-gray-800 font-medium">{deliveryData.origin_branch?.branch_name} {'→'} {deliveryData.destination?.city_name}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Consignor</p>
                                        <p className="text-gray-800 font-medium">{deliveryData.consignor?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Consignee</p>
                                        <p className="text-gray-800 font-medium">{deliveryData.consignee?.name}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Form */}
                            <div className="px-6 pb-6 space-y-6">
                                {isEligible ? (
                                    <>
                                        <div className="border-t border-gray-100 pt-6">
                                            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider underline decoration-green-500 underline-offset-4">Update Delivery Information</h3>
                                            <div className={`grid grid-cols-1 ${status === 'Delivered' ? (deliveryData?.account_type === 'topay' ? 'md:grid-cols-4' : 'md:grid-cols-3') : 'md:grid-cols-2'} gap-4`}>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                                                    <select
                                                        value={status}
                                                        onChange={(e) => {
                                                            setStatus(e.target.value);
                                                            setNotDeliveredReason(''); setNotDeliveredReasonOther('');
                                                            setRtoReason(''); setRtoReasonOther('');
                                                            setRedirectBranch(''); setRedirectReason(''); setRedirectReasonOther('');
                                                        }}
                                                        className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-medium"
                                                    >
                                                        <option>Delivered</option>
                                                        <option>RTO (Return to Origin)</option>
                                                        <option>Redirected</option>
                                                        <option>Not Delivered</option>
                                                    </select>
                                                </div>

                                                {status === 'Not Delivered' && (
                                                    <div className="md:col-span-1">
                                                        <label className="block text-xs font-bold text-red-500 uppercase mb-1">Reason <span className="text-red-500">*</span></label>
                                                        <select value={notDeliveredReason} onChange={(e) => setNotDeliveredReason(e.target.value)} className={`w-full p-2 border-2 rounded-lg outline-none focus:ring-2 focus:ring-red-400 font-medium ${notDeliveredReason ? 'border-red-400 bg-red-50' : 'border-red-300'}`}>
                                                            <option value="">-- Select Reason --</option>
                                                            {NOT_DELIVERED_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                    </div>
                                                )}
                                                {status === 'Not Delivered' && notDeliveredReason === 'Other' && (
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-bold text-red-500 uppercase mb-1">Specify Reason <span className="text-red-500">*</span></label>
                                                        <input type="text" value={notDeliveredReasonOther} onChange={(e) => setNotDeliveredReasonOther(e.target.value)} placeholder="Describe the reason..." className="w-full p-2 border-2 border-red-300 bg-red-50 rounded-lg outline-none focus:ring-2 focus:ring-red-400 font-medium" />
                                                    </div>
                                                )}

                                                {status === 'RTO (Return to Origin)' && (
                                                    <div className="md:col-span-1">
                                                        <label className="block text-xs font-bold text-orange-500 uppercase mb-1">RTO Reason <span className="text-orange-500">*</span></label>
                                                        <select value={rtoReason} onChange={(e) => setRtoReason(e.target.value)} className={`w-full p-2 border-2 rounded-lg outline-none focus:ring-2 focus:ring-orange-400 font-medium ${rtoReason ? 'border-orange-400 bg-orange-50' : 'border-orange-300'}`}>
                                                            <option value="">-- Select RTO Reason --</option>
                                                            {RTO_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                    </div>
                                                )}
                                                {status === 'RTO (Return to Origin)' && rtoReason === 'Other' && (
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-bold text-orange-500 uppercase mb-1">Specify RTO Reason <span className="text-orange-500">*</span></label>
                                                        <input type="text" value={rtoReasonOther} onChange={(e) => setRtoReasonOther(e.target.value)} placeholder="Describe the RTO reason..." className="w-full p-2 border-2 border-orange-300 bg-orange-50 rounded-lg outline-none focus:ring-2 focus:ring-orange-400 font-medium" />
                                                    </div>
                                                )}

                                                {status === 'Redirected' && (
                                                    <>
                                                        <div className="md:col-span-1">
                                                            <label className="block text-xs font-bold text-blue-500 uppercase mb-1">Redirect To <span className="text-blue-500">*</span></label>
                                                            <select value={redirectBranch} onChange={(e) => setRedirectBranch(e.target.value)} className={`w-full p-2 border-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 font-medium ${redirectBranch ? 'border-blue-400 bg-blue-50' : 'border-blue-300'}`}>
                                                                <option value="">-- Select Target Branch --</option>
                                                                {branches.filter(b => b.id.toString() !== deliveryData?.destination_id?.toString()).map(b => <option key={b.id} value={b.id}>{b.branch_name} ({b.branch_code})</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="md:col-span-1">
                                                            <label className="block text-xs font-bold text-blue-500 uppercase mb-1">Reason <span className="text-blue-500">*</span></label>
                                                            <select value={redirectReason} onChange={(e) => setRedirectReason(e.target.value)} className={`w-full p-2 border-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 font-medium ${redirectReason ? 'border-blue-400 bg-blue-50' : 'border-blue-300'}`}>
                                                                <option value="">-- Select Reason --</option>
                                                                {['Customer Relocated', 'Wrongly Routed', 'Address Not Serviceable', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
                                                            </select>
                                                        </div>
                                                        {redirectReason === 'Other' && (
                                                            <div className="md:col-span-2">
                                                                <label className="block text-xs font-bold text-blue-500 uppercase mb-1">Specify Reason <span className="text-blue-500">*</span></label>
                                                                <input type="text" value={redirectReasonOther} onChange={(e) => setRedirectReasonOther(e.target.value)} placeholder="Describe the redirect reason..." className="w-full p-2 border-2 border-blue-300 bg-blue-50 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 font-medium" />
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                {status === 'Delivered' && (
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Receiver Name</label>
                                                        <input type="text" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="Enter receiver name..." className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-medium" />
                                                    </div>
                                                )}
                                                {status === 'Delivered' && deliveryData?.account_type === 'topay' && (
                                                    <>
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount (Rs.)</label>
                                                            <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-medium" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                                                Payment Mode (Net: Rs.{Math.max(0, deliveryData.grand_total - (parseFloat(discount) || 0))})
                                                            </label>
                                                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-medium">
                                                                <option value="cash">Cash</option>
                                                                <option value="upi">UPI</option>
                                                                <option value="bank_transfer">Bank Transfer</option>
                                                            </select>
                                                        </div>
                                                        {/* Cash Received Confirmation */}
                                                        <div className="md:col-span-2">
                                                            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                                                cashReceived
                                                                    ? 'bg-green-50 border-green-500 text-green-800'
                                                                    : 'bg-amber-50 border-amber-400 text-amber-800'
                                                            }`}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={cashReceived}
                                                                    onChange={(e) => setCashReceived(e.target.checked)}
                                                                    className="w-4 h-4 accent-green-600 cursor-pointer"
                                                                />
                                                                <span className="text-xs font-black uppercase tracking-wider">
                                                                    {cashReceived
                                                                        ? `✓ Cash/Payment of ₹${Math.max(0, deliveryData.grand_total - (parseFloat(discount) || 0))} Confirmed Received`
                                                                        : `⚠ Tick to confirm payment of ₹${Math.max(0, deliveryData.grand_total - (parseFloat(discount) || 0))} was collected`
                                                                    }
                                                                </span>
                                                            </label>
                                                            {!cashReceived && (
                                                                <p className="text-[10px] text-amber-600 font-bold mt-1 ml-1">If unchecked, GC will be marked delivered but payment stays PENDING</p>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                                {status !== 'Not Delivered' && status !== 'RTO (Return to Origin)' && status !== 'Redirected' && (
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Remarks</label>
                                                        <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Enter remarks..." className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-medium" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-8 flex justify-end">
                                                <button
                                                    onClick={handleUpdate}
                                                    disabled={(
                                                        status === 'Not Delivered' ? !notDeliveredReason
                                                            : status === 'RTO (Return to Origin)' ? !rtoReason
                                                                : status === 'Redirected' ? (!redirectBranch || !redirectReason)
                                                                    : false
                                                    ) || updating}
                                                    className={`px-10 py-3 text-white font-black rounded-xl shadow-xl transition-all active:scale-95 flex items-center gap-2 uppercase tracking-wider text-sm ${
                                                        (status === 'Not Delivered' ? !!notDeliveredReason
                                                            : status === 'RTO (Return to Origin)' ? !!rtoReason
                                                                : status === 'Redirected' ? (!!redirectBranch && !!redirectReason)
                                                                    : true)
                                                        ? 'bg-green-600 shadow-green-200 hover:bg-green-700'
                                                        : 'bg-gray-400 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {updating ? (
                                                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Updating...</>
                                                    ) : (
                                                        <><CheckCircle2 size={18} />Update Delivery Status</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    (deliveryData.status || '').toUpperCase() === 'DELIVERED' ? (
                                        <div className="border-t border-gray-100 pt-8 pb-4 flex flex-col items-center justify-center gap-4 text-center">
                                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border-4 border-green-100">
                                                <CheckCircle2 size={40} className="text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-gray-900 uppercase tracking-tighter">Delivery Confirmed</p>
                                                <p className="text-sm text-gray-500 font-bold max-w-xs mx-auto">
                                                    Payment and proof for GC <span className="text-green-600 underline underline-offset-4 decoration-2">{deliveryData.gc_number}</span> have been successfully recorded.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border-t border-gray-100 pt-8 pb-4 flex flex-col items-center justify-center gap-4 text-center">
                                            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center border-4 border-amber-100">
                                                <AlertCircle size={40} className="text-amber-500" />
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-gray-900 uppercase tracking-tighter">Action Required</p>
                                                <p className="text-sm text-gray-500 font-bold max-w-xs mx-auto">
                                                    This GC is currently <span className="text-amber-600 underline underline-offset-4 decoration-2">{deliveryData.status}</span>. Move it to <strong>Warehouse Inward</strong> to enable delivery.
                                                </p>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {!deliveryData && !loading && (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="inline-flex p-4 bg-gray-50 rounded-full text-gray-400 mb-4"><AlertCircle size={40} /></div>
                        <h3 className="text-lg font-bold text-gray-600 uppercase tracking-widest">No GC Selected</h3>
                        <p className="text-gray-400 text-sm font-medium">Search for a GC number to update its delivery status.</p>
                    </div>
                )}

                {/* Success Modal */}
                {showSuccessModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="bg-green-500 p-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner mb-4"><CheckCircle2 size={36} className="text-green-500" /></div>
                                <h3 className="text-2xl font-black text-white tracking-tight">{successModalData.title}</h3>
                            </div>
                            <div className="p-6 text-center">
                                <p className="text-gray-600 font-medium text-base mb-8">{successModalData.text}</p>
                                <button onClick={() => setShowSuccessModal(false)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 uppercase tracking-wider text-sm">Dismiss</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Modal */}
                {showErrorModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border-2 border-red-500/20">
                            <div className="bg-red-500 p-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner mb-4"><AlertCircle size={36} className="text-red-500" /></div>
                                <h3 className="text-2xl font-black text-white tracking-tight leading-none uppercase">{errorModalData.title}</h3>
                            </div>
                            <div className="p-6 text-center">
                                <p className="text-gray-600 font-bold text-sm mb-8 leading-relaxed">{errorModalData.text}</p>
                                <button onClick={() => setShowErrorModal(false)} className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 font-black rounded-xl transition-colors outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 uppercase tracking-wider text-xs">Close &amp; Try Again</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Help Modal */}
            {showHelp && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-green-100">
                        <div className="p-6 bg-gradient-to-r from-green-600 to-emerald-700 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg"><HelpCircle size={24} /></div>
                                <div>
                                    <h2 className="text-xl font-bold">Delivery Update Guide</h2>
                                    <p className="text-green-100 text-xs">How to process final delivery or returns</p>
                                </div>
                            </div>
                            <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
                        </div>
                        <div className="p-8 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-green-700 font-bold uppercase text-xs tracking-wider">
                                        <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">1</span>
                                        Successful Delivery
                                    </div>
                                    <ul className="space-y-3 text-sm text-gray-600 ml-10">
                                        <li>Select <span className="font-semibold text-gray-800">Delivered</span> status.</li>
                                        <li>POD can be uploaded later via <span className="font-semibold text-gray-800">Upload POD</span> screen.</li>
                                        <li>Collect <span className="font-semibold text-gray-800">ToPay</span> amounts if applicable.</li>
                                    </ul>
                                </section>
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-red-700 font-bold uppercase text-xs tracking-wider">
                                        <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">!</span>
                                        Delivery Failures
                                    </div>
                                    <ul className="space-y-3 text-sm text-gray-600 ml-10">
                                        <li><span className="font-semibold text-gray-800">Not Delivered:</span> Use for temporary failures (party absent, etc.). GC stays at your branch.</li>
                                        <li><span className="font-semibold text-gray-800">RTO:</span> Use to return the goods to the origin branch.</li>
                                    </ul>
                                </section>
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-blue-700 font-bold uppercase text-xs tracking-wider">
                                        <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">2</span>
                                        Redirection
                                    </div>
                                    <ul className="space-y-3 text-sm text-gray-600 ml-10">
                                        <li>Use <span className="font-semibold text-gray-800">Redirected</span> if the party moved or address was wrongly routed.</li>
                                        <li>Select the <span className="font-semibold text-gray-800">New Target Branch</span> where the goods should go.</li>
                                    </ul>
                                </section>
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-purple-700 font-bold uppercase text-xs tracking-wider">
                                        <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">*</span>
                                        Branch Rules
                                    </div>
                                    <div className="ml-10">
                                        <p className="text-xs text-gray-500 leading-relaxed italic">You can only update deliveries for GCs that were either booked at your branch or inwarded at your branch.</p>
                                    </div>
                                </section>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button onClick={() => setShowHelp(false)} className="px-6 py-2 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-all shadow-lg">I Understand</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpdateDelivery;
