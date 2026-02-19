import React, { useState, useEffect } from 'react'
import { Search, Plus, Trash2, Save, RotateCcw, Truck, MapPin, Loader2, CheckCircle2, AlertCircle, X, ChevronDown } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function LocalTrip() {
    const [actionType, setActionType] = useState('NEW')
    const [tripNo, setTripNo] = useState('')
    const [searchLoading, setSearchLoading] = useState(false)
    const [saveLoading, setSaveLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [isSelectingGC, setIsSelectingGC] = useState(false)
    const [gcSearchTerm, setGcSearchTerm] = useState('')

    const [formData, setFormData] = useState({
        vehicle_id: '',
        driver_id: '',
        trip_date: new Date().toISOString().split('T')[0],
        remarks: '',
        advance_amount: ''
    })

    const [selectedGcDetails, setSelectedGcDetails] = useState([])
    const [tempSelectedGcs, setTempSelectedGcs] = useState([])

    const [vehicles, setVehicles] = useState([])
    const [drivers, setDrivers] = useState([])
    const [waybills, setWaybills] = useState([])
    const [currentUser, setCurrentUser] = useState(null)
    const [branchId, setBranchId] = useState('')
    const [branches, setBranches] = useState([])

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'))
        setCurrentUser(user)
        if (user && user.role !== 'superadmin') {
            setBranchId(user.branch_id)
        }
        fetchMasterData(user)
    }, [])

    const fetchMasterData = async (user) => {
        try {
            const waybillUrl = (user && user.role !== 'superadmin')
                ? `${API_URL}/waybills?status=RECEIVED&branch_id=${user.branch_id}`
                : `${API_URL}/waybills?status=RECEIVED`

            const [vRes, dRes, wRes, bRes] = await Promise.all([
                fetch(`${API_URL}/vehicles`),
                fetch(`${API_URL}/drivers`),
                fetch(waybillUrl),
                fetch(`${API_URL}/branches`)
            ])
            const [vData, dData, wData, bData] = await Promise.all([
                vRes.json(), dRes.json(), wRes.json(), bRes.json()
            ])
            if (vData.success) setVehicles(vData.data)
            if (dData.success) setDrivers(dData.data)
            if (wData.success) setWaybills(wData.data)
            if (bData.success) setBranches(bData.data)
        } catch (err) {
            console.error('Error fetching master data:', err)
            setError('Failed to load master data')
        }
    }

    const handleReset = () => {
        setFormData({
            vehicle_id: '',
            driver_id: '',
            trip_date: new Date().toISOString().split('T')[0],
            remarks: '',
            advance_amount: ''
        })
        setSelectedGcDetails([])
        setTempSelectedGcs([])
        setTripNo('')
        setError('')
        setSuccess('')
    }

    const toggleGcSelection = (wb) => {
        if (tempSelectedGcs.find(item => item.id === wb.id)) {
            setTempSelectedGcs(tempSelectedGcs.filter(item => item.id !== wb.id))
        } else {
            setTempSelectedGcs([...tempSelectedGcs, {
                id: wb.id,
                gcNum: wb.gc_number,
                destination: wb.destination?.city_name || '-',
                noOfArticles: wb.total_articles,
                articleDesc: wb.article_desc || '-'
            }])
        }
    }

    const handleAddSelectedToTrip = () => {
        const newItems = tempSelectedGcs.filter(temp => !selectedGcDetails.some(item => item.id === temp.id))
        setSelectedGcDetails([...selectedGcDetails, ...newItems])
        setIsSelectingGC(false)
        setTempSelectedGcs([])
        setGcSearchTerm('')
    }

    const removeGcFromTrip = (id) => {
        setSelectedGcDetails(selectedGcDetails.filter(item => item.id !== id))
    }

    const handleSave = async () => {
        if (!formData.vehicle_id || !formData.driver_id || selectedGcDetails.length === 0) {
            setError('Please fill required fields and add at least one GC')
            return
        }
        try {
            setSaveLoading(true)
            setError('')
            const payload = {
                ...formData,
                trip_type: 'LOCAL',
                gc_ids: selectedGcDetails.map(item => item.id),
                branch_id: branchId
            }
            const method = actionType === 'NEW' ? 'POST' : 'PUT'
            const url = actionType === 'NEW' ? `${API_URL}/local-trips` : `${API_URL}/local-trips/${tripNo}`
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await response.json()
            if (data.success) {
                setSuccess(`Local Trip ${actionType === 'NEW' ? 'created' : 'updated'} successfully!`)
                if (actionType === 'NEW') handleReset()
            } else {
                setError(data.message || 'Failed to save Local Trip')
            }
        } catch (err) {
            setError('Error saving Local Trip')
        } finally {
            setSaveLoading(false)
        }
    }

    const filteredWaybills = waybills.filter(wb => {
        const numMatch = !gcSearchTerm || wb.gc_number?.toLowerCase().includes(gcSearchTerm.toLowerCase())
        const branchMatch = currentUser?.role === 'superadmin' ||
            (branchId && parseInt(wb.destination_branch_id) === parseInt(branchId))
        return numMatch && branchMatch
    })

    // ── GC Selection View ──
    if (isSelectingGC) {
        return (
            <div className="p-4 space-y-4 bg-gray-50 min-h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Truck className="text-purple-600" size={18} />
                            Choose GC for Local Trip
                        </h2>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Select received waybills to assign to this local trip</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setIsSelectingGC(false); setTempSelectedGcs([]); setGcSearchTerm('') }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold flex items-center gap-2 transition-all active:scale-95 border border-gray-200 text-sm"
                        >
                            <X size={15} /> CANCEL
                        </button>
                        <button
                            onClick={handleAddSelectedToTrip}
                            disabled={tempSelectedGcs.length === 0}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-purple-100 disabled:opacity-50 text-sm"
                        >
                            <CheckCircle2 size={15} /> ADD {tempSelectedGcs.length} TO TRIP
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search GC number..."
                            value={gcSearchTerm}
                            onChange={(e) => setGcSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg focus:border-purple-500 outline-none text-xs font-semibold"
                        />
                    </div>
                </div>

                {/* GC Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left w-10"></th>
                                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">GC Number</th>
                                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Destination</th>
                                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Articles</th>
                                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredWaybills.length > 0 ? filteredWaybills.map((wb) => {
                                const isSelected = tempSelectedGcs.some(item => item.id === wb.id)
                                const alreadyInTrip = selectedGcDetails.some(item => item.id === wb.id)
                                return (
                                    <tr
                                        key={wb.id}
                                        onClick={() => !alreadyInTrip && toggleGcSelection(wb)}
                                        className={`cursor-pointer transition-colors ${alreadyInTrip ? 'bg-gray-50 opacity-50 cursor-not-allowed' : isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                                    >
                                        <td className="px-4 py-2">
                                            <div className={`w-4 h-4 border-2 rounded transition-all flex items-center justify-center ${alreadyInTrip ? 'border-gray-200 bg-gray-100' : isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
                                                {(isSelected || alreadyInTrip) && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 font-bold text-gray-800">{wb.gc_number}</td>
                                        <td className="px-4 py-2 text-gray-600 font-medium">
                                            <div className="flex items-center gap-1">
                                                <MapPin size={11} className="text-gray-400" />
                                                {wb.destination?.city_name || '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 font-bold text-gray-700">{wb.total_articles}</td>
                                        <td className="px-4 py-2 text-gray-500">{wb.bill_date ? new Date(wb.bill_date).toLocaleDateString() : '-'}</td>
                                        <td className="px-4 py-2 text-gray-500 italic truncate max-w-[150px]">{wb.article_desc || '-'}</td>
                                    </tr>
                                )
                            }) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <Search size={20} className="text-gray-300" />
                                        </div>
                                        <p className="text-gray-500 font-bold text-sm">No received waybills found</p>
                                        <p className="text-gray-400 text-[10px] mt-1">Only waybills with RECEIVED status appear here</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    // ── Main Form View ──
    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600">
                        <Truck size={18} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">Local Trip</h1>
                </div>
                <div className="flex gap-2">
                    {success && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-bold">
                            <CheckCircle2 size={13} /> {success}
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold">
                            <AlertCircle size={13} /> {error}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 space-y-4 border border-gray-100">

                {/* Action Mode & Reference */}
                <div className="bg-purple-50/40 p-3 rounded-xl border-2 border-purple-100 flex items-center gap-4 shadow-sm">
                    <div className="flex flex-col gap-1 flex-none">
                        <label className="text-purple-800/50 font-black uppercase tracking-[0.2em] text-[8px] ml-1">Current Process</label>
                        <div className="relative group">
                            <select
                                value={actionType}
                                onChange={(e) => { setActionType(e.target.value); handleReset() }}
                                className="pl-3 pr-8 py-2 bg-white text-purple-900 rounded-lg border-2 border-purple-200 focus:border-purple-500 outline-none font-black text-xs min-w-[160px] appearance-none cursor-pointer shadow-sm"
                            >
                                <option value="NEW">✨ CREATE NEW TRIP</option>
                                <option value="EDIT">📝 MODIFY EXISTING</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-purple-600">
                                <ChevronDown size={14} className="stroke-[3]" />
                            </div>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-purple-200 shrink-0"></div>

                    <div className="flex-1 flex flex-col gap-1">
                        <label className="text-purple-800/50 font-black uppercase tracking-[0.2em] text-[8px] ml-1">
                            {actionType === 'NEW' ? 'System Reference Code' : 'Search Reference Code'}
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder={actionType === 'NEW' ? 'LT-2026-AUTO-GENERATED' : 'TYPE LOCAL TRIP NO...'}
                                value={tripNo}
                                onChange={(e) => setTripNo(e.target.value.toUpperCase())}
                                disabled={actionType === 'NEW'}
                                className="flex-1 px-4 py-2 bg-white text-gray-800 rounded-lg border-2 border-purple-100 focus:border-purple-500 outline-none font-bold text-sm disabled:opacity-50 disabled:bg-transparent disabled:border-transparent disabled:italic"
                            />
                            {actionType === 'EDIT' && (
                                <button
                                    onClick={() => { }}
                                    disabled={searchLoading}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-black flex items-center gap-2 transition-all active:scale-95 shadow-md text-xs"
                                >
                                    {searchLoading ? <Loader2 size={14} className="animate-spin" /> : <><Search size={14} className="stroke-[3]" /> FETCH</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="bg-purple-50/30 p-4 rounded-xl border border-purple-100 shadow-sm space-y-4">
                    <h3 className="font-black text-[9px] text-purple-700 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-purple-500"></div>
                        Local Trip Details
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Vehicle No <span className="text-red-500">*</span></label>
                            <select
                                value={formData.vehicle_id}
                                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-purple-500 outline-none font-bold text-gray-700 text-[11px] bg-white"
                            >
                                <option value="">Select Vehicle</option>
                                {vehicles.map(v => (
                                    <option key={v.id} value={v.id}>{v.vehicle_number}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Driver Name <span className="text-red-500">*</span></label>
                            <select
                                value={formData.driver_id}
                                onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-purple-500 outline-none font-bold text-gray-700 text-[11px] bg-white"
                            >
                                <option value="">Select Driver</option>
                                {drivers.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Trip Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={formData.trip_date}
                                onChange={(e) => setFormData({ ...formData, trip_date: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-purple-500 outline-none font-bold text-gray-700 text-[11px]"
                            />
                        </div>

                        {currentUser?.role === 'superadmin' && (
                            <div>
                                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Branch</label>
                                <select
                                    value={branchId}
                                    onChange={(e) => setBranchId(e.target.value)}
                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-purple-500 outline-none font-bold text-gray-700 text-[11px] bg-white"
                                >
                                    <option value="">All Branches</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.branch_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Advance Amount</label>
                            <input
                                type="number"
                                value={formData.advance_amount}
                                onChange={(e) => setFormData({ ...formData, advance_amount: e.target.value })}
                                placeholder="0.00"
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-purple-500 outline-none font-bold text-gray-700 text-[11px]"
                            />
                        </div>
                        <div>
                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Remarks</label>
                            <input
                                type="text"
                                value={formData.remarks}
                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                placeholder="Optional remarks..."
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-purple-500 outline-none font-bold text-gray-700 text-[11px]"
                            />
                        </div>
                    </div>

                    {/* GC Selection Button */}
                    <div>
                        <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Waybill / GC Selection <span className="text-red-500">*</span></label>
                        <button
                            onClick={() => setIsSelectingGC(true)}
                            className="px-4 py-2 border-2 border-purple-300 rounded-lg hover:bg-purple-50 flex items-center gap-2 font-bold text-purple-700 transition-all active:scale-95 bg-white text-xs"
                        >
                            <Plus size={14} /> CHOOSE GC
                            <span className="ml-1 bg-purple-600 text-white px-1.5 py-0.5 rounded text-[10px]">
                                {selectedGcDetails.length}
                            </span>
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2 border-t border-purple-100">
                        <button
                            onClick={handleSave}
                            disabled={saveLoading}
                            className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold flex items-center gap-2 shadow-lg shadow-purple-100 transition-all disabled:opacity-50 text-sm active:scale-95"
                        >
                            {saveLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {saveLoading ? 'Saving...' : actionType === 'NEW' ? 'CREATE LOCAL TRIP' : 'UPDATE LOCAL TRIP'}
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold flex items-center gap-2 transition-all text-sm active:scale-95"
                        >
                            <RotateCcw size={14} /> RESET
                        </button>
                    </div>
                </div>

                {/* Selected GC Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-purple-50/30 p-3 border-b border-purple-100 flex items-center justify-between">
                        <h3 className="font-black text-[9px] text-purple-800 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-purple-500"></div>
                            Selected GC / Waybills
                        </h3>
                        <span className="text-[9px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                            {selectedGcDetails.length} Added
                        </span>
                    </div>
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">GC Number</th>
                                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Destination</th>
                                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Articles</th>
                                <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                <th className="px-4 py-2 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {selectedGcDetails.length > 0 ? selectedGcDetails.map((gc, idx) => (
                                <tr key={idx} className="hover:bg-purple-50/30 transition-colors">
                                    <td className="px-4 py-2 font-bold text-gray-800">{gc.gcNum}</td>
                                    <td className="px-4 py-2 text-gray-600 font-medium">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={11} className="text-gray-400" />
                                            {gc.destination}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 font-bold text-gray-700">{gc.noOfArticles}</td>
                                    <td className="px-4 py-2 text-gray-500 italic">{gc.articleDesc}</td>
                                    <td className="px-4 py-2 text-center">
                                        <button
                                            onClick={() => removeGcFromTrip(gc.id)}
                                            className="p-1 text-red-400 hover:bg-red-50 rounded-lg transition-colors active:scale-75"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-gray-400 font-medium italic text-[10px]">
                                        No waybills added yet. Click "CHOOSE GC" to add received waybills to this local trip.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    )
}

export default LocalTrip
