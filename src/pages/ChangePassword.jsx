import React, { useState } from 'react'

function ChangePassword() {
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Change Password</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300 max-w-md mx-auto">
          <h3 className="font-bold text-gray-800 mb-4">Change Password</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Old Password</label>
              <input type="password" value={passwords.oldPassword} onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
              <input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <input type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>

            <div className="flex gap-2 pt-4">
              <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Submit</button>
              <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Reset</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChangePassword
