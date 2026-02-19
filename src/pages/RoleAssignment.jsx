import React, { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'

function RoleAssignment() {
  const [assignments, setAssignments] = useState([
    { id: 1, userName: 'Subbu', role: 'SUPERADMIN', status: 'Active' },
    { id: 2, userName: 'Naveen', role: 'SUPERADMIN', status: 'Active' },
    { id: 3, userName: 'Pratap', role: 'SUPERADMIN', status: 'Active' },
    { id: 4, userName: 'Ravi', role: 'SUPERADMIN', status: 'Active' },
    { id: 5, userName: 'Pooja', role: 'SUPERADMIN', status: 'Active' },
    { id: 6, userName: 'Gopi', role: 'BLY_MAIN_ADMIN', status: 'Active' },
    { id: 7, userName: 'Manoj', role: 'BILL_USER', status: 'Active' },
    { id: 8, userName: 'Basavaraj BS', role: 'BILL_USER', status: 'Active' },
    { id: 9, userName: 'Yallappa', role: 'BILL_USER', status: 'Active' },
    { id: 10, userName: 'GVT', role: 'BILL_USER', status: 'Active' },
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Role Assignment</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          <Plus size={20} />
          Assign Role
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">User Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-800">{assignment.userName}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {assignment.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {assignment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition">
                      <Edit2 size={18} />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition">
                      <Trash2 size={18} />
                    </button>
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

export default RoleAssignment
