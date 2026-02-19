import React from 'react'
import { Plus } from 'lucide-react'

function ReceivePayment() {
  const payments = [
    { id: 'PAY001', consignor: 'ABC Traders', amount: '₹45,000', date: '2025-01-07', method: 'Bank Transfer', status: 'Received' },
    { id: 'PAY002', consignor: 'XYZ Stores', amount: '₹32,000', date: '2025-01-06', method: 'Cash', status: 'Received' },
    { id: 'PAY003', consignor: 'PQR Exports', amount: '₹28,500', date: '2025-01-05', method: 'Cheque', status: 'Pending' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Receive Payments</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          <Plus size={20} />
          Record Payment
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Payment ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Consignor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Method</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-800">{payment.id}</td>
                  <td className="px-6 py-4 text-gray-600">{payment.consignor}</td>
                  <td className="px-6 py-4 font-semibold text-green-600">{payment.amount}</td>
                  <td className="px-6 py-4 text-gray-600">{payment.date}</td>
                  <td className="px-6 py-4 text-gray-600">{payment.method}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      payment.status === 'Received' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status}
                    </span>
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

export default ReceivePayment
