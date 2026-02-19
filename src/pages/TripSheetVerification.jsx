import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { CheckCircle2, Search, Loader2, AlertCircle, ShieldCheck, X, FileText, MapPin, Printer } from 'lucide-react'

const API_BASE_URL = 'http://localhost:8000/api/v1'

function TripSheetVerification() {
  const [user, setUser] = useState(null)
  const [branches, setBranches] = useState([])
  const [filters, setFilters] = useState({
    branch_id: '',
    from_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0]
  })

  const fetchAwaitingVerification = async (currentFilters = filters) => {
    try {
      setLoading(true)
      setSelectedTripId(null)
      const userObj = user || JSON.parse(localStorage.getItem('user'))
      const params = {
        branch_id: userObj?.role !== 'superadmin' ? userObj?.branch_id : currentFilters.branch_id,
        from_date: currentFilters.from_date,
        to_date: currentFilters.to_date
      }

      const response = await axios.get(`${API_BASE_URL}/trip-sheets/awaiting-verification`, { params })
      if (response.data.success) {
        setTripsheets(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    let currentFilters = { ...filters }
    if (userStr) {
      const userData = JSON.parse(userStr)
      setUser(userData)
      if (userData.role !== 'superadmin' && userData.branch_id) {
        currentFilters.branch_id = userData.branch_id
        setFilters(currentFilters)
      }
    }
    fetchAwaitingVerification(currentFilters)
  }, [])

  const [tripsheets, setTripsheets] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTripId, setSelectedTripId] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Printing states
  const [printData, setPrintData] = useState(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [logo, setLogo] = useState(null)

  // Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    onConfirm: null
  })

  useEffect(() => {
    fetchBranches()
    fetchLogo()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/branches`)
      if (response.data.success) {
        setBranches(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching branches:', err)
    }
  }

  const fetchLogo = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/logo_path`)
      if (response.data.success && response.data.data) {
        setLogo(`http://localhost:8000/storage/${response.data.data}`)
      }
    } catch (err) {
      console.error('Error fetching logo:', err)
    }
  }


  const handlePrint = async (id) => {
    try {
      setIsPrinting(true)
      const response = await axios.get(`${API_BASE_URL}/trip-sheets/${id}`)
      if (response.data.success) {
        setPrintData(response.data.data)
        setTimeout(() => {
          window.print()
          setPrintData(null)
          setIsPrinting(false)
        }, 500)
      }
    } catch (err) {
      alert('Error fetching trip sheet details for print')
      setIsPrinting(false)
    }
  }

  const handleVerify = async (id) => {
    const trip = tripsheets.find(t => t.id === id)
    if (!trip) return

    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Confirm Verification',
      message: `Are you sure you want to verify Trip Sheet ${trip.trip_number}? This will finalize the record for auditing.`,
      onConfirm: () => {
        setModal({ ...modal, isOpen: false })
        processVerification(id)
      }
    })
  }

  const processVerification = async (id) => {
    try {
      setSubmitLoading(true)
      const user = JSON.parse(localStorage.getItem('user'))
      const response = await axios.post(`${API_BASE_URL}/trip-sheets/${id}/verify`, {
        verification_date: new Date().toISOString().split('T')[0],
        verified_by: user?.id
      })

      if (response.data.success) {
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Verified!',
          message: 'Trip Sheet has been verified and audited successfully.',
          onConfirm: () => {
            setModal({ ...modal, isOpen: false })
            fetchAwaitingVerification()
          }
        })
      }
    } catch (err) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Verification Failed',
        message: err.response?.data?.message || 'Failed to verify trip sheet',
        onConfirm: () => setModal({ ...modal, isOpen: false })
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4 relative">
      <div className="no-print space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-100">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Trip Sheet Verification</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Audit and finalize trip sheet finances</p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                <MapPin size={10} /> Branch
              </label>
              <select
                value={filters.branch_id}
                onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
                disabled={user?.role !== 'superadmin'}
                className={`w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-blue-500 focus:bg-white outline-none font-bold text-gray-700 transition-all appearance-none text-sm ${user?.role !== 'superadmin' ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {user?.role === 'superadmin' && <option value="">ALL BRANCHES</option>}
                {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
              </select>
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">From Date</label>
                <input
                  type="date"
                  value={filters.from_date}
                  onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-blue-500 outline-none font-bold text-gray-700 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">To Date</label>
                <input
                  type="date"
                  value={filters.to_date}
                  onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-blue-500 outline-none font-bold text-gray-700 text-sm"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchAwaitingVerification}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-100 disabled:opacity-50 text-sm"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <><Search size={16} /> GET DETAILS</>}
              </button>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              Awaiting Verification
            </h3>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              {tripsheets.length} PENDING AUDITS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-800 text-white text-[10px]">
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest">TS No</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest">Date</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-widest">Vehicle</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-widest">Freight</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-widest">Advance</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-widest">Driver Pay</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-widest">Balance at Off.</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-widest">Summary/Profit</th>
                  <th className="px-4 py-3 text-center font-black uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tripsheets.length > 0 ? (
                  tripsheets.map((ts) => {
                    const totalFreight = parseFloat(ts.total_freight) || 0
                    const advance = parseFloat(ts.advance_amount) || 0
                    const driverPay = parseFloat(ts.less_paid_driver) || 0
                    const costs = advance + driverPay
                    const profit = totalFreight - costs

                    return (
                      <tr key={ts.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-4 py-3 font-black text-blue-600">{ts.trip_number}</td>
                        <td className="px-4 py-3 text-gray-500 font-bold whitespace-nowrap">{new Date(ts.trip_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-gray-800 font-black tracking-tight">{ts.vehicle?.vehicle_number}</td>
                        <td className="px-4 py-3 text-right font-black text-blue-600">₹{totalFreight.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold text-orange-600">₹{advance.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold text-red-500">₹{driverPay.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-black text-purple-600">₹{(parseFloat(ts.balance_at_office) || 0).toLocaleString()}</td>
                        <td className={`px-4 py-3 text-right font-black ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{profit.toLocaleString()}
                          <div className="text-[8px] uppercase opacity-50 font-black tracking-tighter">
                            {profit >= 0 ? 'PROFIT' : 'LOSS'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <button
                              onClick={() => handlePrint(ts.id)}
                              className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-800 hover:text-white transition-all shadow-sm"
                              title="Print Tripsheet"
                            >
                              <Printer size={14} />
                            </button>
                            <button
                              onClick={() => handleVerify(ts.id)}
                              className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm"
                            >
                              <CheckCircle2 size={12} /> VERIFY
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center text-gray-400 font-black uppercase tracking-widest text-xs">
                      {loading ? 'Searching Records...' : 'No Pending Verifications Found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Printable Trip Sheet Overlay */}
      {printData && (
        <div className="printable-content">
          <div className="header-box border-2 border-black mb-4">
            <div className="flex justify-between items-start p-4 border-b-2 border-black">
              <div className="w-24">
                {logo ? <img src={logo} alt="Logo" className="w-full" /> : <div className="w-16 h-16 bg-gray-100 border flex items-center justify-center text-[8px]">LOGO</div>}
              </div>
              <div className="text-center flex-1 pr-6">
                <h1 className="text-2xl font-black tracking-tighter border-2 border-black px-6 py-1 inline-block uppercase">
                  {printData.dispatch_branch?.branch_name || 'TRANSPORT COMPANY'}
                </h1>
                <p className="text-[10px] font-bold mt-2 uppercase leading-tight">
                  {printData.dispatch_branch?.address || 'MAIN ROAD, TRANSPORT PLAZA'}
                  <br />
                  {printData.dispatch_branch?.city || 'CITY'} {printData.dispatch_branch?.pincode} - {printData.dispatch_branch?.state}
                  {printData.dispatch_branch?.phone && ` . MOB: ${printData.dispatch_branch.phone}`}
                </p>
              </div>
              <div className="w-32 flex flex-col items-end gap-1">
                <div className="border-2 border-black p-1 text-[10px] font-black w-full text-center">TRIP ID: {printData.id}</div>
                <div className="border border-black p-1 text-[7px] font-bold w-full text-center uppercase">A4 SIZE PRINT</div>
              </div>
            </div>
            <h2 className="text-center font-black uppercase mb-0 py-2 text-sm tracking-widest bg-gray-50 border-b-2 border-black">
              TRIPSHEET DETAILS - {printData.dispatch_branch?.branch_name || 'BRANCH'}
            </h2>

            <div className="grid grid-cols-3 text-[11px] font-bold">
              <div className="border-r border-b border-black p-1.5 flex justify-between">
                <span className="text-gray-500 uppercase text-[9px]">TS No :</span>
                <span>{printData.trip_number}</span>
              </div>
              <div className="border-r border-b border-black p-1.5 flex justify-between">
                <span className="text-gray-500 uppercase text-[9px]">Date :</span>
                <span>{new Date(printData.trip_date).toLocaleDateString('en-GB')}</span>
              </div>
              <div className="border-b border-black p-1.5 flex justify-between">
                <span className="text-gray-500 uppercase text-[9px]">Vehicle No :</span>
                <span className="font-black">{printData.vehicle?.vehicle_number || 'N/A'}</span>
              </div>

              <div className="border-r border-b border-black p-1.5 flex justify-between">
                <span className="text-gray-500 uppercase text-[9px]">Driver Name :</span>
                <span>{printData.driver?.name || 'N/A'}</span>
              </div>
              <div className="border-r border-b border-black p-1.5 flex justify-between">
                <span className="text-gray-500 uppercase text-[9px]">Owner Name :</span>
                <span>{printData.owner_name || 'N/A'}</span>
              </div>
              <div className="border-b border-black p-1.5 flex justify-between">
                <span className="text-gray-500 uppercase text-[9px]">LR NO :</span>
                <span>{printData.lr_number || '0'}</span>
              </div>

              <div className="border-r border-black p-1.5 flex justify-between">
                <span className="text-gray-500 uppercase text-[9px]">CR NO :</span>
                <span>{printData.cr_number || '0'}</span>
              </div>
              <div className="border-r border-black p-1.5 flex justify-between">
                <span className="text-gray-500 uppercase text-[9px]">Lorry Freight:</span>
                <span>₹{(parseFloat(printData.total_freight) || 0).toFixed(2)}</span>
              </div>
              <div className="p-1.5 flex justify-between">
                <span className="text-gray-500 uppercase text-[9px]">Advance :</span>
                <span>₹{parseFloat(printData.advance_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <table className="w-full border-2 border-black text-[10px] mb-4">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-black">
                <th className="border-r border-black px-1 py-2 w-12 text-center">SI-NO</th>
                <th className="border-r border-black px-2 py-2 text-left">GC NO</th>
                <th className="border-r border-black px-2 py-2 w-20 text-center">Articles</th>
                <th className="border-r border-black px-2 py-2 w-20 text-center">Weight</th>
                <th className="border-r border-black px-2 py-2 text-left">Consignor</th>
                <th className="border-r border-black px-2 py-2 text-center">Destination</th>
                <th className="px-2 py-2 text-right">TO PAY</th>
              </tr>
            </thead>
            <tbody>
              {printData.waybills?.map((gc, idx) => (
                <tr key={gc.id} className="border-b border-black">
                  <td className="border-r border-black px-1 py-1.5 text-center font-bold">{idx + 1}</td>
                  <td className="border-r border-black px-2 py-1.5 font-black">{gc.gc_number}</td>
                  <td className="border-r border-black px-2 py-1.5 text-center font-bold">
                    {gc.articles?.reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0) || 0}
                  </td>
                  <td className="border-r border-black px-2 py-1.5 text-center font-bold">
                    {gc.articles?.reduce((acc, curr) => acc + (parseFloat(curr.weight) || 0), 0) || 0}
                  </td>
                  <td className="border-r border-black px-2 py-1.5 font-medium truncate max-w-[180px]">
                    {gc.consignor?.name || '-'}
                  </td>
                  <td className="border-r border-black px-2 py-1.5 text-center font-bold text-[9px]">
                    {gc.destination?.name || '-'}
                  </td>
                  <td className="px-2 py-1.5 text-right font-black">
                    {parseFloat(gc.total_amount).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-black font-black bg-gray-100">
                <td colSpan="2" className="border-r border-black px-4 py-2 text-center uppercase tracking-widest text-[11px]">TOTAL ARTICLES</td>
                <td className="border-r border-black px-2 py-2 text-center text-[12px]">
                  {printData.waybills?.reduce((acc, gc) => acc + (gc.articles?.reduce((a, c) => a + (parseInt(c.quantity) || 0), 0) || 0), 0)}
                </td>
                <td className="border-r border-black py-2"></td>
                <td className="border-r border-black py-2"></td>
                <td className="border-r border-black px-2 py-2 text-center uppercase text-[11px]">GRAND TOTAL</td>
                <td className="px-2 py-2 text-right text-[12px]">
                  ₹{parseFloat(printData.waybills?.reduce((acc, gc) => acc + (parseFloat(gc.total_amount) || 0), 0)).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="grid grid-cols-3 border-2 border-black text-[10px] font-bold mb-4 italic">
            <div className="space-y-4 p-4 border-r border-black">
              <p className="flex justify-between font-black text-blue-800">Total Freight : <span className="border-b border-black w-24">₹{(parseFloat(printData.total_freight) || 0).toFixed(2)}</span></p>
              <p className="flex justify-between font-black text-purple-800">Total Collection : <span className="border-b border-black w-16">₹{(parseFloat(printData.total_collection) || 0).toFixed(2)}</span></p>
            </div>
            <div className="space-y-4 p-4 border-r border-black">
              <p className="flex justify-between">Advance Rs : <span className="border-b border-black w-24">₹{(parseFloat(printData.advance_amount) || 0).toFixed(2)}</span></p>
              <p className="flex justify-between text-red-700">Less paid to Driver : <span className="border-b border-black w-12">₹{(parseFloat(printData.less_paid_driver) || 0).toFixed(2)}</span></p>
            </div>
            <div className="space-y-4 p-4 bg-green-50/50">
              <p className="flex justify-between font-black text-green-800">Bal. at Office : <span className="border-b border-black w-20 font-black">₹{(parseFloat(printData.balance_at_office) || 0).toFixed(2)}</span></p>
              <p className="flex justify-between">Total KMS Run: <span className="border-b border-black w-16">{(parseFloat(printData.total_kms) || 0)} KM</span></p>
            </div>
          </div>

          <div className="border-2 border-black p-4 text-[10px] font-bold mb-6 bg-gray-50">
            <p className="uppercase text-[8px] text-gray-500 mb-2">Audit Remarks / Instructions:</p>
            <p className="font-bold min-h-[40px] uppercase text-[11px]">{printData.ack_remarks || 'VERIFIED OK'}</p>
          </div>

          <div className="flex justify-between items-end font-black text-[11px] uppercase pt-12">
            <div className="text-center">
              <div className="w-32 border-b-2 border-black mb-1"></div>
              Sign. of Driver
            </div>
            <div className="text-center flex-1 mx-12 border-2 border-black p-6 bg-gray-50/50 rounded-lg">
              <p className="mb-12 text-sm font-black text-blue-900 tracking-tighter overflow-hidden whitespace-nowrap">For {printData.dispatch_branch?.branch_name?.toUpperCase() || 'TRANSPORT COMPANY'}</p>
              <div className="w-56 border-t-2 border-dashed border-black mx-auto pt-2 font-bold text-[10px] tracking-widest text-gray-400">AUTHORIZED AUDITOR SIGNATORY</div>
            </div>
            <div className="text-center">
              <div className="w-40 border-b-2 border-black mb-1"></div>
              Office Signature & Seal
            </div>
          </div>
        </div>
      )}

      {/* Centered Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm no-print">
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
                {modal.type === 'confirm' ? 'CONFIRM VERIFY' : 'OKAY'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media screen {
          .printable-content { display: none; }
        }
        @media print {
          /* Strict Hiding of UI Elements */
          aside, header, nav, footer, .no-print, 
          [role="complementary"], [role="navigation"], [role="banner"],
          .sidebar, #sidebar, .header, #header, 
          .tabs-header, .top-nav, .logout-btn,
          .bg-gray-100.border-b.border-gray-300 { 
            display: none !important; 
            visibility: hidden !important;
            width: 0 !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }

          /* A4 Container Setup */
          body, html, #root, .flex.h-screen { 
            background: white !important; 
            height: auto !important; 
            width: 210mm !important;
            display: block !important;
            overflow: visible !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }

          .flex-1.flex.flex-col,
          .flex-1.overflow-hidden,
          .flex-1.overflow-auto,
          main, .main-content {
            display: block !important;
            overflow: visible !important;
            width: 100% !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            position: static !important;
          }

          .printable-content { 
            display: block !important; 
            width: 210mm !important;
            min-height: 297mm !important;
            background: white !important;
            margin: 0 !important;
            padding: 15mm !important;
            position: relative !important;
            box-sizing: border-box !important;
            z-index: 9999 !important;
          }

          .p-6, .p-8, .space-y-6 { padding: 0 !important; margin: 0 !important; }

          @page { 
            size: A4 portrait; 
            margin: 0mm; 
          }
        }
      `}</style>
    </div>
  )
}

export default TripSheetVerification
