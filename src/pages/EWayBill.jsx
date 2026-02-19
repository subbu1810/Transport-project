import React from 'react'
import { Plus } from 'lucide-react'

function EWayBill() {
  const eWayBills = [
    { id: 'EWB001', billNumber: '12345', supplier: 'ABC Traders', amount: '₹50,000', status: 'Generated', date: '2025-01-07' },
    { id: 'EWB002', billNumber: '12346', supplier: 'XYZ Stores', amount: '₹35,000', status: 'Pending', date: '2025-01-06' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">E-Way Bills</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          <Plus size={20} />
          Generate E-Way Bill
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">E-Way Bill ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bill Number</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Supplier</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {eWayBills.map((bill) => (
                <tr key={bill.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-800">{bill.id}</td>
                  <td className="px-6 py-4 text-gray-600">{bill.billNumber}</td>
                  <td className="px-6 py-4 text-gray-600">{bill.supplier}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{bill.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      bill.status === 'Generated' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{bill.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default EWayBill
