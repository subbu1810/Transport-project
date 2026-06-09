import React, { useState, useEffect } from 'react'
import { Search, Plus, Trash2, Printer, Save, RotateCcw, Truck, MapPin, CheckCircle2, XCircle, ChevronDown, Loader2, X, CheckCircle, AlertCircle, HelpCircle, ListOrdered, GitBranch } from 'lucide-react'
import { API_BASE_URL } from '../config/api';

function RouteTripSheetEntry() {
  const [routes, setRoutes] = useState([])
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [loading, setLoading] = useState(false)
  const [masterLoading, setMasterLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [branches, setBranches] = useState([])
  const [waybills, setWaybills] = useState([])
  const [dispatchBranchId, setDispatchBranchId] = useState('')

  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    trip_date: new Date().toISOString().split('T')[0],
    route_id: '',
    owner_name: '',
    remarks: '',
    advance_amount: '',
    opening_km: '',
    trip_type: 'INTERSTATE'
  })

  const [selectedGcs, setSelectedGcs] = useState([]) // Array of waybill IDs

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user) {
      setDispatchBranchId(user.branch_id)
    }
    fetchMasterData()
  }, [])

  const fetchMasterData = async () => {
    try {
      setMasterLoading(true)
      const user = JSON.parse(localStorage.getItem('user'))
      let routeUrl = `${API_BASE_URL}/routes`
      
      if (user && user.role?.toUpperCase() === 'ADMIN' && user.branch_id) {
        routeUrl += `?origin_branch_id=${user.branch_id}`
      }

      const [vRes, dRes, bRes, rRes] = await Promise.all([
        fetch(`${API_BASE_URL}/vehicles`),
        fetch(`${API_BASE_URL}/drivers`),
        fetch(`${API_BASE_URL}/branches`),
        fetch(routeUrl)
      ])

      const [vData, dData, bData, rData] = await Promise.all([
        vRes.json(), dRes.json(), bRes.json(), rRes.json()
      ])

      if (vData.success) setVehicles(vData.data)
      if (dData.success) setDrivers(dData.data)
      if (bData.success) setBranches(bData.data)
      if (rData.success) setRoutes(rData.data)
    } catch (err) {
      console.error('Error fetching master data:', err)
      setError('Failed to load master data')
    } finally {
      setMasterLoading(false)
    }
  }

  const handleRouteSelect = async (routeId) => {
    const route = routes.find(r => r.id === parseInt(routeId))
    setSelectedRoute(route)
    setFormData({ ...formData, route_id: routeId })
    
    if (route) {
      // Fetch GCs for all branches in this route
      const stopBranchIds = route.stops.map(s => s.branch_id).join(',')
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/waybills?status=PENDING,RECEIVED,Booked,INWARDED&available_at_branch=${dispatchBranchId}`)
        const data = await response.json()
        if (data.success) {
          // Filter GCs whose destination's taluk is in our route stops
          const routeTalukIds = route.stops.map(s => parseInt(s.taluk_id))
          const filteredWaybills = data.data.filter(wb => {
             return routeTalukIds.includes(parseInt(wb.destination?.taluk_id))
          })
          setWaybills(filteredWaybills)
          setSelectedGcs([]) // Reset selection when route changes
        }
      } catch (err) {
        console.error('Error fetching waybills:', err)
      } finally {
        setLoading(false)
      }
    } else {
      setWaybills([])
    }
  }

  const toggleGcSelection = (gcId) => {
    if (selectedGcs.includes(gcId)) {
      setSelectedGcs(selectedGcs.filter(id => id !== gcId))
    } else {
      setSelectedGcs([...selectedGcs, gcId])
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.vehicle_id || !formData.driver_id || !formData.route_id || selectedGcs.length === 0) {
      setError('Please fill all required fields and select at least one GC')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/trip-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dispatch_branch_id: dispatchBranchId,
          gc_ids: selectedGcs
        })
      })

      const data = await response.json()
      if (data.success) {
        setSuccess(`Route Trip Sheet ${data.data.trip_number} created successfully!`)
        // Reset
        setSelectedGcs([])
        setFormData({
            ...formData,
            vehicle_id: '',
            driver_id: '',
            route_id: '',
            advance_amount: '',
            opening_km: '',
            remarks: ''
        })
        setSelectedRoute(null)
      } else {
        setError(data.message || 'Failed to create trip sheet')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  if (masterLoading) return <div className="p-8 text-center text-gray-500">Initializing Multi-Stop Engine...</div>

  return (
    <div className="p-4 space-y-4 bg-gray-50/50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-black text-indigo-900 uppercase tracking-tight flex items-center gap-2">
            <GitBranch className="text-indigo-600" />
            Route Trip Sheet Entry
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Partitioned Multi-Stop Logistics Dispatch</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-xs font-bold animate-in fade-in">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14}/></button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 text-green-700 rounded-lg text-xs font-bold animate-in fade-in">
          <CheckCircle size={16} /> {success}
          <button onClick={() => setSuccess('')} className="ml-auto"><X size={14}/></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Step 1: Route & Vehicle Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">1. Journey Definition</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Select Logic Route</label>
                <select
                  value={formData.route_id}
                  onChange={(e) => handleRouteSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="">Choose Predefined Route</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.route_name}</option>
                  ))}
                </select>
              </div>

              {selectedRoute && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">Journey Sequence</p>
                  <div className="flex flex-col gap-1.5">
                    {selectedRoute.stops.map((stop, idx) => (
                      <div key={stop.id} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-[10px] font-black text-indigo-700">{idx+1}</div>
                        <span className="text-xs font-bold text-indigo-800">{stop.taluk?.name}</span>
                        {idx === 0 && <span className="text-[8px] font-black bg-white px-1 rounded text-indigo-400 border border-indigo-100 uppercase">Start</span>}
                        {idx === selectedRoute.stops.length - 1 && <span className="text-[8px] font-black bg-white px-1 rounded text-green-400 border border-green-100 uppercase">End</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Vehicle</label>
                  <select
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Driver</label>
                  <select
                    value={formData.driver_id}
                    onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.driver_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Opening KM</label>
                  <input
                    type="number"
                    value={formData.opening_km}
                    onChange={(e) => setFormData({ ...formData, opening_km: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Advance Pay</label>
                  <input
                    type="number"
                    value={formData.advance_amount}
                    onChange={(e) => setFormData({ ...formData, advance_amount: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={loading || !selectedRoute || selectedGcs.length === 0}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            Generate Route Trip Sheet
          </button>
        </div>

        {/* Step 2: Partitioned GC Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 min-h-[500px] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">2. Load Planning (Stops-wise Waybills)</h3>
              <div className="flex gap-4">
                 <div className="text-right">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Total Selected</p>
                   <p className="text-sm font-black text-indigo-600 uppercase">{selectedGcs.length} WAYBILLS</p>
                 </div>
              </div>
            </div>

            {!selectedRoute ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                <GitBranch size={48} className="mb-4 opacity-20" />
                <p className="font-bold text-sm">Please select a route first to load available waybills</p>
              </div>
            ) : (
              <div className="space-y-6 overflow-auto max-h-[600px] pr-2 custom-scrollbar">
                {selectedRoute.stops.map((stop, sIdx) => {
                   const gcsForThisStop = waybills.filter(wb => 
                      parseInt(wb.destination?.taluk_id) === parseInt(stop.taluk_id)
                   );

                   return (
                     <div key={stop.id} className="space-y-2">
                       <div className="flex items-center gap-2 sticky top-0 bg-white py-2 z-10 border-b border-gray-50">
                          <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-sm">{sIdx + 1}</div>
                          <h4 className="text-xs font-black text-gray-800 uppercase tracking-tight">STOP (TALUK): {stop.taluk?.name}</h4>
                          <span className="ml-auto text-[10px] font-black text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full">{gcsForThisStop.length} AVAILABLE</span>
                       </div>

                       {gcsForThisStop.length === 0 ? (
                         <div className="p-4 border border-dashed border-gray-100 rounded-xl text-center text-gray-300 text-[10px] font-bold uppercase tracking-widest">No Waybills found for this destination</div>
                       ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                           {gcsForThisStop.map(wb => (
                             <div 
                                key={wb.id} 
                                onClick={() => toggleGcSelection(wb.id)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-start group ${selectedGcs.includes(wb.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-gray-50 border-gray-100 hover:border-indigo-300 text-gray-700'}`}
                             >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <p className={`text-xs font-black uppercase tracking-tight ${selectedGcs.includes(wb.id) ? 'text-white' : 'text-gray-800'}`}>GC: {wb.gc_number}</p>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${selectedGcs.includes(wb.id) ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>{wb.payment_type}</span>
                                  </div>
                                  <p className={`text-[9.5px] font-bold leading-tight ${selectedGcs.includes(wb.id) ? 'text-white/80' : 'text-gray-500'}`}>{wb.consignor?.consignor_name}</p>
                                  <div className="flex gap-3 text-[9px] font-black uppercase opacity-60">
                                    <span>{wb.total_articles} ART</span>
                                    <span>{wb.total_weight} KG</span>
                                  </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedGcs.includes(wb.id) ? 'bg-white border-white text-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'}`}>
                                  {selectedGcs.includes(wb.id) && <CheckCircle size={12} strokeWidth={4} />}
                                </div>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RouteTripSheetEntry
