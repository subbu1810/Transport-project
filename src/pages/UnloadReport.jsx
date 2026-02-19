import React from 'react'
import { Download } from 'lucide-react'

function UnloadReport() {
  const reports = [
    { date: '2025-01-07', location: 'Bangalore', itemsUnloaded: 150, status: 'Completed' },
    { date: '2025-01-06', location: 'Hyderabad', itemsUnloaded: 120, status: 'Completed' },
    { date: '2025-01-05', location: 'Chennai', itemsUnloaded: 95, status: 'Completed' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Unload Reports</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          <Download size={20} />
          Export Report
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Items Unloaded</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, index) => (
                <tr key={index} className="border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-gray-600">{report.date}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{report.location}</td>
                  <td className="px-6 py-4 text-gray-600">{report.itemsUnloaded}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {report.status}
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

export default UnloadReport
