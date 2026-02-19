import React, { useState, useEffect } from 'react'
import { Search, Package, CheckCircle2, XCircle, Loader2, Download, MapPin, Calendar, FileText } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function BulkGCInward() {
    const [originBranch, setOriginBranch] = useState('')
    const [branches, setBranches] = useState([])
    const [waybills, setWaybills] = useState([])
    const [selectedWaybills, setSelectedWaybills] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    const [currentBranchId, setCurrentBranchId] = useState(null)
    const [currentBranchName, setCurrentBranchName] = useState('')
    const [currentUser, setCurrentUser] = useState(null)

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'))
        setCurrentUser(user)
        if (user) {
            setCurrentBranchId(user.branch_id || 1)
            setCurrentBranchName(user.branch_name || 'SINDHANUIR')
        }
        fetchBranches()
    }, [])

    useEffect(() => {
        if (originBranch && currentBranchId) {
            fetchWaybills()
        } else {
            setWaybills([])
            setSelectedWaybills([])
        }
    }, [originBranch, currentBranchId])

    const fetchBranches = async () => {
        try {
            const response = await fetch(`${API_URL}/branches`)
            const data = await response.json()
            if (data.success) {
                setBranches(data.data)
            }
        } catch (err) {
            console.error('Error fetching branches:', err)
            setError('Failed to load branches')
        }
    }

    const fetchWaybills = async () => {
        try {
            setLoading(true)
            setError('')

            // Fetch waybills where:
            // - origin_branch_id = selected origin branch
            // - destination matches current logged-in branch
            // - status = PENDING or DISPATCHED (not yet received at destination)
            const response = await fetch(
                `${API_URL}/waybills?origin_branch_id=${originBranch}&destination_branch_id=${currentBranchId}&status=DISPATCHED`
            )
            const data = await response.json()

            if (data.success) {
                setWaybills(data.data)
                if (data.data.length === 0) {
                    setError('No pending waybills found for the selected origin branch')
                }
            } else {
                setError(data.message || 'Failed to fetch waybills')
            }
        } catch (err) {
            console.error('Error fetching waybills:', err)
            setError('Error connecting to server')
        } finally {
            setLoading(false)
        }
    }

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
            setError('Please select at least one waybill to receive')
            return
        }

        try {
            setSaving(true)
            setError('')
            setSuccess('')

            const response = await fetch(`${API_URL}/waybills/bulk-inward`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    waybill_ids: selectedWaybills,
                    received_branch_id: currentBranchId,
                    received_date: new Date().toISOString().split('T')[0]
                })
            })

            const data = await response.json()

            if (data.success) {
                setSuccess(`Successfully received ${selectedWaybills.length} waybill(s) at ${currentBranchName}`)
                setSelectedWaybills([])
                fetchWaybills() // Refresh the list
            } else {
                setError(data.message || 'Failed to process bulk inward')
            }
        } catch (err) {
            console.error('Error processing bulk inward:', err)
            setError('Error connecting to server')
        } finally {
            setSaving(false)
        }
    }

    const filteredWaybills = waybills.filter(wb => {
        if (!searchTerm) return true
        const search = searchTerm.toLowerCase()
        return (
            wb.gc_number?.toLowerCase().includes(search) ||
            wb.consignor?.name?.toLowerCase().includes(search) ||
            wb.consignee?.name?.toLowerCase().includes(search)
        )
    })

    return (
        <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <Package className="text-green-600" size={24} />
                        Bulk GC Inward
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-gray-500 font-medium">
                            Receiving at:
                        </p>
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
                                className="text-sm font-black text-green-600 bg-green-50 border-none outline-none cursor-pointer p-1 rounded hover:bg-green-100 transition-colors"
                            >
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                                ))}
                            </select>
                        ) : (
                            <span className="font-black text-green-600">{currentBranchName}</span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    {success && <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium flex items-center gap-2">
                        <CheckCircle2 size={18} /> {success}
                    </span>}
                    {error && <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium flex items-center gap-2">
                        <XCircle size={18} /> {error}
                    </span>}
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-2 gap-4">
                    {/* Origin Branch Selector */}
                    <div>
                        <label className="block text-xs font-black text-gray-600 uppercase mb-2 tracking-wider">
                            Origin Branch <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <select
                                value={originBranch}
                                onChange={(e) => setOriginBranch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none font-bold text-gray-800 bg-white text-sm"
                            >
                                <option value="">Select Origin Branch</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.branch_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 ml-1">Select the branch where GCs were dispatched from</p>
                    </div>

                    {/* Search Filter */}
                    <div>
                        <label className="block text-xs font-black text-gray-600 uppercase mb-2 tracking-wider">
                            Search GC / Consignor / Consignee
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Type to filter results..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                disabled={!originBranch}
                                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none font-bold text-gray-800 disabled:bg-gray-100 disabled:text-gray-400 text-sm"
                            />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 ml-1">Filter by GC number, consignor, or consignee name</p>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            {originBranch && waybills.length > 0 && (
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-600">Total GCs:</span>
                            <span className="px-3 py-1 bg-white border border-green-300 rounded-lg font-black text-green-700 text-sm">{waybills.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-600">Selected:</span>
                            <span className="px-3 py-1 bg-green-600 text-white rounded-lg font-black text-sm">{selectedWaybills.length}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleBulkInward}
                        disabled={selectedWaybills.length === 0 || saving}
                        className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-black flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Download size={16} />
                                RECEIVE {selectedWaybills.length} GC(s)
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Waybills Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={48} className="animate-spin text-green-600" />
                    </div>
                ) : !originBranch ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <MapPin size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Select Origin Branch</h3>
                        <p className="text-gray-500 max-w-md">
                            Please select an origin branch from the dropdown above to view waybills dispatched to {currentBranchName}
                        </p>
                    </div>
                ) : filteredWaybills.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <FileText size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Waybills Found</h3>
                        <p className="text-gray-500 max-w-md">
                            {searchTerm
                                ? 'No waybills match your search criteria. Try adjusting your filters.'
                                : `No pending waybills found from the selected origin branch to ${currentBranchName}`
                            }
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50/50 border-b-2 border-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left w-10">
                                    <button
                                        onClick={toggleSelectAll}
                                        className={`w-4 h-4 border-2 rounded transition-all flex items-center justify-center ${selectedWaybills.length === filteredWaybills.length && filteredWaybills.length > 0
                                            ? 'border-green-600 bg-green-600'
                                            : 'border-gray-300 hover:border-green-400'
                                            }`}
                                    >
                                        {selectedWaybills.length === filteredWaybills.length && filteredWaybills.length > 0 && (
                                            <div className="w-1 h-1 bg-white rounded-full"></div>
                                        )}
                                    </button>
                                </th>
                                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">GC Number</th>
                                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Bill Date</th>
                                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Consignor</th>
                                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Consignee</th>
                                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Articles</th>
                                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredWaybills.map((wb) => {
                                const isSelected = selectedWaybills.includes(wb.id)
                                return (
                                    <tr
                                        key={wb.id}
                                        onClick={() => toggleSelectWaybill(wb.id)}
                                        className={`group cursor-pointer transition-colors ${isSelected ? 'bg-green-50' : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <td className="px-4 py-2">
                                            <div
                                                className={`w-4 h-4 border-2 rounded transition-all flex items-center justify-center ${isSelected
                                                    ? 'border-green-600 bg-green-600'
                                                    : 'border-gray-300 group-hover:border-green-400'
                                                    }`}
                                            >
                                                {isSelected && <div className="w-1 h-1 bg-white rounded-full"></div>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 font-bold text-gray-800">{wb.gc_number}</td>
                                        <td className="px-4 py-2 text-gray-600 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={12} className="text-gray-400" />
                                                {wb.bill_date ? new Date(wb.bill_date).toLocaleDateString('en-GB') : '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 font-medium">{wb.consignor?.name || '-'}</td>
                                        <td className="px-4 py-2 text-gray-600 font-medium">{wb.consignee?.name || '-'}</td>
                                        <td className="px-4 py-2 font-bold text-gray-700">{wb.total_articles || 0}</td>
                                        <td className="px-4 py-2 font-bold text-gray-800">₹{parseFloat(wb.total_amount || 0).toFixed(2)}</td>
                                        <td className="px-4 py-2">
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-[10px] font-bold uppercase">
                                                {wb.status || 'PENDING'}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default BulkGCInward
