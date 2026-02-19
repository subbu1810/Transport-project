import React, { useState, useEffect } from 'react'
import { Search, Loader2, Save, X, ChevronRight, ChevronLeft, ArrowRight, ArrowLeft } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function FromToAddress() {
  const [branches, setBranches] = useState([])
  const [districts, setDistricts] = useState([])
  const [taluks, setTaluks] = useState([])

  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedTaluk, setSelectedTaluk] = useState('')

  const [toAssign, setToAssign] = useState([]) // Unassigned
  const [assigned, setAssigned] = useState([]) // Assigned

  const [loading, setLoading] = useState(false)
  const [mappingLoading, setMappingLoading] = useState(false)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' })
    }, 5000)
  }

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [branchRes, districtRes] = await Promise.all([
          fetch(`${API_URL}/branches`),
          fetch(`${API_URL}/districts`)
        ])

        const branchData = await branchRes.json()
        const districtData = await districtRes.json()

        if (branchData.success) setBranches(branchData.data)
        if (districtData.success) setDistricts(districtData.data)
      } catch (err) {
        console.error('Error fetching initial data:', err)
        showNotification('error', 'Failed to connect to server')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Fetch taluks when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setTaluks([])
      setSelectedTaluk('')
      return
    }

    const fetchTaluks = async () => {
      try {
        const response = await fetch(`${API_URL}/taluks`)
        const data = await response.json()
        if (data.success) {
          const filtered = data.data.filter(t => t.district_id == selectedDistrict)
          setTaluks(filtered)
        }
      } catch (err) {
        console.error('Error fetching taluks:', err)
      }
    }
    fetchTaluks()
  }, [selectedDistrict])

  // Fetch mappings when branch or taluk changes
  useEffect(() => {
    if (!selectedBranch) {
      setAssigned([])
      setToAssign([])
      return
    }

    const fetchMappings = async () => {
      try {
        setMappingLoading(true)
        let url = `${API_URL}/branch-destination-mappings?branch_id=${selectedBranch}`
        if (selectedTaluk) {
          url += `&taluk_id=${selectedTaluk}`
        }

        const response = await fetch(url)
        const data = await response.json()

        if (data.success) {
          setToAssign(data.data.unassigned)
          setAssigned(data.data.assigned)
        }
      } catch (err) {
        console.error('Error fetching mappings:', err)
        showNotification('error', 'Failed to fetch mappings')
      } finally {
        setMappingLoading(false)
      }
    }
    fetchMappings()
  }, [selectedBranch, selectedTaluk])

  const handleAssign = (item) => {
    setToAssign(toAssign.filter(i => i.id !== item.id))
    setAssigned([...assigned, item].sort((a, b) => a.city_name.localeCompare(b.city_name)))
  }

  const handleUnassign = (item) => {
    setAssigned(assigned.filter(i => i.id !== item.id))
    setToAssign([...toAssign, item].sort((a, b) => a.city_name.localeCompare(b.city_name)))
  }

  const handleAssignAll = () => {
    setAssigned([...assigned, ...toAssign].sort((a, b) => a.city_name.localeCompare(b.city_name)))
    setToAssign([])
  }

  const handleUnassignAll = () => {
    setToAssign([...toAssign, ...assigned].sort((a, b) => a.city_name.localeCompare(b.city_name)))
    setAssigned([])
  }

  const saveMappings = async () => {
    if (!selectedBranch) {
      showNotification('error', 'Branch is required')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/branch-destination-mappings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: selectedBranch,
          taluk_id: selectedTaluk || 0, // 0 or null if not filtering by taluk
          destination_ids: assigned.map(a => a.id)
        })
      })

      const data = await response.json()
      if (data.success) {
        showNotification('success', 'Mappings saved successfully')
      } else {
        showNotification('error', data.message || 'Failed to save mappings')
      }
    } catch (err) {
      console.error('Error saving mappings:', err)
      showNotification('error', 'Failed to save mappings')
    } finally {
      setLoading(false)
    }
  }

  if (loading && branches.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Notification Popup */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transform transition-all duration-300 ${notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
          <div className="flex items-start">
            <div className="flex-1">
              <p className="font-medium">
                {notification.type === 'success' ? 'Success!' :
                  notification.type === 'error' ? 'Error!' :
                    'Info'}
              </p>
              <p className="text-sm mt-1">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification({ show: false, type: '', message: '' })}
              className="ml-4 text-white hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Branch-Destination Mapping</h1>
        <button
          onClick={saveMappings}
          disabled={loading || !selectedBranch}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Save Assignments
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Branch (Source)</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors bg-gray-50"
            >
              <option value="">Select Branch</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.branch_name} ({b.branch_code})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors bg-gray-50"
            >
              <option value="">Select District</option>
              {districts.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Taluk</label>
            <select
              value={selectedTaluk}
              onChange={(e) => setSelectedTaluk(e.target.value)}
              disabled={!selectedDistrict}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              <option value="">Select Taluk</option>
              {taluks.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_50px_1fr] gap-6 items-center">
          {/* TO BE ASSIGNED */}
          <div className="flex flex-col h-[500px] border-2 border-yellow-100 rounded-2xl overflow-hidden bg-yellow-50/30">
            <div className="bg-yellow-100 p-4 border-b-2 border-yellow-200 flex justify-between items-center">
              <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                <Search size={18} />
                AVAILABLE DESTINATIONS
                <span className="bg-yellow-200 px-2 py-0.5 rounded-full text-xs">
                  {toAssign.length}
                </span>
              </h3>
              <button
                onClick={handleAssignAll}
                disabled={toAssign.length === 0}
                className="text-xs font-bold text-yellow-700 hover:text-yellow-900 flex items-center gap-1 uppercase tracking-wider disabled:opacity-50"
              >
                Assign All <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {mappingLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-yellow-500" /></div>
              ) : toAssign.length === 0 ? (
                <div className="text-center py-10 text-gray-400 italic">No available destinations</div>
              ) : (
                toAssign.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleAssign(item)}
                    className="group p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-yellow-400 hover:shadow-md transition-all flex justify-between items-center"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-700">{item.city_name}</span>
                      <span className="text-xs text-gray-400">
                        {item.taluk?.name} {item.taluk?.district?.name ? `(${item.taluk.district.name})` : ''}
                      </span>
                    </div>
                    <ArrowRight size={18} className="text-gray-300 group-hover:text-yellow-500 group-hover:translate-x-1 transition-all" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* MID CONTROLS */}
          <div className="flex lg:flex-col gap-2 justify-center">
            <div className="hidden lg:flex flex-col gap-2 items-center text-gray-300">
              <div className="h-20 w-px bg-gray-200"></div>
              <span className="text-[10px] font-bold uppercase vertical-text py-4">Drag/Click</span>
              <div className="h-20 w-px bg-gray-200"></div>
            </div>
          </div>

          {/* ASSIGNED */}
          <div className="flex flex-col h-[500px] border-2 border-green-100 rounded-2xl overflow-hidden bg-green-50/30">
            <div className="bg-green-100 p-4 border-b-2 border-green-200 flex justify-between items-center">
              <button
                onClick={handleUnassignAll}
                disabled={assigned.length === 0}
                className="text-xs font-bold text-green-700 hover:text-green-900 flex items-center gap-1 uppercase tracking-wider disabled:opacity-50"
              >
                <ChevronLeft size={14} /> Unassign All
              </button>
              <h3 className="font-bold text-green-800 flex items-center gap-2">
                ASSIGNED TO BRANCH
                <span className="bg-green-200 px-2 py-0.5 rounded-full text-xs">
                  {assigned.length}
                </span>
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {mappingLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-green-500" /></div>
              ) : assigned.length === 0 ? (
                <div className="text-center py-10 text-gray-400 italic">No destinations assigned</div>
              ) : (
                assigned.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleUnassign(item)}
                    className="group p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-green-400 hover:shadow-md transition-all flex justify-between items-center"
                  >
                    <ArrowLeft size={18} className="text-gray-300 group-hover:text-green-500 group-hover:-translate-x-1 transition-all" />
                    <div className="flex flex-col items-end">
                      <span className="font-medium text-gray-700 text-right">{item.city_name}</span>
                      <span className="text-xs text-gray-400">{item.taluk?.name}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-blue-50 p-4 border border-blue-100 flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <Save size={20} />
          </div>
          <div className="flex-1 text-sm text-blue-800">
            <p className="font-bold mb-1">How it works:</p>
            <p>1. Select a **Source Branch** to manage its assigned delivery points.</p>
            <p>2. Filter by **District** and **Taluk** to find specific cities/locations.</p>
            <p>3. Click locations in the **Yellow** column to assign them, or the **Green** column to unassign.</p>
            <p>4. Don't forget to click **Save Assignments** at the top right to persist your changes!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FromToAddress
