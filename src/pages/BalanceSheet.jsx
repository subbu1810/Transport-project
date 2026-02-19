import React, { useState } from 'react'

function BalanceSheet() {
  const [filters, setFilters] = useState({
    fromDate: '08/12/2025',
    toDate: '06/12/2025',
    branch: ''
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Balance Sheet</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">Booking Payment Balance Search</h3>
          <div className="grid grid-cols-3 gap-4">
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
                <option value="">Select</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Get Details</button>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">Booking Payment Balance Details</h3>
          <div className="bg-green-100 p-6 rounded-lg">
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div className="bg-white p-4 rounded border-2 border-green-300">
                <p className="font-semibold text-green-600">TOPAY</p>
              </div>
              <div className="bg-white p-4 rounded border-2 border-green-300"></div>
              <div className="bg-white p-4 rounded border-2 border-green-300">
                <p className="font-semibold text-green-600">PAID</p>
              </div>
              <div className="bg-white p-4 rounded border-2 border-green-300"></div>
              <div className="bg-white p-4 rounded border-2 border-green-300">
                <p className="font-semibold">ACCOUNT</p>
              </div>
              <div className="bg-white p-4 rounded border-2 border-green-300"></div>
              <div className="bg-white p-4 rounded border-2 border-green-300">
                <p className="font-semibold">TOTAL BALANCE</p>
              </div>
              <div className="bg-white p-4 rounded border-2 border-green-300"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BalanceSheet
