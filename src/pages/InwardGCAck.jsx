import React, { useState } from 'react'

function InwardGCAck() {
  const [gcNumber, setGcNumber] = useState('')

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Inward GC Ack</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-100 p-4 rounded-lg border-2 border-green-300">
          <div className="flex items-center gap-3">
            <select className="px-3 py-2 border-2 border-green-600 rounded-lg focus:outline-none font-semibold">
              <option>BY GC-NUM</option>
            </select>
            <input type="text" placeholder="ENTER GCNUMBER TO ACK" value={gcNumber} onChange={(e) => setGcNumber(e.target.value)} className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">Acknowledgement Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-green-100 border-b-2 border-green-300">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Branch</th>
                  <th className="px-4 py-2 text-left font-semibold">Booking/Inward Date</th>
                  <th className="px-4 py-2 text-left font-semibold">Dispatch Date</th>
                  <th className="px-4 py-2 text-left font-semibold">Delivery Status</th>
                  <th className="px-4 py-2 text-left font-semibold">Delivery Date</th>
                  <th className="px-4 py-2 text-left font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td colSpan="6" className="px-4 py-2 text-center text-gray-500">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
          <h3 className="font-bold text-gray-800 mb-4">WayBill Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100 border-b-2 border-yellow-300">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Bill Date</th>
                  <th className="px-4 py-2 text-left font-semibold">From</th>
                  <th className="px-4 py-2 text-left font-semibold">To</th>
                  <th className="px-4 py-2 text-left font-semibold">Consignor</th>
                  <th className="px-4 py-2 text-left font-semibold">Consignee</th>
                  <th className="px-4 py-2 text-left font-semibold">Address</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td colSpan="6" className="px-4 py-2 text-center text-gray-500">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">Article Info</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-green-100 border-b-2 border-green-300">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Article Type</th>
                  <th className="px-4 py-2 text-left font-semibold">No Of Article</th>
                  <th className="px-4 py-2 text-left font-semibold">Rate</th>
                  <th className="px-4 py-2 text-left font-semibold">DD</th>
                  <th className="px-4 py-2 text-left font-semibold">Total</th>
                  <th className="px-4 py-2 text-left font-semibold">Rate</th>
                  <th className="px-4 py-2 text-left font-semibold">HANDLING Total</th>
                  <th className="px-4 py-2 text-left font-semibold">Freight</th>
                  <th className="px-4 py-2 text-left font-semibold">Act Wt</th>
                  <th className="px-4 py-2 text-left font-semibold">Charged Wt</th>
                  <th className="px-4 py-2 text-left font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td colSpan="11" className="px-4 py-2 text-center text-gray-500">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200 grid grid-cols-5 gap-4">
          <div><label className="text-sm font-semibold">Total Articles</label><input type="text" className="w-full px-2 py-1 border border-gray-300 rounded" /></div>
          <div><label className="text-sm font-semibold">Freight</label><input type="text" className="w-full px-2 py-1 border border-gray-300 rounded" /></div>
          <div><label className="text-sm font-semibold">DD</label><input type="text" className="w-full px-2 py-1 border border-gray-300 rounded" /></div>
          <div><label className="text-sm font-semibold">Handling</label><input type="text" className="w-full px-2 py-1 border border-gray-300 rounded" /></div>
          <div><label className="text-sm font-semibold">Stationary</label><input type="text" className="w-full px-2 py-1 border border-gray-300 rounded" /></div>
        </div>
      </div>
    </div>
  )
}

export default InwardGCAck
