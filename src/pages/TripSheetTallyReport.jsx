import React, { useState } from 'react'

function TripSheetTallyReport() {
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    status: '',
    branch: ''
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Trip Sheet Tally Report</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">Search TripSheet Tally Report Details</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
              <input type="date" value={filters.fromDate} onChange={(e) => setFilters({...filters, fromDate: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
              <input type="date" value={filters.toDate} onChange={(e) => setFilters({...filters, toDate: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                <option value="">Select</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
              <select value={filters.branch} onChange={(e) => setFilters({...filters, branch: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                <option value="">Select</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Get Details</button>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
          <h3 className="font-bold text-gray-800 mb-4">TripSheet Tally Report Details View</h3>
          <div className="flex gap-2 mb-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Print</button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Admin View</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100 border-b-2 border-yellow-300">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Tripsheet No</th>
                  <th className="px-3 py-2 text-left font-semibold">Dispatch Date</th>
                  <th className="px-3 py-2 text-left font-semibold">Vehicle No</th>
                  <th className="px-3 py-2 text-left font-semibold">Driver Name</th>
                  <th className="px-3 py-2 text-left font-semibold">Owner Name</th>
                  <th className="px-3 py-2 text-left font-semibold">Advance</th>
                  <th className="px-3 py-2 text-left font-semibold">LR NO</th>
                  <th className="px-3 py-2 text-left font-semibold">CR NO</th>
                  <th className="px-3 py-2 text-left font-semibold">INDENT NO</th>
                  <th className="px-3 py-2 text-left font-semibold">Trip Remarks</th>
                  <th className="px-3 py-2 text-left font-semibold">Status</th>
                  <th className="px-3 py-2 text-left font-semibold">Ack Date</th>
                  <th className="px-3 py-2 text-left font-semibold">Ack Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td colSpan="13" className="px-3 py-2 text-center text-gray-500">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TripSheetTallyReport
