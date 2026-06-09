import React, { useState, useEffect, useRef } from 'react'
import { Search, Package, CheckCircle2, AlertCircle, Loader2, Download, MapPin, Calendar, FileText, Barcode, X, ArrowRight, Filter, ChevronRight, CheckSquare, Square, Info } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function BulkGCInward() {
    const [originBranch, setOriginBranch] = useState('')
    const [branches, setBranches] = useState([])
    const [waybills, setWaybills] = useState([])
    const [selectedWaybills, setSelectedWaybills] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [notification, setNotification] = useState({ show: false, type: '', message: '' })
    const [searchTerm, setSearchTerm] = useState('')
    const [scanTerm, setScanTerm] = useState('')
    const [filterOnlyCurrentBranch, setFilterOnlyCurrentBranch] = useState(true)
    const scanInputRef = useRef(null)
    const [showHelp, setShowHelp] = useState(false)

    const [currentBranchId, setCurrentBranchId] = useState(null)
    const [currentBranchName, setCurrentBranchName] = useState('')
    const [currentBranchTaluk, setCurrentBranchTaluk] = useState('')
    const [currentUser, setCurrentUser] = useState(null)

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'))
        setCurrentUser(user)
        if (user) {
            setCurrentBranchId(user.branch_id || 1)
            setCurrentBranchName(user.branch_name || 'BRANCH OFFICE')
        }
        fetchBranches()
    }, [])

    useEffect(() => {
        if (originBranch && currentBranchId) {
            fetchWaybills()
            setTimeout(() => {
                scanInputRef.current?.focus()
            }, 500)
        } else {
            setWaybills([])
            setSelectedWaybills([])
        }
    }, [originBranch, currentBranchId, filterOnlyCurrentBranch])

    const showNotification = (type, message, isPopup = false) => {
        setNotification({ show: true, type, message, isPopup })
        if (!isPopup) {
            setTimeout(() => {
                setNotification(prev => prev.message === message ? { show: false, type: '', message: '', isPopup: false } : prev)
            }, 3000)
        }
    }

    const fetchBranches = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/branches`)
            const data = await response.json()
            if (data.success) {
                setBranches(data.data)
                // Find and set current branch taluk if we have the ID
                const user = JSON.parse(localStorage.getItem('user'))
                const bId = user?.branch_id || 1
                const currentBranch = data.data.find(b => b.id == bId)
                if (currentBranch) {
                    setCurrentBranchTaluk(currentBranch.taluk)
                }
            }
        } catch (err) {
            console.error('Error fetching branches:', err)
            showNotification('error', 'Failed to load branches')
        }
    }

    const fetchWaybills = async () => {
        try {
            setLoading(true)
            let url = `${API_BASE_URL}/waybills?status=DISPATCHED`

            if (originBranch && originBranch !== 'All Branches') {
                url += `&branch_id=${originBranch}`
            }

            if (filterOnlyCurrentBranch) {
                if (currentBranchTaluk) {
                    url += `&destination_taluk=${encodeURIComponent(currentBranchTaluk)}`
                } else if (currentBranchId) {
                    url += `&destination_branch_id=${currentBranchId}`
                }
            }
            const response = await fetch(url)
            const data = await response.json()

            if (data.success) {
                setWaybills(data.data)
                if (data.data.length === 0) {
                    showNotification('info', 'No pending GCs found')
                }
            } else {
                showNotification('error', data.message || 'Failed to fetch waybills')
            }
        } catch (err) {
            console.error('Error fetching waybills:', err)
            showNotification('error', 'Server error')
        } finally {
            setLoading(false)
        }
    }

    const filteredWaybills = waybills.filter(wb => {
        if (!searchTerm) return true
        const search = searchTerm.toLowerCase()
        return (
            wb.gc_number?.toLowerCase().includes(search) ||
            wb.consignor?.name?.toLowerCase().includes(search) ||
            wb.consignee?.name?.toLowerCase().includes(search) ||
            wb.destination?.city_name?.toLowerCase().includes(search) ||
            wb.article_desc?.toLowerCase().includes(search) ||
            (wb.articles && wb.articles.some(a => a.article_type?.toLowerCase().includes(search)))
        )
    })

    const totalQty = filteredWaybills.reduce((sum, wb) => sum + (parseInt(wb.total_articles) || 0), 0)
    const totalAmount = filteredWaybills.reduce((sum, wb) => sum + (parseFloat(wb.total_amount) || 0), 0)

    const toggleSelectAll = () => {
        if (selectedWaybills.length === filteredWaybills.length && filteredWaybills.length > 0) {
            setSelectedWaybills([])
        } else {
            setSelectedWaybills(filteredWaybills.map(wb => wb.id))
        }
    }

    const toggleSelectWaybill = (id) => {
        if (selectedWaybills.includes(id)) {
            setSelectedWaybills(selectedWaybills.filter(wbId => wbId !== id))
        } else {
            setSelectedWaybills([...selectedWaybills, id])
        }
    }

    const handleBulkInward = async () => {
        if (selectedWaybills.length === 0) {
            showNotification('error', 'Selection empty')
            return
        }

        try {
            setSaving(true)
            const response = await fetch(`${API_BASE_URL}/waybills/bulk-inward`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    waybill_ids: selectedWaybills,
                    received_branch_id: currentBranchId,
                    received_date: new Date().toISOString().split('T')[0],
                    remarks: 'Bulk Inward',
                    inward_by: currentUser?.id
                })
            })

            const data = await response.json()

            if (data.success) {
                showNotification('success', `Manifest Inwarded Successfully! ${selectedWaybills.length} GCs have been processed.`, true)
                setSelectedWaybills([])
                fetchWaybills()
            } else {
                showNotification('error', data.message || 'Inward operation failed. Please check the branch status.', true)
            }
        } catch (err) {
            console.error('Error processing bulk inward:', err)
            showNotification('error', 'Server error')
        } finally {
            setSaving(false)
        }
    }

    const handleScan = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const scancode = scanTerm.trim().toUpperCase()
            if (!scancode) return

            const found = waybills.find(wb => wb.gc_number?.toUpperCase() === scancode)

            if (found) {
                if (!selectedWaybills.includes(found.id)) {
                    setSelectedWaybills(prev => [...prev, found.id])
                    showNotification('info', `GC ${found.gc_number} matched`)
                } else {
                    showNotification('info', `GC ${found.gc_number} already selected`)
                }
            } else {
                showNotification('error', `GC ${scancode} not in manifest`)
            }
            setScanTerm('')
        }
    }

    return (
        <div className="p-3 space-y-3 bg-[#f8fafc] min-h-screen font-['Plus_Jakarta_Sans',_sans-serif]">
            {/* Modal Popup Notification */}
            {notification.show && notification.isPopup && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                        <div className={`p-8 text-center space-y-4 ${notification.type === 'success' ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
                            <div className="flex justify-center">
                                <div className={`p-4 rounded-full shadow-lg ${notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {notification.type === 'success' ? <CheckCircle2 size={40} strokeWidth={2.5} /> : <AlertCircle size={40} strokeWidth={2.5} />}
                                </div>
                            </div>
                            <h2 className={`text-2xl font-black tracking-tight uppercase ${notification.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                                {notification.type === 'success' ? 'Great Success!' : 'Action Required'}
                            </h2>
                            <p className="text-gray-600 text-[11px] font-black uppercase tracking-wider leading-relaxed px-4">
                                {notification.message}
                            </p>
                        </div>
                        <div className="p-5 bg-white">
                            <button
                                onClick={() => setNotification({ ...notification, show: false })}
                                className={`w-full py-3.5 rounded-2xl text-white text-[11px] font-black shadow-xl transition-all hover:scale-105 active:scale-95 uppercase tracking-widest ${notification.type === 'success' ? 'bg-green-600 shadow-green-100 hover:bg-green-700' : 'bg-red-600 shadow-red-100 hover:bg-red-700'}`}
                            >
                                CONTINUE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification (For Scans and Infos) */}
            {notification.show && !notification.isPopup && (
                <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md animate-in slide-in-from-right duration-300 ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                    } min-w-[240px]`}>
                    <div className="p-1.5 bg-white/20 rounded-lg">
                        {notification.type === 'error' ? <AlertCircle size={18} /> : <Search size={18} />}
                    </div>
                    <div className="flex-1">
                        <p className="font-black uppercase tracking-widest text-[10px] leading-none mb-1">
                            {notification.type === 'error' ? 'Scan Error' : 'Scanning Info'}
                        </p>
                        <p className="font-bold text-[9px] opacity-90">{notification.message}</p>
                    </div>
                    <button onClick={() => setNotification({ ...notification, show: false })} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Header - No Black color */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-3xl shadow-sm border border-green-50 gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-600 rounded-2xl shadow-lg shadow-green-100 text-white">
                        <Package size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">Bulk Inward <span className="text-green-600 text-sm ml-2">({filteredWaybills.length})</span></h1>
                            <button
                                onClick={() => setShowHelp(true)}
                                className="p-1.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-all shadow-sm border border-green-100 group"
                                title="Understanding Bulk Inward"
                            >
                                <Info size={16} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                        <p className="text-gray-400 mt-1 font-black text-[7px] uppercase tracking-widest">Arrival Management</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-2xl border border-green-100 self-end sm:self-auto">
                    <div className="flex flex-col">
                        <span className="text-[6px] font-black text-green-700 uppercase tracking-widest leading-none mb-1">Acting Branch</span>
                        {currentUser?.role === 'superadmin' ? (
                            <select
                                value={currentBranchId}
                                onChange={(e) => {
                                    const selected = branches.find(b => b.id == e.target.value)
                                    if (selected) {
                                        setCurrentBranchId(selected.id)
                                        setCurrentBranchName(selected.branch_name)
                                    }
                                }}
                                className="bg-transparent text-green-900 text-[10px] font-black outline-none border-none cursor-pointer pr-3 appearance-none hover:text-green-600"
                            >
                                {branches.map(b => (
                                    <option key={b.id} value={b.id} className="bg-white">{b.branch_name}</option>
                                ))}
                            </select>
                        ) : (
                            <span className="text-green-900 text-[10px] font-black uppercase tracking-tight">{currentBranchName}</span>
                        )}
                    </div>
                    <div className="w-px h-5 bg-green-200 mx-1"></div>
                    <MapPin size={12} className="text-green-600" />
                </div>
            </div>

            {/* Filter Hub - Clean Green theme */}
            <div className="bg-white rounded-[2rem] shadow-sm p-6 border border-green-50 relative overflow-hidden">
                <div className="relative z-10 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Origin */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Origin Point
                            </label>
                            <div className="relative group">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <select
                                    value={originBranch}
                                    onChange={(e) => setOriginBranch(e.target.value)}
                                    className="w-full pl-10 pr-6 py-2.5 bg-gray-50 border-2 border-gray-100 focus:border-green-600 focus:bg-white focus:outline-none transition-all rounded-xl text-xs font-black text-gray-700 appearance-none cursor-pointer"
                                >
                                    <option value="">Select Origin Branch</option>
                                    <option value="All Branches">All Branches</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 rotate-90" size={12} />
                            </div>
                        </div>

                        {/* Scanner */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Quick Scan
                            </label>
                            <div className="relative">
                                <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input
                                    ref={scanInputRef}
                                    type="text"
                                    placeholder="SCAN BARCODE..."
                                    value={scanTerm}
                                    onChange={(e) => setScanTerm(e.target.value)}
                                    onKeyDown={handleScan}
                                    disabled={!originBranch}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-2 border-gray-100 focus:border-blue-600 focus:bg-white focus:outline-none transition-all rounded-xl text-xs font-black text-gray-700 placeholder:text-gray-300 disabled:opacity-50 tracking-widest"
                                />
                            </div>
                        </div>

                        {/* Search */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Filter Manifest
                            </label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input
                                    type="text"
                                    placeholder="SEARCH LIST..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    disabled={!originBranch}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-2 border-gray-100 focus:border-green-600 focus:bg-white focus:outline-none transition-all rounded-xl text-xs font-black text-gray-700 placeholder:text-gray-300 disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* Branch Filter Toggle */}
                        <div className="space-y-1.5 flex flex-col justify-end">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Manifest Scope</label>
                            <button
                                onClick={() => setFilterOnlyCurrentBranch(!filterOnlyCurrentBranch)}
                                disabled={!originBranch}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-wider ${!originBranch ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-100 text-gray-400' :
                                    filterOnlyCurrentBranch
                                        ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-100'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
                                    }`}
                            >
                                {filterOnlyCurrentBranch ? <CheckSquare size={14} /> : <Square size={14} />}
                                {filterOnlyCurrentBranch ? "My Branch Only" : "Show All Destinations"}
                            </button>
                        </div>
                    </div>

                    {/* Summary Bar - Light Background */}
                    {originBranch && (
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-2xl border border-green-100 relative">
                            <div className="flex items-center gap-6 px-4">
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">Found</span>
                                    <span className="text-base font-black text-gray-900">{waybills.length}</span>
                                </div>
                                <div className="w-px h-8 bg-green-200"></div>
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-green-600 uppercase tracking-widest mb-1">Selected</span>
                                    <span className="text-base font-black text-green-700">{selectedWaybills.length}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleBulkInward}
                                disabled={selectedWaybills.length === 0 || saving}
                                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-[0.98] disabled:opacity-30 flex items-center gap-2"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} strokeWidth={3} />}
                                {saving ? "PROCESSING..." : `RECEIVE ${selectedWaybills.length} GCs`}
                            </button>
                        </div>
                    )}
                </div>
            </div >

            {/* Manifest List */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-[400px]">
                {!originBranch ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                        <MapPin size={32} className="text-gray-100 mb-4" />
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-tight">Select Origin Branch</h3>
                    </div>
                ) : loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-10">
                        <Loader2 size={32} className="animate-spin text-green-600 mb-4" />
                    </div>
                ) : filteredWaybills.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                        <FileText size={32} className="text-gray-100 mb-4" />
                        <h3 className="text-sm font-black text-gray-400 uppercase">Manifest Empty</h3>
                    </div>
                ) : (
                    <div className="overflow-auto pb-4">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#fbfcff] border-b-2 border-green-50 sticky top-0 z-20">
                                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <th className="px-4 py-4 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedWaybills.length === filteredWaybills.length && filteredWaybills.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-gray-200 text-green-600 focus:ring-green-500 cursor-pointer shadow-sm"
                                        />
                                    </th>
                                    <th className="px-3 py-4 font-black">#</th>
                                    <th className="px-3 py-4 font-black">GC Number</th>
                                    <th className="px-3 py-4 font-black">Date</th>
                                    <th className="px-3 py-4 font-black">Consignor</th>
                                    <th className="px-3 py-4 font-black">Consignee</th>
                                    <th className="px-3 py-4 text-center font-black">Qty</th>
                                    <th className="px-3 py-4 font-black">Article Type</th>
                                    <th className="px-3 py-4 font-black">Destination</th>
                                    <th className="px-3 py-4 text-right font-black">Amount</th>
                                    <th className="px-6 py-4 text-center font-black">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredWaybills.map((wb, index) => {
                                    const isSelected = selectedWaybills.includes(wb.id)
                                    return (
                                        <tr
                                            key={wb.id}
                                            onClick={() => toggleSelectWaybill(wb.id)}
                                            className={`transition-all duration-200 cursor-pointer text-[11px] group border-l-4 ${isSelected
                                                ? 'bg-green-50/70 border-green-500'
                                                : 'hover:bg-gray-50/80 border-transparent'
                                                }`}
                                        >
                                            <td className="px-4 py-3.5 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    readOnly
                                                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer transition-transform group-hover:scale-110"
                                                />
                                            </td>
                                            <td className="px-3 py-3.5 font-bold text-gray-400">{index + 1}</td>
                                            <td className="px-3 py-3.5 font-bold text-gray-900 tracking-tight">{wb.gc_number}</td>
                                            <td className="px-3 py-3.5 text-gray-500 font-bold">{wb.bill_date ? new Date(wb.bill_date).toLocaleDateString('en-GB') : '-'}</td>
                                            <td className="px-3 py-3.5 text-gray-700 font-bold uppercase tracking-tight truncate max-w-[150px]" title={wb.consignor?.name}>{wb.consignor?.name || '-'}</td>
                                            <td className="px-3 py-3.5 text-gray-700 font-bold uppercase tracking-tight truncate max-w-[150px]" title={wb.consignee?.name}>{wb.consignee?.name || '-'}</td>
                                            <td className="px-3 py-3.5 text-center">
                                                <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-black text-[10px] border border-blue-100">
                                                    {wb.total_articles || '0'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3.5 text-gray-600 font-black uppercase text-[10px] tracking-tight">
                                                {wb.articles && wb.articles.length > 0
                                                    ? wb.articles.map(a => a.article_type).filter(Boolean).join(', ') || '-'
                                                    : wb.article_desc || '-'
                                                }
                                            </td>
                                            <td className="px-3 py-3.5 font-black text-gray-600 uppercase tracking-tighter">{wb.destination?.city_name || '-'}</td>
                                            <td className="px-3 py-3.5 text-right font-black text-gray-900 border-r border-gray-50/50">
                                                <span className="bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                                    ₹{parseFloat(wb.total_amount || 0).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-center">
                                                <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${wb.status === 'DISPATCHED'
                                                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                    : 'bg-green-50 text-green-700 border-green-200'
                                                    }`}>
                                                    {wb.status || 'PENDING'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                            <tfoot className="bg-gray-50 sticky bottom-0 z-20 border-t-2 border-green-50 font-black text-[10px] text-gray-900 uppercase">
                                <tr>
                                    <td colSpan={6} className="px-4 py-3 text-right">Totals:</td>
                                    <td className="px-3 py-3 text-center font-black">
                                        <span className="bg-blue-600 text-white px-2.5 py-1 rounded-lg shadow-sm">
                                            {totalQty}
                                        </span>
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td className="px-3 py-3 text-right font-black">
                                        <span className="bg-green-600 text-white px-2.5 py-1 rounded-lg shadow-sm">
                                            ₹{totalAmount.toLocaleString()}
                                        </span>
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )
                }
            </div >

            {/* Help Modal */}
            {showHelp && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 border border-green-100 flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-gradient-to-r from-green-600 to-green-800 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <Info size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight uppercase">Bulk Inward Guide</h2>
                                    <p className="text-green-100 text-[10px] font-black uppercase tracking-widest mt-0.5">Learn How to Receive Multiple GCs</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowHelp(false)}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50 flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Component 1: Acting Branch */}
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-green-100 text-green-700 rounded-lg"><MapPin size={20} /></div>
                                        <h3 className="font-black text-gray-800 uppercase tracking-tight">Acting Branch</h3>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed font-bold">
                                        This displays your current location. All selected items will be marked as "Received" at <span className="font-black text-green-700">this specific branch</span>. Superadmins can change the acting branch to inward items on behalf of other locations.
                                    </p>
                                </div>

                                {/* Component 2: Origin Point */}
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><MapPin size={20} /></div>
                                        <h3 className="font-black text-gray-800 uppercase tracking-tight">Origin Point</h3>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed font-bold">
                                        Select where the truck/goods are coming from. This will immediately filter the manifest to show all "DISPATCHED" items coming from that branch towards your location.
                                    </p>
                                </div>

                                {/* Component 3: Quick Scan */}
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-purple-100 text-purple-700 rounded-lg"><Barcode size={20} /></div>
                                        <h3 className="font-black text-gray-800 uppercase tracking-tight">Quick Scan / Barcode</h3>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed font-bold">
                                        Click inside this box and scan physical GC barcodes using a barcode scanner. It automatically selects the scanned GC from the list. Very useful for quickly verifying unloaded goods.
                                    </p>
                                </div>

                                {/* Component 4: Filter Manifest */}
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-amber-100 text-amber-700 rounded-lg"><Search size={20} /></div>
                                        <h3 className="font-black text-gray-800 uppercase tracking-tight">Filter Manifest</h3>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed font-bold">
                                        Manually type a Consignor name, Consignee name, GC number, or Item type to quickly find specific items within a large manifest.
                                    </p>
                                </div>

                                {/* Component 5: Manifest Scope */}
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100 md:col-span-2">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-orange-100 text-orange-700 rounded-lg"><Filter size={20} /></div>
                                        <h3 className="font-black text-gray-800 uppercase tracking-tight">Manifest Scope (Destination Filter)</h3>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed font-bold">
                                        By default, the manifest only shows items where <span className="font-black text-black">YOUR BRANCH</span> is the final destination ("My Branch Only"). <br/><br/>
                                        If you click this button to switch to <span className="font-black text-black underline">"Show All Destinations"</span>, you will see ALL items coming from the Origin Point, even those meant for other branches (e.g., passing through your hub). This is useful for hub transshipment scanning.
                                    </p>
                                </div>

                                {/* Component 6: Summary & Receive */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-2xl shadow-sm border border-green-200 md:col-span-2">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-green-200 text-green-800 rounded-lg"><Download size={20} /></div>
                                        <h3 className="font-black text-gray-800 uppercase tracking-tight">Receive Selected GCs</h3>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed font-bold">
                                        This green bar tracks how many items are currently matched and selected. After verifying and selecting the checkboxes for the items you received, click the <span className="font-black text-green-700 bg-green-100/80 px-2 py-0.5 rounded border border-green-200">RECEIVE GCs</span> button to mark their status as "RECEIVED" at your branch in the database.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t border-gray-100 shrink-0 flex justify-end">
                            <button
                                onClick={() => setShowHelp(false)}
                                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95"
                            >
                                Understood & Ready
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}

export default BulkGCInward
