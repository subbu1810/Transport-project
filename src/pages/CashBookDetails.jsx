import React, { useState, useEffect } from 'react'
import { Plus, Filter, Search, Download, Printer, Edit2, Trash2, X, CheckCircle, Calendar, Building2, Save, XCircle } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function CashBookDetails() {
    const [entries, setEntries] = useState([])

    const [branches, setBranches] = useState([])
    const [heads, setHeads] = useState([])

    const [showModal, setShowModal] = useState(false)
    const [showCloseModal, setShowCloseModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    const [currentEntry, setCurrentEntry] = useState({
        id: '',
        voucher_no: '',
        transaction_date: new Date().toISOString().split('T')[0],
        transaction_type: '',
        account_head_id: '',
        amount: '',
        branch_id: '',
        paid_to_receive_from: '',
        mode_of_pay: 'Cash',
        dd_cheque_no: '',
        dd_cheque_date: new Date().toISOString().split('T')[0],
        drawn_on_bank: '',
        authorised_by: '',
        paid_by_received_by: '',
        remarks: ''
    })

    const [dayBookClose, setDayBookClose] = useState({
        date: new Date().toISOString().split('T')[0],
        creditAmount: 0,
        debitAmount: 0,
        dayTotal: 0,
        remarks: ''
    })

    const [searchQuery, setSearchQuery] = useState('')
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
    const [filterBranch, setFilterBranch] = useState('All Branches')

    const [currentUser, setCurrentUser] = useState(null)

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'))
        setCurrentUser(user)
        if (user && user.role !== 'superadmin') {
            setFilterBranch(user.branch_name)
        }
    }, [])

    useEffect(() => {
        if (branches.length > 0) {
            fetchEntries()
        }
    }, [filterDate, filterBranch, searchQuery, branches])

    useEffect(() => {
        fetchBranches()
        fetchHeads()
    }, [])

    const fetchBranches = async () => {
        try {
            const response = await fetch(`${API_URL}/branches`)
            const data = await response.json()
            if (data.success) setBranches(data.data)
        } catch (err) {
            console.error('Error fetching branches:', err)
        }
    }

    const fetchHeads = async () => {
        try {
            const response = await fetch(`${API_URL}/account-heads`)
            const data = await response.json()
            if (data.success) setHeads(data.data)
        } catch (err) {
            console.error('Error fetching heads:', err)
        }
    }

    const fetchEntries = async () => {
        try {
            let url = `${API_URL}/cash-book?date=${filterDate}&search=${searchQuery}`
            if (filterBranch !== 'All Branches') {
                const branchObj = branches.find(b => b.branch_name === filterBranch);
                if (branchObj) url += `&branch_id=${branchObj.id}`
            }
            const response = await fetch(url)
            const data = await response.json()
            if (data.success) setEntries(data.data)
        } catch (err) {
            console.error('Error fetching entries:', err)
        }
    }

    const handleOpenModal = (typeArg = '', entry = null) => {
        if (entry) {
            setCurrentEntry({
                ...entry,
                transaction_date: entry.transaction_date,
                transaction_type: entry.transaction_type,
            })
            setIsEditing(true)
        } else {
            setCurrentEntry({
                voucher_no: `VCH-${Date.now().toString().slice(-6)}`,
                transaction_date: new Date().toISOString().split('T')[0],
                transaction_type: typeArg,
                account_head_id: '',
                amount: '',
                branch_id: currentUser?.role !== 'superadmin' ? currentUser?.branch_id : (branches[0]?.id || ''),
                paid_to_receive_from: '',
                mode_of_pay: 'Cash',
                dd_cheque_no: '',
                dd_cheque_date: new Date().toISOString().split('T')[0],
                drawn_on_bank: '',
                authorised_by: '',
                paid_by_received_by: '',
                remarks: ''
            })
            setIsEditing(false)
        }
        setShowModal(true)
    }

    const handleSaveEntry = async () => {
        if (!currentEntry.transaction_type || !currentEntry.account_head_id || !currentEntry.amount) {
            alert('Please fill in all required fields (Type, Head, and Amount)')
            return
        }

        try {
            const url = isEditing
                ? `${API_URL}/cash-book/${currentEntry.id}`
                : `${API_URL}/cash-book`

            const method = isEditing ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentEntry)
            })

            const data = await response.json()
            if (data.success) {
                fetchEntries()
                setShowModal(false)
            } else {
                alert('Error saving entry: ' + JSON.stringify(data.message))
            }
        } catch (err) {
            console.error('Error saving entry:', err)
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this entry?')) {
            try {
                const response = await fetch(`${API_URL}/cash-book/${id}`, { method: 'DELETE' })
                const data = await response.json()
                if (data.success) fetchEntries()
            } catch (err) {
                console.error('Error deleting entry:', err)
            }
        }
    }

    const handleOpenCloseModal = () => {
        const credits = entries.filter(e => e.transaction_type === 'CREDIT').reduce((a, b) => a + Number(b.amount), 0)
        const debits = entries.filter(e => e.transaction_type === 'DEBIT').reduce((a, b) => a + Number(b.amount), 0)

        setDayBookClose({
            date: filterDate,
            creditAmount: credits,
            debitAmount: debits,
            dayTotal: credits - debits,
            remarks: ''
        })
        setShowCloseModal(true)
    }

    const handleConfirmClose = async () => {
        // Find or create a 'CLOSING BALANCE' head ID
        const closingHead = heads.find(h => h.name === 'CLOSING_BALANCE')
        if (!closingHead) {
            alert('Please create an Account Head named "CLOSING_BALANCE" first.')
            return
        }

        const branchObj = filterBranch === 'All Branches' ? branches[0] : branches.find(b => b.branch_name === filterBranch)

        const closingEntry = {
            voucher_no: `CLO-${Date.now().toString().slice(-6)}`,
            transaction_date: dayBookClose.date,
            account_head_id: closingHead.id,
            transaction_type: 'DEBIT',
            amount: Math.abs(dayBookClose.dayTotal),
            remarks: dayBookClose.remarks || `DayBook Closed: ${dayBookClose.date}`,
            branch_id: branchObj?.id || null,
            mode_of_pay: 'Cash',
            is_closing_entry: true
        }

        const closingSummary = {
            closing_date: dayBookClose.date,
            branch_id: branchObj?.id || null,
            opening_balance: 0, // In a real system, fetch previous day's closing
            credit_total: dayBookClose.creditAmount,
            debit_total: dayBookClose.debitAmount,
            closing_balance: dayBookClose.dayTotal,
            remarks: dayBookClose.remarks
        }

        try {
            // Save the closing entry in cash book
            const resp1 = await fetch(`${API_URL}/cash-book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(closingEntry)
            })

            // Save the summary in day_book_closings
            const resp2 = await fetch(`${API_URL}/day-book-closings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(closingSummary)
            })

            const data1 = await resp1.json()
            const data2 = await resp2.json()

            if (data1.success && data2.success) {
                fetchEntries()
                setShowCloseModal(false)
                alert('DayBook closed and summary stored successfully!')
            }
        } catch (err) {
            console.error('Error closing DayBook:', err)
        }
    }

    const printVoucher = (entry) => {
        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
      <html>
        <head>
          <title>Cash Voucher - ${entry.voucher_no}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .voucher { border: 3px solid #1e3a8a; padding: 30px; max-width: 800px; margin: auto; background: #fff; }
            .header { text-align: center; border-bottom: 2px solid #1e3a8a; margin-bottom: 20px; padding-bottom: 15px; }
            .header h1 { margin: 0; color: #1e3a8a; font-size: 28px; }
            .voucher-type { display: inline-block; background: #1e3a8a; color: white; padding: 5px 20px; border-radius: 20px; margin-top: 10px; font-weight: bold; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
            .info-item { border-bottom: 1px dotted #aaa; padding: 5px 0; }
            .info-item b { color: #1e3a8a; width: 140px; display: inline-block; }
            .amount-section { margin-top: 30px; padding: 15px; background: #f8fafc; border: 2px dashed #1e3a8a; font-size: 24px; font-weight: bold; display: flex; justify-content: space-between; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; }
            .sign-box { text-align: center; width: 200px; }
            .sign-line { border-top: 2px solid #1e3a8a; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="voucher">
            <div class="header">
              <h1>SRI GANESH ROAD LINES</h1>
              <p>Transport Contractors & Commission Agents</p>
              <div class="voucher-type">CASH ${entry.transaction_type.toUpperCase()} VOUCHER</div>
            </div>
            <div class="info-grid">
              <div class="info-item"><b>Voucher No:</b> ${entry.voucher_no}</div>
              <div class="info-item"><b>Date:</b> ${entry.transaction_date}</div>
              <div class="info-item"><b>Branch:</b> ${entry.branch?.branch_name || 'N/A'}</div>
              <div class="info-item"><b>Account Head:</b> ${entry.account_head?.name || 'N/A'}</div>
              <div class="info-item"><b>Mode of Pay:</b> ${entry.mode_of_pay}</div>
              <div class="info-item"><b>Ref No:</b> ${entry.dd_cheque_no || 'N/A'}</div>
              <div class="info-item"><b>Paid/Recv By:</b> ${entry.paid_by_received_by || 'N/A'}</div>
              <div class="info-item"><b>Authorised By:</b> ${entry.authorised_by || 'N/A'}</div>
            </div>
            <div style="margin-top: 20px; border-bottom: 1px dotted #aaa; padding-bottom: 10px;">
              <b>Particulars:</b> ${entry.remarks || 'N/A'}
            </div>
            <div class="amount-section">
              <span>TOTAL AMOUNT:</span>
              <span>₹ ${Number(entry.amount).toLocaleString('en-IN')}</span>
            </div>
            <div class="footer">
              <div class="sign-box"><div class="sign-line"></div>Receiver's Signature</div>
              <div class="sign-box"><div class="sign-line"></div>Accountant</div>
              <div class="sign-box"><div class="sign-line"></div>Manager</div>
            </div>
          </div>
        </body>
      </html>
    `)
        printWindow.document.close()
        printWindow.print()
    }

    // Filter heads based on selected transaction type inside modal
    const filteredHeads = heads.filter(h => h.transaction_type === currentEntry.transaction_type)

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#1e3a8a]">Cash Book Details</h1>
                    <p className="text-gray-500 text-sm">Manage daily receipts, payments and cash balance</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => handleOpenModal('')}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-lg hover:shadow-xl font-semibold"
                    >
                        <Plus size={20} />
                        Add Entry
                    </button>
                    <button
                        onClick={handleOpenCloseModal}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl font-semibold"
                    >
                        <CheckCircle size={20} />
                        Close Book
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px] space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase">Search Details</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by description or head..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                        />
                    </div>
                </div>
                <div className="w-full md:w-auto space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase">Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                        />
                    </div>
                </div>
                <div className="w-full md:w-auto space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase">Branch</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            value={filterBranch}
                            onChange={(e) => setFilterBranch(e.target.value)}
                            disabled={currentUser?.role !== 'superadmin'}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition appearance-none disabled:bg-gray-100 disabled:text-gray-500"
                        >
                            {currentUser?.role === 'superadmin' && <option>All Branches</option>}
                            {branches.map(b => <option key={b.id} value={b.branch_name}>{b.branch_name}</option>)}
                        </select>
                    </div>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-[#1e3a8a] text-[#1e3a8a] rounded-lg hover:bg-blue-50 transition font-bold"
                >
                    <Download size={18} />
                    PDF
                </button>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#1e3a8a] text-white">
                                <th className="px-6 py-4 text-left font-semibold">Date</th>
                                <th className="px-6 py-4 text-left font-semibold">Branch</th>
                                <th className="px-6 py-4 text-left font-semibold">Account Head</th>
                                <th className="px-6 py-4 text-left font-semibold">Remarks</th>
                                <th className="px-6 py-4 text-right font-semibold">Credit (₹)</th>
                                <th className="px-6 py-4 text-right font-semibold">Debit (₹)</th>
                                <th className="px-6 py-4 text-right font-semibold">Balance (₹)</th>
                                <th className="px-6 py-4 text-center font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {entries.length > 0 ? entries.map((entry, index) => {
                                const balance = entries.slice(0, index + 1).reduce((acc, curr) => {
                                    return curr.transaction_type === 'CREDIT' ? acc + Number(curr.amount) : acc - Number(curr.amount)
                                }, 0)

                                return (
                                    <tr key={entry.id} className="hover:bg-blue-50 transition group">
                                        <td className="px-6 py-4 font-medium text-gray-700">{entry.transaction_date}</td>
                                        <td className="px-6 py-4 text-gray-600">{entry.branch?.branch_name || 'N/A'}</td>
                                        <td className="px-6 py-4 font-bold text-blue-900">{entry.account_head?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 text-gray-600 italic">"{entry.remarks}"</td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600 bg-emerald-50/30">
                                            {entry.transaction_type === 'CREDIT' ? Number(entry.amount).toLocaleString('en-IN') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-rose-600 bg-rose-50/30">
                                            {entry.transaction_type === 'DEBIT' ? Number(entry.amount).toLocaleString('en-IN') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-gray-800">
                                            {balance.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(entry.transaction_type, entry)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => printVoucher(entry)}
                                                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                                    title="Print Voucher"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(entry.id)}
                                                    className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            }) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-400 italic">No entries found for this date.</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-gray-100 font-black border-t-4 border-[#1e3a8a]/20">
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-right text-[#1e3a8a]">SUB TOTALS:</td>
                                <td className="px-6 py-4 text-right text-emerald-700 bg-emerald-50">
                                    ₹{entries.filter(e => e.transaction_type === 'CREDIT' && !e.is_closing_entry).reduce((a, b) => a + Number(b.amount), 0).toLocaleString('en-IN')}
                                </td>
                                <td className="px-6 py-4 text-right text-rose-700 bg-rose-50">
                                    ₹{entries.filter(e => e.transaction_type === 'DEBIT' && !e.is_closing_entry).reduce((a, b) => a + Number(b.amount), 0).toLocaleString('en-IN')}
                                </td>
                                <td className="px-6 py-4 text-right text-[#1e3a8a] bg-blue-50 text-xl">
                                    ₹{(entries.filter(e => e.transaction_type === 'CREDIT' && !e.is_closing_entry).reduce((a, b) => a + Number(b.amount), 0) -
                                        entries.filter(e => e.transaction_type === 'DEBIT' && !e.is_closing_entry).reduce((a, b) => a + Number(b.amount), 0)).toLocaleString('en-IN')}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Entry Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-[#fdfdf3] rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden border-2 border-gray-300">
                        {/* Header */}
                        <div className="p-4 bg-gray-50 border-b border-gray-300 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                Cash book Entry Details ({currentEntry.transaction_type || 'New'} Voucher No: {currentEntry.voucher_no})
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-red-600 transition">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Form Details */}
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
                                <div className="flex items-center gap-4">
                                    <label className="w-40 text-sm font-semibold text-gray-700">Transaction date</label>
                                    <input
                                        type="date"
                                        className="flex-1 p-2 border border-gray-300 rounded bg-[#fffced] focus:ring-2 focus:ring-yellow-400 outline-none"
                                        value={currentEntry.transaction_date}
                                        onChange={(e) => setCurrentEntry({ ...currentEntry, transaction_date: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="w-40 text-sm font-semibold text-gray-700">Transaction Type</label>
                                    <select
                                        className="flex-1 p-2 border border-gray-300 rounded bg-[#fffced] focus:ring-2 focus:ring-yellow-400 outline-none font-bold"
                                        value={currentEntry.transaction_type}
                                        onChange={(e) => setCurrentEntry({ ...currentEntry, transaction_type: e.target.value, account_head_id: '' })}
                                    >
                                        <option value="">Select Type</option>
                                        <option value="CREDIT">CREDIT</option>
                                        <option value="DEBIT">DEBIT</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2 flex items-center gap-4">
                                    <label className="w-40 text-sm font-semibold text-gray-700">Head (Particulars)</label>
                                    <select
                                        className="flex-1 p-2 border border-gray-300 rounded bg-[#fffced] focus:ring-2 focus:ring-yellow-400 outline-none font-bold text-blue-900"
                                        value={currentEntry.account_head_id}
                                        onChange={(e) => setCurrentEntry({ ...currentEntry, account_head_id: e.target.value })}
                                        disabled={!currentEntry.transaction_type}
                                    >
                                        <option value="">{currentEntry.transaction_type ? 'Select Head' : 'Select Transaction Type First'}</option>
                                        {filteredHeads.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                    </select>
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="w-40 text-sm font-semibold text-gray-700">Amount</label>
                                    <input
                                        type="number"
                                        className="flex-1 p-2 border border-gray-300 rounded bg-[#fffced] focus:ring-2 focus:ring-yellow-400 outline-none font-bold text-xl"
                                        value={currentEntry.amount}
                                        onChange={(e) => setCurrentEntry({ ...currentEntry, amount: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="w-40 text-sm font-semibold text-gray-700">Branch Name</label>
                                    <select
                                        className="flex-1 p-2 border border-gray-300 rounded bg-[#fffced] focus:ring-2 focus:ring-yellow-400 outline-none disabled:bg-gray-200 disabled:text-gray-600"
                                        value={currentEntry.branch_id}
                                        onChange={(e) => setCurrentEntry({ ...currentEntry, branch_id: e.target.value })}
                                        disabled={currentUser?.role !== 'superadmin'}
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-2 flex items-center gap-4">
                                    <label className="w-40 text-sm font-semibold text-gray-700">Paid To/Receive From</label>
                                    <input
                                        type="text"
                                        className="flex-1 p-2 border border-gray-300 rounded bg-[#fffced] focus:ring-2 focus:ring-yellow-400 outline-none"
                                        value={currentEntry.paid_to_receive_from}
                                        onChange={(e) => setCurrentEntry({ ...currentEntry, paid_to_receive_from: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="w-40 text-sm font-semibold text-gray-700">Mode Of Pay</label>
                                    <select
                                        className="flex-1 p-2 border border-gray-300 rounded bg-[#fffced] focus:ring-2 focus:ring-yellow-400 outline-none"
                                        value={currentEntry.mode_of_pay}
                                        onChange={(e) => setCurrentEntry({ ...currentEntry, mode_of_pay: e.target.value })}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="DD">DD</option>
                                        <option value="Online">Online</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="w-40 text-sm font-semibold text-gray-700">DD/CHEQUE NO</label>
                                    <input
                                        type="text"
                                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 outline-none"
                                        value={currentEntry.dd_cheque_no}
                                        onChange={(e) => setCurrentEntry({ ...currentEntry, dd_cheque_no: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="w-40 text-sm font-semibold text-gray-700">DD/CHEQUE Date</label>
                                    <input
                                        type="date"
                                        className="flex-1 p-2 border border-gray-300 rounded bg-[#fffced] focus:ring-2 focus:ring-yellow-400 outline-none"
                                        value={currentEntry.dd_cheque_date}
                                        onChange={(e) => setCurrentEntry({ ...currentEntry, dd_cheque_date: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="w-40 text-sm font-semibold text-gray-700">Drawn on Bank</label>
                                    <input
                                        type="text"
                                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 outline-none"
                                        value={currentEntry.drawn_on_bank}
                                        onChange={(e) => setCurrentEntry({ ...currentEntry, drawn_on_bank: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="w-40 text-sm font-semibold text-gray-700">Authorised By</label>
                                    <input
                                        type="text"
                                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 outline-none"
                                        value={currentEntry.authorised_by}
                                        onChange={(e) => setCurrentEntry({ ...currentEntry, authorised_by: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="w-40 text-sm font-semibold text-gray-700">Paid By/Received By</label>
                                    <input
                                        type="text"
                                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 outline-none"
                                        value={currentEntry.paid_by_received_by}
                                        onChange={(e) => setCurrentEntry({ ...currentEntry, paid_by_received_by: e.target.value })}
                                    />
                                </div>

                                <div className="md:col-span-2 flex items-start gap-4">
                                    <label className="w-40 text-sm font-semibold text-gray-700 pt-2">Remarks</label>
                                    <textarea
                                        rows="3"
                                        className="flex-1 p-2 border border-gray-300 rounded bg-[#fffced] focus:ring-2 focus:ring-yellow-400 outline-none resize-none"
                                        value={currentEntry.remarks}
                                        onChange={(e) => setCurrentEntry({ ...currentEntry, remarks: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="p-6 bg-gray-50 flex justify-center gap-5 border-t border-gray-300">
                            <button
                                onClick={handleSaveEntry}
                                className="flex items-center gap-2 px-8 py-2.5 bg-[#8da242] text-white font-bold rounded shadow-md hover:bg-[#7a8d38] transition active:scale-95"
                            >
                                <Save size={20} />
                                Save
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex items-center gap-2 px-8 py-2.5 bg-[#8da242] text-white font-bold rounded shadow-md hover:bg-[#7a8d38] transition active:scale-95"
                            >
                                <XCircle size={20} />
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DayBook Close Modal */}
            {showCloseModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded shadow-2xl w-full max-w-lg overflow-hidden border-[6px] border-[#a3b44b]">
                        <div className="p-3 bg-[#a3b44b] text-white flex justify-between items-center">
                            <h2 className="text-xl font-bold italic">DayBook Close</h2>
                            <button onClick={() => setShowCloseModal(false)} className="text-white hover:bg-white/20 rounded p-1">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="border-b border-gray-300 pb-2">
                                <h3 className="text-lg font-bold text-gray-800">DayBook Closing Details</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <label className="text-md font-semibold text-gray-700">Transaction date</label>
                                    <div className="relative w-64">
                                        <input type="text" readOnly className="w-full bg-[#444] text-[#ffef00] font-bold text-xl px-3 py-1.5 rounded border-2 border-gray-400" value={dayBookClose.date.split('-').reverse().join('/')} />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-white border border-gray-300 p-0.5 rounded cursor-not-allowed">
                                            <Calendar size={18} className="text-red-400" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <label className="text-md font-semibold text-gray-700">Credit Amount</label>
                                    <div className="w-64">
                                        <input type="text" readOnly className="w-full bg-black text-[#ffef00] font-black text-2xl px-3 py-1 text-right rounded border-2 border-gray-600" value={dayBookClose.creditAmount.toFixed(2)} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <label className="text-md font-semibold text-gray-700">Debit Amount</label>
                                    <div className="w-64">
                                        <input type="text" readOnly className="w-full bg-black text-[#ffef00] font-black text-2xl px-3 py-1 text-right rounded border-2 border-gray-600" value={dayBookClose.debitAmount.toFixed(2)} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <label className="text-md font-semibold text-gray-700">Day Total</label>
                                    <div className="w-64">
                                        <input type="text" readOnly className="w-full bg-black text-[#ffef00] font-black text-2xl px-3 py-1 text-right rounded border-2 border-gray-600" value={dayBookClose.dayTotal.toFixed(2)} />
                                    </div>
                                </div>
                                <div className="flex items-start justify-between gap-4">
                                    <label className="text-md font-semibold text-gray-700 pt-2">Remarks</label>
                                    <textarea rows="3" className="w-64 p-2 border-2 border-rose-300 rounded bg-rose-50/30 focus:outline-none" value={dayBookClose.remarks} onChange={(e) => setDayBookClose({ ...dayBookClose, remarks: e.target.value })}></textarea>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-center gap-4">
                                <button onClick={handleConfirmClose} className="flex items-center gap-2 px-4 py-2 bg-[#8da242] text-white font-bold rounded shadow-md hover:opacity-90 transition active:scale-95"><Save size={20} className="bg-[#1e40af] p-0.5 rounded" />DayBook Close</button>
                                <button onClick={() => setShowCloseModal(false)} className="flex items-center gap-2 px-6 py-2 bg-[#8da242] text-white font-bold rounded shadow-md hover:opacity-90 transition active:scale-95"><XCircle size={20} className="text-red-500 bg-white rounded-full p-0.5" />Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CashBookDetails
