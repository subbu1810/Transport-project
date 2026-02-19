import React, { useState } from 'react'
import { Plus, Eye, Download, Trash2 } from 'lucide-react'

function WayBill() {
  const [wayBills, setWayBills] = useState([
    { id: 'WB001', consignor: 'ABC Traders', consignee: 'XYZ Stores', amount: '₹5,000', status: 'Delivered', date: '2025-01-05' },
    { id: 'WB002', consignor: 'PQR Exports', consignee: 'LMN Imports', amount: '₹8,500', status: 'In Transit', date: '2025-01-06' },
    { id: 'WB003', consignor: 'DEF Industries', consignee: 'GHI Retail', amount: '₹3,200', status: 'Pending', date: '2025-01-07' },
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Way Bills</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          <Plus size={20} />
          Create Way Bill
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Way Bill ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Consignor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Consignee</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {wayBills.map((bill) => (
                <tr key={bill.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-800">{bill.id}</td>
                  <td className="px-6 py-4 text-gray-600">{bill.consignor}</td>
                  <td className="px-6 py-4 text-gray-600">{bill.consignee}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{bill.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      bill.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                      bill.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{bill.date}</td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition">
                      <Eye size={18} />
                    </button>
                    <button className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition">
                      <Download size={18} />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default WayBill
