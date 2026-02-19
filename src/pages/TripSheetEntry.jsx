import React, { useState, useEffect } from 'react'
import { Search, Plus, Trash2, Printer, Save, RotateCcw, Truck, MapPin, CheckCircle2, XCircle, ChevronDown, Loader2, X } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function TripSheetEntry() {
  const [actionType, setActionType] = useState('NEW')
  const [tripsheetNo, setTripsheetNo] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // UI States
  const [isSelectingGC, setIsSelectingGC] = useState(false)
  const [gcSearchTerm, setGcSearchTerm] = useState('')
  const [gcFilters, setGcFilters] = useState({
    destination: ''
  })

  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    trip_date: new Date().toISOString().split('T')[0],
    modeOfPay: '',
    doCheckNo: '',
    doCheckDate: '',
    cr_number: '',
    indent_number: '',
    alertBranch: '',
    transport_name: '',
    remarks: '',
    advance_amount: ''
  })

  const [selectedGcDetails, setSelectedGcDetails] = useState([])
  const [tempSelectedGcs, setTempSelectedGcs] = useState([]) // For selection view

  // Master data
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [branches, setBranches] = useState([])
  const [waybills, setWaybills] = useState([])
  const [destinations, setDestinations] = useState([])

  const [currentUser, setCurrentUser] = useState(null)
  const [dispatchBranchId, setDispatchBranchId] = useState('')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    setCurrentUser(user)
    if (user && user.role !== 'superadmin') {
      setDispatchBranchId(user.branch_id)
    }
    fetchMasterData()
  }, [])

  const fetchMasterData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      const waybillUrl = (user && user.role !== 'superadmin')
        ? `${API_URL}/waybills?status=PENDING&branch_id=${user.branch_id}`
        : `${API_URL}/waybills?status=PENDING`

      const [vRes, dRes, bRes, wRes, destRes] = await Promise.all([
        fetch(`${API_URL}/vehicles`),
        fetch(`${API_URL}/drivers`),
        fetch(`${API_URL}/branches`),
        fetch(waybillUrl),
        fetch(`${API_URL}/destinations`)
      ])

      const [vData, dData, bData, wData, destData] = await Promise.all([
        vRes.json(), dRes.json(), bRes.json(), wRes.json(), destRes.json()
      ])

      if (vData.success) setVehicles(vData.data)
      if (dData.success) setDrivers(dData.data)
      if (bData.success) setBranches(bData.data)
      if (wData.success) setWaybills(wData.data)
      if (destData.success) setDestinations(destData.data)
    } catch (err) {
      console.error('Error fetching master data:', err)
      setError('Failed to load master data')
    }
  }

  const searchTripSheet = async () => {
    if (!tripsheetNo.trim()) {
      setError('Please enter a Trip Sheet Number')
      return
    }

    try {
      setSearchLoading(true)
      setError('')
      const response = await fetch(`${API_URL}/trip-sheets/search/${tripsheetNo}`)
      const data = await response.json()

      if (data.success) {
        const ts = data.data
        setFormData({
          vehicle_id: ts.vehicle_id,
          driver_id: ts.driver_id,
          trip_date: ts.trip_date,
          modeOfPay: ts.mode_of_pay || '',
          doCheckNo: ts.do_check_no || '',
          doCheckDate: ts.do_check_date || '',
          cr_number: ts.cr_number || '',
          indent_number: ts.indent_number || '',
          alertBranch: ts.alert_branch || '',
          transport_name: ts.transport_name || '',
          remarks: ts.trip_remarks || '',
          advance_amount: ts.advance_amount || ''
        })
        setSelectedGcDetails(ts.waybills.map(wb => ({
          id: wb.id,
          gcNum: wb.gc_number,
          destination: wb.destination?.city_name || wb.destination_city || '-',
          noOfArticles: wb.total_articles,
          articleDesc: wb.article_desc || '-'
        })))
        setSuccess('Trip Sheet details loaded successfully!')
      } else {
        setError(data.message || 'Trip Sheet not found')
      }
    } catch (err) {
      setError('Error searching for Trip Sheet')
    } finally {
      setSearchLoading(false)
    }
  }

  const toggleGcSelection = (wb) => {
    if (tempSelectedGcs.find(item => item.id === wb.id)) {
      setTempSelectedGcs(tempSelectedGcs.filter(item => item.id !== wb.id))
    } else {
      setTempSelectedGcs([...tempSelectedGcs, {
        id: wb.id,
        gcNum: wb.gc_number,
        destination: wb.destination?.city_name || wb.destination_city || '-',
        noOfArticles: wb.total_articles,
        articleDesc: wb.article_desc || '-'
      }])
    }
  }

  const handleAddSelectedToTrip = () => {
    // Merge only new unique ones
    const newItems = tempSelectedGcs.filter(temp => !selectedGcDetails.some(item => item.id === temp.id))
    setSelectedGcDetails([...selectedGcDetails, ...newItems])
    setIsSelectingGC(false)
    setTempSelectedGcs([])
    setGcFilters({ destination: '' })
  }

  const removeGcFromTrip = (id) => {
    setSelectedGcDetails(selectedGcDetails.filter(item => item.id !== id))
  }

  const handleGenerateTripSheet = async () => {
    if (!formData.vehicle_id || !formData.driver_id || selectedGcDetails.length === 0) {
      setError('Please fill required fields and add at least one GC')
      return
    }

    try {
      setSaveLoading(true)
      setError('')

      const payload = {
        ...formData,
        trip_number: tripsheetNo,
        gc_ids: selectedGcDetails.map(item => item.id),
        dispatch_branch_id: dispatchBranchId
      }

      const method = actionType === 'NEW' ? 'POST' : 'PUT'
      const url = actionType === 'NEW' ? `${API_URL}/trip-sheets` : `${API_URL}/trip-sheets/${tripsheetNo}`

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Trip Sheet ${actionType === 'NEW' ? 'generated' : 'updated'} successfully! Number: ${data.data.trip_number}`)
        if (actionType === 'NEW') handleReset()
      } else {
        setError(data.message || 'Failed to save Trip Sheet')
      }
    } catch (err) {
      setError('Error saving Trip Sheet')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      vehicle_id: '',
      driver_id: '',
      trip_date: new Date().toISOString().split('T')[0],
      modeOfPay: '',
      doCheckNo: '',
      doCheckDate: '',
      cr_number: '',
      indent_number: '',
      alertBranch: '',
      transport_name: '',
      remarks: '',
      advance_amount: ''
    })
    setSelectedGcDetails([])
    setTempSelectedGcs([])
    setTripsheetNo('')
    setError('')
    setSuccess('')
  }

  // Filtered list for selection
  const filteredWaybills = waybills.filter(wb => {
    const destMatch = !gcFilters.destination ||
      (wb.destination?.city_name || wb.destination_city || '').toLowerCase().includes(gcFilters.destination.toLowerCase())
    const numMatch = !gcSearchTerm || wb.gc_number.toLowerCase().includes(gcSearchTerm.toLowerCase())
    const branchMatch = currentUser?.role === 'superadmin' ||
      (dispatchBranchId && parseInt(wb.origin_branch_id) === parseInt(dispatchBranchId))
    return destMatch && numMatch && branchMatch
  })

  // If in selection mode, render the selection view
  if (isSelectingGC) {
    return (
      <div className="p-4 space-y-4 bg-gray-50 min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Truck className="text-green-600" size={20} />
              Choose GC for Trip
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Select one or more booked waybills to add to the current trip</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsSelectingGC(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold flex items-center gap-2 transition-all active:scale-95 border border-gray-200 text-sm"
            >
              <XCircle size={16} /> CANCEL
            </button>
            <button
              onClick={handleAddSelectedToTrip}
              disabled={tempSelectedGcs.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-100 disabled:opacity-50 text-sm"
            >
              <CheckCircle2 size={16} /> ADD {tempSelectedGcs.length} TO TRIP
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-1 space-y-3">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Filters</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Search GC No</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="text"
                      placeholder="e.g. GC-2026..."
                      value={gcSearchTerm}
                      onChange={(e) => setGcSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none text-xs font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Destination</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <select
                      value={gcFilters.destination}
                      onChange={(e) => setGcFilters({ ...gcFilters, destination: e.target.value })}
                      className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none text-xs font-semibold bg-white"
                    >
                      <option value="">All Destinations</option>
                      {destinations.map(d => (
                        <option key={d.id} value={d.city_name}>{d.city_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-600 p-4 rounded-xl shadow-lg shadow-green-100 text-white">
              <h4 className="font-bold text-sm mb-0.5">Quick Stats</h4>
              <p className="text-green-100 text-[10px] mb-3">Summary of your current selection</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="opacity-80">Total GCs</span>
                  <span className="font-bold">{waybills.length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="opacity-80">Matching Filters</span>
                  <span className="font-bold">{filteredWaybills.length}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-green-500 mt-1 font-bold text-sm">
                  <span>Selected</span>
                  <span>{tempSelectedGcs.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50/50">
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-2 text-left w-10">
                      <button
                        onClick={() => {
                          const selectableFiltered = filteredWaybills.filter(wb => !selectedGcDetails.some(item => item.id === wb.id));
                          const allSelected = selectableFiltered.length > 0 && selectableFiltered.every(wb => tempSelectedGcs.some(temp => temp.id === wb.id));

                          if (allSelected) {
                            setTempSelectedGcs(tempSelectedGcs.filter(temp => !selectableFiltered.some(wb => wb.id === temp.id)));
                          } else {
                            const newSelections = selectableFiltered.filter(wb => !tempSelectedGcs.some(temp => temp.id === wb.id)).map(wb => ({
                              id: wb.id,
                              gcNum: wb.gc_number,
                              destination: wb.destination?.city_name || wb.destination_city || '-',
                              noOfArticles: wb.total_articles,
                              articleDesc: wb.article_desc || '-'
                            }));
                            setTempSelectedGcs([...tempSelectedGcs, ...newSelections]);
                          }
                        }}
                        className={`w-4 h-4 border-2 rounded transition-all flex items-center justify-center ${filteredWaybills.filter(wb => !selectedGcDetails.some(item => item.id === wb.id)).length > 0 &&
                          filteredWaybills.filter(wb => !selectedGcDetails.some(item => item.id === wb.id)).every(wb => tempSelectedGcs.some(temp => temp.id === wb.id))
                          ? 'border-green-600 bg-green-600'
                          : 'border-gray-300 hover:border-green-400'
                          }`}
                      >
                        {filteredWaybills.filter(wb => !selectedGcDetails.some(item => item.id === wb.id)).length > 0 &&
                          filteredWaybills.filter(wb => !selectedGcDetails.some(item => item.id === wb.id)).every(wb => tempSelectedGcs.some(temp => temp.id === wb.id)) &&
                          <div className="w-1 h-1 bg-white rounded-full"></div>}
                      </button>
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">GC Number</th>
                    <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Destination</th>
                    <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Articles</th>
                    <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredWaybills.length > 0 ? (
                    filteredWaybills.map((wb) => {
                      const isSelected = tempSelectedGcs.some(item => item.id === wb.id)
                      const alreadyInTrip = selectedGcDetails.some(item => item.id === wb.id)

                      return (
                        <tr
                          key={wb.id}
                          onClick={() => !alreadyInTrip && toggleGcSelection(wb)}
                          className={`group cursor-pointer transition-colors ${alreadyInTrip ? 'bg-gray-50 opacity-60 cursor-not-allowed' : isSelected ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                        >
                          <td className="px-4 py-2">
                            <div className={`w-4 h-4 border-2 rounded transition-all flex items-center justify-center ${alreadyInTrip ? 'border-gray-200 bg-gray-100' :
                              isSelected ? 'border-green-600 bg-green-600' :
                                'border-gray-300 group-hover:border-green-400'
                              }`}>
                              {(isSelected || alreadyInTrip) && <div className="w-1 h-1 bg-white rounded-full"></div>}
                            </div>
                          </td>
                          <td className="px-4 py-2 font-bold text-gray-800">{wb.gc_number}</td>
                          <td className="px-4 py-2 text-gray-600 font-medium">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={12} className="text-gray-400" />
                              {wb.destination?.city_name || wb.destination_city || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-2 font-bold text-gray-700">{wb.total_articles}</td>
                          <td className="px-4 py-2 text-gray-500 font-medium">{wb.bill_date ? new Date(wb.bill_date).toLocaleDateString() : '-'}</td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="max-w-xs mx-auto space-y-2">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Search size={24} className="text-gray-300" />
                          </div>
                          <p className="text-gray-800 font-bold text-sm">No waybills found</p>
                          <p className="text-gray-500 text-[10px]">Try adjusting your filters or search term to find what you're looking for.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Trip Sheet Entry</h1>
        <div className="flex gap-2">
          {success && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-medium text-sm">{success}</span>}
          {error && <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-medium text-sm">{error}</span>}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
        {/* Action Mode & Reference Header */}
        <div className="bg-green-50/50 p-3 rounded-xl border-2 border-green-100 flex items-center gap-4 shadow-sm">
          {/* Mode Selector Dropdown */}
          <div className="flex flex-col gap-1 flex-none">
            <label className="text-green-800/50 font-black uppercase tracking-[0.2em] text-[8px] ml-1">Current Process</label>
            <div className="relative group">
              <select
                value={actionType}
                onChange={(e) => {
                  setActionType(e.target.value)
                  handleReset()
                }}
                className="pl-3 pr-8 py-2 bg-white text-green-900 rounded-lg border-2 border-green-200 focus:border-green-500 outline-none font-black text-xs min-w-[160px] appearance-none hover:border-green-400 transition-all cursor-pointer shadow-sm"
              >
                <option value="NEW">✨ CREATE NEW TRIP</option>
                <option value="EDIT">📝 MODIFY EXISTING</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-green-600 transition-transform group-hover:scale-110">
                <ChevronDown size={14} className="stroke-[3]" />
              </div>
            </div>
          </div>

          <div className="h-10 w-px bg-green-200 shrink-0"></div>

          {/* Reference Search / Display */}
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-green-800/50 font-black uppercase tracking-[0.2em] text-[8px] ml-1">
              {actionType === 'NEW' ? 'System Reference Code' : 'Search Reference Code'}
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1 group">
                <input
                  type="text"
                  placeholder={actionType === 'NEW' ? "TS-2026-AUTO-GENERATED" : "TYPE TRIPSHEET NO OR ID..."}
                  value={tripsheetNo}
                  onChange={(e) => setTripsheetNo(e.target.value.toUpperCase())}
                  disabled={actionType === 'NEW'}
                  className={`w-full px-4 py-2 bg-white text-gray-800 rounded-lg border-2 transition-all outline-none font-bold text-sm ${actionType === 'EDIT' && !tripsheetNo
                    ? 'border-yellow-400 focus:border-yellow-500'
                    : 'border-green-100 focus:border-green-500 hover:border-green-200'
                    } disabled:opacity-50 disabled:bg-transparent disabled:border-transparent disabled:italic`}
                />
                {actionType === 'NEW' && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-green-200 uppercase tracking-tighter">Automatic</div>}
              </div>

              {actionType === 'EDIT' && (
                <button
                  onClick={searchTripSheet}
                  disabled={searchLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-black flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-green-100 border border-transparent text-xs"
                >
                  {searchLoading ? <Loader2 size={16} className="animate-spin" /> : <><Search size={16} className="stroke-[3]" /> FETCH</>}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
            <Plus size={16} className="text-green-600" />
            Trip Sheet Details Entry/Edit
          </h3>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Vehicle No <span className="text-red-500">*</span></label>
              <select
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                disabled={actionType === 'EDIT'}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none font-bold bg-white disabled:bg-gray-100 disabled:text-gray-500 text-xs"
              >
                <option value="">Select Vehicle</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.vehicle_number}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Driver Name <span className="text-red-500">*</span></label>
              <select
                value={formData.driver_id}
                onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                disabled={actionType === 'EDIT'}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none font-bold bg-white disabled:bg-gray-100 disabled:text-gray-500 text-xs"
              >
                <option value="">Select Driver</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Trip Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={formData.trip_date}
                onChange={(e) => setFormData({ ...formData, trip_date: e.target.value })}
                disabled={actionType === 'EDIT'}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none font-bold disabled:bg-gray-100 disabled:text-gray-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Dispatch Branch <span className="text-red-500">*</span></label>
              <select
                value={dispatchBranchId}
                onChange={(e) => setDispatchBranchId(e.target.value)}
                disabled={currentUser?.role !== 'superadmin' || actionType === 'EDIT'}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none font-bold bg-white disabled:bg-gray-100 disabled:text-gray-500 text-xs"
              >
                {!dispatchBranchId && <option value="">Select Branch</option>}
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.branch_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Mode of Pay</label>
              <select
                value={formData.modeOfPay}
                onChange={(e) => setFormData({ ...formData, modeOfPay: e.target.value })}
                disabled={actionType === 'EDIT'}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none font-bold bg-white disabled:bg-gray-100 disabled:text-gray-500 text-xs"
              >
                <option value="">Select</option>
                <option value="CASH">CASH</option>
                <option value="CHEQUE">CHEQUE</option>
                <option value="DD">DD</option>
                <option value="TRANSFER">TRANSFER</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Advance Amount</label>
              <input
                type="number"
                value={formData.advance_amount}
                onChange={(e) => setFormData({ ...formData, advance_amount: e.target.value })}
                placeholder="0.00"
                disabled={actionType === 'EDIT'}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none font-bold disabled:bg-gray-100 disabled:text-gray-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">CR NUMBER</label>
              <input
                type="text"
                value={formData.cr_number}
                onChange={(e) => setFormData({ ...formData, cr_number: e.target.value })}
                disabled={actionType === 'EDIT'}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none font-bold disabled:bg-gray-100 disabled:text-gray-500 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="col-span-1">
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">WayBill/GC SELECTION <span className="text-red-500">*</span></label>
              <button
                onClick={() => setIsSelectingGC(true)}
                disabled={actionType === 'EDIT'}
                className="w-full px-3 py-2 border-2 border-green-300 rounded-lg hover:bg-green-100 flex items-center justify-between font-bold text-green-700 transition-all active:scale-95 bg-white group disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed text-xs"
              >
                <span className="flex items-center gap-2">
                  <Truck size={16} /> CHOOSE GC
                </span>
                <span className="bg-green-600 text-white px-1.5 py-0.5 rounded text-[10px] group-hover:scale-110 transition-transform">
                  {selectedGcDetails.length}
                </span>
              </button>
            </div>
            <div className="col-span-3">
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Remarks</label>
              <input
                type="text"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                disabled={actionType === 'EDIT'}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none font-bold disabled:bg-gray-100 disabled:text-gray-500 text-xs"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t-2 border-green-100">
            <button
              onClick={handleGenerateTripSheet}
              disabled={saveLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold flex items-center gap-2 shadow-lg shadow-green-200 transition-all disabled:opacity-50 text-sm"
            >
              {saveLoading ? 'Saving...' : <><Save size={16} /> {actionType === 'NEW' ? 'GENERATE TRIP SHEET' : 'UPDATE TRIP SHEET'}</>}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-bold flex items-center gap-2 transition-all text-sm"
            >
              <RotateCcw size={16} /> RESET
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-xs uppercase tracking-wider">
              Selected CG/WayBills ({selectedGcDetails.length})
            </h3>
            <div className="flex gap-2">
              <button className="p-1.5 text-gray-600 hover:bg-yellow-200 rounded-lg transition-colors"><Printer size={16} /></button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-yellow-200 shadow-sm bg-white">
            <table className="w-full text-xs">
              <thead className="bg-yellow-100">
                <tr>
                  <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase text-[10px] tracking-wider">GC Num</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase text-[10px] tracking-wider">Destination</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase text-[10px] tracking-wider">Articles</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase text-[10px] tracking-wider">Description</th>
                  <th className="px-4 py-2 text-center font-bold text-gray-700 uppercase text-[10px] tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-100">
                {selectedGcDetails.length > 0 ? (
                  selectedGcDetails.map((gc, idx) => (
                    <tr key={idx} className="hover:bg-yellow-50 transition-colors">
                      <td className="px-4 py-2 font-bold text-gray-800">{gc.gcNum}</td>
                      <td className="px-4 py-2 text-gray-600 font-medium">{gc.destination}</td>
                      <td className="px-4 py-2 text-gray-600 font-bold">{gc.noOfArticles}</td>
                      <td className="px-4 py-2 text-gray-600 italic">{gc.articleDesc}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => removeGcFromTrip(gc.id)}
                          disabled={actionType === 'EDIT'}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-75 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-6 text-center text-gray-400 font-medium italic">
                      No waybills added to this trip yet. Click "CHOOSE GC" to add.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TripSheetEntry
