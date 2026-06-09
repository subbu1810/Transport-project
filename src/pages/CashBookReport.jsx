import React, { useState, useEffect } from 'react'
import { Info, X, Printer, Download, Calendar, Filter, ChevronDown, ChevronRight, Search, FileText, AlertCircle } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function CashBookReport() {
    const [reportData, setReportData] = useState([])
    const [detailedEntries, setDetailedEntries] = useState([])
    const [expandedRows, setExpandedRows] = useState(new Set())
    const [branches, setBranches] = useState([])
    const [filters, setFilters] = useState({
        from_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        to_date: new Date().toISOString().split('T')[0],
        branch_id: 'All Branches'
    })
    const [searchTerm, setSearchTerm] = useState('')

    const [currentUser, setCurrentUser] = useState(null)
    const [transportDetails, setTransportDetails] = useState({
        name: 'Transport Logistics',
        address: '',
        phone: '',
        email: '',
        logo: null
    })
    const [showHelp, setShowHelp] = useState(false)

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            const user = JSON.parse(userData)
            setCurrentUser(user)
            if (user && user.role !== 'superadmin') {
                setFilters(prev => ({ ...prev, branch_id: user.branch_id }))
            }
            fetchTransportDetails(user)
        }
        fetchBranches()
    }, [])

    const fetchTransportDetails = async (userData) => {
        try {
            if (userData?.transport_name) {
                setTransportDetails({
                    name: userData.transport_name,
                    address: userData.transport_address || '',
                    phone: userData.transport_phone || '',
                    email: userData.email || '',
                    logo: userData.transport_logo_url
                        ? (userData.transport_logo_url.startsWith('http')
                            ? userData.transport_logo_url
                            : `${STORAGE_URL}/${userData.transport_logo_url}`)
                        : null
                })
            }
        } catch (err) {
            console.error('Error fetching transport details:', err)
        }
    }

    useEffect(() => {
        if (currentUser) {
            generateReport()
        }
    }, [currentUser, filters.from_date, filters.to_date, filters.branch_id, branches])

    const fetchBranches = async () => {
        try {
            const userData = localStorage.getItem('user')
            const response = await fetch(`${API_BASE_URL}/branches`)
            const data = await response.json()
            if (data.success) {
                if (userData) {
                    const user = JSON.parse(userData)
                    if (user.role === 'superadmin') {
                        setBranches(data.data)
                    } else {
                        const userBranch = data.data.find(b => b.id === user.branch_id)
                        setBranches(userBranch ? [userBranch] : [])
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching branches:', err)
        }
    }

    const generateReport = async () => {
        try {
            // 1. Fetch closing summaries (to mark days as closed)
            let closingUrl = `${API_BASE_URL}/day-book-closings?from_date=${filters.from_date}&to_date=${filters.to_date}`
            if (filters.branch_id !== 'All Branches') {
                closingUrl += `&branch_id=${filters.branch_id}`
            }
            const closingRes = await fetch(closingUrl)
            const closingData = await closingRes.json()
            const closings = closingData.success ? closingData.data : []
            setReportData(closings)

            // 2. Fetch ALL transaction entries for the range
            let entriesUrl = `${API_BASE_URL}/cash-book?from_date=${filters.from_date}&to_date=${filters.to_date}`
            if (filters.branch_id !== 'All Branches' && filters.branch_id) {
                entriesUrl += `&branch_id=${filters.branch_id}`
            }
            const entriesRes = await fetch(entriesUrl)
            const entriesData = await entriesRes.json()
            const entries = entriesData.success ? entriesData.data : []
            setDetailedEntries(entries)

            // 3. SECURE OPENING BALANCE: Fetch opening for each branch as of START DATE
            const targetBranches = filters.branch_id === 'All Branches' ? branches : branches.filter(b => b.id.toString() === filters.branch_id.toString())
            
            const openingPromises = targetBranches.map(async (b) => {
                const res = await fetch(`${API_BASE_URL}/day-book-closings/opening-balance?branch_id=${b.id}&date=${filters.from_date}`)
                const d = await res.json()
                return { branch_id: b.id, opening_balance: Number(d.data?.opening_balance) || 0 }
            })

            const branchOpeningsRows = await Promise.all(openingPromises)
            const openingsMap = {}
            branchOpeningsRows.forEach(r => openingsMap[r.branch_id] = r.opening_balance)
            setStartBalances(openingsMap)

        } catch (err) {
            console.error('Error generating detailed report:', err)
        }
    }

    const [startBalances, setStartBalances] = useState({})

    // AGGREGATE SUMMARY: Combine start balances with all fetched entries
    const periodOpeningBalance = Object.values(startBalances).reduce((acc, curr) => acc + curr, 0)
    
    // Sum only entries from detailed list (includes unclosed days)
    const totalReceipts = detailedEntries.reduce((acc, curr) => 
        curr.transaction_type === 'CREDIT' ? acc + Number(curr.amount) : acc, 0)
    
    const totalPayments = detailedEntries.reduce((acc, curr) => 
        curr.transaction_type === 'DEBIT' ? acc + Number(curr.amount) : acc, 0)
    
    const periodClosingBalance = periodOpeningBalance + totalReceipts - totalPayments
    const netCashFlow = totalReceipts - totalPayments

    const toggleRow = async (pseudoId, branchId, date) => {
        const rowKey = pseudoId
        const newExpanded = new Set(expandedRows)
        
        if (newExpanded.has(rowKey)) {
            newExpanded.delete(rowKey)
            setExpandedRows(newExpanded)
            return
        }

        // Expand immediately for better UX
        newExpanded.add(rowKey)
        setExpandedRows(newExpanded)

        // Fetch specific entries for this branch/date if not already present or to ensure freshness
        try {
            const response = await fetch(`${API_BASE_URL}/cash-book?date=${date}&branch_id=${branchId}`)
            const data = await response.json()
            if (data.success && Array.isArray(data.data)) {
                // Merge new entries with existing ones, avoiding duplicates based on ID
                setDetailedEntries(prev => {
                    const newEntryIds = new Set(data.data.map(e => e.id));
                    const otherEntries = prev.filter(e => !newEntryIds.has(e.id));
                    return [...otherEntries, ...data.data]
                })
            }
        } catch (err) {
            console.error('Error fetching on-demand entries:', err)
        }
    }

    const getBranchDateEntries = (branchId, date) => {
        if (!detailedEntries || !Array.isArray(detailedEntries)) return []

        const targetBranchId = Number(branchId)
        const targetDate = date ? date.split(' ')[0] : ''

        return detailedEntries.filter(e => {
            const entryBranchId = Number(e.branch_id)
            const entryDate = e.transaction_date ? e.transaction_date.split(' ')[0] : ''

            if (entryBranchId !== targetBranchId || entryDate !== targetDate) return false;
            
            if (searchTerm) {
                const s = searchTerm.toLowerCase()
                const headName = (e.account_head?.name || e.accountHead?.name || '').toLowerCase()
                const remarks = (e.remarks || '').toLowerCase()
                return headName.includes(s) || remarks.includes(s) || String(e.amount).includes(s)
            }
            return true;
        }).sort((a, b) => Number(a.id) - Number(b.id))
    }

    const handlePrint = () => {
        window.print()
    }

    const printVoucher = (entry) => {
        const printWindow = window.open('', '_blank')

        const logoHtml = transportDetails.logo
            ? `<img src="${transportDetails.logo}" style="height: 40px; max-width: 100px; object-fit: contain;" />`
            : '';

        printWindow.document.write(`
          <html>
            <head>
              <title>Voucher - ${entry.voucher_no || 'N/A'}</title>
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
                    <h1>${transportDetails.name}</h1>
                    ${transportDetails.address ? `<p>${transportDetails.address} | Ph: ${transportDetails.phone}</p>` : ''}
                  </div>
                </div>
                
                <div class="voucher-type-row">
                  <div class="voucher-type">CASH ${entry.transaction_type} VOUCHER</div>
                </div>
    
                <div class="info-grid">
                  <div class="info-item"><b>Voucher No</b> <span>${entry.voucher_no || 'N/A'}</span></div>
                  <div class="info-item"><b>Date</b> <span>${entry.transaction_date}</span></div>
                  <div class="info-item"><b>Branch</b> <span>${entry.branch?.branch_name || 'N/A'}</span></div>
                  <div class="info-item"><b>Mode</b> <span>${entry.mode_of_pay || 'Cash'}</span></div>
                </div>
    
                <div class="full-width-item"><b>Head:</b> <span>${entry.account_head?.name || entry.accountHead?.name || 'N/A'}</span></div>
                <div class="full-width-item"><b>Paid/Recv:</b> <span>${entry.paid_by_received_by || entry.paid_to_receive_from || 'N/A'}</span></div>
    
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

    const printDayReport = async (row) => {
        // Open window IMMEDIATELY to avoid popup blocker
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            alert('Popup blocked! Please allow popups for this site to print.')
            return
        }
        
        printWindow.document.write('<html><head><title>Loading...</title></head><body><p style="font-family:sans-serif; text-align:center; margin-top:50px;">Preparing report, please wait...</p></body></html>')

        // Fetch fresh details if not already loaded (ensure we have items)
        let dayEntries = getBranchDateEntries(row.branch_id, row.closing_date);

        if (dayEntries.length === 0) {
            try {
                const response = await fetch(`${API_BASE_URL}/cash-book?date=${row.closing_date}&branch_id=${row.branch_id}`)
                const data = await response.json()
                if (data.success && Array.isArray(data.data)) {
                    dayEntries = data.data;
                }
            } catch (err) {
                console.error('Error fetching for print:', err)
                printWindow.document.body.innerHTML = '<p style="color:red;">Error loading details. Please try again.</p>'
                return
            }
        }

        const logoHtml = transportDetails.logo ? `<img src="${transportDetails.logo}" style="height: 60px; object-fit: contain;" />` : '';

        const rowsHtml = dayEntries.map((e, index) => {
            const creditNum = e.transaction_type === 'CREDIT' ? Number(e.amount) : 0;
            const debitNum = e.transaction_type === 'DEBIT' ? Number(e.amount) : 0;
            const headName = e.account_head?.name || e.accountHead?.name || 'N/A';

            return `
                <tr>
                    <td style="border: 1px solid black; padding: 5px; text-align: left;">${e.transaction_date}</td>
                    <td style="border: 1px solid black; padding: 5px; text-align: left;">${headName}</td>
                    <td style="border: 1px solid black; padding: 5px; text-align: left;">${e.remarks || '-'}</td>
                    <td style="border: 1px solid black; padding: 5px; text-align: right;">${creditNum ? creditNum.toLocaleString('en-IN') : '-'}</td>
                    <td style="border: 1px solid black; padding: 5px; text-align: right;">${debitNum ? debitNum.toLocaleString('en-IN') : '-'}</td>
                </tr>
            `;
        }).join('');

        // Overwrite the loading message with the real content
        printWindow.document.open()
        printWindow.document.write(`
            <html>
                <head>
                    <title>Daily Cash Report - ${row.closing_date} ${!row.is_closed ? '(DRAFT)' : ''}</title>
                    <style>
                        @page { size: auto; margin: 10mm; }
                        body { font-family: sans-serif; padding: 0; margin: 0; }
                        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; }
                        .title { text-align: right; }
                        table { width: 100%; border-collapse: collapse; font-size: 11px; }
                        th { background: #eee; border: 1px solid black; padding: 6px; text-transform: uppercase; }
                        .totals-row { font-weight: bold; background: #fafafa; }
                        .footer { margin-top: 50px; display: flex; justify-content: space-between; }
                        .sign { border-top: 1px solid black; padding-top: 5px; width: 150px; text-align: center; font-size: 10px; font-weight: bold; }
                        .draft-watermark { color: #ccc; font-size: 40px; transform: rotate(-30deg); position: fixed; top: 40%; left: 30%; opacity: 0.3; z-index: -1; font-weight: 900; pointer-events: none; }
                    </style>
                </head>
                <body onload="window.print(); window.onafterprint = function() { window.close(); };">
                    ${!row.is_closed ? '<div class="draft-watermark">DRAFT REPORT</div>' : ''}
                    <div class="header">
                        ${logoHtml}
                        <div class="header-info">
                            <h1 style="margin: 0; font-size: 20px;">${transportDetails.name}</h1>
                            <p style="margin: 2px 0; font-size: 11px;">${transportDetails.address}</p>
                            ${transportDetails.phone ? `<p style="margin: 2px 0; font-size: 11px;">Ph: ${transportDetails.phone}</p>` : ''}
                        </div>
                        <div class="title">
                            <h2 style="margin: 0; text-decoration: underline;">DAILY CASH REPORT ${!row.is_closed ? '(DRAFT)' : ''}</h2>
                            <p style="margin: 2px 0; font-weight: bold;">Date: ${row.closing_date}</p>
                            <p style="margin: 2px 0; font-weight: bold;">Branch: ${row.branch_name || row.branch?.branch_name || 'N/A'}</p>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Account Head</th>
                                <th>Remarks</th>
                                <th>Credit (₹)</th>
                                <th>Debit (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="background: #fdfdfd; italic">
                                <td colspan="3" style="border: 1px solid black; padding: 5px; text-align: right; font-weight: bold;">OPENING BALANCE:</td>
                                <td style="border: 1px solid black; padding: 5px; text-align: right; font-weight: bold;">₹ ${Number(row.opening_balance).toLocaleString('en-IN')}</td>
                                <td style="border: 1px solid black; padding: 5px; text-align: center; font-weight: bold;">-</td>
                            </tr>
                            ${rowsHtml || '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #999;">No detailed entries found for this date.</td></tr>'}
                        </tbody>
                        <tfoot class="totals-row">
                            <tr>
                                <td colspan="3" style="border: 1px solid black; padding: 8px; text-align: right;">DAY TOTALS:</td>
                                <td style="border: 1px solid black; padding: 8px; text-align: right;">₹ ${Number(row.credits || row.credit_total || 0).toLocaleString('en-IN')}</td>
                                <td style="border: 1px solid black; padding: 8px; text-align: right;">₹ ${Number(row.debits || row.debit_total || 0).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr style="background: #eee;">
                                <td colspan="3" style="border: 1px solid black; padding: 8px; text-align: right; font-size: 14px;">CLOSING BALANCE:</td>
                                <td style="border: 1px solid black; padding: 8px; text-align: right; font-size: 14px;">₹ ${Number(row.closing_balance).toLocaleString('en-IN')}</td>
                                <td style="border: 1px solid black; padding: 8px; text-align: center; font-size: 14px;">-</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div class="footer">
                        <div class="sign">CASHIER / PREPARED BY</div>
                        <div class="sign">ACCOUNTANT</div>
                        <div class="sign">BRANCH MANAGER / AUTHORISED</div>
                    </div>
                </body>
            </html>
        `)
        printWindow.document.close()
    }

    return (
        <div className="p-2 space-y-4 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-[#1e3a8a]">Cash Book Report</h1>
                            <button
                                onClick={() => setShowHelp(true)}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-all shadow-sm border border-blue-100 group"
                                title="Understanding Cash Book"
                            >
                                <Info size={18} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                        <p className="text-gray-500 text-xs italic">Showing data only for DayBook Closed dates</p>
                    </div>
                </div>
                <div className="flex gap-2 no-print">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1e3a8a] text-[#1e3a8a] rounded text-sm hover:bg-blue-50 transition font-bold shadow-sm"
                    >
                        <Printer size={16} />
                        Print
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e3a8a] text-white rounded text-sm hover:bg-[#1e40af] transition shadow hover:shadow-md font-bold"
                    >
                        <Download size={16} />
                        PDF
                    </button>
                </div>
            </div>

            {/* Search Filters */}
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 no-print">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">From Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1e3a8a]" size={14} />
                            <input
                                type="date"
                                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded text-xs focus:border-[#1e3a8a] outline-none transition"
                                value={filters.from_date}
                                onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">To Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1e3a8a]" size={14} />
                            <input
                                type="date"
                                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded text-xs focus:border-[#1e3a8a] outline-none transition"
                                value={filters.to_date}
                                onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Branch</label>
                        <select
                            className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs focus:border-[#1e3a8a] outline-none bg-gray-50 font-semibold text-gray-700 disabled:opacity-50"
                            value={filters.branch_id}
                            onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
                            disabled={currentUser?.role !== 'superadmin'}
                        >
                            {currentUser?.role === 'superadmin' && <option value="All Branches">All Branches</option>}
                            {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Search Particulars</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1e3a8a]" size={14} />
                            <input
                                type="text"
                                placeholder="Search 'salary', head..."
                                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded text-xs focus:border-[#1e3a8a] outline-none transition"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-white border-l-4 border-gray-500 p-3 rounded-lg shadow-sm">
                    <p className="text-gray-600 text-[10px] font-bold uppercase tracking-tight">Period Opening</p>
                    <h3 className="text-xl font-black mt-1 text-gray-800">₹{periodOpeningBalance.toLocaleString('en-IN')}</h3>
                </div>
                <div className="bg-white border-l-4 border-emerald-500 p-3 rounded-lg shadow-sm">
                    <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-tight">Total Receipts</p>
                    <h3 className="text-xl font-black mt-1 text-gray-800">₹{totalReceipts.toLocaleString('en-IN')}</h3>
                </div>
                <div className="bg-white border-l-4 border-rose-500 p-3 rounded-lg shadow-sm">
                    <p className="text-rose-600 text-[10px] font-bold uppercase tracking-tight">Total Payments</p>
                    <h3 className="text-xl font-black mt-1 text-gray-800">₹{totalPayments.toLocaleString('en-IN')}</h3>
                </div>
                <div className="bg-white border-l-4 border-blue-500 p-3 rounded-lg shadow-sm">
                    <p className="text-blue-600 text-[10px] font-bold uppercase tracking-tight">Period Closing</p>
                    <h3 className="text-xl font-black mt-1 text-[#1e3a8a]">₹{periodClosingBalance.toLocaleString('en-IN')}</h3>
                </div>
            </div>

            {/* Report Table */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-gray-900 text-white font-bold">
                                <th className="px-4 py-2.5 text-left border-r border-gray-700 w-10"></th>
                                <th className="px-4 py-2.5 text-left border-r border-gray-700">Date</th>
                                <th className="px-4 py-2.5 text-left border-r border-gray-700">Branch</th>
                                <th className="px-4 py-2.5 text-right border-r border-gray-700">Opening (₹)</th>
                                <th className="px-4 py-2.5 text-right border-r border-gray-700">Receipts (₹)</th>
                                <th className="px-4 py-2.5 text-right border-r border-gray-700">Payments (₹)</th>
                                <th className="px-4 py-2.5 text-right border-r border-gray-700">Closing (₹)</th>
                                <th className="px-4 py-2.5 text-center border-gray-700 no-print">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(() => {
                                // 1. Map all closings by Date-Branch key
                                const closingMap = {}
                                reportData.forEach(c => {
                                    closingMap[`${c.branch_id}-${c.closing_date}`] = c
                                })

                                // 2. Get all distinct Date-Branch combinations from entries
                                const entryDaysMap = {}
                                
                                const filteredEntries = detailedEntries.filter(e => {
                                    if (!searchTerm) return true
                                    const s = searchTerm.toLowerCase()
                                    const headName = (e.account_head?.name || e.accountHead?.name || '').toLowerCase()
                                    const remarks = (e.remarks || '').toLowerCase()
                                    return headName.includes(s) || remarks.includes(s) || String(e.amount).includes(s)
                                })

                                filteredEntries.forEach(e => {
                                    const dateKey = e.transaction_date?.split(' ')[0]
                                    if (!dateKey) return
                                    const key = `${e.branch_id}-${dateKey}`
                                    if (!entryDaysMap[key]) {
                                        entryDaysMap[key] = {
                                            branch_id: e.branch_id,
                                            branch_name: e.branch?.branch_name,
                                            date: dateKey,
                                            credits: 0,
                                            debits: 0
                                        }
                                    }
                                    if (e.transaction_type === 'CREDIT') entryDaysMap[key].credits += Number(e.amount)
                                    else entryDaysMap[key].debits += Number(e.amount)
                                })

                                // 3. Merge both lists and sort by date then branch
                                const allKeys = new Set(
                                    searchTerm 
                                        ? Object.keys(entryDaysMap) 
                                        : [...Object.keys(closingMap), ...Object.keys(entryDaysMap)]
                                )
                                const rawRows = Array.from(allKeys).map(key => {
                                    const c = closingMap[key]
                                    const e = entryDaysMap[key]
                                    const bId = key.substring(0, key.indexOf('-'))
                                    const d = key.substring(key.indexOf('-') + 1)
                                    return {
                                        key,
                                        is_closed: !!c,
                                        id: c?.id || `draft-${key}`,
                                        closing_date: d,
                                        branch_id: bId,
                                        branch_name: c?.branch?.branch_name || e?.branch_name || 'N/A',
                                        credits: c ? Number(c.credit_total) : (e?.credits || 0),
                                        debits: c ? Number(c.debit_total) : (e?.debits || 0),
                                        closed_opening: c ? Number(c.opening_balance) : null,
                                        closed_closing: c ? Number(c.closing_balance) : null
                                    }
                                }).sort((a, b) => a.closing_date.localeCompare(b.closing_date))

                                // 4. DYNAMIC BALANCE ROLL-FORWARD
                                const rollingBalances = { ...startBalances }
                                const rows = rawRows.map(row => {
                                    const bId = row.branch_id
                                    // Start with rolling balance if available, otherwise 0 or the closed opening
                                    const calcOpening = rollingBalances[bId] !== undefined ? rollingBalances[bId] : (row.closed_opening || 0)
                                    const calcClosing = calcOpening + row.credits - row.debits
                                    
                                    // Update rolling for next appearance of this branch
                                    rollingBalances[bId] = calcClosing

                                    return {
                                        ...row,
                                        opening_balance: calcOpening,
                                        closing_balance: calcClosing,
                                        // Discrepancy check: If closed but math doesn't match entries
                                        warning: row.is_closed && Math.abs(calcClosing - (row.closed_closing || 0)) > 1
                                    }
                                }).sort((a, b) => a.closing_date.localeCompare(b.closing_date) || a.branch_name.localeCompare(b.branch_name))

                                if (rows.length === 0) return null

                                return rows.map((row) => (
                                    <React.Fragment key={row.key}>
                                        <tr
                                            onClick={() => toggleRow(row.key, row.branch_id, row.closing_date)}
                                            className={`hover:bg-blue-50/50 transition duration-300 font-bold cursor-pointer ${!row.is_closed ? 'bg-amber-50/20' : ''}`}
                                        >
                                            <td className="px-4 py-2 text-center border-r border-gray-50">
                                                {expandedRows.has(row.key) ? (
                                                    <ChevronDown size={18} className="text-[#1e3a8a]" />
                                                ) : (
                                                    <ChevronRight size={18} className="text-gray-400" />
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-gray-600 border-r border-gray-50">
                                                <div className="flex items-center gap-2">
                                                    {row.closing_date}
                                                    {!row.is_closed && <span className="text-[8px] bg-amber-100 text-amber-700 px-1 rounded-sm uppercase tracking-tighter">Draft</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-[#1e3a8a] border-r border-gray-50">{row.branch_name}</td>
                                            <td className="px-4 py-2 text-right text-gray-400 border-r border-gray-50 italic">₹{Number(row.opening_balance).toLocaleString('en-IN')}</td>
                                            <td className="px-4 py-2 text-right text-emerald-600 border-r border-gray-50 font-black">₹{Number(row.credits).toLocaleString('en-IN')}</td>
                                            <td className="px-4 py-2 text-right text-rose-600 border-r border-gray-50 font-black">₹{Number(row.debits).toLocaleString('en-IN')}</td>
                                            <td className={`px-4 py-2 text-right font-black border-r border-gray-50 ${row.warning ? 'text-amber-600 bg-amber-50' : 'text-gray-900 bg-gray-50/50'}`}>
                                                ₹{Number(row.closing_balance).toLocaleString('en-IN')}
                                                {row.warning && <AlertCircle size={10} className="inline ml-1" title="Discrepancy: Entries sum different from Closed total" />}
                                            </td>
                                            <td className="px-4 py-2 text-center no-print">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); printDayReport(row); }}
                                                    className={`p-1.5 rounded transition ${row.is_closed ? 'text-blue-600 hover:bg-blue-50' : 'text-amber-600 hover:bg-amber-50'}`}
                                                    title={row.is_closed ? "Print Finalized Day Report" : "Print Draft Day Report"}
                                                >
                                                    <Printer size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedRows.has(row.key) && (
                                        <tr className="bg-white">
                                            <td colSpan="8" className="px-0 py-0 border-b border-gray-100">
                                                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <table className="w-full text-[11px] border-collapse bg-white">
                                                        <thead className="bg-gray-50 text-gray-800 border-y border-gray-200">
                                                            <tr>
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
                                                        <tbody className="divide-y divide-gray-50 font-medium">
                                                            {(() => {
                                                                let runningBal = Number(row.opening_balance)
                                                                const dayEntries = getBranchDateEntries(row.branch_id, row.closing_date)

                                                                if (dayEntries.length === 0) {
                                                                    return (
                                                                        <tr>
                                                                            <td colSpan="8" className="px-3 py-8 text-center text-gray-400 italic font-normal">No detailed transactions recorded for this day.</td>
                                                                        </tr>
                                                                    )
                                                                }

                                                                return dayEntries.map((e) => {
                                                                    if (e.transaction_type === 'CREDIT') runningBal += Number(e.amount)
                                                                    else runningBal -= Number(e.amount)

                                                                    const headName = e.account_head?.name || e.accountHead?.name || 'N/A'

                                                                    return (
                                                                        <tr key={`entry-${e.id}`} className="hover:bg-gray-50/50 transition border-b border-gray-50 shadow-sm">
                                                                            <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{e.transaction_date}</td>
                                                                            <td className="px-3 py-2.5 text-gray-500 uppercase text-[9px]">{e.branch?.branch_name || '-'}</td>
                                                                            <td className="px-3 py-2.5 font-black text-[#1e3a8a] text-[10px]">
                                                                                {headName}
                                                                            </td>
                                                                            <td className="px-3 py-2.5 text-gray-600 max-w-[250px] truncate leading-tight font-medium">
                                                                                {e.remarks || '-'}
                                                                            </td>
                                                                            <td className="px-3 py-2.5 text-right font-black text-emerald-700 bg-emerald-50/10">
                                                                                {e.transaction_type === 'CREDIT' ? `₹${Number(e.amount).toLocaleString('en-IN')}` : '-'}
                                                                            </td>
                                                                            <td className="px-3 py-2.5 text-right font-black text-rose-700 bg-rose-50/10">
                                                                                {e.transaction_type === 'DEBIT' ? `₹${Number(e.amount).toLocaleString('en-IN')}` : '-'}
                                                                            </td>
                                                                            <td className="px-3 py-2.5 text-right font-black text-gray-900 bg-gray-50/40">
                                                                                ₹{runningBal.toLocaleString('en-IN')}
                                                                            </td>
                                                                            <td className="px-3 py-2.5 text-center no-print border-l border-gray-50">
                                                                                <button
                                                                                    onClick={(event) => { event.stopPropagation(); printVoucher(e); }}
                                                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                                                    title="Print Voucher"
                                                                                >
                                                                                    <Printer size={15} />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    )
                                                                })
                                                            })()}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </React.Fragment>
                                ))
                            })() || (
                                <tr>
                                    <td colSpan="8" className="px-6 py-20 text-center text-gray-400 italic font-medium">
                                        No transaction data found for the selected period.
                                        <br />
                                        <span className="text-sm">Add entries in "Cash Book Details" to see reports here.</span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {(detailedEntries.length > 0 || reportData.length > 0) && (
                            <tfoot className="bg-gray-100/50 font-black">
                                <tr>
                                    <td colSpan="3" className="px-4 py-3 text-right text-gray-500 uppercase tracking-widest text-[10px]">Totals:</td>
                                    <td className="px-4 py-3 text-right text-gray-700">₹{periodOpeningBalance.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-right text-emerald-700">₹{totalReceipts.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-right text-rose-700">₹{totalPayments.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-right text-[#1e3a8a] text-sm font-black">₹{periodClosingBalance.toLocaleString('en-IN')}</td>
                                    <td className="no-print"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Hidden Printable Section */}
            <div id="printable-report" className="hidden-print-section p-6 bg-white text-black font-sans">
                <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
                    <div className="flex items-center gap-4">
                        {transportDetails.logo && (
                            <img src={transportDetails.logo} alt="Logo" className="w-16 h-16 object-contain" />
                        )}
                        <div>
                            <h2 className="text-2xl font-black uppercase text-black">{transportDetails.name}</h2>
                            <p className="text-sm font-bold text-gray-800">{transportDetails.address}</p>
                            <p className="text-sm font-bold text-gray-800">Ph: {transportDetails.phone} | Email: {transportDetails.email}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h3 className="text-xl font-black uppercase text-black underline">Cash Book Report</h3>
                        <p className="text-sm font-bold mt-1">
                            Branch: <span className="uppercase">{filters.branch_id === 'All Branches' ? 'ALL BRANCHES' : branches.find(b => b.id.toString() === filters.branch_id.toString())?.branch_name || 'N/A'}</span>
                        </p>
                        <p className="text-sm font-bold">
                            Period: {filters.from_date.split('-').reverse().join('/')} to {filters.to_date.split('-').reverse().join('/')}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="border border-black p-2 bg-gray-50 text-center">
                        <p className="text-[10px] uppercase font-bold">Period Opening</p>
                        <p className="text-xl font-black">₹{periodOpeningBalance.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="border border-black p-2 bg-gray-50 text-center">
                        <p className="text-[10px] uppercase font-bold">Total Receipts</p>
                        <p className="text-xl font-black">₹{totalReceipts.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="border border-black p-2 bg-gray-50 text-center">
                        <p className="text-[10px] uppercase font-bold">Total Payments</p>
                        <p className="text-xl font-black">₹{totalPayments.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="border border-black p-2 bg-gray-50 text-center">
                        <p className="text-[10px] uppercase font-bold">Period Closing</p>
                        <p className="text-xl font-black">₹{periodClosingBalance.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-black px-2 py-1.5 text-left">Date</th>
                            <th className="border border-black px-2 py-1.5 text-left">Branch</th>
                            <th className="border border-black px-2 py-1.5 text-right">Opening (₹)</th>
                            <th className="border border-black px-2 py-1.5 text-right">Receipts (₹)</th>
                            <th className="border border-black px-2 py-1.5 text-right">Payments (₹)</th>
                            <th className="border border-black px-2 py-1.5 text-right">Closing (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            const closingMap = {}
                            reportData.forEach(c => { closingMap[`${c.branch_id}-${c.closing_date}`] = c })
                            const entryDaysMap = {}
                            detailedEntries.forEach(e => {
                                const dKey = e.transaction_date?.split(' ')[0]
                                if (!dKey) return
                                const key = `${e.branch_id}-${dKey}`
                                if (!entryDaysMap[key]) entryDaysMap[key] = { branch_id: e.branch_id, branch_name: e.branch?.branch_name, date: dKey, credits: 0, debits: 0 }
                                if (e.transaction_type === 'CREDIT') entryDaysMap[key].credits += Number(e.amount)
                                else entryDaysMap[key].debits += Number(e.amount)
                            })
                            const allKeys = new Set([...Object.keys(closingMap), ...Object.keys(entryDaysMap)])
                            
                            // Roll forward balances specifically for the print view
                            const rollingPrint = { ...startBalances }
                            const rows = Array.from(allKeys)
                                .map(key => {
                                    const c = closingMap[key];
                                    const e = entryDaysMap[key];
                                    const bId = key.substring(0, key.indexOf('-'));
                                    const d = key.substring(key.indexOf('-') + 1);
                                    return { key, bId, date: d, c, e };
                                })
                                .sort((a, b) => a.date.localeCompare(b.date)) // Sort BEFORE calculation
                                .map(item => {
                                    const { bId, date, c, e } = item;
                                    const cr = c ? Number(c.credit_total) : (e?.credits || 0)
                                    const dr = c ? Number(c.debit_total) : (e?.debits || 0)
                                    const op = rollingPrint[bId] !== undefined ? rollingPrint[bId] : (c ? Number(c.opening_balance) : 0)
                                    const cl = op + cr - dr
                                    rollingPrint[bId] = cl

                                    return { closing_date: date, branch_name: c?.branch?.branch_name || e?.branch_name || 'N/A', is_closed: !!c, opening_balance: op, credit_total: cr, debit_total: dr, closing_balance: cl }
                                });

                            return rows.map((row, idx) => (
                                <tr key={`print-row-${idx}`}>
                                    <td className="border border-black px-2 py-1.5">{row.closing_date}</td>
                                    <td className="border border-black px-2 py-1.5">{row.branch_name}</td>
                                    <td className="border border-black px-2 py-1.5 text-right">{Number(row.opening_balance).toLocaleString('en-IN')}</td>
                                    <td className="border border-black px-2 py-1.5 text-right font-bold text-emerald-800">{Number(row.credit_total).toLocaleString('en-IN')}</td>
                                    <td className="border border-black px-2 py-1.5 text-right font-bold text-rose-800">{Number(row.debit_total).toLocaleString('en-IN')}</td>
                                    <td className="border border-black px-2 py-1.5 text-right font-black">{Number(row.closing_balance).toLocaleString('en-IN')}</td>
                                </tr>
                            ))
                        })()}
                    </tbody>
                    <tfoot className="bg-gray-100 font-black">
                        <tr>
                            <td colSpan="2" className="border border-black px-2 py-2 text-right uppercase">Report Totals:</td>
                            <td className="border border-black px-2 py-2 text-right">₹{periodOpeningBalance.toLocaleString('en-IN')}</td>
                            <td className="border border-black px-2 py-2 text-right">₹{totalReceipts.toLocaleString('en-IN')}</td>
                            <td className="border border-black px-2 py-2 text-right">₹{totalPayments.toLocaleString('en-IN')}</td>
                            <td className="border border-black px-2 py-2 text-right text-sm">₹{periodClosingBalance.toLocaleString('en-IN')}</td>
                        </tr>
                    </tfoot>
                </table>

                <div className="mt-12 flex justify-between px-4">
                    <div className="border-t border-black pt-2 px-8 text-center text-xs font-bold uppercase">Prepared By</div>
                    <div className="border-t border-black pt-2 px-8 text-center text-xs font-bold uppercase">Branch Manager</div>
                    <div className="border-t border-black pt-2 px-8 text-center text-xs font-bold uppercase">Authorised Signatory</div>
                </div>
            </div>

            <style>{`
                @media screen {
                    .hidden-print-section { display: none; }
                }
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    body * { visibility: hidden !important; }
                    #printable-report, #printable-report * { visibility: visible !important; }
                    #printable-report {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        display: block !important;
                    }
                    .no-print { display: none !important; }
                    table { border-collapse: collapse !important; }
                    th, td { border: 1px solid black !important; }
                }
            `}</style>

            {/* Help Modal */}
            {showHelp && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-blue-100">
                        <div className="p-6 bg-gradient-to-r from-[#1e3a8a] to-indigo-900 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Info size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight">Cash Book Guide</h2>
                                    <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Financial Transparency & Audit</p>
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
                            <div className="space-y-8">
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-[#1e3a8a] font-bold uppercase text-xs tracking-wider">
                                        <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-black">?</span>
                                        What is the Cash Book Report?
                                    </div>
                                    <div className="ml-10">
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            The Cash Book Report provides a finalized summary of all cash transactions. Crucially, it only displays data for dates where the <span className="font-bold text-[#1e3a8a]">DayBook has been Closed</span> by the branch manager or cashier.
                                        </p>
                                    </div>
                                </section>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-2 text-emerald-700 font-bold uppercase text-xs tracking-wider">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-black">IN</div>
                                            Receipts (Credit)
                                        </div>
                                        <ul className="space-y-2 text-xs text-gray-500 ml-10 leading-relaxed">
                                            <li>• Cash received from customers.</li>
                                            <li>• External funding or bank withdrawals.</li>
                                            <li>• <span className="font-bold">Increases</span> your closing balance.</li>
                                        </ul>
                                    </section>

                                    <section className="space-y-4">
                                        <div className="flex items-center gap-2 text-rose-700 font-bold uppercase text-xs tracking-wider">
                                            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 font-black">OUT</div>
                                            Payments (Debit)
                                        </div>
                                        <ul className="space-y-2 text-xs text-gray-500 ml-10 leading-relaxed">
                                            <li>• Operational expenses and salaries.</li>
                                            <li>• Driver advances or fuel payments.</li>
                                            <li>• <span className="font-bold">Decreases</span> your closing balance.</li>
                                        </ul>
                                    </section>
                                </div>

                                <section className="space-y-4 bg-amber-50 p-6 rounded-2xl border border-amber-100">
                                    <div className="flex items-center gap-2 text-amber-700 font-bold uppercase text-xs tracking-wider">
                                        <span className="text-lg">⚖️</span>
                                        Balancing Logic
                                    </div>
                                    <div className="text-xs text-amber-800 leading-relaxed ml-7 space-y-2">
                                        <p><span className="font-black italic">Opening Balance + Total Receipts - Total Payments = Closing Balance</span></p>
                                        <p>The <span className="font-bold underline">Closing Balance</span> of one day automatically becomes the <span className="font-bold underline">Opening Balance</span> of the next operational day.</p>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-blue-700 font-bold uppercase text-xs tracking-wider">
                                        <span className="text-lg">🔍</span>
                                        Detailed View
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed ml-7">
                                        Click on any row in the table to expand it and see the <span className="font-black italic">Voucher-by-Voucher</span> breakdown of that specific day's transactions.
                                    </p>
                                </section>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setShowHelp(false)}
                                className="px-8 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-95 uppercase text-xs tracking-widest"
                            >
                                Got It!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CashBookReport
