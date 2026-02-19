import React, { useState } from 'react'

function TripSheetPayment() {
  const [filters, setFilters] = useState({
    branch: '',
    transporterName: ''
  })

  const [tripsheets] = useState([
    { tripsheetNo: '', dispatchDate: '', vehicleNo: '', today: '', account: '', paid: '', total: '', advance: '', freight: '', balance: '', profitLoss: '' }
  ])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Trip Sheet Payment</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">TripSheet Payment</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
              <select value={filters.branch} onChange={(e) => setFilters({...filters, branch: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                <option value="">Select Branch</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Transporter Name</label>
              <select value={filters.transporterName} onChange={(e) => setFilters({...filters, transporterName: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                <option value="">Select Transporter</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold">Get Details</button>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
          <h3 className="font-bold text-gray-800 mb-4">TripSheet Details View</h3>
          <div className="flex gap-2 mb-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">TripSheet Print</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100 border-b-2 border-yellow-300">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Tripsheet No</th>
                  <th className="px-4 py-2 text-left font-semibold">Dispatch Date</th>
                  <th className="px-4 py-2 text-left font-semibold">Vehicle No</th>
                  <th className="px-4 py-2 text-left font-semibold">TODAY</th>
                  <th className="px-4 py-2 text-left font-semibold">ACCOUNT</th>
                  <th className="px-4 py-2 text-left font-semibold">PAID</th>
                  <th className="px-4 py-2 text-left font-semibold">TOTAL</th>
                  <th className="px-4 py-2 text-left font-semibold">ADVANCE</th>
                  <th className="px-4 py-2 text-left font-semibold">FREIGHT</th>
                  <th className="px-4 py-2 text-left font-semibold">BALANCE</th>
                  <th className="px-4 py-2 text-left font-semibold">PROFIT/LOSS</th>
                </tr>
              </thead>
              <tbody>
                {tripsheets.map((ts, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{ts.tripsheetNo}</td>
                    <td className="px-4 py-2">{ts.dispatchDate}</td>
                    <td className="px-4 py-2">{ts.vehicleNo}</td>
                    <td className="px-4 py-2">{ts.today}</td>
                    <td className="px-4 py-2">{ts.account}</td>
                    <td className="px-4 py-2">{ts.paid}</td>
                    <td className="px-4 py-2">{ts.total}</td>
                    <td className="px-4 py-2">{ts.advance}</td>
                    <td className="px-4 py-2">{ts.freight}</td>
                    <td className="px-4 py-2">{ts.balance}</td>
                    <td className="px-4 py-2">{ts.profitLoss}</td>
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

export default TripSheetPayment
