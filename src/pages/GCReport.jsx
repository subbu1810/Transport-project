import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Calendar, Building, Search, FileText, Package } from 'lucide-react'

const API_BASE_URL = 'http://localhost:8000/api/v1'

function GCReport() {
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    branchId: ''
  })
  const [branches, setBranches] = useState([])
  const [waybills, setWaybills] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setCurrentUser(user)

      // If admin, pre-set the branch filter and lock it
      if (user.role !== 'superadmin' && user.branch_id) {
        setFilters(prev => ({
          ...prev,
          branchId: user.branch_id,
          fromDate: new Date().toISOString().split('T')[0],
          toDate: new Date().toISOString().split('T')[0]
        }))
      } else {
        fetchBranches()
        const today = new Date().toISOString().split('T')[0]
        setFilters(prev => ({ ...prev, fromDate: today, toDate: today }))
      }
    }
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/branches`)
      if (response.data.success) {
        setBranches(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching branches:', err)
    }
  }


  const fetchWaybills = async () => {
    try {
      setLoading(true)
      setError('')

      const params = {}
      if (filters.fromDate) params.from_date = filters.fromDate
      if (filters.toDate) params.to_date = filters.toDate
      if (filters.branchId) params.branch_id = filters.branchId

      const response = await axios.get(`${API_BASE_URL}/waybills`, { params })

      if (response.data.success) {
        setWaybills(response.data.data)
        if (response.data.data.length === 0) {
          setError('No records found for the selected filters')
        }
      }
    } catch (err) {
      setError('Error fetching waybill records')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 rounded-xl">
          <FileText className="text-blue-600" size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">GC Report</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Filter Section */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-xl border border-green-200">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
            <Search size={16} className="text-green-600" />
            Search WayBill Details
          </h3>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-1/4 min-w-[150px]">
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Calendar size={12} />
                From Date
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-200 outline-none transition-all font-medium"
              />
            </div>
            <div className="w-1/4 min-w-[150px]">
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Calendar size={12} />
                To Date
              </label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-200 outline-none transition-all font-medium"
              />
            </div>
            {currentUser?.role === 'superadmin' ? (
              <div className="w-1/4 min-w-[150px]">
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Building size={12} />
                  Branch
                </label>
                <select
                  value={filters.branchId}
                  onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-200 outline-none transition-all font-medium"
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="w-1/4 min-w-[150px]">
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Building size={12} />
                  Current Branch
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentUser?.branch_name || 'Own Branch'}
                  className="w-full px-2 py-1.5 text-sm border border-gray-100 bg-gray-50 rounded text-gray-500 font-bold outline-none cursor-not-allowed"
                />
              </div>
            )}
            <div className="flex-1 min-w-[120px]">
              <button
                onClick={fetchWaybills}
                disabled={loading}
                className="w-full px-4 py-1.5 text-sm bg-gradient-to-r from-green-600 to-green-700 text-white rounded hover:from-green-700 hover:to-green-800 transition-all font-bold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    Get Details
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Package size={20} className="text-orange-600" />
              WayBill Details View
            </h3>
            <span className="px-3 py-1 bg-white rounded-full text-sm font-bold text-gray-600 border border-gray-200">
              Total: {waybills.length} records
            </span>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-yellow-200">
            <table className="w-full text-sm bg-white">
              <thead className="bg-yellow-100 border-b-2 border-yellow-300">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Bill Date</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">GC Number</th>
                  {currentUser?.role === 'superadmin' && <th className="px-4 py-3 text-left font-bold text-gray-700">Branch</th>}
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Destination</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Consignor</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Consignee</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-700">Articles</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {waybills.length === 0 ? (
                  <tr>
                    <td colSpan={currentUser?.role === 'superadmin' ? '9' : '8'} className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <FileText size={48} className="text-gray-300" />
                        <p className="font-medium">No waybill records found</p>
                        <p className="text-sm">Try adjusting your filters or create a new GC entry</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  waybills.map((waybill, idx) => (
                    <tr key={idx} className="hover:bg-yellow-50 transition-colors">
                      <td className="px-4 py-3 font-medium">{formatDate(waybill.bill_date)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-bold text-xs">
                          {waybill.gc_number}
                        </span>
                      </td>
                      {currentUser?.role === 'superadmin' && <td className="px-4 py-3">{waybill.origin_branch?.branch_name || '-'}</td>}
                      <td className="px-4 py-3">{waybill.destination?.city_name || '-'}</td>
                      <td className="px-4 py-3">{waybill.consignor?.name || '-'}</td>
                      <td className="px-4 py-3">{waybill.consignee?.name || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-gray-100 rounded font-bold">
                          {waybill.total_articles}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">
                        ₹{parseFloat(waybill.grand_total).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${waybill.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                          waybill.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                          {waybill.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GCReport
