import React, { useState } from 'react'

function TripSheetAlert() {
  const [filters, setFilters] = useState({
    fromDate: '08/12/2025',
    toDate: '06/12/2025',
    branch: 'SINDHANUIR'
  })

  const [alerts] = useState([
    { tripsheetNo: 783, dispatchDate: '06/12/2025', vehicleNo: 'KA635132', driverName: 'ANWAR BASHA - 96 - GURU SANGAYA', ownerName: '', advance: 0, tripRemarks: 'GVT TO SON', raisedBranch: 'GANGAVATI', raisedDateTime: '06/12/2025 08:26:1' }
  ])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Trip Sheet Alert</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">Search TripSheet Alert Details</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
              <input type="date" value={filters.fromDate} onChange={(e) => setFilters({...filters, fromDate: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
              <input type="date" value={filters.toDate} onChange={(e) => setFilters({...filters, toDate: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
              <select value={filters.branch} onChange={(e) => setFilters({...filters, branch: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                <option>SINDHANUIR</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold">Get Details</button>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
          <h3 className="font-bold text-gray-800 mb-4">TripSheet Alert Details View</h3>
          <div className="flex gap-2 mb-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">View/Print</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100 border-b-2 border-yellow-300">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Tripsheet No</th>
                  <th className="px-4 py-2 text-left font-semibold">Dispatch Date</th>
                  <th className="px-4 py-2 text-left font-semibold">Vehicle No</th>
                  <th className="px-4 py-2 text-left font-semibold">Driver Name</th>
                  <th className="px-4 py-2 text-left font-semibold">Owner Name</th>
                  <th className="px-4 py-2 text-left font-semibold">Advance</th>
                  <th className="px-4 py-2 text-left font-semibold">Trip Remarks</th>
                  <th className="px-4 py-2 text-left font-semibold">Raised Branch</th>
                  <th className="px-4 py-2 text-left font-semibold">Raised Date/Time</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{alert.tripsheetNo}</td>
                    <td className="px-4 py-2">{alert.dispatchDate}</td>
                    <td className="px-4 py-2">{alert.vehicleNo}</td>
                    <td className="px-4 py-2">{alert.driverName}</td>
                    <td className="px-4 py-2">{alert.ownerName}</td>
                    <td className="px-4 py-2">{alert.advance}</td>
                    <td className="px-4 py-2">{alert.tripRemarks}</td>
                    <td className="px-4 py-2">{alert.raisedBranch}</td>
                    <td className="px-4 py-2">{alert.raisedDateTime}</td>
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

export default TripSheetAlert
