import React, { useState } from 'react'
import {
    Search, Package, Calendar, Truck, MapPin, CheckCircle2,
    Clock, AlertCircle, Box, ArrowRight, ShieldCheck,
    CreditCard, User
} from 'lucide-react'

function GCTracking() {
    const [gcNumber, setGcNumber] = useState('')
    const [trackingData, setTrackingData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSearch = async (e) => {
        e.preventDefault()
        if (!gcNumber.trim()) return

        setLoading(true)
        setError('')
        setTrackingData(null)

        try {
            const response = await fetch(`http://localhost:8000/api/v1/waybills/search/${gcNumber}`)
            const data = await response.json()

            if (data.success && data.data) {
                setTrackingData(data.data)
            } else {
                setError('GC Number not found')
            }
        } catch (err) {
            console.error('Error fetching GC details:', err)
            setError('Failed to fetch tracking details. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // Determine current step index based on status
    const getStepIndex = (status) => {
        const s = status?.toUpperCase().trim() || ''
        if (s === 'DELIVERED') return 5
        if (s === 'OUT FOR DELIVERY' || s === 'OF-DELIVERY') return 4
        if (s === 'RECEIVED' || s === 'INWARDED') return 3
        if (s === 'DISPATCHED' || s === 'IN-TRANSIT') return 2
        return 1 // Default to Booked
    }

    const currentStep = trackingData ? getStepIndex(trackingData.status) : 0

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 lg:p-8 font-sans text-gray-900 w-full">
            <div className="w-full max-w-full space-y-10">

                {/* Header & Search Hero */}
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold tracking-wider uppercase rounded-full">
                            Live Tracking
                        </span>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                            Track Your Shipment
                        </h1>
                        <p className="text-sm text-gray-500">
                            Enter your Consignment Note Number to see real-time updates.
                        </p>
                    </div>

                    <div className="bg-white p-1.5 rounded-xl shadow-lg shadow-green-100 border border-green-100 flex items-center max-w-lg mx-auto transform transition-all hover:scale-[1.005] focus-within:ring-2 focus-within:ring-green-100">
                        <div className="pl-3 text-green-600">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            value={gcNumber}
                            onChange={(e) => setGcNumber(e.target.value)}
                            placeholder="Enter GC Number (e.g. 10023)"
                            className="flex-1 w-full p-2.5 bg-transparent border-none outline-none text-base font-medium text-gray-900 placeholder:text-gray-400"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={loading || !gcNumber}
                            className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-md shadow-green-200 text-sm"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : 'Track'}
                        </button>
                    </div>

                    {error && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium animate-in fade-in slide-in-from-top-2 border border-red-100">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}
                </div>

                {/* Results Section */}
                {trackingData && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                        {/* Status Overview Card */}
                        <div className="bg-white rounded-2xl shadow-lg shadow-gray-100 overflow-hidden border border-gray-100">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-gray-500 text-sm font-medium">GC Number</span>
                                            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-100">
                                                #{trackingData.gc_number}
                                            </span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {trackingData.status || 'BOOKED'}
                                        </h2>
                                        <p className="text-gray-500 mt-1 flex items-center gap-1.5 text-xs">
                                            <Clock size={14} className="text-green-600" />
                                            Last updated: {new Date(trackingData.updated_at || trackingData.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-gray-500 text-xs font-medium mb-0.5">Expected Delivery</div>
                                        <div className="text-lg font-bold text-green-600 flex items-center justify-end gap-1.5">
                                            <Calendar size={18} />
                                            {/* Calculating a mock generic date if not available, usually 3-5 days from booking */}
                                            {new Date(new Date(trackingData.created_at).getTime() + (5 * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Stepper */}
                                <div className="mt-8 relative max-w-3xl mx-auto">
                                    {/* Progress Bar Background */}
                                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 rounded-full" />

                                    {/* Active Progress Bar */}
                                    <div
                                        className="absolute top-1/2 left-0 h-0.5 bg-green-500 -translate-y-1/2 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                                    />

                                    <div className="relative flex justify-between w-full">
                                        {['Booked', 'Dispatched', 'Received', 'Out for Delivery', 'Delivered'].map((step, index) => {
                                            const stepNum = index + 1
                                            const isActive = currentStep >= stepNum
                                            const isCompleted = currentStep > stepNum

                                            return (
                                                <div key={step} className="flex flex-col items-center gap-2 group cursor-default relative">
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10 
                                                            ${isActive
                                                                ? 'bg-green-600 border-green-100 text-white shadow-md shadow-green-200 scale-110'
                                                                : 'bg-white border-gray-100 text-gray-300'
                                                            }`}
                                                    >
                                                        {isCompleted ? <CheckCircle2 size={16} /> :
                                                            isActive && stepNum === currentStep ? <Truck size={16} className="animate-pulse" /> :
                                                                <div className="w-1.5 h-1.5 bg-current rounded-full" />
                                                        }
                                                    </div>
                                                    <span className={`absolute top-10 text-[10px] font-bold whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                                        {step}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className="h-6"></div>
                            </div>

                            {/* Shipment Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                                <div className="p-6 space-y-5">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                                        <div className="p-1.5 bg-green-50 rounded-lg text-green-600">
                                            <Box size={18} />
                                        </div>
                                        Shipment Details
                                    </h3>

                                    <div className="relative pl-6 space-y-6 border-l-2 border-green-100 ml-2.5 py-1">
                                        {/* Origin */}
                                        <div className="relative group">
                                            <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full border-[3px] border-white bg-green-200 ring-1 ring-green-100 group-hover:bg-green-400 transition-colors" />
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-0.5">From Origin</p>
                                                <p className="text-lg font-bold text-gray-900 leading-none">{trackingData.origin_branch?.branch_name || 'N/A'}</p>
                                                <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
                                                    <User size={12} className="text-green-600" /> {trackingData.consignor?.name || 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Destination */}
                                        <div className="relative group">
                                            <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full border-[3px] border-white bg-green-600 ring-1 ring-green-100 shadow-md shadow-green-200 group-hover:scale-110 transition-transform" />
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-0.5">To Destination</p>
                                                <p className="text-lg font-bold text-gray-900 leading-none">{trackingData.destination?.city_name || 'N/A'}</p>
                                                <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
                                                    <User size={12} className="text-green-600" /> {trackingData.consignee?.name || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50/30 space-y-5">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                                        <div className="p-1.5 bg-green-50 rounded-lg text-green-600">
                                            <ShieldCheck size={18} />
                                        </div>
                                        Package Info
                                    </h3>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Articles</p>
                                            <p className="text-xl font-bold text-gray-900 flex items-baseline gap-1">
                                                {trackingData.articles?.reduce((sum, item) => sum + parseInt(item.no_of_articles || 0), 0) || 0}
                                                <span className="text-xs text-gray-400 font-medium">items</span>
                                            </p>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Weight</p>
                                            <p className="text-xl font-bold text-gray-900 flex items-baseline gap-1">
                                                {trackingData.articles?.reduce((sum, item) => sum + parseFloat(item.actual_weight || 0), 0).toFixed(2) || '0.00'}
                                                <span className="text-xs text-gray-400 font-medium">kg</span>
                                            </p>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Payment</p>
                                            <p className="text-base font-bold text-gray-900 truncate flex items-center gap-1.5">
                                                <CreditCard size={14} className="text-green-600" />
                                                {trackingData.account_type || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Amount</p>
                                            <p className="text-xl font-bold text-green-600">
                                                ₹ {parseFloat(trackingData.grand_total || 0).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    {trackingData.trip_sheet_id && (
                                        <div className="p-3 bg-green-50 rounded-xl border border-green-100 flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm text-green-600">
                                                <Truck size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Trip Sheet Assigned</p>
                                                <p className="text-xs text-green-700 font-medium mt-0.5">
                                                    Trip Sheet #{trackingData.trip_sheet_id}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    )
}

export default GCTracking
