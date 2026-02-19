import React, { useState } from 'react'

function WaybillTrack() {
  const [gcNumber, setGcNumber] = useState('')

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Waybill Track</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300 flex items-center gap-4">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">BY GC-NUM</button>
          <input type="text" placeholder="ENTER GCNUMBER TO SEARCH" value={gcNumber} onChange={(e) => setGcNumber(e.target.value)} className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg bg-black text-white" />
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">CONSIGNOR/OUTWARD DETAILS</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-green-100 border-b-2 border-green-300">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Consignor Agt Id</th>
                  <th className="px-4 py-2 text-left font-semibold">Consignor Agt Date</th>
                  <th className="px-4 py-2 text-left font-semibold">Consignor Agt Status</th>
                  <th className="px-4 py-2 text-left font-semibold">Agt Remarks</th>
                  <th className="px-4 py-2 text-left font-semibold">Delivered</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">INWARD Waybill Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Consignee</label>
              <input type="text" className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">From</label>
              <input type="text" className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Consignor</label>
              <input type="text" className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">To</label>
              <input type="text" className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
              <input type="text" className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Article Desc</label>
              <input type="text" className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
          <h3 className="font-bold text-gray-800 mb-4">Article Info</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100 border-b-2 border-yellow-300">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Article Type</th>
                  <th className="px-3 py-2 text-left font-semibold">No Of Article</th>
                  <th className="px-3 py-2 text-left font-semibold">DD</th>
                  <th className="px-3 py-2 text-left font-semibold">Total</th>
                  <th className="px-3 py-2 text-left font-semibold">Rate</th>
                  <th className="px-3 py-2 text-left font-semibold">HANDLING</th>
                  <th className="px-3 py-2 text-left font-semibold">Total</th>
                  <th className="px-3 py-2 text-left font-semibold">Freight</th>
                  <th className="px-3 py-2 text-left font-semibold">Ack Wt</th>
                  <th className="px-3 py-2 text-left font-semibold">Charged Wt</th>
                  <th className="px-3 py-2 text-left font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td colSpan="11" className="px-3 py-2 text-center text-gray-500">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WaybillTrack
