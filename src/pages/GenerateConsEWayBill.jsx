import React, { useState } from 'react'

function GenerateConsEWayBill() {
  const [tripsheetNo, setTripsheetNo] = useState('')
  const [formData, setFormData] = useState({
    vehicleNo: '',
    driverName: '',
    tripDate: '06/12/2025',
    modeOfPay: '',
    doCheckNo: '',
    doCheckDate: '',
    crNo: '',
    indentNo: '',
    bankName: '',
    alertBranch: '',
    transportName: '',
    remarks: ''
  })

  const [gcDetails, setGcDetails] = useState([
    { gcNum: '', destination: '', totalEWayBill: '', noOfArticles: '', declaredValue: '', eWayBillNo: '', articleDesc: '' }
  ])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Generate Cons E-WayBill</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-black p-3 rounded-lg flex items-center gap-4">
          <input type="text" placeholder="TRIPSHEET NO" value={tripsheetNo} onChange={(e) => setTripsheetNo(e.target.value)} className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 flex-1" />
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">GET DETAILS</button>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">Generate Consolidated E-WayBill</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle No</label>
              <input type="text" value={formData.vehicleNo} onChange={(e) => setFormData({...formData, vehicleNo: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Driver Name</label>
              <input type="text" value={formData.driverName} onChange={(e) => setFormData({...formData, driverName: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Trip Date</label>
              <input type="date" value={formData.tripDate} onChange={(e) => setFormData({...formData, tripDate: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mode of Pay</label>
              <select value={formData.modeOfPay} onChange={(e) => setFormData({...formData, modeOfPay: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                <option value="">Select</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">DD/CHEQUE NO</label>
              <input type="text" value={formData.doCheckNo} onChange={(e) => setFormData({...formData, doCheckNo: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">DD/CHEQUE Date</label>
              <input type="date" value={formData.doCheckDate} onChange={(e) => setFormData({...formData, doCheckDate: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">CR NO</label>
              <select value={formData.crNo} onChange={(e) => setFormData({...formData, crNo: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                <option value="">Select</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">INDENT NO</label>
              <input type="text" value={formData.indentNo} onChange={(e) => setFormData({...formData, indentNo: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
              <select value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                <option value="">Select</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Alert Branch</label>
              <select value={formData.alertBranch} onChange={(e) => setFormData({...formData, alertBranch: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                <option value="">Select</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Transport Name</label>
              <select value={formData.transportName} onChange={(e) => setFormData({...formData, transportName: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                <option value="">Select</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
              <input type="text" value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
          </div>

          <div className="flex gap-2">
            <button className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-semibold">GENERATE CONSOLIDATED E-WAYBILL</button>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">GC Details View</h3>
          <div className="flex gap-2 mb-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">WayBillDetails</button>
            <button className="px-4 py-2 bg-black text-white rounded-lg font-semibold">Total Bills</button>
            <button className="px-4 py-2 bg-black text-white rounded-lg font-semibold">Total E-WayBill</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-green-100 border-b-2 border-green-300">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">GC Num</th>
                  <th className="px-4 py-2 text-left font-semibold">Destination</th>
                  <th className="px-4 py-2 text-left font-semibold">No Of Articles</th>
                  <th className="px-4 py-2 text-left font-semibold">Declared Value</th>
                  <th className="px-4 py-2 text-left font-semibold">E-WayBill No</th>
                  <th className="px-4 py-2 text-left font-semibold">Article Desc</th>
                </tr>
              </thead>
              <tbody>
                {gcDetails.map((gc, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{gc.gcNum}</td>
                    <td className="px-4 py-2">{gc.destination}</td>
                    <td className="px-4 py-2">{gc.noOfArticles}</td>
                    <td className="px-4 py-2">{gc.declaredValue}</td>
                    <td className="px-4 py-2">{gc.eWayBillNo}</td>
                    <td className="px-4 py-2">{gc.articleDesc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GenerateConsEWayBill
