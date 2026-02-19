import React from 'react'
import { Download, Filter } from 'lucide-react'

function ConsignorReport() {
  const reports = [
    { consignor: 'ABC Traders', totalShipments: 45, totalAmount: '₹2,25,000', lastShipment: '2025-01-07' },
    { consignor: 'XYZ Stores', totalShipments: 32, totalAmount: '₹1,60,000', lastShipment: '2025-01-06' },
    { consignor: 'PQR Exports', totalShipments: 28, totalAmount: '₹1,40,000', lastShipment: '2025-01-05' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Consignor Reports</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          <Download size={20} />
          Export Report
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Consignor Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total Shipments</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Last Shipment</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, index) => (
                <tr key={index} className="border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-800">{report.consignor}</td>
                  <td className="px-6 py-4 text-gray-600">{report.totalShipments}</td>
                  <td className="px-6 py-4 font-semibold text-green-600">{report.totalAmount}</td>
                  <td className="px-6 py-4 text-gray-600">{report.lastShipment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ConsignorReport
