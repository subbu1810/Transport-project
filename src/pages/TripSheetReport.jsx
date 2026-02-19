import React, { useState, useEffect } from 'react'
import { Search, Printer, FileText, Filter, Calendar, MapPin, Loader2, RefreshCcw, CheckCircle2, Circle } from 'lucide-react'
import axios from 'axios'

const API_URL = 'http://localhost:8000/api/v1'

function TripSheetReport() {
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    branch_id: ''
  })

  const [tripsheets, setTripsheets] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTripId, setSelectedTripId] = useState(null)
  const [printData, setPrintData] = useState(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [logo, setLogo] = useState(null)

  useEffect(() => {
    fetchBranches()
    fetchLogo()
  }, [])

  const fetchLogo = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings/logo_path`)
      if (response.data.success && response.data.data) {
        setLogo(`http://localhost:8000/storage/${response.data.data}`)
      }
    } catch (err) {
      console.error('Error fetching logo:', err)
    }
  }

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_URL}/branches`)
      const data = await response.json()
      if (data.success) {
        setBranches(data.data)
      }
    } catch (err) {
      console.error('Error fetching branches:', err)
    }
  }

  const fetchReportData = async () => {
    try {
      setLoading(true)
      setError('')
      setSelectedTripId(null)

      const queryParams = new URLSearchParams({
        from_date: filters.fromDate,
        to_date: filters.toDate,
      })
      if (filters.branch_id) queryParams.append('branch_id', filters.branch_id)

      const response = await fetch(`${API_URL}/trip-sheets?${queryParams.toString()}`)
      const data = await response.json()

      if (data.success) {
        setTripsheets(data.data)
      } else {
        setError(data.message || 'Failed to fetch report data')
      }
    } catch (err) {
      setError('Error connecting to server')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = async () => {
    if (!selectedTripId) {
      alert('Please select a trip sheet to print')
      return
    }

    try {
      setIsPrinting(true)
      const response = await fetch(`${API_URL}/trip-sheets/${selectedTripId}`)
      const data = await response.json()
      if (data.success) {
        setPrintData(data.data)
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

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen relative">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 no-print">
        <div>
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <div className="p-1.5 bg-green-600 rounded-lg text-white">
              <FileText size={20} />
            </div>
            TRIP SHEET REPORT
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5 uppercase tracking-wider">Select and print detailed trip sheets</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            disabled={!selectedTripId || isPrinting}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-gray-200 text-sm"
          >
            {isPrinting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
            PRINT SELECTED
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 no-print">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-green-600" />
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Report Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              <Calendar size={10} /> From Date
            </label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-green-500 focus:bg-white outline-none font-bold text-gray-700 transition-all text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              <Calendar size={10} /> To Date
            </label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-green-500 focus:bg-white outline-none font-bold text-gray-700 transition-all text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              <MapPin size={10} /> Dispatch Branch
            </label>
            <select
              value={filters.branch_id}
              onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg focus:border-green-500 focus:bg-white outline-none font-bold text-gray-700 transition-all appearance-none text-sm"
            >
              <option value="">ALL BRANCHES</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.branch_name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchReportData}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-100 disabled:opacity-50 text-sm"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><Search size={16} /> GET DETAILS</>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden no-print">
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            TripSheet Records
          </h3>
          <span className="text-[10px] font-black text-gray-400 bg-gray-200 px-2.5 py-1 rounded-full">{tripsheets.length} RECORDS FOUND</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-800 text-white text-[10px]">
                <th className="px-4 py-3 text-center">SEL</th>
                <th className="px-4 py-3 text-left font-black uppercase tracking-widest">TripSheet No</th>
                <th className="px-4 py-3 text-left font-black uppercase tracking-widest">Dispatch Date</th>
                <th className="px-4 py-3 text-left font-black uppercase tracking-widest">Vehicle No</th>
                <th className="px-4 py-3 text-left font-black uppercase tracking-widest">Driver Name</th>
                <th className="px-4 py-3 text-left font-black uppercase tracking-widest">Owner Name</th>
                <th className="px-4 py-3 text-right font-black uppercase tracking-widest">Advance</th>
                <th className="px-4 py-3 text-right font-black uppercase tracking-widest">Freight</th>
                <th className="px-4 py-3 text-right font-black uppercase tracking-widest">Collection</th>
                <th className="px-4 py-3 text-right font-black uppercase tracking-widest">Less Paid</th>
                <th className="px-4 py-3 text-right font-black uppercase tracking-widest">Balance</th>
                <th className="px-4 py-3 text-center font-black uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-left font-black uppercase tracking-widest">Ack Date</th>
                <th className="px-4 py-3 text-left font-black uppercase tracking-widest">Ack Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tripsheets.length > 0 ? (
                tripsheets.map((ts) => (
                  <tr
                    key={ts.id}
                    className={`hover:bg-green-50/30 transition-colors cursor-pointer ${selectedTripId === ts.id ? 'bg-green-50' : ''}`}
                    onClick={() => setSelectedTripId(ts.id)}
                  >
                    <td className="px-4 py-3 text-center">
                      {selectedTripId === ts.id ?
                        <CheckCircle2 size={14} className="text-green-600 mx-auto" /> :
                        <Circle size={14} className="text-gray-300 mx-auto" />
                      }
                    </td>
                    <td className="px-4 py-3 font-black text-blue-600">{ts.trip_number}</td>
                    <td className="px-4 py-3 text-gray-600 font-bold whitespace-nowrap">{new Date(ts.trip_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-800 font-black tracking-tight">{ts.vehicle?.vehicle_number || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600 font-bold">{ts.driver?.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600 font-bold">{ts.owner_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-black">₹{parseFloat(ts.advance_amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-black text-blue-600">₹{(ts.total_freight || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-black text-purple-600">₹{(ts.total_collection || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-black text-red-500">₹{(ts.less_paid_driver || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-black text-green-700">₹{(ts.balance_at_office || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${ts.status === 'DELIVERED' || ts.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        ts.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {ts.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-bold text-[10px]">
                      {ts.ack_date ? new Date(ts.ack_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-medium text-[10px] truncate max-w-[150px]">
                      {ts.ack_remarks || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="px-4 py-12 text-center text-gray-400 font-black uppercase tracking-widest text-xs">
                    No Data Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                <span>0.00</span>
              </div>
              <div className="p-1.5 flex justify-between">
                <span className="text-gray-500 uppercase text-[9px]">Advance :</span>
                <span>₹{parseFloat(printData.advance_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 border-2 border-black text-[11px] font-bold mb-4 bg-gray-50/50">
            <div className="border-r border-black p-1.5 flex justify-between">
              <span className="text-gray-500 uppercase text-[9px]">INDENT NO :</span>
              <span>{printData.indent_number || '0'}</span>
            </div>
            <div className="border-r border-black p-1.5 flex justify-between">
              <span className="text-gray-500 uppercase text-[9px]">Bunk Name :</span>
              <span>-</span>
            </div>
            <div className="p-1.5 flex justify-between">
              <span className="text-gray-500 uppercase text-[9px]">Fuel Qty :</span>
              <span>0 Liter</span>
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
              <p className="flex justify-between">Opening KM : <span className="border-b border-black w-24"></span></p>
              <p className="flex justify-between">Freight Rs : <span className="border-b border-black w-24"></span></p>
              <p className="flex justify-between font-black">Total Collection : <span className="border-b border-black w-16"></span></p>
            </div>
            <div className="space-y-4 p-4 border-r border-black">
              <p className="flex justify-between">Closing KM : <span className="border-b border-black w-24"></span></p>
              <p className="flex justify-between">Advance Rs : <span className="border-b border-black w-24"></span></p>
              <p className="flex justify-between">Less paid to Driver : <span className="border-b border-black w-12"></span></p>
            </div>
            <div className="space-y-4 p-4">
              <p className="flex justify-between">Total KMS : <span className="border-b border-black w-24"></span></p>
              <p className="flex justify-between">Balance Rs : <span className="border-b border-black w-24"></span></p>
              <p className="flex justify-between font-black">Bal. at Office / Agency : <span className="border-b border-black w-12"></span></p>
            </div>
          </div>

          <div className="border-2 border-black p-4 text-[10px] font-bold mb-6 bg-gray-50">
            <p className="uppercase text-[8px] text-gray-500 mb-2">Remarks / Instructions:</p>
            <p className="font-bold min-h-[40px]">{printData.trip_remarks || 'N/A'}</p>
          </div>

          <div className="text-[10px] font-medium leading-relaxed mb-16 italic border-b border-gray-300 pb-4">
            <p className="mb-2">Note: 1. Octroi Superintendent, Bellary Municipal Corporation. Kindly prepare each transit pass in the name of Lorry Owner. There is no responsibility on our Transport Company, regarding the same. Delivery condition within _________ days at destination as per agreement.</p>
            <p className="mb-2">2. Received the above goods in sound & in good condition. I & My owner are responsible for the delivery at proper destination.</p>
            <p>3. Transporter not responsible for unloading if not done on Sunday and other Holiday.</p>
          </div>

          <div className="flex justify-between items-end font-black text-[11px] uppercase pt-12">
            <div className="text-center">
              <div className="w-32 border-b-2 border-black mb-1"></div>
              Sign. of Driver
            </div>
            <div className="text-center flex-1 mx-12 border-2 border-black p-6 bg-gray-50/50 rounded-lg">
              <p className="mb-12 text-sm font-black">For {printData.dispatch_branch?.branch_name?.toUpperCase() || 'TRANSPORT COMPANY'}</p>
              <div className="w-56 border-t-2 border-dashed border-black mx-auto pt-2 font-bold text-[10px] tracking-widest text-gray-400">AUTHORIZED SIGNATORY</div>
            </div>
            <div className="text-center">
              <div className="w-40 border-b-2 border-black mb-1"></div>
              Office Signature & Seal
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

export default TripSheetReport
