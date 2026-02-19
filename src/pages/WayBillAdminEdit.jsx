import React, { useState, useEffect } from 'react'
import { Search, Save, RotateCcw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function WayBillAdminEdit() {
  const [gcNumber, setGcNumber] = useState('')
  const [waybillId, setWaybillId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    billDate: '',
    originBranchId: '',
    destinationId: '',
    consignorId: '',
    consigneeId: '',
    articleDesc: '',
    totalArticles: '',
    freightAmount: '',
    ddCharges: '',
    handlingCharges: '',
    stationaryCharges: '',
    totalAmount: '',
    invoiceNo: '',
    declaredValue: '',
    ewayBillNo: '',
    taxPayableBy: '',
    accountType: '',
    gstPercent: '',
    gstAmount: '',
    grandTotal: '',
    roadingClerk: '',
    remarks: ''
  })

  const [articles, setArticles] = useState([])
  const [branches, setBranches] = useState([])
  const [consignors, setConsignors] = useState([])
  const [consignees, setConsignees] = useState([])
  const [destinations, setDestinations] = useState([])

  useEffect(() => {
    fetchMasterData()
  }, [])

  const fetchMasterData = async () => {
    try {
      const [
        branchesRes,
        consignorsRes,
        consigneesRes,
        destinationsRes
      ] = await Promise.all([
        fetch(`${API_URL}/branches`).then(res => res.json()),
        fetch(`${API_URL}/consignors`).then(res => res.json()),
        fetch(`${API_URL}/consignees`).then(res => res.json()),
        fetch(`${API_URL}/destinations`).then(res => res.json())
      ])

      if (branchesRes.success) setBranches(branchesRes.data)
      if (consignorsRes.success) setConsignors(consignorsRes.data)
      if (consigneesRes.success) setConsignees(consigneesRes.data)
      if (destinationsRes.success) setDestinations(destinationsRes.data)

    } catch (err) {
      console.error('Error fetching master data:', err)
      setError('Failed to load master data. Some fields may not be populated.')
    }
  }

  const handleSearch = async () => {
    if (!gcNumber.trim()) {
      setError('Please enter a GC Number')
      return
    }

    setSearching(true)
    setError('')
    setSuccess('')
    setWaybillId(null)

    try {
      const response = await fetch(`${API_URL}/waybills/search/${gcNumber}`)
      const data = await response.json()

      if (data.success && data.data) {
        const waybill = data.data
        setWaybillId(waybill.id)
        setFormData({
          billDate: waybill.bill_date || '',
          originBranchId: waybill.origin_branch_id || '',
          destinationId: waybill.destination_id || '',
          consignorId: waybill.consignor_id || '',
          consigneeId: waybill.consignee_id || '',
          articleDesc: waybill.article_desc || '',
          totalArticles: waybill.total_articles || '',
          freightAmount: waybill.freight_amount || '',
          ddCharges: waybill.dd_charges || '',
          handlingCharges: waybill.handling_charges || '',
          stationaryCharges: waybill.stationary_charges || '',
          totalAmount: waybill.total_amount || '',
          invoiceNo: waybill.invoice_no || '',
          declaredValue: waybill.declared_value || '',
          ewayBillNo: waybill.eway_bill_no || '',
          taxPayableBy: waybill.tax_payable_by || '',
          accountType: waybill.account_type || '',
          gstPercent: waybill.gst_percent || '',
          gstAmount: waybill.gst_amount || '',
          grandTotal: waybill.grand_total || '',
          roadingClerk: waybill.roading_clerk || '',
          remarks: waybill.remarks || ''
        })
        setArticles(waybill.articles || [])
        setSuccess('Waybill details fetched successfully.')
      } else {
        setError(data.message || 'GC Number not found.')
      }
    } catch (err) {
      console.error('Error searching waybill:', err)
      setError('An error occurred while searching. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleSave = async () => {
    if (!waybillId) {
      setError('No waybill loaded to save.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        bill_date: formData.billDate,
        origin_branch_id: formData.originBranchId,
        destination_id: formData.destinationId,
        consignor_id: formData.consignorId,
        consignee_id: formData.consigneeId,
        article_desc: formData.articleDesc,
        total_articles: formData.totalArticles,
        freight_amount: formData.freightAmount,
        dd_charges: formData.ddCharges,
        handling_charges: formData.handlingCharges,
        stationary_charges: formData.stationaryCharges,
        total_amount: formData.totalAmount,
        invoice_no: formData.invoiceNo,
        declared_value: formData.declaredValue,
        eway_bill_no: formData.ewayBillNo,
        tax_payable_by: formData.taxPayableBy,
        account_type: formData.accountType,
        gst_percent: formData.gstPercent,
        gst_amount: formData.gstAmount,
        grand_total: formData.grandTotal,
        roading_clerk: formData.roadingClerk,
        remarks: formData.remarks,
        articles: articles // Send existing articles back (assuming backend handles update/replace)
      }

      const response = await fetch(`${API_URL}/waybills/${waybillId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Waybill updated successfully!')
      } else {
        setError(data.message || 'Failed to update waybill.')
      }
    } catch (err) {
      console.error('Error updating waybill:', err)
      setError('An error occurred while saving. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setGcNumber('')
    setWaybillId(null)
    setSuccess('')
    setError('')
    setFormData({
      billDate: '',
      originBranchId: '',
      destinationId: '',
      consignorId: '',
      consigneeId: '',
      articleDesc: '',
      totalArticles: '',
      freightAmount: '',
      ddCharges: '',
      handlingCharges: '',
      stationaryCharges: '',
      totalAmount: '',
      invoiceNo: '',
      declaredValue: '',
      ewayBillNo: '',
      taxPayableBy: '',
      accountType: '',
      gstPercent: '',
      gstAmount: '',
      grandTotal: '',
      roadingClerk: '',
      remarks: ''
    })
    setArticles([])
  }

  // Helper to update specific article field
  const updateArticle = (index, field, value) => {
    const newArticles = [...articles]
    newArticles[index] = { ...newArticles[index], [field]: value }
    setArticles(newArticles)
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">WayBill Admin/Edit</h1>

      <div className="bg-white rounded-lg shadow-md p-4 space-y-4">

        {/* Search Section */}
        <div className="bg-green-100 p-3 rounded-lg border-2 border-green-300">
          <div className="flex items-center gap-2">
            <select className="px-2 py-1 border-2 border-green-600 rounded-lg focus:outline-none font-semibold bg-white text-sm">
              <option>BY GC-NUM</option>
            </select>
            <input
              type="text"
              placeholder="ENTER GC NUMBER TO SEARCH"
              value={gcNumber}
              onChange={(e) => setGcNumber(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-2 py-1 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-sm"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="bg-green-600 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
            >
              {searching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
              Search
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 font-medium">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 font-medium">
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        {/* Edit Form - Only show if Waybill ID is set */}
        {waybillId && (
          <>
            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
              <h3 className="font-bold text-gray-800 mb-3">Way Bill Edit</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Bill Date</label>
                  <input
                    type="date"
                    value={formData.billDate ? new Date(formData.billDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                    className="w-full px-2 py-1 border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">From</label>
                  <select
                    value={formData.originBranchId}
                    onChange={(e) => setFormData({ ...formData, originBranchId: e.target.value })}
                    className="w-full px-2 py-1 border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:outline-none text-sm"
                  >
                    <option value="">Select Origin</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.branch_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">To</label>
                  <select
                    value={formData.destinationId}
                    onChange={(e) => setFormData({ ...formData, destinationId: e.target.value })}
                    className="w-full px-2 py-1 border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:outline-none text-sm"
                  >
                    <option value="">Select Destination</option>
                    {destinations.map(d => (
                      <option key={d.id} value={d.id}>{d.city_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Consignor</label>
                  <select
                    value={formData.consignorId}
                    onChange={(e) => setFormData({ ...formData, consignorId: e.target.value })}
                    className="w-full px-2 py-1 border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:outline-none text-sm"
                  >
                    <option value="">Select Consignor</option>
                    {consignors.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Consignee</label>
                  <select
                    value={formData.consigneeId}
                    onChange={(e) => setFormData({ ...formData, consigneeId: e.target.value })}
                    className="w-full px-2 py-1 border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:outline-none text-sm"
                  >
                    <option value="">Select Consignee</option>
                    {consignees.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Article Desc</label>
                <input
                  type="text"
                  value={formData.articleDesc}
                  onChange={(e) => setFormData({ ...formData, articleDesc: e.target.value })}
                  className="w-full px-2 py-1 border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:outline-none text-sm"
                />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
              <h3 className="font-bold text-gray-800 mb-3">Article Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-green-100 border-b-2 border-green-300">
                    <tr>
                      <th className="px-2 py-1 text-left font-semibold">Article Type</th>
                      <th className="px-2 py-1 text-left font-semibold">No Of Article</th>
                      <th className="px-2 py-1 text-left font-semibold">Rate</th>
                      <th className="px-2 py-1 text-left font-semibold">Total</th>
                      <th className="px-2 py-1 text-left font-semibold">Freight</th>
                      <th className="px-2 py-1 text-left font-semibold">Act Wt</th>
                      <th className="px-2 py-1 text-left font-semibold">Charged Wt</th>
                      <th className="px-2 py-1 text-left font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((article, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 bg-white">
                        <td className="px-2 py-1">
                          <input
                            value={article.article_type}
                            onChange={(e) => updateArticle(index, 'article_type', e.target.value)}
                            className="w-full px-1.5 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            value={article.no_of_articles}
                            onChange={(e) => updateArticle(index, 'no_of_articles', e.target.value)}
                            className="w-full px-1.5 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            value={article.rate}
                            onChange={(e) => updateArticle(index, 'rate', e.target.value)}
                            className="w-full px-1.5 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        {/* Calculated Fields (Display only for now) */}
                        <td className="px-2 py-1 text-center">{parseFloat(article.total || 0).toFixed(2)}</td>
                        <td className="px-2 py-1 text-center">{parseFloat(article.freight || 0).toFixed(2)}</td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            value={article.actual_weight}
                            onChange={(e) => updateArticle(index, 'actual_weight', e.target.value)}
                            className="w-full px-1.5 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            value={article.charged_weight}
                            onChange={(e) => updateArticle(index, 'charged_weight', e.target.value)}
                            className="w-full px-1.5 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-2 py-1 text-center">{parseFloat(article.amount || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financials */}
            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Total Articles</label>
                  <input type="number" value={formData.totalArticles} onChange={(e) => setFormData({ ...formData, totalArticles: e.target.value })} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Freight Amount</label>
                  <input type="number" value={formData.freightAmount} onChange={(e) => setFormData({ ...formData, freightAmount: e.target.value })} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Handling Charges</label>
                  <input type="number" value={formData.handlingCharges} onChange={(e) => setFormData({ ...formData, handlingCharges: e.target.value })} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Grand Total</label>
                  <input type="number" value={formData.grandTotal} onChange={(e) => setFormData({ ...formData, grandTotal: e.target.value })} className="w-full px-2 py-1 border border-green-500 ring-2 ring-green-100 rounded font-bold text-sm" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-center pt-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold text-sm flex items-center gap-2 shadow-lg"
              >
                {loading && <Loader2 className="animate-spin" size={20} />}
                {loading ? 'Saving...' : 'Save & Update'}
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-bold text-sm flex items-center gap-2"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default WayBillAdminEdit
