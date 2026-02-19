import React, { useState } from 'react'

function ConsignorHistoryReport() {
  const [filters, setFilters] = useState({
    fromDate: '08/12/2025',
    toDate: '06/12/2025',
    branch: '',
    consignor: ''
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Consignor History Report</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">Consignor History Report</h3>
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
                <option value="">Select</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Consignor</label>
              <select value={filters.consignor} onChange={(e) => setFilters({...filters, consignor: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                <option value="">Select</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Get Details</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
            <h3 className="font-bold text-gray-800 mb-2">BOOKING DETAILS</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>BOOKING:</span><span className="bg-black text-white px-2 py-1"></span></div>
              <div className="flex justify-between"><span>DELIVERED:</span><span className="bg-black text-white px-2 py-1"></span></div>
              <div className="flex justify-between"><span>PENDING:</span><span className="bg-black text-white px-2 py-1"></span></div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
            <h3 className="font-bold text-gray-800 mb-2">FREIGHT WISE BOOKING</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>ACCOUNT:</span><span className="bg-black text-white px-2 py-1"></span></div>
              <div className="flex justify-between"><span>TOPAY:</span><span className="bg-black text-white px-2 py-1"></span></div>
              <div className="flex justify-between"><span>PAID:</span><span className="bg-black text-white px-2 py-1"></span></div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
            <h3 className="font-bold text-gray-800 mb-2">PAYMENT DETAILS</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>BOOKING:</span><span className="bg-black text-white px-2 py-1"></span></div>
              <div className="flex justify-between"><span>PAID:</span><span className="bg-black text-white px-2 py-1"></span></div>
              <div className="flex justify-between"><span>BALANCE:</span><span className="bg-black text-white px-2 py-1"></span></div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
            <h3 className="font-bold text-gray-800 mb-2">FREIGHT WISE PAYMENT</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>ACCOUNT:</span><span className="bg-black text-white px-2 py-1"></span></div>
              <div className="flex justify-between"><span>TOPAY:</span><span className="bg-black text-white px-2 py-1"></span></div>
              <div className="flex justify-between"><span>PAID:</span><span className="bg-black text-white px-2 py-1"></span></div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
          <h3 className="font-bold text-gray-800 mb-4">Payed Details View</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100 border-b-2 border-yellow-300">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Payed Date</th>
                  <th className="px-3 py-2 text-left font-semibold">WayBill Amt</th>
                  <th className="px-3 py-2 text-left font-semibold">Received Amt</th>
                  <th className="px-3 py-2 text-left font-semibold">Discount Amt</th>
                  <th className="px-3 py-2 text-left font-semibold">Account Type</th>
                  <th className="px-3 py-2 text-left font-semibold">Pay Mode</th>
                  <th className="px-3 py-2 text-left font-semibold">Booked Branch</th>
                  <th className="px-3 py-2 text-left font-semibold">Received Branch</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td colSpan="8" className="px-3 py-2 text-center text-gray-500">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsignorHistoryReport
