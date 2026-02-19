import React, { useState, useEffect } from 'react';
import { BarChart3, Search, Filter, Download, Loader2, Camera } from 'lucide-react';

const DeliveryStatusReport = ({ reportType = 'delivered' }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('All Branches');
    const [admin, setAdmin] = useState(null);

    const getReportTitle = () => {
        switch (reportType) {
            case 'undelivered': return 'UNDELIVERED GC REPORT';
            case 'rto': return 'RTO REPORT';
            default: return 'DELIVERED GC REPORT';
        }
    };

    const getCountLabel = () => {
        switch (reportType) {
            case 'undelivered': return 'Total Undelivered';
            case 'rto': return 'Total RTO';
            default: return 'Total Delivered';
        }
    };

    useEffect(() => {
        // Try 'user' first, then 'admin' as fallback
        const adminInfo = JSON.parse(localStorage.getItem('user')) || JSON.parse(localStorage.getItem('admin'));

        if (adminInfo) {
            setAdmin(adminInfo);
            const userRole = (adminInfo.role || '').toLowerCase();
            if (userRole === 'superadmin') {
                fetchBranches();
            } else {
                setSelectedBranch(adminInfo.branch_id);
            }
        }
    }, []);

    const fetchBranches = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/v1/branches/active');
            const data = await response.json();
            if (data.success) {
                setBranches(data.data);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                from_date: fromDate,
                to_date: toDate,
                branch_id: selectedBranch,
                report_type: reportType
            });
            const response = await fetch(`http://localhost:8000/api/v1/reports/delivery-status?${queryParams}`);
            const data = await response.json();
            if (data.success) {
                setReports(data.data);
            }
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (admin) {
            fetchReport();
        }
    }, [admin, selectedBranch, reportType]);

    return (
        <div className="p-4 bg-gray-50 min-h-screen font-sans no-print">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                        <div className="p-2 bg-emerald-600 rounded-lg shadow-md shadow-emerald-100">
                            <BarChart3 className="text-white" size={20} />
                        </div>
                        {getReportTitle()}
                    </h1>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">From Date</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-700 text-sm transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">To Date</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-700 text-sm transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Branch</label>
                            {admin?.role?.toLowerCase() === 'superadmin' ? (
                                <select
                                    value={selectedBranch}
                                    onChange={(e) => setSelectedBranch(e.target.value)}
                                    className="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-700 text-sm transition-all cursor-pointer shadow-sm"
                                >
                                    <option value="All Branches">All Branches</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.branch_name} ({branch.branch_code})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="w-full p-2 bg-gray-100 border border-gray-200 rounded-xl font-bold text-gray-500 text-sm shadow-sm">
                                    {admin?.branch_name || 'My Branch'}
                                </div>
                            )}
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={fetchReport}
                                disabled={loading}
                                className="w-full py-2 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 disabled:opacity-70 text-sm"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                                GENERATE
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                        <div className="flex items-center gap-4">
                            <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">{getCountLabel()}</span>
                                <span className="text-lg font-black text-emerald-600">{reports.length}</span>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 font-black rounded-lg hover:bg-emerald-600 hover:text-white transition-all text-[10px] tracking-widest uppercase">
                            <Download size={14} />
                            Export
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-emerald-600 border-b border-emerald-700">
                                    <th className="px-4 py-3 text-[10px] font-black text-emerald-50 uppercase tracking-widest">Date</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-emerald-50 uppercase tracking-widest">GC No</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-emerald-50 uppercase tracking-widest">Branch</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-emerald-50 uppercase tracking-widest">Consignee</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-emerald-50 uppercase tracking-widest">Destination</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-emerald-50 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-emerald-50 uppercase tracking-widest text-center">POC</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-emerald-50 uppercase tracking-widest">Receiver</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-emerald-50 uppercase tracking-widest">Update Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {reports.length > 0 ? (
                                    reports.map((item) => (
                                        <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors group">
                                            <td className="px-4 py-3 text-xs text-gray-500 font-bold">{item.bill_date}</td>
                                            <td className="px-4 py-3 text-xs text-emerald-600 font-black">{item.gc_number}</td>
                                            <td className="px-4 py-3 text-[10px] text-gray-500 font-black uppercase">
                                                {item.origin_branch?.branch_name || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-700 font-black uppercase whitespace-nowrap">{item.consignee?.name || 'N/A'}</td>
                                            <td className="px-4 py-3 text-xs text-gray-600 font-bold">{item.destination?.city_name || 'N/A'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${item.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                                                    item.status === 'RTO (Return to Origin)' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center">
                                                    {item.delivery_proof ? (
                                                        <a
                                                            href={`http://localhost:8000/storage/${item.delivery_proof}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center gap-1 group/btn"
                                                            title="View Delivery Proof"
                                                        >
                                                            <Camera size={14} />
                                                            <span className="text-[8px] font-black uppercase hidden group-hover/btn:inline">Open</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-300 italic">No POC</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-700 font-black">{item.receiver_name || '-'}</td>
                                            <td className="px-4 py-3 text-[10px] text-gray-400 font-bold">
                                                {item.delivered_at
                                                    ? new Date(item.delivered_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                                                    : new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                }
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-12 text-center text-gray-400 font-black uppercase tracking-widest text-[10px]">
                                            No records found {reportType !== 'delivered' && `for ${reportType} GC`}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};



export default DeliveryStatusReport;

