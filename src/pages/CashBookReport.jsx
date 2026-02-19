import React, { useState, useEffect } from 'react'
import { Printer, Download, Calendar, Filter } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function CashBookReport() {
    const [reportData, setReportData] = useState([])
    const [branches, setBranches] = useState([])
    const [filters, setFilters] = useState({
        from_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        to_date: new Date().toISOString().split('T')[0],
        branch_id: 'All Branches'
    })

    const [currentUser, setCurrentUser] = useState(null)

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'))
        setCurrentUser(user)
        if (user && user.role !== 'superadmin') {
            setFilters(prev => ({ ...prev, branch_id: user.branch_id }))
        }
        fetchBranches()
    }, [])

    useEffect(() => {
        if (currentUser) {
            generateReport()
        }
    }, [currentUser, filters.from_date, filters.to_date, filters.branch_id])

    const fetchBranches = async () => {
        try {
            const response = await fetch(`${API_URL}/branches`)
            const data = await response.json()
            if (data.success) setBranches(data.data)
        } catch (err) {
            console.error('Error fetching branches:', err)
        }
    }

    const generateReport = async () => {
        try {
            let url = `${API_URL}/day-book-closings?from_date=${filters.from_date}&to_date=${filters.to_date}`
            if (filters.branch_id !== 'All Branches') {
                url += `&branch_id=${filters.branch_id}`
            }
            const response = await fetch(url)
            const data = await response.json()
            if (data.success) {
                setReportData(data.data)
            }
        } catch (err) {
            console.error('Error generating report:', err)
        }
    }

    const totalReceipts = reportData.reduce((acc, curr) => acc + Number(curr.credit_total), 0)
    const totalPayments = reportData.reduce((acc, curr) => acc + Number(curr.debit_total), 0)
    const netCashFlow = totalReceipts - totalPayments

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[#1e3a8a]">Cash Book Report</h1>
                    <p className="text-gray-500 text-sm italic">Showing data only for DayBook Closed dates</p>
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 border-2 border-[#1e3a8a] text-[#1e3a8a] rounded-lg hover:bg-blue-50 transition font-bold shadow-sm">
                        <Printer size={20} />
                        Print Report
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#1e40af] transition shadow-lg font-bold">
                        <Download size={20} />
                        Download PDF
                    </button>
                </div>
            </div>

            {/* Search Filters */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">From Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1e3a8a]" size={18} />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-100 rounded-xl focus:border-[#1e3a8a] outline-none transition transition-all"
                                value={filters.from_date}
                                onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">To Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1e3a8a]" size={18} />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-100 rounded-xl focus:border-[#1e3a8a] outline-none transition transition-all"
                                value={filters.to_date}
                                onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Branch</label>
                        <select
                            className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl focus:border-[#1e3a8a] outline-none bg-gray-50 font-semibold text-gray-700 disabled:opacity-50"
                            value={filters.branch_id}
                            onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
                            disabled={currentUser?.role !== 'superadmin'}
                        >
                            {currentUser?.role === 'superadmin' && <option value="All Branches">All Branches</option>}
                            {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={generateReport}
                            className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl hover:bg-blue-800 transition shadow-xl font-black text-sm uppercase tracking-widest"
                        >
                            <Filter size={20} />
                            Filter Data
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border-l-[6px] border-emerald-500 p-6 rounded-2xl shadow-lg group hover:scale-[1.02] transition">
                    <p className="text-emerald-600 text-xs font-black uppercase tracking-wider">Total Daily Receipts</p>
                    <h3 className="text-3xl font-black mt-2 text-gray-800">₹{totalReceipts.toLocaleString('en-IN')}</h3>
                </div>
                <div className="bg-white border-l-[6px] border-rose-500 p-6 rounded-2xl shadow-lg group hover:scale-[1.02] transition">
                    <p className="text-rose-600 text-xs font-black uppercase tracking-wider">Total Daily Payments</p>
                    <h3 className="text-3xl font-black mt-2 text-gray-800">₹{totalPayments.toLocaleString('en-IN')}</h3>
                </div>
                <div className="bg-white border-l-[6px] border-blue-500 p-6 rounded-2xl shadow-lg group hover:scale-[1.02] transition">
                    <p className="text-blue-600 text-xs font-black uppercase tracking-wider">Net Cash in Closings</p>
                    <h3 className="text-3xl font-black mt-2 text-gray-800">₹{netCashFlow.toLocaleString('en-IN')}</h3>
                </div>
            </div>

            {/* Report Table */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-900 text-white">
                                <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-widest border-r border-gray-700">Date</th>
                                <th className="px-6 py-5 text-left text-xs font-black uppercase tracking-widest border-r border-gray-700">Branch</th>
                                <th className="px-6 py-5 text-right text-xs font-black uppercase tracking-widest border-r border-gray-700">Day Opening (₹)</th>
                                <th className="px-6 py-5 text-right text-xs font-black uppercase tracking-widest border-r border-gray-700">Day Receipts (₹)</th>
                                <th className="px-6 py-5 text-right text-xs font-black uppercase tracking-widest border-r border-gray-700">Day Payments (₹)</th>
                                <th className="px-6 py-5 text-right text-xs font-black uppercase tracking-widest border-gray-700">Day Closing (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reportData.length > 0 ? reportData.map((row) => (
                                <tr key={row.id} className="hover:bg-blue-50/50 transition duration-300 font-bold">
                                    <td className="px-6 py-5 text-gray-600 border-r border-gray-50">{row.closing_date}</td>
                                    <td className="px-6 py-5 text-[#1e3a8a] border-r border-gray-50">{row.branch?.branch_name || 'N/A'}</td>
                                    <td className="px-6 py-5 text-right text-gray-400 border-r border-gray-50 italic">₹{Number(row.opening_balance).toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-5 text-right text-emerald-600 border-r border-gray-50">₹{Number(row.credit_total).toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-5 text-right text-rose-600 border-r border-gray-50">₹{Number(row.debit_total).toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-5 text-right text-gray-900 bg-gray-50/50 font-black text-lg">
                                        ₹{Number(row.closing_balance).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-gray-400 italic font-medium">
                                        No closed book data found for the selected period.
                                        <br />
                                        <span className="text-sm">Please close the DayBook in "Cash Book Details" to see data here.</span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {reportData.length > 0 && (
                            <tfoot className="bg-gray-100/50 font-black">
                                <tr>
                                    <td colSpan="3" className="px-6 py-6 text-right text-gray-500 uppercase tracking-widest text-xs">Averages / Totals:</td>
                                    <td className="px-6 py-6 text-right text-emerald-700">₹{totalReceipts.toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-6 text-right text-rose-700">₹{totalPayments.toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-6 text-right text-[#1e3a8a] text-xl">₹{netCashFlow.toLocaleString('en-IN')}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    )
}

export default CashBookReport
