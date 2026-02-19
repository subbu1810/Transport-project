import React, { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function ScreenAssignment() {
  const [admins, setAdmins] = useState([])
  const [selectedAdminId, setSelectedAdminId] = useState('')
  const [availableScreens, setAvailableScreens] = useState([])
  const [selectedScreens, setSelectedScreens] = useState([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [isSuperAdminSelection, setIsSuperAdminSelection] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    fetchAdmins()
    fetchAvailableScreens()
  }, [])

  useEffect(() => {
    if (selectedAdminId) {
      const admin = admins.find(a => a.id === parseInt(selectedAdminId))
      if (admin) {
        if (admin.role === 'superadmin') {
          setIsSuperAdminSelection(true)
          // For superadmin, implicitly select all screens visually but disable editing
          const allScreenPaths = availableScreens.flatMap(cat => cat.screens.map(s => s.path))
          setSelectedScreens(allScreenPaths)
        } else {
          setIsSuperAdminSelection(false)
          fetchAdminAssignments(selectedAdminId)
        }
      }
    } else {
      setSelectedScreens([])
      setIsSuperAdminSelection(false)
    }
  }, [selectedAdminId, admins, availableScreens])

  const fetchAdmins = async () => {
    try {
      const response = await fetch(`${API_URL}/admins`)
      const data = await response.json()
      if (data.success) {
        setAdmins(data.data)
      }
    } catch (err) {
      console.error('Error fetching admins:', err)
      setError('Failed to load admin list')
    }
  }

  const fetchAvailableScreens = async () => {
    try {
      const response = await fetch(`${API_URL}/screen-assignments/all-screens`)
      const data = await response.json()
      if (data.success) {
        setAvailableScreens(data.data)
      }
    } catch (err) {
      console.error('Error fetching screens:', err)
      setError('Failed to load screens list')
    }
  }

  const fetchAdminAssignments = async (adminId) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/screen-assignments/admin/${adminId}`)
      const data = await response.json()
      if (data.success) {
        if (data.is_superadmin) {
          // Should be handled by useEffect logic, but safety check
          setIsSuperAdminSelection(true)
        } else {
          const assignedPaths = data.data.map(assign => assign.screen_path)
          setSelectedScreens(assignedPaths)
        }
      }
    } catch (err) {
      console.error('Error fetching assignments:', err)
      setError('Failed to load user assignments')
    } finally {
      setLoading(false)
    }
  }

  const toggleScreen = (path) => {
    if (isSuperAdminSelection) return // Prevent editing for superadmin

    if (selectedScreens.includes(path)) {
      setSelectedScreens(selectedScreens.filter(p => p !== path))
    } else {
      setSelectedScreens([...selectedScreens, path])
    }
  }

  const toggleCategory = (categoryScreens) => {
    if (isSuperAdminSelection) return

    const categoryPaths = categoryScreens.map(s => s.path)
    const allSelected = categoryPaths.every(path => selectedScreens.includes(path))

    if (allSelected) {
      // Unselect all
      setSelectedScreens(selectedScreens.filter(path => !categoryPaths.includes(path)))
    } else {
      // Select all
      const newScreens = [...selectedScreens]
      categoryPaths.forEach(path => {
        if (!newScreens.includes(path)) newScreens.push(path)
      })
      setSelectedScreens(newScreens)
    }
  }

  const handleSave = () => {
    if (!selectedAdminId) return
    if (isSuperAdminSelection) return
    setShowConfirmation(true)
  }

  const executeSave = async () => {
    setShowConfirmation(false)
    if (!selectedAdminId) return
    if (isSuperAdminSelection) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // Build payload
      const payloadScreens = []
      availableScreens.forEach(cat => {
        cat.screens.forEach(screen => {
          if (selectedScreens.includes(screen.path)) {
            payloadScreens.push({
              screen_path: screen.path,
              screen_name: screen.name,
              category: cat.category
            })
          }
        })
      })

      const response = await fetch(`${API_URL}/screen-assignments/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_id: selectedAdminId,
          screens: payloadScreens
        })
      })

      const data = await response.json()

      if (data.success) {
        setShowSuccessModal(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setError(data.message || 'Failed to save assignments')
      }
    } catch (err) {
      console.error('Error saving assignments:', err)
      setError('Error connecting to server')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Screen Assignment</h1>
        <div className="flex gap-2">
          {success && <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium flex items-center gap-2"><CheckCircle2 size={18} /> {success}</span>}
          {error && <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium flex items-center gap-2"><AlertCircle size={18} /> {error}</span>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Select Admin User</label>
          <select
            value={selectedAdminId}
            onChange={(e) => setSelectedAdminId(e.target.value)}
            className="w-full md:w-96 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 font-medium text-gray-700 bg-white shadow-sm transition-colors"
          >
            <option value="">-- Select Administrator --</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.name} ({admin.role}) - {admin.branch_name}
              </option>
            ))}
          </select>
          {isSuperAdminSelection && (
            <p className="mt-2 text-sm text-amber-600 font-medium flex items-center gap-2">
              <AlertCircle size={16} /> Superadmin users have full access to all screens by default. Assignments cannot be modified.
            </p>
          )}
        </div>

        {selectedAdminId && (
          <div className="space-y-8">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Available Screens</h3>
              <div className="text-sm text-gray-500">
                {isSuperAdminSelection
                  ? 'All screens enabled (Superadmin)'
                  : `${selectedScreens.length} screens assigned`
                }
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={32} className="animate-spin text-green-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableScreens.map((category, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                      <h4 className="font-bold text-gray-700">{category.category}</h4>
                      {!isSuperAdminSelection && (
                        <button
                          onClick={() => toggleCategory(category.screens)}
                          className="text-xs font-semibold text-green-600 hover:text-green-700 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                        >
                          Toggle All
                        </button>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      {category.screens.map((screen, sIdx) => {
                        const isSelected = selectedScreens.includes(screen.path)
                        return (
                          <div
                            key={sIdx}
                            onClick={() => toggleScreen(screen.path)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-white shadow-sm border border-green-100' : 'hover:bg-gray-200/50'
                              } ${isSuperAdminSelection ? 'cursor-default opacity-75' : ''}`}
                          >
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-400 bg-white'
                                }`}
                            >
                              {isSelected && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                            </div>
                            <span className={`text-sm font-medium ${isSelected ? 'text-gray-800' : 'text-gray-500'}`}>
                              {screen.name}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSuperAdminSelection && (
              <div className="flex gap-4 pt-6 border-t border-gray-200 sticky bottom-0 bg-white p-4 -mx-6 mt-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-b-xl">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold transition-all shadow-lg shadow-green-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  SAVE ASSIGNMENTS
                </button>
                <button
                  onClick={() => setSelectedAdminId('')}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition-colors"
                >
                  CANCEL
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Assignments</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to update the screen permissions for this user?
              This will update their access immediately.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={executeSave}
                className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-lg shadow-green-100"
              >
                Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-300 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Success!</h3>
            <p className="text-gray-600 mb-6">
              Screen assignments have been saved successfully.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-100"
            >
              OK, Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScreenAssignment
