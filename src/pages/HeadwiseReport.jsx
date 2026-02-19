import React, { useState } from 'react'

function HeadwiseReport() {
  const [filters, setFilters] = useState({
    fromDate: '06/12/2025',
    toDate: '06/12/2025',
    headName: '',
    branch: ''
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">HeadWise Report</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">HeadWise Cash book Details</h3>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Head Name</label>
              <select value={filters.headName} onChange={(e) => setFilters({...filters, headName: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
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

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">HeadWise Cash book Graph</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Graph Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeadwiseReport
