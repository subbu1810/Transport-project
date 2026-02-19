import React, { useState } from 'react'

function UnloadReportPrepare() {
  const [formData, setFormData] = useState({
    fromBranch: '',
    tripsheet: '',
    unloadingDate: '05/12/2025',
    totalArticles: '',
    totalWeight: '',
    remarks: '',
    vehicleNo: '',
    driverName: '',
    tripDate: '',
    hamaliPaid: '',
    unloadedBy: '',
    advanceAmt: ''
  })

  const [gcDetails] = useState([
    { billDate: '', gcNum: '', destination: '', noOfArticles: '', articleDesc: '', account: '', paid: '', toPay: '' }
  ])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Unload Report Prepare</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">Unloading Report Prepare</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">From Branch</label>
              <select value={formData.fromBranch} onChange={(e) => setFormData({...formData, fromBranch: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                <option value="">Select</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tripsheet</label>
              <select value={formData.tripsheet} onChange={(e) => setFormData({...formData, tripsheet: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                <option value="">Select</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Unloading Date</label>
              <input type="date" value={formData.unloadingDate} onChange={(e) => setFormData({...formData, unloadingDate: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Total Articles</label>
              <input type="text" value={formData.totalArticles} onChange={(e) => setFormData({...formData, totalArticles: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Total Weight</label>
              <input type="text" value={formData.totalWeight} onChange={(e) => setFormData({...formData, totalWeight: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hamali Paid</label>
              <input type="text" value={formData.hamaliPaid} onChange={(e) => setFormData({...formData, hamaliPaid: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
              <input type="text" value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle No</label>
              <input type="text" value={formData.vehicleNo} onChange={(e) => setFormData({...formData, vehicleNo: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-black text-white" disabled />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Unloaded By</label>
              <input type="text" value={formData.unloadedBy} onChange={(e) => setFormData({...formData, unloadedBy: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Driver Name</label>
              <input type="text" value={formData.driverName} onChange={(e) => setFormData({...formData, driverName: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-black text-white" disabled />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Trip Date</label>
              <input type="text" value={formData.tripDate} onChange={(e) => setFormData({...formData, tripDate: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-black text-white" disabled />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Advance Amt</label>
              <input type="text" value={formData.advanceAmt} onChange={(e) => setFormData({...formData, advanceAmt: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
          </div>

          <div className="flex gap-2">
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Generate Unload ID</button>
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Reset</button>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
          <h3 className="font-bold text-gray-800 mb-4">GC Details View</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100 border-b-2 border-yellow-300">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Bill Date</th>
                  <th className="px-4 py-2 text-left font-semibold">GC Num</th>
                  <th className="px-4 py-2 text-left font-semibold">Destination</th>
                  <th className="px-4 py-2 text-left font-semibold">No Of Articles</th>
                  <th className="px-4 py-2 text-left font-semibold">Article Desc</th>
                  <th className="px-4 py-2 text-left font-semibold">ACCOUNT</th>
                  <th className="px-4 py-2 text-left font-semibold">PAID</th>
                  <th className="px-4 py-2 text-left font-semibold">TO PAY</th>
                </tr>
              </thead>
              <tbody>
                {gcDetails.map((gc, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{gc.billDate}</td>
                    <td className="px-4 py-2">{gc.gcNum}</td>
                    <td className="px-4 py-2">{gc.destination}</td>
                    <td className="px-4 py-2">{gc.noOfArticles}</td>
                    <td className="px-4 py-2">{gc.articleDesc}</td>
                    <td className="px-4 py-2">{gc.account}</td>
                    <td className="px-4 py-2">{gc.paid}</td>
                    <td className="px-4 py-2">{gc.toPay}</td>
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

export default UnloadReportPrepare
