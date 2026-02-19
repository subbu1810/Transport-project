import React from 'react'
import { Plus } from 'lucide-react'

function TripSheet() {
  const trips = [
    { id: 'TS001', driver: 'Driver 1', vehicle: 'KA-01-AB-1234', route: 'Bangalore → Hyderabad', status: 'Completed', date: '2025-01-07' },
    { id: 'TS002', driver: 'Driver 2', vehicle: 'KA-01-CD-5678', route: 'Hyderabad → Chennai', status: 'In Progress', date: '2025-01-07' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Trip Sheets</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          <Plus size={20} />
          Create Trip Sheet
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trip ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Driver</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Vehicle</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Route</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-800">{trip.id}</td>
                  <td className="px-6 py-4 text-gray-600">{trip.driver}</td>
                  <td className="px-6 py-4 text-gray-600">{trip.vehicle}</td>
                  <td className="px-6 py-4 text-gray-600">{trip.route}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      trip.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{trip.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default TripSheet
