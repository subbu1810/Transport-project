import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { CreditCard, AlertTriangle, CheckCircle, Clock, FileText, Download, Play, RefreshCw, X, ShieldAlert } from 'lucide-react';
import MaintenanceInvoice from '../components/MaintenanceInvoice';

const MaintenanceBilling = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [selectedBill, setSelectedBill] = useState(null);

    // Manual Bill Generation State
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [genMonth, setGenMonth] = useState(new Date().getMonth() === 0 ? 12 : new Date().getMonth());
    const [genYear, setGenYear] = useState(new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear());
    const [genRate, setGenRate] = useState('');
    const [generating, setGenerating] = useState(false);
    const [genMessage, setGenMessage] = useState(null);

    const userObj = JSON.parse(localStorage.getItem('user') || '{}');
    const roleName = (typeof userObj?.role === 'string' ? userObj.role : userObj?.role?.role_name || '').toLowerCase();
    const canGenerateBills = roleName === 'superadmin' || roleName === 'super admin' || roleName === 'admin';

    const companyInfo = {
        name: 'S Square G Tech Solutions Pvt Ltd.',
        cin: 'U62099KA2025PTC211596',
        gst: 'NON - GST',
        address: 'No.6-1-3124/41B, Adarsh Colony, Sindhanur, Raichur, Sindhanur, Karnataka, India, 584128',
        contact: '7022477479, 7676814367, 9980190691',
        mail: 'info@ssquareg.com'
    };

    useEffect(() => {
        fetchBills();
        loadRazorpayScript();
    }, []);

    const loadRazorpayScript = () => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
    };

    const [pendingBill, setPendingBill] = useState(null);

    const fetchBills = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'super admin';
            const branchQuery = isSuperAdmin ? '' : `&branch_id=${user.branch_id || ''}`;
            
            // Fetch Pending Bill Dynamically
            const pendingRes = await fetch(`${API_BASE_URL}/maintenance/pending-bill?transport_id=${user.transport_id}${branchQuery}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const pendingData = await pendingRes.json();
            if (pendingData.success && pendingData.data && pendingData.data.length > 0) {
                // Pick the first one for logic tracking
                setPendingBill(pendingData.data[0]);
            } else {
                setPendingBill(null);
            }

            // Fetch History
            const response = await fetch(`${API_BASE_URL}/maintenance/bills?transport_id=${user.transport_id}${branchQuery}`);
            const data = await response.json();
            if (data.success) {
                setBills(data.data);
            }
        } catch (error) {
            console.error('Error fetching bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateBills = async () => {
        setGenerating(true);
        setGenMessage(null);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const payload = {
                month: parseInt(genMonth),
                year: parseInt(genYear),
                transport_id: user.transport_id,
            };
            if (genRate && parseFloat(genRate) > 0) {
                payload.rate = parseFloat(genRate);
            }

            const res = await fetch(`${API_BASE_URL}/maintenance/generate-bill`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setGenMessage({ type: 'success', text: data.message });
                fetchBills();
                setTimeout(() => {
                    setShowGenerateModal(false);
                    setGenMessage(null);
                }, 1800);
            } else {
                setGenMessage({ type: 'error', text: data.message || 'Failed to generate bills.' });
            }
        } catch (err) {
            console.error('Error generating bills:', err);
            setGenMessage({ type: 'error', text: 'Error connecting to server. Please try again.' });
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadInvoice = (bill) => {
        setSelectedBill(bill);
        setTimeout(() => {
            const printContents = document.getElementById('maintenance-invoice').innerHTML;
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Invoice - ${bill.id}</title>
                        <style>
                            body { margin: 0; padding: 0; }
                            @page { size: auto; margin: 0; }
                        </style>
                    </head>
                    <body>
                        ${printContents}
                        <script>
                            window.onload = function() {
                                window.print();
                                window.onafterprint = function() { window.close(); };
                            };
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }, 100);
    };

    const handlePayment = async (bill) => {
        setProcessingId(bill.id);
        try {
            // 1. Create Order
            const orderRes = await fetch(`${API_BASE_URL}/maintenance/orders/${bill.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const orderData = await orderRes.json();

            if (!orderData.success) {
                alert(orderData.message);
                return;
            }

            // 2. Open Razorpay
            const options = {
                key: orderData.key,
                amount: orderData.amount * 100,
                currency: 'INR',
                name: 'Transport Management System',
                description: `Maintenance Fee`,
                order_id: orderData.order_id,
                handler: async function (response) {
                    // 3. Verify Payment
                    const verifyRes = await fetch(`${API_BASE_URL}/maintenance/verify-payment`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                    });
                    const verifyData = await verifyRes.json();
                    if (verifyData.success) {
                        alert('Payment Successful!');
                        fetchBills();
                        window.location.reload(); // Refresh to clear alerts
                    } else {
                        alert('Verification Failed!');
                    }
                },
                prefill: {
                    name: JSON.parse(localStorage.getItem('user')).name,
                    email: JSON.parse(localStorage.getItem('user')).email,
                },
                theme: { color: '#16a34a' }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error('Payment Error:', error);
            alert('Something went wrong during payment initialization.');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading billing information...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Maintenance Billing</h1>
                    <p className="text-gray-600">View and pay your monthly maintenance fees based on GC counts.</p>
                </div>
                {canGenerateBills && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setGenMessage(null);
                                setShowGenerateModal(true);
                            }}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
                        >
                            <Play size={14} /> Generate Monthly Bills
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Billing Month</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">GC Count</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Amount</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {bills.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center">
                                    <div className="max-w-md mx-auto text-center space-y-3">
                                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <p className="text-gray-800 font-bold">No maintenance bills found for this transport.</p>
                                        <p className="text-gray-500 text-xs leading-relaxed">
                                            Maintenance bills are generated automatically on the 1st of each month based on booked GCs. 
                                            Ensure the <strong>Maintenance Rate (per GC)</strong> is set in <strong>Transport Master</strong>, or click <strong>Generate Monthly Bills</strong> to generate bills immediately.
                                        </p>
                                        {canGenerateBills && (
                                            <button
                                                onClick={() => {
                                                    setGenMessage(null);
                                                    setShowGenerateModal(true);
                                                }}
                                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm mt-2"
                                            >
                                                <Play size={13} /> Generate Bills Now
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            bills.map((bill) => (
                                <tr key={bill.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-bold text-gray-800 text-xs uppercase">
                                        {bill.branch ? bill.branch.branch_name : 'Unknown Branch'}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-700 text-xs">
                                        <div className="bg-gray-100 px-2 py-1 rounded inline-block">
                                            {bill.bill_month}/{bill.bill_year}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{bill.gc_count}</td>
                                    <td className="px-6 py-4 text-gray-600">₹{bill.rate}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">₹{bill.total_amount}</td>
                                    <td className="px-6 py-4">
                                        {bill.status === 'Paid' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle size={14} /> Paid
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                <Clock size={14} /> Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {bill.status === 'Pending' && (
                                            <button
                                                onClick={() => handlePayment(bill)}
                                                disabled={processingId === bill.id}
                                                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
                                            >
                                                <CreditCard size={14} />
                                                {processingId === bill.id ? 'Processing...' : 'Pay Now'}
                                            </button>
                                        )}
                                        {bill.status === 'Paid' && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-400 text-xs italic">Paid on {new Date(bill.paid_at).toLocaleDateString()}</span>
                                                <button
                                                    onClick={() => handleDownloadInvoice(bill)}
                                                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-bold transition"
                                                >
                                                    <Download size={14} /> Download Invoice
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-4">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <FileText size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-blue-900 mb-1">Billing Policy</h3>
                    <p className="text-blue-800 text-sm leading-relaxed">
                        Maintenance fees are calculated at the end of each month based on the total number of GC waybills booked. 
                        Please ensure timely payment to avoid service interruptions. For assistance, contact technical support.
                    </p>
                </div>
            </div>

            {/* Manual Bill Generation Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-base">Generate Monthly Maintenance Bills</h3>
                                <p className="text-xs text-blue-100">Calculate fees for all branches based on GC count</p>
                            </div>
                            <button
                                onClick={() => setShowGenerateModal(false)}
                                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {genMessage && (
                                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                                    genMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                    {genMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                                    <span>{genMessage.text}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Billing Month</label>
                                    <select
                                        value={genMonth}
                                        onChange={(e) => setGenMonth(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {[
                                            { m: 1, name: 'January' }, { m: 2, name: 'February' }, { m: 3, name: 'March' },
                                            { m: 4, name: 'April' }, { m: 5, name: 'May' }, { m: 6, name: 'June' },
                                            { m: 7, name: 'July' }, { m: 8, name: 'August' }, { m: 9, name: 'September' },
                                            { m: 10, name: 'October' }, { m: 11, name: 'November' }, { m: 12, name: 'December' }
                                        ].map(item => (
                                            <option key={item.m} value={item.m}>{item.name} ({item.m})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Billing Year</label>
                                    <input
                                        type="number"
                                        value={genYear}
                                        onChange={(e) => setGenYear(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Rate per GC (₹) <span className="text-gray-400 font-normal">(Optional override)</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Leave blank to use Transport Master rate"
                                    value={genRate}
                                    onChange={(e) => setGenRate(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-[11px] text-gray-500 mt-1">
                                    If left empty, the rate configured in Transport Master will be applied.
                                </p>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowGenerateModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={generating}
                                    onClick={handleGenerateBills}
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                                >
                                    {generating ? (
                                        <>
                                            <RefreshCw size={14} className="animate-spin" /> Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Play size={14} /> Calculate & Generate
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Invoice Template for Printing */}
            <MaintenanceInvoice bill={selectedBill} companyInfo={companyInfo} />
        </div>
    );
};

export default MaintenanceBilling;
