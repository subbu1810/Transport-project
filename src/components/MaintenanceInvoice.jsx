import React from 'react';

const MaintenanceInvoice = ({ bill, companyInfo }) => {
    if (!bill) return null;

    const printInvoice = () => {
        const printContents = document.getElementById('maintenance-invoice').innerHTML;
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); // To restore React state
    };

    return (
        <div id="maintenance-invoice" className="hidden">
            <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', color: '#333', maxWidth: '800px', margin: 'auto', backgroundColor: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #16a34a', paddingBottom: '20px', marginBottom: '30px' }}>
                    <div>
                        <h1 style={{ color: '#16a34a', margin: '0 0 5px 0', fontSize: '24px' }}>{companyInfo.name}</h1>
                        <p style={{ margin: '2px 0', fontSize: '12px' }}>CIN: {companyInfo.cin}</p>
                        <p style={{ margin: '2px 0', fontSize: '12px' }}>GST: {companyInfo.gst}</p>
                        <p style={{ margin: '10px 0 2px 0', fontSize: '12px', fontWeight: 'bold' }}>Address:</p>
                        <p style={{ margin: '0', fontSize: '12px', width: '250px' }}>{companyInfo.address}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#666' }}>PAYMENT RECEIPT</h2>
                        <p style={{ margin: '2px 0', fontSize: '13px' }}><strong>Receipt No:</strong> INV-{bill.id}-{bill.bill_month}{bill.bill_year}</p>
                        <p style={{ margin: '2px 0', fontSize: '13px' }}><strong>Date:</strong> {new Date(bill.paid_at).toLocaleDateString()}</p>
                        <p style={{ margin: '2px 0', fontSize: '13px' }}><strong>Status:</strong> <span style={{ color: '#16a34a', fontWeight: 'bold' }}>PAID</span></p>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                    <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#777', textTransform: 'uppercase', fontWeight: 'bold' }}>Bill To</p>
                        <p style={{ margin: '0', fontSize: '15px', fontWeight: 'bold' }}>{bill.transport?.transport_name || 'Transport Company'}</p>
                        <p style={{ margin: '2px 0', fontSize: '13px' }}>{bill.branch?.branch_name ? `Branch: ${bill.branch.branch_name}` : ''}</p>
                        <p style={{ margin: '2px 0', fontSize: '13px' }}>{bill.transport?.address || ''}</p>
                        <div style={{ marginTop: '5px' }}>
                            {bill.transport?.mobile && <p style={{ margin: '0', fontSize: '12px' }}><strong>Phone:</strong> {bill.transport.mobile}</p>}
                            {bill.transport?.email && <p style={{ margin: '0', fontSize: '12px' }}><strong>Email:</strong> {bill.transport.email}</p>}
                            {bill.transport?.gst_number && <p style={{ margin: '0', fontSize: '12px' }}><strong>GST:</strong> {bill.transport.gst_number}</p>}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#777', textTransform: 'uppercase', fontWeight: 'bold' }}>Payment Details</p>
                        <p style={{ margin: '2px 0', fontSize: '13px' }}><strong>Transaction ID:</strong> {bill.razorpay_payment_id || 'N/A'}</p>
                        <p style={{ margin: '2px 0', fontSize: '13px' }}><strong>Method:</strong> Online Payment (Razorpay)</p>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                            <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px' }}>Description</th>
                            <th style={{ textAlign: 'center', padding: '12px', fontSize: '13px' }}>Billing Period</th>
                            <th style={{ textAlign: 'center', padding: '12px', fontSize: '13px' }}>GC Count</th>
                            <th style={{ textAlign: 'right', padding: '12px', fontSize: '13px' }}>Rate</th>
                            <th style={{ textAlign: 'right', padding: '12px', fontSize: '13px' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '15px 12px', fontSize: '14px' }}>Software Maintenance & Subscription Services</td>
                            <td style={{ textAlign: 'center', padding: '15px 12px', fontSize: '14px' }}>{bill.bill_month}/{bill.bill_year}</td>
                            <td style={{ textAlign: 'center', padding: '15px 12px', fontSize: '14px' }}>{bill.gc_count}</td>
                            <td style={{ textAlign: 'right', padding: '15px 12px', fontSize: '14px' }}>₹{bill.rate}</td>
                            <td style={{ textAlign: 'right', padding: '15px 12px', fontSize: '14px', fontWeight: 'bold' }}>₹{bill.total_amount}</td>
                        </tr>
                    </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ width: '250px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #333' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Total Amount Paid</span>
                            <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#16a34a' }}>₹{bill.total_amount}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
                    <div style={{ width: '60%' }}>
                        <p style={{ margin: '0', fontSize: '11px', color: '#777' }}>This is a computer-generated receipt and does not require a physical signature.</p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', fontWeight: 'bold', color: '#16a34a' }}>Thank you for your business!</p>
                        <div style={{ marginTop: '10px', fontSize: '11px', color: '#999' }}>
                            Contact: {companyInfo.contact} | Email: {companyInfo.mail}
                        </div>
                    </div>
                    <div style={{ width: '40%', textAlign: 'center' }}>
                        <div style={{ border: '2px solid #16a34a', borderRadius: '8px', padding: '10px', display: 'inline-block', position: 'relative', backgroundColor: 'rgba(22, 163, 74, 0.05)' }}>
                            <p style={{ margin: '0', color: '#16a34a', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }}>Digitally Signed</p>
                            <p style={{ margin: '2px 0 0 0', color: '#666', fontSize: '10px' }}>{companyInfo.name}</p>
                            <p style={{ margin: '2px 0 0 0', color: '#999', fontSize: '9px' }}>{new Date(bill.paid_at).toLocaleString()}</p>
                            <div style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: '#16a34a', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '12px' }}>✓</div>
                        </div>
                        <p style={{ marginTop: '10px', fontSize: '13px', fontWeight: 'bold', color: '#333', borderTop: '1px solid #eee', paddingTop: '5px' }}>Authorized Signatory</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceInvoice;
