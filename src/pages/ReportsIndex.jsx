import React, { useState } from 'react'

// Generic Report Component
function GenericReport({ title, fields = [], tableColumns = [], hasGraph = false }) {
  const [filters, setFilters] = useState({})

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">{title}</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {fields.length > 0 && (
          <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
            <h3 className="font-bold text-gray-800 mb-4">Search {title} Details</h3>
            <div className={`grid grid-cols-${Math.min(fields.length, 4)} gap-4`}>
              {fields.map((field, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{field.label}</label>
                  {field.type === 'select' ? (
                    <select className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                      <option value="">Select</option>
                    </select>
                  ) : (
                    <input type={field.type || 'text'} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Get Details</button>
            </div>
          </div>
        )}

        {hasGraph && (
          <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
            <h3 className="font-bold text-gray-800 mb-4">{title} Graph</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Graph Placeholder</p>
            </div>
          </div>
        )}

        {tableColumns.length > 0 && (
          <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
            <h3 className="font-bold text-gray-800 mb-4">{title} Details View</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-yellow-100 border-b-2 border-yellow-300">
                  <tr>
                    {tableColumns.map((col, idx) => (
                      <th key={idx} className="px-3 py-2 text-left font-semibold">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    {tableColumns.map((col, idx) => (
                      <td key={idx} className="px-3 py-2"></td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GenericReport
