import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { CreditCard, AlertTriangle, CheckCircle, Clock, FileText, Download } from 'lucide-react';
import MaintenanceInvoice from '../components/MaintenanceInvoice';

const MaintenanceBilling = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [selectedBill, setSelectedBill] = useState(null);

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
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Maintenance Billing</h1>
                <p className="text-gray-600">View and pay your monthly maintenance fees based on GC counts.</p>
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
                                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No billing records found.</td>
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

            {/* Hidden Invoice Template for Printing */}
            <MaintenanceInvoice bill={selectedBill} companyInfo={companyInfo} />
        </div>
    );
};

export default MaintenanceBilling;
