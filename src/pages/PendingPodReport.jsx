import React, { useState, useEffect } from 'react';
import { BarChart3, Search, Filter, Download, Loader2, Camera } from 'lucide-react';
import { API_BASE_URL, STORAGE_URL } from '../config/api';

const PendingPodReport = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('All Branches');
    const [admin, setAdmin] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
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
            const response = await fetch(`${API_BASE_URL}/branches/active`);
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
                branch_id: selectedBranch
            });
            const response = await fetch(`${API_BASE_URL}/reports/pending-pod?${queryParams}`);
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

    const handleExport = () => {
        if (reports.length === 0) return;

        const headers = [
            'Delivery Date',
            'GC No',
            'Booking Branch',
            'Delivered Branch',
            'Consignee',
            'Destination',
            'Status'
        ];

        const csvData = reports.map(item => [
            item.delivered_at ? new Date(item.delivered_at).toLocaleDateString('en-IN') : '-',
            item.gc_number,
            item.origin_branch?.branch_name || 'N/A',
            item.delivered_branch?.branch_name || item.delivered_branch_name || 'N/A',
            item.consignee?.name || 'N/A',
            item.destination?.city_name || 'N/A',
            item.status
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Pending_POD_Report_${fromDate}_to_${toDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        if (admin) {
            fetchReport();
        }
    }, [admin, selectedBranch, fromDate, toDate]);

    return (
        <div className="p-3 bg-gray-50/50 h-screen font-sans no-print flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col gap-3 min-h-0">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-600 rounded-lg shadow-md shadow-emerald-100">
                            <BarChart3 className="text-white" size={18} />
                        </div>
                        PENDING POD UPLOAD GC REPORT
                    </h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-0.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">From Date (Delivered)</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full p-1.5 bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-700 text-xs transition-all"
                            />
                        </div>
                        <div className="space-y-0.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">To Date (Delivered)</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full p-1.5 bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-700 text-xs transition-all"
                            />
                        </div>
                        <div className="space-y-0.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Delivered Branch</label>
                            {admin?.role?.toLowerCase() === 'superadmin' ? (
                                <select
                                    value={selectedBranch}
                                    onChange={(e) => setSelectedBranch(e.target.value)}
                                    className="w-full p-1.5 bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-700 text-xs transition-all cursor-pointer shadow-sm appearance-none"
                                >
                                    <option value="All Branches">All Branches</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.branch_name} ({branch.branch_code})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="w-full p-1.5 bg-gray-100 border border-gray-200 rounded-lg font-bold text-gray-500 text-xs shadow-sm">
                                    {admin?.branch_name || 'My Branch'}
                                </div>
                            )}
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={fetchReport}
                                disabled={loading}
                                className="w-full py-1.5 bg-emerald-600 text-white font-black rounded-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 disabled:opacity-70 text-[10px] tracking-widest uppercase"
                            >
                                {loading ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />}
                                GENERATE
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <div className="flex items-center gap-4">
                            <div>
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block">Total Pending POD</span>
                                <span className="text-base font-black text-rose-600 leading-none">{reports.length}</span>
                            </div>
                            
                            <div className="hidden md:flex relative ml-4">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                                <input 
                                    type="text"
                                    placeholder="GC Number or Consignee..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-700 text-[10px] w-48 shadow-inner transition-all"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 font-black rounded-lg hover:bg-emerald-600 hover:text-white transition-all text-[9px] tracking-widest uppercase"
                        >
                            <Download size={12} />
                            Export
                        </button>
                    </div>

                    <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-emerald-600">
                                    <th className="px-4 py-2.5 text-[9px] font-black text-emerald-50 uppercase tracking-widest">Delivery Date</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-emerald-50 uppercase tracking-widest">GC No</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-emerald-50 uppercase tracking-widest">Booking Branch</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-emerald-50 uppercase tracking-widest">Delivered Branch</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-emerald-50 uppercase tracking-widest">Consignee</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-emerald-50 uppercase tracking-widest">Destination</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-emerald-50 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-emerald-50 uppercase tracking-widest text-center">POD Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {reports.filter(item => {
                                    if (!searchTerm) return true;
                                    const s = searchTerm.toLowerCase();
                                    return (item.gc_number || '').toLowerCase().includes(s) || 
                                           (item.consignee?.name || '').toLowerCase().includes(s);
                                }).length > 0 ? (
                                    reports.filter(item => {
                                        if (!searchTerm) return true;
                                        const s = searchTerm.toLowerCase();
                                        return (item.gc_number || '').toLowerCase().includes(s) || 
                                               (item.consignee?.name || '').toLowerCase().includes(s);
                                    }).map((item) => (
                                        <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors group">
                                            <td className="px-4 py-2 text-[10px] text-gray-500 font-bold">
                                                {item.delivered_at ? new Date(item.delivered_at).toLocaleDateString('en-IN') : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-[10px] text-emerald-600 font-black">{item.gc_number}</td>
                                            <td className="px-4 py-2 text-[9px] text-gray-500 font-black uppercase">
                                                {item.origin_branch?.branch_name || 'N/A'}
                                            </td>
                                            <td className="px-4 py-2 text-[9px] text-gray-500 font-black uppercase">
                                                {item.delivered_branch?.branch_name || item.delivered_branch_name || 'N/A'}
                                            </td>
                                            <td className="px-4 py-2 text-[10px] text-gray-700 font-black uppercase whitespace-nowrap">{item.consignee?.name || 'N/A'}</td>
                                            <td className="px-4 py-2 text-[10px] text-gray-600 font-bold">{item.destination?.city_name || 'N/A'}</td>
                                            <td className="px-4 py-2 text-center">
                                                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-green-100 text-green-700">
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 animate-pulse">
                                                    Pending POD
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-12 text-center text-gray-400 font-black uppercase tracking-widest text-[9px]">
                                            No pending POD uploads found
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

export default PendingPodReport;
