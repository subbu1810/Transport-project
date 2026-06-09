import React, { useState, useEffect } from 'react'
import { Plus, Filter, Search, Download, Printer, Edit2, Trash2, X, CheckCircle, Calendar, Building2, Save, XCircle, AlertCircle } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function CashBookDetails() {
    const [entries, setEntries] = useState([])

    const [branches, setBranches] = useState([])
    const [heads, setHeads] = useState([])

    const [showModal, setShowModal] = useState(false)
    const [showCloseModal, setShowCloseModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)

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
        openingBalance: 0,
        creditAmount: 0,
        debitAmount: 0,
        dayTotal: 0,
        remarks: ''
    })

    const [searchQuery, setSearchQuery] = useState('')
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
    const [filterBranch, setFilterBranch] = useState('All Branches')
    const [isClosed, setIsClosed] = useState(false)

    const [notification, setNotification] = useState({ show: false, type: '', message: '' })

    const showNotify = (type, message) => {
        setNotification({ show: true, type, message })
        setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000)
    }

    const today = new Date().toISOString().split('T')[0]  // YYYY-MM-DD of today

    const [currentUser, setCurrentUser] = useState(null)
    const [companyDetails, setCompanyDetails] = useState({
        name: '',
        subtitle: '',
        address: '',
        phone: '',
        logo: null
    })

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            try {
                const user = JSON.parse(userData)
                setCurrentUser(user)
                setCompanyDetails({
                    name: user.transport_name || '',
                    subtitle: user.transport_subtitle || '',
                    address: user.transport_address || '',
                    phone: user.transport_phone || '',
                    logo: user.transport_logo_url || user.transport_logo_path || null
                })
                if (user && user.role !== 'superadmin') {
                    setFilterBranch(user.branch_name)
                }
            } catch (e) {
                console.error("Error parsing user data", e)
            }
        }
    }, [])

    useEffect(() => {
        if (branches.length > 0) {
            fetchEntries()
            checkClosingStatus()
        }
    }, [filterDate, filterBranch, searchQuery, branches])

    useEffect(() => {
        fetchBranches()
        fetchHeads()
    }, [])

    const fetchBranches = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/branches`)
            const data = await response.json()
            if (data.success) setBranches(data.data)
        } catch (err) {
            console.error('Error fetching branches:', err)
        }
    }

    const fetchHeads = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/account-heads`)
            const data = await response.json()
            if (data.success) setHeads(data.data)
        } catch (err) {
            console.error('Error fetching heads:', err)
        }
    }

    const fetchEntries = async () => {
        try {
            setLoading(true)
            const params = {
                date: filterDate,
                search: searchQuery
            }
            if (filterBranch && filterBranch !== 'All Branches') {
                const branchObj = branches.find(b => b.branch_name === filterBranch);
                if (branchObj) {
                    params.branch_id = branchObj.id
                }
            }
            const response = await fetch(`${API_BASE_URL}/cash-book?` + new URLSearchParams(params))
            const data = await response.json()
            if (data.success) setEntries(data.data)
        } catch (err) {
            console.error('Error fetching entries:', err)
        } finally {
            setLoading(false)
        }
    }

    const checkClosingStatus = async () => {
        if (!filterBranch || filterBranch === 'All Branches') {
            setIsClosed(false)
            return
        }
        try {
            const branchObj = branches.find(b => b.branch_name === filterBranch);
            if (!branchObj) return;

            const response = await fetch(`${API_BASE_URL}/day-book-closings?from_date=${filterDate}&to_date=${filterDate}&branch_id=${branchObj.id}`)
            const data = await response.json()
            if (data.success) {
                setIsClosed(data.data.length > 0)
            }
        } catch (err) {
            console.error('Error checking closing status:', err)
        }
    }

    const handleOpenModal = (typeArg = '', entry = null) => {
        if (isClosed && !entry) {
            showNotify('error', 'Cannot add entries for a closed day.')
            return
        }
        if (isClosed && entry) {
            showNotify('error', 'Cannot edit entries for a closed day.')
            return
        }
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
        if (isClosed) {
            showNotify('error', 'Access Denied: DayBook is closed.')
            return
        }
        if (!currentEntry.transaction_type || !currentEntry.account_head_id || !currentEntry.amount) {
            showNotify('error', 'Please fill in all required fields (Type, Head, and Amount)')
            return
        }

        // Mode of Pay Validation
        if (currentEntry.mode_of_pay === 'Cheque' || currentEntry.mode_of_pay === 'DD') {
            if (!currentEntry.dd_cheque_no || !currentEntry.dd_cheque_date) {
                showNotify('error', `Please enter ${currentEntry.mode_of_pay} Number and Date.`)
                return
            }
        }
        if (currentEntry.mode_of_pay === 'Online') {
            if (!currentEntry.dd_cheque_no) {
                showNotify('error', 'Please enter Transaction Number for Online payment.')
                return
            }
        }

        // Block future dates
        if (currentEntry.transaction_date > today) {
            showNotify('error', `Future dates are not allowed. Today is ${today}.`)
            return
        }

        try {
            const url = isEditing
                ? `${API_BASE_URL}/cash-book/${currentEntry.id}`
                : `${API_BASE_URL}/cash-book`

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
                showNotify('success', isEditing ? 'Entry updated successfully!' : 'Entry saved successfully!')
            } else {
                showNotify('error', 'Error saving entry: ' + (typeof data.message === 'string' ? data.message : JSON.stringify(data.message)))
            }
        } catch (err) {
            console.error('Error saving entry:', err)
        }
    }

    const handleDelete = async (id) => {
        if (isClosed) {
            showNotify('error', 'Cannot delete entries for a closed day.')
            return
        }
        if (window.confirm('Are you sure you want to delete this entry?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/cash-book/${id}`, { method: 'DELETE' })
                const data = await response.json()
                if (data.success) {
                    fetchEntries()
                    showNotify('success', 'Entry deleted successfully!')
                } else {
                    showNotify('error', 'Failed to delete entry: ' + data.message)
                }
            } catch (err) {
                console.error('Error deleting entry:', err)
            }
        }
    }

    const handleOpenCloseModal = async () => {
        if (isClosed) {
            showNotify('error', 'DayBook is already closed for this date.')
            return
        }
        if (filterBranch === 'All Branches') {
            showNotify('error', 'Please select a specific branch to close the book.')
            return
        }

        const branchObj = branches.find(b => b.branch_name === filterBranch)
        if (!branchObj) return;

        let previousClosingBalance = 0;
        try {
            const response = await fetch(`${API_BASE_URL}/day-book-closings/opening-balance?branch_id=${branchObj.id}&date=${filterDate}`)
            const data = await response.json()
            if (data.success) {
                previousClosingBalance = Number(data.data.opening_balance) || 0;
            }
        } catch (err) {
            console.error('Error fetching opening balance:', err)
        }

        const credits = entries.filter(e => e.transaction_type === 'CREDIT').reduce((a, b) => a + Number(b.amount), 0)
        const debits = entries.filter(e => e.transaction_type === 'DEBIT').reduce((a, b) => a + Number(b.amount), 0)

        setDayBookClose({
            date: filterDate,
            openingBalance: previousClosingBalance,
            creditAmount: credits,
            debitAmount: debits,
            dayTotal: previousClosingBalance + credits - debits,
            remarks: ''
        })
        setShowCloseModal(true)
    }

    const handleConfirmClose = async () => {
        const branchObj = filterBranch === 'All Branches' ? branches[0] : branches.find(b => b.branch_name === filterBranch)

        const closingSummary = {
            closing_date: dayBookClose.date,
            branch_id: branchObj?.id || null,
            opening_balance: dayBookClose.openingBalance,
            credit_total: dayBookClose.creditAmount,
            debit_total: dayBookClose.debitAmount,
            closing_balance: dayBookClose.dayTotal,
            remarks: dayBookClose.remarks
        }

        try {
            // Save the summary in day_book_closings
            const response = await fetch(`${API_BASE_URL}/day-book-closings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(closingSummary)
            })

            const data = await response.json()

            if (data.success) {
                fetchEntries()
                checkClosingStatus()
                setShowCloseModal(false)
                showNotify('success', 'DayBook closed and summary stored successfully!')
            } else {
                showNotify('error', 'Failed to close DayBook correctly.')
            }
        } catch (err) {
            console.error('Error closing DayBook:', err)
        }
    }

    const printVoucher = (entry) => {
        const printWindow = window.open('', '_blank')

        let logoSrc = companyDetails.logo;
        if (logoSrc && !logoSrc.startsWith('http')) {
            logoSrc = `${STORAGE_URL}/${logoSrc}`;
        }

        const logoHtml = logoSrc
            ? `<img src="${logoSrc}" style="height: 40px; max-width: 100px; object-fit: contain;" />`
            : '';

        printWindow.document.write(`
      <html>
        <head>
          <title>Voucher - ${entry.voucher_no}</title>
          <style>
            @page { size: A4; margin: 5mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 0; margin: 0; color: #1e3a8a; background: #fff; }
            .voucher { 
                border: 1.5px solid #1e3a8a; 
                padding: 10px; 
                max-width: 500px; 
                margin: 5px auto; 
                background: #fff; 
                page-break-inside: avoid;
            }
            .header-container { 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                gap: 15px; 
                border-bottom: 1px solid #1e3a8a; 
                margin-bottom: 8px; 
                padding-bottom: 5px; 
            }
            .header-text { text-align: center; }
            .header-text h1 { margin: 0; color: #1e3a8a; font-size: 16px; font-weight: 950; text-transform: uppercase; line-height: 1; }
            .header-text p { margin: 1px 0; font-size: 9px; font-weight: bold; color: #444; line-height: 1; }
            
            .voucher-type-row { text-align: center; margin-bottom: 8px; }
            .voucher-type { 
                display: inline-block; 
                background: #1e3a8a; 
                color: #fff; 
                padding: 2px 15px; 
                border-radius: 2px; 
                font-weight: 900; 
                font-size: 11px; 
                text-transform: uppercase; 
            }

            .info-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 4px 20px; 
                margin-bottom: 8px; 
            }
            .info-item { 
                border-bottom: 0.5px dotted #1e3a8a; 
                padding: 1px 0; 
                font-size: 10px; 
                display: flex; 
                justify-content: space-between; 
            }
            .info-item b { color: #1e3a8a; font-size: 9px; text-transform: uppercase; }
            .info-item span { font-weight: bold; color: #000; }

            .full-width-item {
                border-bottom: 0.5px dotted #1e3a8a; 
                padding: 2px 0; 
                font-size: 10px;
                display: flex;
                gap: 5px;
            }
            .full-width-item b { color: #1e3a8a; font-size: 9px; text-transform: uppercase; white-space: nowrap; }
            .full-width-item span { font-weight: bold; color: #000; }

            .particulars-box { 
                border: 0.5px solid #1e3a8a; 
                padding: 5px; 
                border-radius: 2px; 
                margin-top: 5px;
                margin-bottom: 10px; 
                min-height: 30px; 
            }
            .particulars-box b { 
                display: block; 
                color: #1e3a8a; 
                font-size: 8px; 
                text-transform: uppercase; 
                border-bottom: 0.5px solid #eee; 
                margin-bottom: 2px;
            }
            .particulars-box span { font-size: 10px; font-weight: bold; color: #333; }

            .amount-section { 
                padding: 6px 12px; 
                background: #f8fafc; 
                border: 1.5px dashed #1e3a8a; 
                border-radius: 4px; 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                margin-bottom: 15px; 
            }
            .amount-label { font-size: 12px; font-weight: 900; color: #1e3a8a; }
            .amount-value { font-size: 18px; font-weight: 950; color: #000; }

            .footer { 
                display: flex; 
                justify-content: space-between; 
                gap: 15px; 
                margin-top: 25px; 
            }
            .sign-box { text-align: center; flex: 1; position: relative; }
            .sign-line { border-top: 0.5px solid #1e3a8a; margin-bottom: 3px; width: 100%; }
            .sign-text { font-size: 9px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; }

            @media print {
              .voucher { margin: 5px auto; }
              body { background: none; }
            }
          </style>
        </head>
        <body onload="window.print(); window.onafterprint = function() { window.close(); };">
          <div class="voucher">
            <div class="header-container">
              ${logoHtml}
              <div class="header-text">
                <h1>${companyDetails.name}</h1>
                ${companyDetails.address ? `<p>${companyDetails.address} | Ph: ${companyDetails.phone}</p>` : ''}
              </div>
            </div>
            
            <div class="voucher-type-row">
              <div class="voucher-type">CASH ${entry.transaction_type} VOUCHER</div>
            </div>

            <div class="info-grid">
              <div class="info-item"><b>Voucher No</b> <span>${entry.voucher_no}</span></div>
              <div class="info-item"><b>Date</b> <span>${entry.transaction_date}</span></div>
              <div class="info-item"><b>Branch</b> <span>${entry.branch?.branch_name || 'N/A'}</span></div>
              <div class="info-item"><b>Mode</b> <span>${entry.mode_of_pay}</span></div>
            </div>

            <div class="full-width-item"><b>Head:</b> <span>${entry.account_head?.name || 'N/A'}</span></div>
            <div class="full-width-item"><b>Paid/Recv:</b> <span>${entry.paid_by_received_by || 'N/A'}</span></div>

            <div class="particulars-box">
              <b>Remarks</b>
              <span>${entry.remarks || 'N/A'}</span>
            </div>

            <div class="amount-section">
              <span class="amount-label">TOTAL AMOUNT</span>
              <span class="amount-value">₹ ${Number(entry.amount).toLocaleString('en-IN')}</span>
            </div>

            <div class="footer">
              <div class="sign-box">
                <div class="sign-line"></div>
                <div class="sign-text">Receiver Signature</div>
              </div>
              <div class="sign-box">
                <div class="sign-line"></div>
                <div class="sign-text">Accountant</div>
              </div>
              <div class="sign-box">
                <div class="sign-line"></div>
                <div class="sign-text">Manager</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `)
        printWindow.document.close()
    }

    // Filter heads based on selected transaction type inside modal
    const filteredHeads = heads.filter(h => h.transaction_type === currentEntry.transaction_type)

    return (
        <div className="p-2 space-y-4 bg-gray-50 min-h-screen">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0; padding: 0; }
                    .bg-white { box-shadow: none !important; border: none !important; }
                    table { border-collapse: collapse !important; width: 100% !important; }
                    th { background-color: #f3f4f6 !important; color: black !important; border: 1px solid #e5e7eb !important; }
                    td { border: 1px solid #e5e7eb !important; }
                    .min-h-screen { min-height: auto !important; }
                    .p-2 { padding: 0 !important; }
                    @page { size: auto; margin: 10mm 15mm; }
                }
            `}</style>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 no-print">
                <div>
                    <h1 className="text-xl font-bold text-[#1e3a8a]">Cash Book Details</h1>
                    <p className="text-gray-500 text-xs">Manage daily receipts, payments and cash balance</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {isClosed && (
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-rose-100 text-rose-700 rounded border-2 border-rose-300 font-black text-sm uppercase animate-pulse">
                            <XCircle size={18} />
                            DayBook Closed
                        </div>
                    )}
                    <button
                        onClick={() => handleOpenModal('')}
                        disabled={isClosed}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition shadow hover:shadow-md font-bold ${isClosed ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                    >
                        <Plus size={16} />
                        Add Entry
                    </button>
                    <button
                        onClick={handleOpenCloseModal}
                        disabled={isClosed}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition shadow hover:shadow-md font-bold ${isClosed ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        <CheckCircle size={16} />
                        {isClosed ? 'Book Closed' : 'Close Book'}
                    </button>
                </div>
            </div>

            {/* Filters Section - Hide on print */}
            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-3 items-end no-print">
                <div className="flex-1 min-w-[150px] space-y-0.5">
                    <label className="text-[10px] font-bold text-gray-600 uppercase">Search Details</label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none transition"
                        />
                    </div>
                </div>
                <div className="w-full md:w-auto space-y-0.5">
                    <label className="text-[10px] font-bold text-gray-600 uppercase">Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none transition"
                        />
                    </div>
                </div>
                <div className="w-full md:w-auto space-y-0.5">
                    <label className="text-[10px] font-bold text-gray-600 uppercase">Branch</label>
                    <div className="relative">
                        <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <select
                            value={filterBranch}
                            onChange={(e) => setFilterBranch(e.target.value)}
                            disabled={currentUser?.role !== 'superadmin'}
                            className="w-full pl-8 pr-8 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white transition appearance-none disabled:bg-gray-100 disabled:text-gray-500"
                        >
                            {currentUser?.role === 'superadmin' && <option>All Branches</option>}
                            {branches.map(b => <option key={b.id} value={b.branch_name}>{b.branch_name}</option>)}
                        </select>
                    </div>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e3a8a] text-white text-xs rounded hover:bg-blue-800 transition font-bold shadow-sm"
                >
                    <Printer size={14} />
                    PRINT REPORT / PDF
                </button>
            </div>

            {/* Print Header - Visible only in Print */}
            <div className="hidden print:block print-header mb-6">
                <div className="flex items-center justify-center gap-6 border-b-2 border-gray-800 pb-4">
                    {companyDetails.logo && (
                        <img
                            src={companyDetails.logo.startsWith('http') ? companyDetails.logo : `${STORAGE_URL}/${companyDetails.logo}`}
                            alt="Logo"
                            className="h-16 w-auto object-contain"
                        />
                    )}
                    <div className="text-center">
                        <h1 className="text-2xl font-black text-[#1e3a8a] uppercase">{companyDetails.name}</h1>
                        <p className="text-xs font-medium text-gray-500">{companyDetails.address}</p>
                        <p className="text-xs font-black text-gray-800 tracking-widest mt-2 border-t border-gray-200 pt-2 uppercase">
                            Cash Book Report - {filterBranch} ({filterDate})
                        </p>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                        <thead>
                            <tr className="bg-[#1e3a8a] text-white">
                                <th className="px-3 py-2 text-left font-bold uppercase tracking-tight">Date</th>
                                <th className="px-3 py-2 text-left font-bold uppercase tracking-tight">Branch</th>
                                <th className="px-3 py-2 text-left font-bold uppercase tracking-tight">Account Head</th>
                                <th className="px-3 py-2 text-left font-bold uppercase tracking-tight">Remarks</th>
                                <th className="px-3 py-2 text-right font-bold uppercase tracking-tight">Credit (₹)</th>
                                <th className="px-3 py-2 text-right font-bold uppercase tracking-tight">Debit (₹)</th>
                                <th className="px-3 py-2 text-right font-bold uppercase tracking-tight">Balance (₹)</th>
                                <th className="px-3 py-2 text-center font-bold uppercase tracking-tight no-print">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {entries.length > 0 ? entries.map((entry, index) => {
                                const balance = entries.slice(0, index + 1).reduce((acc, curr) => {
                                    return curr.transaction_type === 'CREDIT' ? acc + Number(curr.amount) : acc - Number(curr.amount)
                                }, 0)

                                return (
                                    <tr key={entry.id} className="hover:bg-blue-50/50 transition border-b border-gray-100">
                                        <td className="px-3 py-1.5 font-medium text-gray-700 whitespace-nowrap">{entry.transaction_date}</td>
                                        <td className="px-3 py-1.5 text-gray-600 whitespace-nowrap text-[9px] print:text-xs">{entry.branch?.branch_name || 'N/A'}</td>
                                        <td className="px-3 py-1.5 font-bold text-blue-900">{entry.account_head?.name || 'N/A'}</td>
                                        <td className="px-3 py-1.5 text-gray-600">
                                            <div className="whitespace-normal break-words">"{entry.remarks}"</div>
                                        </td>
                                        <td className="px-3 py-1.5 text-right font-bold text-emerald-600">
                                            {entry.transaction_type === 'CREDIT' ? Number(entry.amount).toLocaleString('en-IN') : '-'}
                                        </td>
                                        <td className="px-3 py-1.5 text-right font-bold text-rose-600">
                                            {entry.transaction_type === 'DEBIT' ? Number(entry.amount).toLocaleString('en-IN') : '-'}
                                        </td>
                                        <td className="px-3 py-1.5 text-right font-black text-gray-800 bg-gray-50/30">
                                            {balance.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-3 py-1.5 no-print">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(entry.transaction_type, entry)}
                                                    disabled={isClosed}
                                                    className={`p-1.5 rounded-lg transition ${isClosed ? 'text-gray-300 cursor-not-allowed opacity-50' : 'text-blue-600 hover:bg-blue-100'
                                                        }`}
                                                    title={isClosed ? "Restricted: DayBook Closed" : "Edit"}
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
                                                    disabled={isClosed}
                                                    className={`p-1.5 rounded-lg transition ${isClosed ? 'text-gray-300 cursor-not-allowed opacity-50' : 'text-rose-600 hover:bg-rose-100'
                                                        }`}
                                                    title={isClosed ? "Restricted: DayBook Closed" : "Delete"}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            }) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-400 italic font-medium">
                                        {loading ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-blue-600 font-bold uppercase tracking-widest text-[10px]">Loading Entries...</span>
                                            </div>
                                        ) : (
                                            'No entries found for this date.'
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-gray-50 font-black border-t-2 border-[#1e3a8a]/20">
                            {!isClosed ? (
                                <tr>
                                    <td colSpan="4" className="px-3 py-2 text-right text-[#1e3a8a] text-[10px] uppercase">Totals:</td>
                                    <td className="px-3 py-2 text-right text-emerald-700 bg-emerald-50/50">
                                        ₹{entries.filter(e => e.transaction_type === 'CREDIT' && !e.is_closing_entry).reduce((a, b) => a + Number(b.amount), 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-3 py-2 text-right text-rose-700 bg-rose-50/50">
                                        ₹{entries.filter(e => e.transaction_type === 'DEBIT' && !e.is_closing_entry).reduce((a, b) => a + Number(b.amount), 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-3 py-2 text-right text-[#1e3a8a] bg-blue-50 text-xs">
                                        ₹{(entries.filter(e => e.transaction_type === 'CREDIT' && !e.is_closing_entry).reduce((a, b) => a + Number(b.amount), 0) -
                                            entries.filter(e => e.transaction_type === 'DEBIT' && !e.is_closing_entry).reduce((a, b) => a + Number(b.amount), 0)).toLocaleString('en-IN')}
                                    </td>
                                    <td className="no-print"></td>
                                </tr>
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-4 py-2 text-center text-gray-400 text-[10px] uppercase tracking-widest italic">End of Summary - All Transactions Protected</td>
                                </tr>
                            )}
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Entry Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-[#fdfdf3] rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden border-2 border-gray-300">
                        {/* Header */}
                        <div className="p-5 bg-emerald-600 text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="relative z-10">
                                <h2 className="text-xl font-black uppercase tracking-tight">
                                    Cash book Entry
                                </h2>
                                <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mt-0.5">
                                    {currentEntry.transaction_type || 'New'} Voucher: {currentEntry.voucher_no}
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="relative z-10 text-white hover:bg-white/20 rounded-xl p-2 transition-all duration-300">
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
                                        max={today}
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
                                    <label className="w-40 text-sm font-semibold text-gray-700">
                                        {currentEntry.mode_of_pay === 'Online' ? 'Transaction No' : 'DD/CHEQUE NO'}
                                        {currentEntry.mode_of_pay !== 'Cash' && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type="text"
                                        className={`flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 outline-none ${currentEntry.mode_of_pay === 'Cash' ? 'bg-gray-100 italic' : 'bg-[#fffced]'}`}
                                        placeholder={currentEntry.mode_of_pay === 'Cash' ? 'Not Applicable' : ''}
                                        disabled={currentEntry.mode_of_pay === 'Cash'}
                                        value={currentEntry.dd_cheque_no}
                                        onChange={(e) => setCurrentEntry({ ...currentEntry, dd_cheque_no: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="w-40 text-sm font-semibold text-gray-700">
                                        DD/CHEQUE Date
                                        {(currentEntry.mode_of_pay === 'Cheque' || currentEntry.mode_of_pay === 'DD') && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type="date"
                                        className={`flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 outline-none ${currentEntry.mode_of_pay === 'Cash' || currentEntry.mode_of_pay === 'Online' ? 'bg-gray-100 italic' : 'bg-[#fffced]'}`}
                                        disabled={currentEntry.mode_of_pay === 'Cash' || currentEntry.mode_of_pay === 'Online'}
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
                        <div className="p-6 bg-gray-50/50 flex justify-center gap-4 border-t border-gray-100">
                            <button
                                onClick={handleSaveEntry}
                                className="flex items-center gap-2 px-10 py-3 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
                            >
                                <Save size={18} />
                                Save Entry
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex items-center gap-2 px-10 py-3 bg-white text-gray-500 font-bold uppercase tracking-widest text-[10px] rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-300"
                            >
                                <XCircle size={18} />
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DayBook Close Modal */}
            {showCloseModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-2">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-emerald-100 font-sans">
                        <div className="p-3 bg-emerald-600 text-white flex justify-between items-center relative overflow-hidden">
                            {/* Decorative background circle */}
                            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                            
                            <div className="relative z-10">
                                <h2 className="text-base font-black uppercase tracking-tight">DayBook Close</h2>
                                <p className="text-[8px] font-bold text-emerald-100 uppercase tracking-widest leading-tight">Secure Finalization</p>
                            </div>
                            <button onClick={() => setShowCloseModal(false)} className="relative z-10 text-white hover:bg-white/20 rounded-lg p-1 transition-all duration-300">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4">
                            <div className="space-y-3">
                                {/* Date Section */}
                                <div className="flex items-center justify-between p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-emerald-600" />
                                        <div>
                                            <p className="text-[8px] font-bold text-emerald-700 uppercase tracking-wider">Session Date</p>
                                            <p className="text-xs font-black text-gray-800">{dayBookClose.date.split('-').reverse().join('/')}</p>
                                        </div>
                                    </div>
                                    <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded uppercase tracking-widest">Active</div>
                                </div>

                                {/* Financial Grid */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2.5 bg-gray-50/50 rounded-lg border border-gray-100">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Opening</p>
                                        <p className="text-sm font-black text-gray-700">₹{dayBookClose.openingBalance.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-50">
                                        <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider">Credits</p>
                                        <p className="text-sm font-black text-emerald-700">₹{dayBookClose.creditAmount.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="p-2.5 bg-rose-50/50 rounded-lg border border-rose-50">
                                        <p className="text-[8px] font-bold text-rose-600 uppercase tracking-wider">Debits</p>
                                        <p className="text-sm font-black text-rose-700">₹{dayBookClose.debitAmount.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-50">
                                        <p className="text-[8px] font-bold text-blue-600 uppercase tracking-wider">Net</p>
                                        <p className="text-sm font-black text-blue-700">₹{dayBookClose.dayTotal.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>

                                {/* Summary Box - Ultra Compact */}
                                <div className="p-3 bg-[#1e3a8a] rounded-lg shadow-md relative overflow-hidden text-center">
                                    <div className="absolute right-0 top-0 w-16 h-16 bg-white/5 rounded-full -mr-8 -mt-8"></div>
                                    <p className="text-[8px] font-bold text-blue-300 uppercase tracking-widest mb-0.5 relative z-10">Grand Closing Balance</p>
                                    <p className="text-2xl font-black text-white tracking-tighter relative z-10">
                                        <span className="text-sm mr-1.5 text-blue-300 opacity-80">₹</span>
                                        {dayBookClose.dayTotal.toLocaleString('en-IN')}
                                    </p>
                                </div>

                                {/* Remarks Section */}
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-0.5">Closing Remarks</label>
                                    <textarea 
                                        rows="2" 
                                        placeholder="Add notes..."
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all text-xs font-medium resize-none placeholder:text-gray-300" 
                                        value={dayBookClose.remarks} 
                                        onChange={(e) => setDayBookClose({ ...dayBookClose, remarks: e.target.value })}
                                    ></textarea>
                                </div>

                                {/* CRITICAL WARNING */}
                                <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle size={14} className="text-amber-600 mt-0.5" />
                                        <p className="text-[9px] font-bold text-amber-800 leading-tight">
                                            <span className="uppercase block mb-0.5">Finalization Lockdown:</span>
                                            Closing this book will restrict all GC bookings and payment receipts for this date. This action cannot be undone by regular users.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-2 flex gap-2">
                                <button 
                                    onClick={handleConfirmClose} 
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] rounded-lg shadow-md shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                                >
                                    <CheckCircle size={14} />
                                    Confirm & Close
                                </button>
                                <button 
                                    onClick={() => setShowCloseModal(false)} 
                                    className="px-6 py-3 bg-white text-gray-400 font-bold uppercase tracking-widest text-[9px] rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {notification.show && (
                <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-md border animate-in slide-in-from-right duration-500 ${notification.type === 'success'
                    ? 'bg-emerald-600/95 text-white border-emerald-400/30'
                    : 'bg-rose-600/95 text-white border-rose-400/30'
                    }`}>
                    <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                        {notification.type === 'success' ? (
                            <CheckCircle size={24} className="animate-bounce" />
                        ) : (
                            <XCircle size={24} className="animate-shake" />
                        )}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <p className="font-black text-sm uppercase tracking-wider mb-0.5">
                            {notification.type === 'success' ? 'Task Complete' : 'Error Occurred'}
                        </p>
                        <p className="text-xs font-bold opacity-90 leading-relaxed">{notification.message}</p>
                    </div>
                    <button
                        onClick={() => setNotification({ ...notification, show: false })}
                        className="p-1.5 hover:bg-white/20 rounded-xl transition-all hover:rotate-90"
                    >
                        <X size={20} />
                    </button>
                </div>
            )}
        </div>
    )
}

export default CashBookDetails
