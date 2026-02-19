import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { FileText, Loader2, Save, RotateCcw, AlertCircle, CheckCircle2, X } from 'lucide-react'

const API_BASE_URL = 'http://localhost:8000/api/v1'

function TripSheetAck() {
  const [formData, setFormData] = useState({
    tripsheetId: '',
    ackDate: new Date().toISOString().split('T')[0],
    totalFreight: '0',
    ackRemarks: '',
    totalCollection: '0',
    lessPaidDriver: '0',
    balanceAtOffice: '0',
    totalKms: '0',
    vehicleNo: '',
    modeOfPay: '',
    crNo: '',
    ownerName: '',
    driverName: '',
    indentNo: '',
    advanceAmount: '0'
  })

  // Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'confirm', // 'confirm' or 'success' or 'error'
    title: '',
    message: '',
    onConfirm: null
  })

  const [awaitingTripSheets, setAwaitingTripSheets] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchAwaitingTripSheets()
  }, [])

  const fetchAwaitingTripSheets = async () => {
    try {
      setLoading(true)
      const user = JSON.parse(localStorage.getItem('user'))
      const response = await axios.get(`${API_BASE_URL}/trip-sheets/awaiting-ack`, {
        params: user?.role !== 'superadmin' ? { branch_id: user.branch_id } : {}
      })
      if (response.data.success) {
        setAwaitingTripSheets(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching awaiting trip sheets:', err)
      setMessage({ type: 'error', text: 'Failed to load pending trip sheets' })
    } finally {
      setLoading(false)
    }
  }

  const handleTripSheetSelect = async (id) => {
    if (!id) {
      resetForm()
      return
    }

    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/trip-sheets/${id}`)
      if (response.data.success) {
        const ts = response.data.data
        const totalGCCollection = ts.waybills?.reduce((acc, wb) => acc + (parseFloat(wb.total_amount) || 0), 0) || 0

        setFormData(prev => ({
          ...prev,
          tripsheetId: ts.id,
          vehicleNo: ts.vehicle?.vehicle_number || '',
          crNo: ts.cr_number || '',
          ownerName: ts.owner_name || '',
          driverName: ts.driver?.name || '',
          indentNo: ts.indent_number || '',
          advanceAmount: ts.advance_amount || '0',
          totalFreight: totalGCCollection.toString(),
          totalCollection: totalGCCollection.toString(),
          balanceAtOffice: totalGCCollection.toString()
        }))
      }
    } catch (err) {
      console.error('Error fetching trip sheet details:', err)
      setMessage({ type: 'error', text: 'Error loading trip sheet details' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const collection = parseFloat(formData.totalCollection) || 0
    const lessPaid = parseFloat(formData.lessPaidDriver) || 0
    const balance = collection - lessPaid
    setFormData(prev => ({ ...prev, balanceAtOffice: balance.toString() }))
  }, [formData.totalCollection, formData.lessPaidDriver])

  const resetForm = () => {
    setFormData({
      tripsheetId: '',
      ackDate: new Date().toISOString().split('T')[0],
      totalFreight: '0',
      ackRemarks: '',
      totalCollection: '0',
      lessPaidDriver: '0',
      balanceAtOffice: '0',
      totalKms: '0',
      vehicleNo: '',
      modeOfPay: '',
      crNo: '',
      ownerName: '',
      driverName: '',
      indentNo: '',
      advanceAmount: '0'
    })
    setMessage({ type: '', text: '' })
  }

  const processSubmission = async () => {
    try {
      setSubmitLoading(true)
      const response = await axios.post(`${API_BASE_URL}/trip-sheets/${formData.tripsheetId}/acknowledge`, {
        ack_date: formData.ackDate,
        ack_remarks: formData.ackRemarks,
        total_freight: formData.totalFreight,
        total_collection: formData.totalCollection,
        less_paid_driver: formData.lessPaidDriver,
        balance_at_office: formData.balanceAtOffice,
        total_kms: formData.totalKms
      })

      if (response.data.success) {
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: 'Trip Sheet Acknowledged Successfully!',
          onConfirm: () => {
            setModal({ ...modal, isOpen: false })
            resetForm()
          }
        })
        fetchAwaitingTripSheets()
      }
    } catch (err) {
      console.error('Error acknowledging trip sheet:', err)
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Failed to acknowledge trip sheet',
        onConfirm: () => setModal({ ...modal, isOpen: false })
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.tripsheetId) {
      setMessage({ type: 'error', text: 'Please select a trip sheet' })
      return
    }

    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Confirm Acknowledgment',
      message: 'Are you sure you want to finalize this Trip Sheet acknowledgment? Once confirmed, it will be moved to the reports.',
      onConfirm: () => {
        setModal({ ...modal, isOpen: false })
        processSubmission()
      }
    })
  }

  return (
    <div className="p-4 space-y-4 relative">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-green-100 rounded-lg text-green-600">
          <FileText size={20} />
        </div>
        <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Trip Sheet Acknowledgment</h1>
      </div>

      {message.text && (
        <div className={`p-3 rounded-lg flex items-center gap-2 font-bold text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Modern Centered Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-8 text-center space-y-4 ${modal.type === 'confirm' ? 'bg-blue-50/50' : modal.type === 'success' ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
              <div className="flex justify-center">
                {modal.type === 'confirm' && <div className="p-4 bg-blue-100 rounded-full text-blue-600"><AlertCircle size={40} /></div>}
                {modal.type === 'success' && <div className="p-4 bg-green-100 rounded-full text-green-600 border-4 border-white"><CheckCircle2 size={40} /></div>}
                {modal.type === 'error' && <div className="p-4 bg-red-100 rounded-full text-red-600"><X size={40} /></div>}
              </div>
              <h2 className={`text-2xl font-black ${modal.type === 'confirm' ? 'text-blue-900' : modal.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>{modal.title}</h2>
              <p className="text-gray-600 font-medium leading-relaxed">{modal.message}</p>
            </div>
            <div className="p-6 bg-white flex gap-3">
              {modal.type === 'confirm' && (
                <button
                  onClick={() => setModal({ ...modal, isOpen: false })}
                  className="flex-1 px-6 py-3 border-2 border-gray-100 rounded-2xl text-gray-500 font-black hover:bg-gray-50 transition-all"
                >
                  CANCEL
                </button>
              )}
              <button
                onClick={modal.onConfirm}
                className={`flex-1 px-6 py-3 rounded-2xl text-white font-black shadow-lg transition-all hover:scale-105 active:scale-95 ${modal.type === 'confirm' ? 'bg-blue-600 shadow-blue-100 hover:bg-blue-700' :
                  modal.type === 'success' ? 'bg-green-600 shadow-green-100 hover:bg-green-700' :
                    'bg-red-600 shadow-red-100 hover:bg-red-700'
                  }`}
              >
                {modal.type === 'confirm' ? 'YES, CONFIRM' : 'OKAY'}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-4 space-y-4">
          {/* Main Selection Area */}
          <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Select Pending Trip Sheet</label>
              <select
                value={formData.tripsheetId}
                onChange={(e) => handleTripSheetSelect(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-green-200 rounded-lg focus:border-green-500 outline-none font-bold text-gray-700 transition-all cursor-pointer text-sm"
                disabled={loading}
              >
                <option value="">Choose a Trip Sheet...</option>
                {awaitingTripSheets.map(ts => (
                  <option key={ts.id} value={ts.id}>{ts.trip_number} - {new Date(ts.trip_date).toLocaleDateString()} ({ts.vehicle?.vehicle_number})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Acknowledgment Date</label>
              <input
                type="date"
                value={formData.ackDate}
                onChange={(e) => setFormData({ ...formData, ackDate: e.target.value })}
                className="w-full px-3 py-2 bg-white border-2 border-green-200 rounded-lg focus:border-green-500 outline-none font-bold text-gray-700 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Advance Amount (Readonly)</label>
              <div className="px-3 py-2 bg-gray-100 border-2 border-gray-200 rounded-lg font-bold text-gray-500 text-sm">
                ₹{parseFloat(formData.advanceAmount).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Trip Information */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                Trip Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <DetailField label="Vehicle No" value={formData.vehicleNo} />
                <DetailField label="Driver Name" value={formData.driverName} />
                <DetailField label="Owner Name" value={formData.ownerName} />
                <DetailField label="CR / Indent No" value={formData.crNo || formData.indentNo || '-'} />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Acknowledgment Remarks</label>
                <textarea
                  value={formData.ackRemarks}
                  onChange={(e) => setFormData({ ...formData, ackRemarks: e.target.value })}
                  rows="3"
                  placeholder="Enter any feedback or notes..."
                  className="w-full px-3 py-2 border-2 border-gray-100 rounded-lg focus:border-green-500 outline-none font-medium text-gray-700 transition-all resize-none shadow-sm text-sm"
                ></textarea>
              </div>
            </div>

            {/* Right Column: Financial Settlement */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                Financial Settlement
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-tighter mb-1">Total Freight</label>
                  <InputField
                    value={formData.totalFreight}
                    onChange={(val) => setFormData({ ...formData, totalFreight: val })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-tighter mb-1">Total Collection</label>
                  <InputField
                    value={formData.totalCollection}
                    onChange={(val) => setFormData({ ...formData, totalCollection: val })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-red-500 uppercase tracking-tighter mb-1">Less Paid to Driver</label>
                  <InputField
                    value={formData.lessPaidDriver}
                    onChange={(val) => setFormData({ ...formData, lessPaidDriver: val })}
                    className="border-red-200 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-green-600 uppercase tracking-tighter mb-1">Balance at Office</label>
                  <div className="px-3 py-2 bg-green-50 border-2 border-green-200 rounded-lg font-black text-green-700 text-sm shadow-inner">
                    ₹{parseFloat(formData.balanceAtOffice).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-tighter mb-1">Total KMS Run</label>
                  <InputField
                    value={formData.totalKms}
                    onChange={(val) => setFormData({ ...formData, totalKms: val })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 border-2 border-gray-200 text-gray-500 rounded-lg hover:bg-white hover:border-gray-400 font-black transition-all flex items-center gap-2 text-sm"
          >
            <RotateCcw size={16} />
            RESET
          </button>
          <button
            type="submit"
            disabled={submitLoading || !formData.tripsheetId}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-black transition-all flex items-center gap-2 shadow-lg shadow-green-100 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 text-sm"
          >
            {submitLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            CONFIRM ACKNOWLEDGMENT
          </button>
        </div>
      </form>
    </div>
  )
}

function DetailField({ label, value }) {
  return (
    <div className="space-y-1">
      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest italic">{label}</label>
      <div className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg font-bold text-gray-700 text-sm truncate uppercase tracking-tight">
        {value || '-'}
      </div>
    </div>
  )
}

function InputField({ value, onChange, className = "" }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-8 pr-4 py-2 border-2 border-gray-100 rounded-lg focus:border-green-500 outline-none font-bold text-gray-700 transition-all shadow-sm text-sm ${className}`}
      />
    </div>
  )
}

export default TripSheetAck
