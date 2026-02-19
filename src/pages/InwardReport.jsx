import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Calendar, Building, Search, FileText, Package, Loader2 } from 'lucide-react'

const API_BASE_URL = 'http://localhost:8000/api/v1'

function InwardReport() {
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

      const today = new Date().toISOString().split('T')[0]

      // If admin, pre-set the branch filter
      if (user.role !== 'superadmin' && user.branch_id) {
        setFilters({
          branchId: user.branch_id,
          fromDate: today,
          toDate: today
        })
      } else {
        fetchBranches()
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

  const fetchInwardWaybills = async () => {
    try {
      setLoading(true)
      setError('')

      const params = {}
      if (filters.fromDate) params.from_date = filters.fromDate
      if (filters.toDate) params.to_date = filters.toDate
      if (filters.branchId) params.destination_branch_id = filters.branchId

      const response = await axios.get(`${API_BASE_URL}/waybills`, { params })

      if (response.data.success) {
        setWaybills(response.data.data)
        if (response.data.data.length === 0) {
          setError('No records found for the selected filters')
        }
      }
    } catch (err) {
      setError('Error fetching inward waybill records')
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
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-green-100 rounded-lg">
          <FileText className="text-green-600" size={20} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Inward Report</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
        {/* Filter Section */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
            <Search size={18} className="text-green-600" />
            Search Inward WayBill Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Calendar size={14} />
                From Date
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all font-medium text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Calendar size={14} />
                To Date
              </label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all font-medium text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Building size={14} />
                Branch
              </label>
              {currentUser?.role === 'superadmin' ? (
                <select
                  value={filters.branchId}
                  onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 font-medium outline-none text-sm"
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  readOnly
                  value={currentUser?.branch_name || 'Own Branch'}
                  className="w-full px-3 py-2 border-2 border-gray-100 bg-gray-50 rounded-lg text-gray-500 font-bold outline-none cursor-not-allowed text-sm"
                />
              )}
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchInwardWaybills}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-bold shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <><Search size={16} /> Get Details</>}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Package size={16} className="text-orange-600" />
              Inward WayBill Details View
            </h3>
            <span className="px-2 py-1 bg-white rounded-full text-[10px] font-black text-gray-500 border border-gray-200 shadow-sm">
              TOTAL: {waybills.length} RECORDS
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium text-sm">
              {error}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-yellow-200 shadow-sm bg-white">
            <table className="w-full text-xs">
              <thead className="bg-yellow-100">
                <tr>
                  <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase text-[10px] tracking-wider">Bill Date</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase text-[10px] tracking-wider">GC Num</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase text-[10px] tracking-wider">Destination</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase text-[10px] tracking-wider">Consignor Name</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase text-[10px] tracking-wider">Consignee name</th>
                  <th className="px-4 py-2 text-center font-bold text-gray-700 uppercase text-[10px] tracking-wider">No Of Articles</th>
                  <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase text-[10px] tracking-wider">Article Desc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-100">
                {waybills.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-400 font-medium italic">
                      No Records found. Adjust your filters to see more.
                    </td>
                  </tr>
                ) : (
                  waybills.map((waybill, idx) => (
                    <tr key={idx} className="hover:bg-yellow-50 transition-colors">
                      <td className="px-4 py-2 font-medium text-gray-700">{formatDate(waybill.bill_date)}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[10px]">
                          {waybill.gc_number}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600 font-medium">{waybill.destination?.city_name || '-'}</td>
                      <td className="px-4 py-2 text-gray-600 font-medium">{waybill.consignor?.name || '-'}</td>
                      <td className="px-4 py-2 text-gray-600 font-medium">{waybill.consignee?.name || '-'}</td>
                      <td className="px-4 py-2 text-center">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-lg font-bold text-gray-700">
                          {waybill.total_articles}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500 italic max-w-xs truncate">{waybill.article_desc}</td>
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

export default InwardReport
