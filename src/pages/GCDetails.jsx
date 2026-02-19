import React, { useState } from 'react'

function GCDetails() {
  const [gcDetails, setGcDetails] = useState([
    { id: 1, consignor: '', gcFrom: '', gcTo: '', running: '', gcStatus: '', remarks: '', status: 'Active' },
  ])

  const [formData, setFormData] = useState({
    consignor: '',
    gcFrom: '',
    gcTo: '',
    gcRunningNo: '',
    ccStatus: '',
    remarks: '',
    status: 'Active'
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">GC Details</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
          <h3 className="font-bold text-gray-800 mb-4">GC Details Entry</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Consignor</label>
              <select
                value={formData.consignor}
                onChange={(e) => setFormData({...formData, consignor: e.target.value})}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              >
                <option value="">Select Consignor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">GC From</label>
              <input
                type="text"
                value={formData.gcFrom}
                onChange={(e) => setFormData({...formData, gcFrom: e.target.value})}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">GC To</label>
              <input
                type="text"
                value={formData.gcTo}
                onChange={(e) => setFormData({...formData, gcTo: e.target.value})}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">GC Running No</label>
              <input
                type="text"
                value={formData.gcRunningNo}
                onChange={(e) => setFormData({...formData, gcRunningNo: e.target.value})}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">CC Status</label>
              <select
                value={formData.ccStatus}
                onChange={(e) => setFormData({...formData, ccStatus: e.target.value})}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              >
                <option value="">Select Status</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
              <input
                type="text"
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold">
              Save
            </button>
            <button className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-semibold">
              Reset
            </button>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">GC Details View</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-200 border-b-2 border-gray-400">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Consignor</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">GC From</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">GC To</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Running</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">GC Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Remarks</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Status</th>
                </tr>
              </thead>
              <tbody>
                {gcDetails.map((gc) => (
                  <tr key={gc.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-600">{gc.consignor}</td>
                    <td className="px-6 py-4 text-gray-600">{gc.gcFrom}</td>
                    <td className="px-6 py-4 text-gray-600">{gc.gcTo}</td>
                    <td className="px-6 py-4 text-gray-600">{gc.running}</td>
                    <td className="px-6 py-4 text-gray-600">{gc.gcStatus}</td>
                    <td className="px-6 py-4 text-gray-600">{gc.remarks}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {gc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GCDetails
