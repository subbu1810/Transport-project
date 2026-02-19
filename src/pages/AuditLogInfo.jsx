import React, { useState } from 'react'

function AuditLogInfo() {
  const [filters, setFilters] = useState({
    fromDate: '08/12/2025',
    toDate: '06/12/2025'
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Audit Log Info</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">Audit Log Details Search</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
              <input type="date" value={filters.fromDate} onChange={(e) => setFilters({...filters, fromDate: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
              <input type="date" value={filters.toDate} onChange={(e) => setFilters({...filters, toDate: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div className="flex items-end">
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Get Details</button>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
          <h3 className="font-bold text-gray-800 mb-4">Audit Log Details View</h3>
          <div className="flex gap-2 mb-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">WayBillDetails</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100 border-b-2 border-yellow-300">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">GC Num</th>
                  <th className="px-3 py-2 text-left font-semibold">Old Value</th>
                  <th className="px-3 py-2 text-left font-semibold">New Value</th>
                  <th className="px-3 py-2 text-left font-semibold">Date Time</th>
                  <th className="px-3 py-2 text-left font-semibold">Changed By</th>
                  <th className="px-3 py-2 text-left font-semibold">Branch</th>
                  <th className="px-3 py-2 text-left font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td colSpan="7" className="px-3 py-2 text-center text-gray-500">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuditLogInfo
