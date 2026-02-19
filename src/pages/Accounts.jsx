import React from 'react'
import { Plus, Filter } from 'lucide-react'

function Accounts() {
  const accounts = [
    { id: 1, name: 'ABC Traders', balance: '₹45,000', status: 'Active', lastTransaction: '2025-01-07' },
    { id: 2, name: 'XYZ Stores', balance: '₹-12,500', status: 'Pending', lastTransaction: '2025-01-06' },
    { id: 3, name: 'PQR Exports', balance: '₹78,900', status: 'Active', lastTransaction: '2025-01-05' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Accounts</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          <Plus size={20} />
          New Account
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6 flex gap-4">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <Filter size={18} />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Account Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Balance</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Last Transaction</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-800">{account.name}</td>
                  <td className={`px-6 py-4 font-semibold ${parseFloat(account.balance.replace(/[₹,]/g, '')) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {account.balance}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      account.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {account.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{account.lastTransaction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Accounts
