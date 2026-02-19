import React from 'react'
import { BarChart3, Download, Filter } from 'lucide-react'

function Reports() {
  const reportTypes = [
    { name: 'Daily Report', description: 'Daily summary of all transactions', icon: BarChart3 },
    { name: 'Weekly Report', description: 'Weekly summary of all transactions', icon: BarChart3 },
    { name: 'Monthly Report', description: 'Monthly summary of all transactions', icon: BarChart3 },
    { name: 'Annual Report', description: 'Annual summary of all transactions', icon: BarChart3 },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
          <Filter size={20} />
          Filter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((report, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <report.icon size={24} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800">{report.name}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">{report.description}</p>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <Download size={18} />
              Generate
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Reports</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div>
                <p className="font-medium text-gray-800">Report #{item}</p>
                <p className="text-sm text-gray-600">Generated on 2025-01-0{7 - item}</p>
              </div>
              <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition">
                <Download size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Reports
