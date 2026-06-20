import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Trash2, Printer, Save, RotateCcw, Truck, MapPin, CheckCircle2, XCircle, ChevronDown, Loader2, X, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL, STORAGE_URL } from '../config/api';
import TripSheetReceipt from '../components/TripSheetReceipt'

function TripSheetEntry() {
  const [actionType, setActionType] = useState('NEW')
  const [editingId, setEditingId] = useState(null)
  const [isLocked, setIsLocked] = useState(false)   // true when trip is already acknowledged
  const [tripsheetNo, setTripsheetNo] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [popup, setPopup] = useState(null) // { type: 'success'|'error', title, message, tripId, tripNumber }
  const [showHelp, setShowHelp] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [printData, setPrintData] = useState(null)
  const [logo, setLogo] = useState(null)
  const [transportInfo, setTransportInfo] = useState({ name: '', address: '', phone: '' })

  // UI States
  const [isSelectingGC, setIsSelectingGC] = useState(false)
  const [gcSearchTerm, setGcSearchTerm] = useState('')
  const [gcFilters, setGcFilters] = useState({
    destination: ''
  })

  // Searchable vehicle dropdown state
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false)
  const vehicleDropdownRef = React.useRef(null)

  // Searchable driver dropdown state
  const [driverSearch, setDriverSearch] = useState('')
  const [showDriverDropdown, setShowDriverDropdown] = useState(false)
  const driverDropdownRef = useRef(null)

  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    trip_date: new Date().toISOString().split('T')[0],
    modeOfPay: '',
    doCheckNo: '',
    doCheckDate: '',
    cr_number: '',
    indent_number: '',
    owner_name: '',
    alertBranch: '',
    transport_name: '',
    remarks: '',
    advance_amount: '',
    opening_km: '',
    rate_per_km: '',
    trip_type: 'INTERSTATE'
  })

  const [selectedGcDetails, setSelectedGcDetails] = useState([])
  const [tempSelectedGcs, setTempSelectedGcs] = useState([]) // For selection view

  // Master data
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [branches, setBranches] = useState([])
  const [waybills, setWaybills] = useState([])
  const [destinations, setDestinations] = useState([])
  const [fuelTokens, setFuelTokens] = useState([])
  const [selectedFuelTokenIds, setSelectedFuelTokenIds] = useState([])

  const [currentUser, setCurrentUser] = useState(null)
  const [dispatchBranchId, setDispatchBranchId] = useState('')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    setCurrentUser(user)
    if (user && user.role !== 'superadmin') {
      setDispatchBranchId(user.branch_id)
    }
    fetchMasterData()
    fetchTransportDetails()
  }, [])

  const fetchTransportDetails = async () => {
    try {
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const user = JSON.parse(userDataStr);
        // Robust transport details mapping from session
        const tName = user.transport_name || (user.transport && user.transport.name) || 'SANVI TRANSPORT';
        const tAddr = user.transport_address || (user.transport && user.transport.address) || '';
        const tPhone = user.transport_phone || user.transport_mobile || (user.transport && user.transport.phone) || '';
        const tGst = user.transport_gstin || user.gstin || user.gst_number || (user.transport && (user.transport.gst_number || user.transport.gstin || user.transport.gst)) || '';
        
        setTransportInfo({ name: tName, address: tAddr, phone: tPhone, gstin: tGst });

        // Logo handling from session
        const transportLogo = user.transport_logo_url || user.transport_logo_path || user.logo_url || user.logo_path || user.logo || (user.transport && (user.transport.logo || user.transport.logo_path));
        if (transportLogo) {
          setLogo(transportLogo.startsWith('http') ? transportLogo : `${STORAGE_URL}/${transportLogo.replace(/^\/+/, '')}`);
          return;
        }
      }

      // Fallback to global settings
      const response = await axios.get(`${API_BASE_URL}/settings/all`);
      if (response.data.success && response.data.data) {
        const s = response.data.data;
        setTransportInfo(prev => ({
          name: s.company_name || s.name || prev.name,
          address: s.address || prev.address,
          phone: s.phone || s.mobile || prev.phone,
          gstin: s.gstin || s.gst_number || s.gst || prev.gstin || ''
        }));
        const globalLogo = s.logo_path || s.logo || s.company_logo || s.transport_logo;
        if (globalLogo) {
          setLogo(globalLogo.startsWith('http') ? globalLogo : `${STORAGE_URL}/${globalLogo.replace(/^\/+/, '')}`);
        }
      }
    } catch (err) {
      console.error('Error fetching transport details:', err);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [vRes, dRes, bRes, destRes] = await Promise.all([
        fetch(`${API_BASE_URL}/vehicles`),
        fetch(`${API_BASE_URL}/drivers`),
        fetch(`${API_BASE_URL}/branches`),
        fetch(`${API_BASE_URL}/destinations`)
      ])

      const [vData, dData, bData, destData] = await Promise.all([
        vRes.json(), dRes.json(), bRes.json(), destRes.json()
      ])

      if (vData.success) setVehicles(vData.data)
      if (dData.success) setDrivers(dData.data)
      if (bData.success) setBranches(bData.data)
      if (destData.success) setDestinations(destData.data)
    } catch (err) {
      console.error('Error fetching master data:', err)
      setError('Failed to load master data')
    }
  }

  const fetchWaybills = async (branchId) => {
    try {
      let url = `${API_BASE_URL}/waybills?status=PENDING,RECEIVED,Booked,INWARDED`
      if (branchId) {
        url += `&available_at_branch=${branchId}`
      }

      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        setWaybills(data.data)
      }
    } catch (err) {
      console.error('Error fetching waybills:', err)
    }
  }

  const handleVehicleChange = async (vid) => {
    // Auto-fill owner_name from vehicle master data (already loaded in state)
    const selectedVehicle = vehicles.find(v => String(v.id) === String(vid))
    setFormData(prev => ({
      ...prev,
      vehicle_id: vid,
      owner_name: selectedVehicle?.owner_name || prev.owner_name,
      rate_per_km: selectedVehicle?.rate_per_km || prev.rate_per_km
    }))

    if (!vid || actionType === 'EDIT') return

    try {
      // 1. Check Availability
      const response = await fetch(`${API_BASE_URL}/trip-sheets/check-vehicle/${vid}?requesting_branch_id=${dispatchBranchId}`)
      const data = await response.json()
      if (data.success && !data.available) {
        setPopup({
          type: 'error',
          title: 'Vehicle Busy!',
          message: data.message || 'This vehicle is currently on another trip and has not been verified.'
        })
        setFormData(prev => ({ ...prev, vehicle_id: '', owner_name: '' }))
        return
      }

      // 2. Fetch Available Fuel Tokens for this vehicle
      const tokensRes = await fetch(`${API_BASE_URL}/fuel/tokens?vehicle_id=${vid}&status=ISSUED`)
      const tokensData = await tokensRes.json()
      if (tokensData.success) {
        // Filter to only show tokens NOT already linked to a trip
        setFuelTokens(tokensData.data.data.filter(t => !t.trip_sheet_id))
      }
    } catch (err) {
      console.error('Error checking vehicle availability:', err)
    }
  }

  useEffect(() => {
    if (dispatchBranchId) {
      fetchWaybills(dispatchBranchId)
      
      // Re-validate vehicle locking when branch changes (crucial for Superadmins)
      if (formData.vehicle_id && actionType === 'NEW') {
        handleVehicleChange(formData.vehicle_id)
      }
    }
  }, [dispatchBranchId])

  const searchTripSheet = async () => {
    if (!tripsheetNo.trim()) {
      setError('Please enter a Trip Sheet Number')
      return
    }

    try {
      setSearchLoading(true)
      setError('')
      const response = await fetch(`${API_BASE_URL}/trip-sheets/search/${tripsheetNo}`)
      const data = await response.json()

      if (data.success) {
        const ts = data.data

        // Lock if verified
        setIsLocked(!!(ts.verification_date))
        setEditingId(ts.id)
        setDispatchBranchId(ts.dispatch_branch_id)
        setFormData({
            vehicle_id: ts.vehicle_id,
            driver_id: ts.driver_id,
            trip_date: ts.trip_date,
            modeOfPay: ts.mode_of_pay || '',
            doCheckNo: ts.do_check_no || '',
            doCheckDate: ts.do_check_date || '',
            cr_number: ts.cr_number || '',
            indent_number: ts.indent_number || '',
            owner_name: ts.owner_name || ts.vehicle?.owner_name || '',
            alertBranch: ts.alert_branch || '',
            transport_name: ts.transport_name || '',
            remarks: ts.trip_remarks || '',
            advance_amount: ts.advance_amount || '',
            opening_km: ts.opening_km || '',
            rate_per_km: ts.rate_per_km || '',
            trip_type: ts.trip_type || 'INTERSTATE'
        })
        setSelectedGcDetails(ts.waybills.map(wb => ({
            id: wb.id,
            gcNum: wb.gc_number,
            destination: wb.destination?.city_name || wb.destination_city || '-',
            noOfArticles: wb.total_articles,
            articleDesc: wb.article_desc || '-'
        })))
        setFuelTokens(ts.fuel_tokens || [])
        setSelectedFuelTokenIds((ts.fuel_tokens || []).map(t => t.id))
        setError('')
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
        alert_branch: formData.alertBranch || null,
        trip_remarks: formData.remarks,
        mode_of_pay: formData.modeOfPay,
        trip_number: tripsheetNo || null,
        opening_km: formData.opening_km || null,
        rate_per_km: formData.rate_per_km || null,
        gc_ids: selectedGcDetails.map(item => item.id),
        fuel_token_ids: selectedFuelTokenIds,
        dispatch_branch_id: dispatchBranchId
      }

      const method = actionType === 'NEW' ? 'POST' : 'PUT'
      const url = actionType === 'NEW' ? `${API_BASE_URL}/trip-sheets` : `${API_BASE_URL}/trip-sheets/${editingId}`

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        setPopup({
          type: 'success',
          title: actionType === 'NEW' ? 'Trip Sheet Generated!' : 'Trip Sheet Updated!',
          tripNumber: data.data.trip_number,
          tripId: data.data.id,
          message: actionType === 'NEW'
            ? `New trip sheet has been created successfully.`
            : `Trip sheet has been updated successfully.`
        })
        if (actionType === 'NEW') handleReset()
      } else {
        setPopup({
          type: 'error',
          title: 'Failed to Save',
          message: data.message || 'Failed to save Trip Sheet'
        })
      }
    } catch (err) {
      setPopup({
        type: 'error',
        title: 'Network Error',
        message: 'Could not reach the server. Please check your connection.'
      })
    } finally {
      setSaveLoading(false)
    }
  }

  const handleReset = () => {
    setIsLocked(false)
    setFormData({
      vehicle_id: '',
      driver_id: '',
      trip_date: new Date().toISOString().split('T')[0],
      modeOfPay: '',
      doCheckNo: '',
      doCheckDate: '',
      cr_number: '',
      indent_number: '',
      owner_name: '',
      alertBranch: '',
      transport_name: '',
      remarks: '',
      advance_amount: '',
      opening_km: '',
      rate_per_km: ''
    })
    setSelectedGcDetails([])
    setTempSelectedGcs([])
    setFuelTokens([])
    setSelectedFuelTokenIds([])
    setTripsheetNo('')
    setEditingId(null)
    setError('')
    setSuccess('')
  }

  // Filtered list for selection
  const filteredWaybills = waybills.filter(wb => {
    const destMatch = !gcFilters.destination ||
      (wb.destination?.city_name || wb.destination_city || '').toLowerCase().includes(gcFilters.destination.toLowerCase())
    const numMatch = !gcSearchTerm || wb.gc_number.toLowerCase().includes(gcSearchTerm.toLowerCase())
    const branchMatch = currentUser?.role === 'superadmin' || !dispatchBranchId ||
      (parseInt(wb.origin_branch_id) === parseInt(dispatchBranchId) ||
        parseInt(wb.inward_branch_id) === parseInt(dispatchBranchId))
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
                    <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Consignor</th>
                    <th className="px-4 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Consignee</th>
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
                          <td className="px-4 py-2">
                            <div className="flex flex-col">
                              <span className="font-black text-gray-800 uppercase text-[10px] leading-tight truncate max-w-[130px]">{wb.consignor?.name || '—'}</span>
                              {wb.consignor?.mobile_no || wb.consignor?.mobile_number ? (
                                <span className="text-[9px] text-gray-400 font-medium">📞 {wb.consignor?.mobile_no || wb.consignor?.mobile_number}</span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-col">
                              <span className="font-black text-gray-800 uppercase text-[10px] leading-tight truncate max-w-[130px]">{wb.consignee?.name || '—'}</span>
                              {wb.consignee?.mobile_no || wb.consignee?.mobile_number ? (
                                <span className="text-[9px] text-gray-400 font-medium">📞 {wb.consignee?.mobile_no || wb.consignee?.mobile_number}</span>
                              ) : null}
                            </div>
                          </td>
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
                      <td colSpan="7" className="px-6 py-12 text-center">
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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Trip Sheet Entry</h1>
          <button
            onClick={() => setShowHelp(true)}
            className="p-1.5 bg-white text-green-600 rounded-full shadow-sm hover:shadow-md hover:bg-green-50 transition-all border border-green-100 group"
            title="Trip Sheet Guide"
          >
            <HelpCircle size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
        <div className="flex gap-2">
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <XCircle className="text-red-500" size={20} />
              <p className="text-red-700 text-xs font-bold">{error}</p>
              <button onClick={() => setError('')} className="ml-auto">
                <X size={16} className="text-red-400 hover:text-red-600" />
              </button>
            </div>
          </div>
        )}

        {/* Verified Lock Banner */}
        {isLocked && (
          <div className="flex items-center gap-3 bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-xl animate-in slide-in-from-top-2 duration-300">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-amber-600" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div className="flex-1">
              <p className="text-amber-800 font-black text-xs">Trip Sheet Verified — Editing Locked</p>
              <p className="text-amber-600 text-[10px] font-medium">This trip sheet has been verified and cannot be modified. Contact a supervisor to unlock if changes are needed.</p>
            </div>
          </div>
        )}

        {/* Action Mode & Reference Header */}
        <div className="bg-green-50/50 py-1.5 px-3 rounded-lg border flex items-center gap-3 shadow-sm border-green-200">
          {/* Mode Selector Dropdown */}
          <div className="flex flex-col flex-none">
            <label className="text-green-800/50 font-black uppercase tracking-[0.2em] text-[7px] ml-1 mb-0.5">Current Process</label>
            <div className="relative group">
              <select
                value={actionType}
                disabled={isLocked}
                onChange={(e) => {
                  setActionType(e.target.value)
                  handleReset()
                }}
                className="pl-2 pr-6 py-1 bg-white text-green-900 rounded-[5px] border border-green-300 focus:border-green-500 outline-none font-black text-[10px] min-w-[140px] appearance-none hover:border-green-400 transition-all cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="NEW">✨ CREATE NEW TRIP</option>
                <option value="EDIT">📝 MODIFY EXISTING</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-green-600 transition-transform group-hover:scale-110">
                <ChevronDown size={14} className="stroke-[3]" />
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-green-200 shrink-0 mx-1"></div>

          {/* Reference Search / Display */}
          <div className="flex-1 flex flex-col">
            <label className="text-green-800/50 font-black uppercase tracking-[0.2em] text-[7px] ml-1 mb-0.5">
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
                  className={`w-full px-3 py-1 bg-white text-gray-800 rounded-[5px] border transition-all outline-none font-bold text-xs ${actionType === 'EDIT' && !tripsheetNo
                    ? 'border-yellow-400 focus:border-yellow-500 ring-1 ring-yellow-400/50'
                    : 'border-green-200 focus:border-green-500 hover:border-green-300'
                    } disabled:opacity-50 disabled:bg-transparent disabled:border-transparent disabled:italic`}
                />
                {actionType === 'NEW' && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-green-300 uppercase tracking-tighter">Automatic</div>}
              </div>

              {actionType === 'EDIT' && (
                <button
                  onClick={searchTripSheet}
                  disabled={searchLoading}
                  className="px-3 py-1 bg-green-600 text-white rounded-[5px] hover:bg-green-700 font-black flex items-center gap-1.5 transition-all outline-none shadow-sm text-[10px]"
                >
                  {searchLoading ? <Loader2 size={14} className="animate-spin" /> : <><Search size={14} className="stroke-[3]" /> FETCH</>}
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
            <div ref={vehicleDropdownRef} className="relative">
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Vehicle No <span className="text-red-500">*</span></label>
              <div
                className={`w-full flex items-center px-3 py-2 border-2 rounded-lg bg-white cursor-text text-xs font-bold gap-2 transition-colors ${
                  showVehicleDropdown ? 'border-green-500 ring-1 ring-green-200' : 'border-gray-300 hover:border-green-400'
                }`}
                onClick={() => setShowVehicleDropdown(true)}
              >
                <Search size={13} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder={formData.vehicle_id ? vehicles.find(v => String(v.id) === String(formData.vehicle_id))?.vehicle_number || 'Select Vehicle' : 'Search vehicle...'}
                  value={showVehicleDropdown ? vehicleSearch : (vehicles.find(v => String(v.id) === String(formData.vehicle_id))?.vehicle_number || '')}
                  onChange={(e) => { setVehicleSearch(e.target.value); setShowVehicleDropdown(true) }}
                  onFocus={() => { setShowVehicleDropdown(true); setVehicleSearch('') }}
                  onBlur={() => setTimeout(() => setShowVehicleDropdown(false), 180)}
                  className="flex-1 outline-none bg-transparent font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-medium min-w-0"
                />
                {formData.vehicle_id && (
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleVehicleChange(''); setVehicleSearch('') }}
                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                  >
                    <X size={13} />
                  </button>
                )}
                <ChevronDown size={13} className={`text-gray-400 shrink-0 transition-transform ${showVehicleDropdown ? 'rotate-180' : ''}`} />
              </div>
              {showVehicleDropdown && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border-2 border-green-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                  {vehicles
                    .filter(v =>
                      !vehicleSearch ||
                      v.vehicle_number.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
                      (v.owner_name || '').toLowerCase().includes(vehicleSearch.toLowerCase())
                    )
                    .length === 0 ? (
                    <div className="px-4 py-3 text-xs text-gray-400 font-medium text-center">No vehicles found</div>
                  ) : (
                    vehicles
                      .filter(v =>
                        !vehicleSearch ||
                        v.vehicle_number.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
                        (v.owner_name || '').toLowerCase().includes(vehicleSearch.toLowerCase())
                      )
                      .map(v => (
                        <div
                          key={v.id}
                          onMouseDown={() => { handleVehicleChange(String(v.id)); setVehicleSearch(''); setShowVehicleDropdown(false) }}
                          className={`px-3 py-2 cursor-pointer text-xs font-bold flex items-center justify-between gap-2 transition-colors ${
                            String(formData.vehicle_id) === String(v.id)
                              ? 'bg-green-50 text-green-700'
                              : 'hover:bg-gray-50 text-gray-800'
                          }`}
                        >
                          <span className="font-black tracking-wide">{v.vehicle_number}</span>
                          {v.owner_name && <span className="text-[10px] text-gray-400 font-medium truncate">{v.owner_name}</span>}
                          {String(formData.vehicle_id) === String(v.id) && <CheckCircle size={13} className="text-green-500 shrink-0" />}
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
            <div ref={driverDropdownRef} className="relative">
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Driver Name <span className="text-red-500">*</span></label>
              <div
                className={`w-full flex items-center px-3 py-2 border-2 rounded-lg bg-white cursor-text text-xs font-bold gap-2 transition-colors ${
                  showDriverDropdown ? 'border-green-500 ring-1 ring-green-200' : 'border-gray-300 hover:border-green-400'
                }`}
                onClick={() => setShowDriverDropdown(true)}
              >
                <Search size={13} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder={formData.driver_id ? drivers.find(d => String(d.id) === String(formData.driver_id))?.name || 'Select Driver' : 'Search driver...'}
                  value={showDriverDropdown ? driverSearch : (drivers.find(d => String(d.id) === String(formData.driver_id))?.name || '')}
                  onChange={(e) => { setDriverSearch(e.target.value); setShowDriverDropdown(true) }}
                  onFocus={() => { setShowDriverDropdown(true); setDriverSearch('') }}
                  onBlur={() => setTimeout(() => setShowDriverDropdown(false), 180)}
                  className="flex-1 outline-none bg-transparent font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-medium min-w-0"
                />
                {formData.driver_id && (
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setFormData({ ...formData, driver_id: '' }); setDriverSearch('') }}
                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                  >
                    <X size={13} />
                  </button>
                )}
                <ChevronDown size={13} className={`text-gray-400 shrink-0 transition-transform ${showDriverDropdown ? 'rotate-180' : ''}`} />
              </div>
              {showDriverDropdown && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border-2 border-green-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                  {drivers
                    .filter(d =>
                      !driverSearch ||
                      d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
                      (d.mobile_number || d.phone || '').toLowerCase().includes(driverSearch.toLowerCase())
                    )
                    .length === 0 ? (
                    <div className="px-4 py-3 text-xs text-gray-400 font-medium text-center">No drivers found</div>
                  ) : (
                    drivers
                      .filter(d =>
                        !driverSearch ||
                        d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
                        (d.mobile_number || d.phone || '').toLowerCase().includes(driverSearch.toLowerCase())
                      )
                      .map(d => (
                        <div
                          key={d.id}
                          onMouseDown={() => { setFormData({ ...formData, driver_id: String(d.id) }); setDriverSearch(''); setShowDriverDropdown(false) }}
                          className={`px-3 py-2 cursor-pointer text-xs font-bold flex items-center justify-between gap-2 transition-colors ${
                            String(formData.driver_id) === String(d.id)
                              ? 'bg-green-50 text-green-700'
                              : 'hover:bg-gray-50 text-gray-800'
                          }`}
                        >
                          <span className="font-black tracking-wide">{d.name}</span>
                          {(d.mobile_number || d.phone) && <span className="text-[10px] text-gray-400 font-medium truncate">{d.mobile_number || d.phone}</span>}
                          {String(formData.driver_id) === String(d.id) && <CheckCircle size={13} className="text-green-500 shrink-0" />}
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Trip Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={formData.trip_date}
                onChange={(e) => setFormData({ ...formData, trip_date: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none font-bold disabled:bg-gray-100 disabled:text-gray-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Dispatch Branch <span className="text-red-500">*</span></label>
              <select
                value={dispatchBranchId}
                onChange={(e) => setDispatchBranchId(e.target.value)}
                disabled={currentUser?.role !== 'superadmin'}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none font-bold bg-white disabled:bg-gray-100 disabled:text-gray-500 text-xs"
              >
                {!dispatchBranchId && <option value="">Select Branch</option>}
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.branch_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Mode of Pay</label>
              <select
                value={formData.modeOfPay}
                onChange={(e) => setFormData({ ...formData, modeOfPay: e.target.value })}
                disabled={false}
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
                disabled={false}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none font-bold disabled:bg-gray-100 disabled:text-gray-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">CR Number</label>
              <input
                type="text"
                value={formData.cr_number}
                onChange={(e) => setFormData({ ...formData, cr_number: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none font-bold disabled:bg-gray-100 disabled:text-gray-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Owner Name</label>
              <input
                type="text"
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                placeholder="Vehicle owner name"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none font-bold disabled:bg-gray-100 disabled:text-gray-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">
                Alert Branch
                <span className="ml-1 text-orange-400">🔔</span>
              </label>
              <select
                value={formData.alertBranch}
                onChange={(e) => {
                  const val = e.target.value
                  if (val && String(val) === String(dispatchBranchId)) {
                    alert('⚠️ Alert Branch cannot be the same as Dispatch Branch!')
                    return
                  }
                  setFormData({ ...formData, alertBranch: val })
                }}
                disabled={false}
                className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 outline-none font-bold bg-white disabled:bg-gray-100 disabled:text-gray-500 text-xs"
              >
                <option value="">Select Branch</option>
                {branches.filter(b => String(b.id) !== String(dispatchBranchId)).map(b => (
                  <option key={b.id} value={b.id}>{b.branch_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Opening KM</label>
              <input
                type="number"
                value={formData.opening_km}
                onChange={(e) => setFormData({ ...formData, opening_km: e.target.value })}
                placeholder="Opening Reading"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none font-bold disabled:bg-gray-100 disabled:text-gray-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Rate / KM</label>
              <input
                type="number"
                value={formData.rate_per_km}
                onChange={(e) => setFormData({ ...formData, rate_per_km: e.target.value })}
                placeholder="0.00"
                disabled={isLocked}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none font-bold disabled:bg-gray-100 disabled:text-gray-500 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="col-span-1">
              <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">WayBill/GC SELECTION <span className="text-red-500">*</span></label>
              <button
                onClick={() => setIsSelectingGC(true)}
                disabled={false}
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
                disabled={false}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none font-bold disabled:bg-gray-100 disabled:text-gray-500 text-xs"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t-2 border-green-100">
            {!isLocked && (
              <button
                onClick={handleGenerateTripSheet}
                disabled={saveLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold flex items-center gap-2 shadow-lg shadow-green-200 transition-all disabled:opacity-50 text-sm"
              >
                {saveLoading ? 'Saving...' : <><Save size={16} /> {actionType === 'NEW' ? 'GENERATE TRIP SHEET' : 'UPDATE TRIP SHEET'}</>}
              </button>
            )}
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
          </div>

          <div className="overflow-hidden rounded-xl border border-yellow-200 shadow-sm bg-white">
            <table className="w-full text-xs">
              <thead className="bg-yellow-100">
                <tr>
                  <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase text-[10px] tracking-wider">GC Num</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase text-[10px] tracking-wider">Destination</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase text-[10px] tracking-wider">Articles</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase text-[10px] tracking-wider">Description</th>
                  {!isLocked && <th className="px-4 py-2 text-center font-bold text-gray-700 uppercase text-[10px] tracking-wider">Action</th>}
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
                      {!isLocked && (
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => removeGcFromTrip(gc.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-75"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
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

      {/* Confirmation Popup */}
      {popup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className={`h-1.5 w-full ${popup.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full flex-shrink-0 ${popup.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                  {popup.type === 'success'
                    ? <CheckCircle size={28} className="text-green-600" />
                    : <AlertCircle size={28} className="text-red-500" />}
                </div>
                <div className="flex-1">
                  <h3 className={`text-base font-black mb-1 ${popup.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                    {popup.title}
                  </h3>
                  {popup.tripNumber && (
                    <div className="mb-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-[10px] text-green-600 font-black uppercase tracking-widest mb-0.5">Trip Sheet Number</p>
                      <p className="text-xl font-black text-green-800 tracking-wide">{popup.tripNumber}</p>
                    </div>
                  )}
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{popup.message}</p>
                </div>
                <button onClick={() => setPopup(null)} className="text-slate-300 hover:text-slate-500 transition-colors mt-0.5">
                  <X size={18} />
                </button>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                {popup.type === 'success' && popup.tripId && (
                  <button
                    onClick={async () => {
                      try {
                        const res = await axios.get(`${API_BASE_URL}/trip-sheets/${popup.tripId}`);
                        if (res.data.success) {
                          setPrintData(res.data.data);
                          setShowPreview(true);
                        }
                      } catch (err) {
                        console.error('Fetch error:', err);
                        alert('Failed to fetch dynamic print data');
                      }
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-100 flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all active:scale-95 group"
                  >
                    <Printer size={18} className="group-hover:scale-110 transition-transform" /> 
                    PRINT DYNAMIC TRIP SHEET
                  </button>
                )}
                <button
                  onClick={() => setPopup(null)}
                  className={`w-full py-2 rounded-xl text-white text-sm font-black shadow-md transition-all ${popup.type === 'success' ? 'bg-gray-800 hover:bg-black' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  {popup.type === 'success' ? 'Done / Close' : 'Dismiss'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-green-100">
            <div className="p-6 bg-gradient-to-r from-green-600 to-emerald-700 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <HelpCircle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Trip Sheet Guide</h2>
                  <p className="text-green-100 text-xs">How to manage vehicle dispatches</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-green-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">1</span>
                    Vehicle & Driver
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 ml-10">
                    <li>• Select an <span className="font-semibold text-gray-800">Available Vehicle</span>. If it's on another trip, you must verify it first.</li>
                    <li>• Assign a <span className="font-semibold text-gray-800">Driver</span> and check their details.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">2</span>
                    Attaching GCs
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 ml-10">
                    <li>• Click <span className="font-semibold text-gray-800">CHOOSE GC</span> to see all waybills waiting for dispatch.</li>
                    <li>• Use <span className="font-semibold text-gray-800">Filters</span> to find waybills for specific destinations.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">3</span>
                    Modifying Trips
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 ml-10">
                    <li>• Switch to <span className="font-semibold text-gray-800">Modify Mode</span> to edit an existing trip.</li>
                    <li>• <span className="text-red-500 font-bold">Note:</span> If a trip is already acknowledged at the destination, it becomes <span className="font-bold">Locked</span>.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-purple-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">★</span>
                    Advance & Pay
                  </div>
                  <div className="ml-10">
                    <p className="text-xs text-gray-500 leading-relaxed italic">
                      You can record <span className="font-semibold text-gray-800">Advance Amounts</span> and the payment mode (Cash/Cheque) during generation.
                    </p>
                  </div>
                </section>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-6 py-2 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-all shadow-lg"
              >
                Ready to Start
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Full Page Print Preview Modal ── */}
      {showPreview && printData && (
        <div className="fixed inset-0 z-[1000] flex flex-col bg-white animate-in fade-in zoom-in duration-300 no-print">
          {/* Modal Header */}
          <div className="p-4 border-b flex justify-between items-center bg-gray-50 no-print">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                <Printer size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-800 leading-none uppercase tracking-tight">Trip Sheet Preview</h2>
                <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-widest">{printData.trip_number} — Review before printing</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setShowPreview(false)
                setPrintData(null)
              }} 
              className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-all text-gray-500 group"
            >
              <X size={28} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          {/* Receipt Preview */}
          <div className="flex-1 overflow-auto bg-gray-200/50 p-4 md:p-8 flex justify-center" id="printable-tripsheet-entry">
            <div className="bg-white shadow-2xl p-[5mm] md:p-[10mm] min-w-fit h-fit">
              <TripSheetReceipt
                printData={printData}
                transportInfo={transportInfo}
                logo={logo}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-6 border-t bg-white flex justify-center items-center gap-6 no-print shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button
              onClick={() => {
                setShowPreview(false)
                setPrintData(null)
              }}
              className="px-8 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-sm hover:bg-gray-200 transition-all active:scale-95 border border-gray-200"
            >
              Close Preview
            </button>
            <button
              onClick={() => window.print()}
              className="px-12 py-4 bg-gradient-to-r from-green-600 to-green-800 text-white rounded-2xl font-black uppercase text-base hover:from-green-700 hover:to-green-900 transition-all flex items-center gap-3 shadow-xl shadow-green-200 active:scale-95 group"
            >
              <Printer size={24} className="group-hover:scale-110 transition-transform" />
              Confirm & Print
            </button>
          </div>
        </div>
      )}

      {/* Hidden printable content */}
      <div className="printable-content hidden print:block">
          <TripSheetReceipt
            printData={printData}
            transportInfo={transportInfo}
            logo={logo}
          />
      </div>

      <style>{`
        @media screen {
          .printable-content { display: none; }
        }
        @media print {
          body * { visibility: hidden !important; }
          .printable-content, .printable-content * { visibility: visible !important; }
          .printable-content { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important;
            display: block !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}

export default TripSheetEntry
