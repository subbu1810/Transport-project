import React from 'react'
import { Download } from 'lucide-react'

function ACKReportBundle() {
  const bundles = [
    { bundleId: 'ACKB001', createdDate: '2025-01-07', reports: 5, status: 'Ready' },
    { bundleId: 'ACKB002', createdDate: '2025-01-06', reports: 8, status: 'Processing' },
    { bundleId: 'ACKB003', createdDate: '2025-01-05', reports: 3, status: 'Ready' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">ACK Report Bundles</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          <Download size={20} />
          Download Bundle
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bundle ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Reports</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {bundles.map((bundle) => (
                <tr key={bundle.bundleId} className="border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-800">{bundle.bundleId}</td>
                  <td className="px-6 py-4 text-gray-600">{bundle.createdDate}</td>
                  <td className="px-6 py-4 text-gray-600">{bundle.reports}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      bundle.status === 'Ready' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {bundle.status}
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

export default ACKReportBundle
