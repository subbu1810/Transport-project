import React, { useState } from 'react'

function ProfitAndLossReport() {
  const [filters, setFilters] = useState({
    fromDate: '06/12/2025',
    toDate: '06/12/2025'
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Profit And Loss Report</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">Profit / Loss Report Details</h3>
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

        <div className="bg-black p-4 rounded-lg text-white">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="font-semibold">CREDIT</p>
            </div>
            <div>
              <p className="font-semibold">DEBIT</p>
            </div>
            <div>
              <p className="font-semibold">PROJECTED INCOME</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <div className="flex gap-2 mb-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Profit / Loss Report Graph</button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Profit / Loss Report Details</button>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">PROFIT/LOSS DETAILS</h3>
          <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
            <p className="text-gray-500">Profit/Loss Details</p>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">CREDIT/DEBIT DETAILS</h3>
          <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
            <p className="text-gray-500">Credit/Debit Details</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfitAndLossReport
