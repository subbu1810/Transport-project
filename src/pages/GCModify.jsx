import React, { useState, useEffect } from 'react'
import { Search, Save, RotateCcw, CheckCircle } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function GCModify() {
  const [gcNumber, setGcNumber] = useState('')
  const [waybillId, setWaybillId] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [saveEnabled, setSaveEnabled] = useState(false)
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
    fetchBranches()
    fetchConsignors()
    fetchConsignees()
    fetchDestinations()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_URL}/branches`)
      const data = await response.json()
      if (data.success) setBranches(data.data)
    } catch (err) {
      console.error('Error fetching branches:', err)
    }
  }

  const fetchConsignors = async () => {
    try {
      const response = await fetch(`${API_URL}/consignors`)
      const data = await response.json()
      if (data.success) setConsignors(data.data)
    } catch (err) {
      console.error('Error fetching consignors:', err)
    }
  }

  const fetchConsignees = async () => {
    try {
      const response = await fetch(`${API_URL}/consignees`)
      const data = await response.json()
      if (data.success) setConsignees(data.data)
    } catch (err) {
      console.error('Error fetching consignees:', err)
    }
  }

  const fetchDestinations = async () => {
    try {
      const response = await fetch(`${API_URL}/destinations`)
      const data = await response.json()
      if (data.success) setDestinations(data.data)
    } catch (err) {
      console.error('Error fetching destinations:', err)
    }
  }

  const searchGC = async () => {
    if (!gcNumber.trim()) {
      setError('Please enter a GC Number')
      return
    }

    try {
      setSearchLoading(true)
      setError('')
      setSuccess('')

      const response = await fetch(`${API_URL}/waybills/search/${gcNumber}`)
      const data = await response.json()

      if (data.success) {
        const waybill = data.data
        setWaybillId(waybill.id)

        // Populate form with waybill data
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
        setSaveEnabled(true)
        setSuccess('GC details loaded successfully!')
      } else {
        setError(data.message || 'GC Number not found')
        setSaveEnabled(false)
      }
    } catch (err) {
      setError('Error searching for GC Number')
      console.error('Error:', err)
      setSaveEnabled(false)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSave = async () => {
    if (!waybillId) {
      setError('No waybill loaded to save')
      return
    }

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
        articles: articles
      }

      const response = await fetch(`${API_URL}/waybills/${waybillId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Waybill updated successfully!')
        setError('')
      } else {
        setError(data.message || 'Failed to update waybill')
      }
    } catch (err) {
      setError('Error updating waybill')
      console.error('Error:', err)
    }
  }

  const handleReset = () => {
    setGcNumber('')
    setWaybillId(null)
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
    setSaveEnabled(false)
    setError('')
    setSuccess('')
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">GC Modify</h1>

      <div className="bg-white rounded-lg shadow-md p-4">
        {/* Search Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-300 mb-4">
          <div className="flex items-center gap-3">
            <select className="px-3 py-2 text-sm border-2 border-green-600 rounded-lg focus:outline-none font-semibold bg-white">
              <option>BY GC-NUM</option>
            </select>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="ENTER GC NUMBER TO SEARCH"
                value={gcNumber}
                onChange={(e) => setGcNumber(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && searchGC()}
                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none font-medium"
              />
            </div>
            <button
              onClick={searchGC}
              disabled={searchLoading}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {searchLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Search
                </>
              )}
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium flex items-center gap-2">
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        {/* Way Bill Edit Section */}
        <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200 mb-3">
          <h3 className="font-bold text-gray-800 mb-3 text-sm">Way Bill Edit</h3>
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Bill Date</label>
              <input
                type="date"
                value={formData.billDate}
                onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">From</label>
              <select
                value={formData.originBranchId}
                onChange={(e) => setFormData({ ...formData, originBranchId: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">To</label>
              <select
                value={formData.destinationId}
                onChange={(e) => setFormData({ ...formData, destinationId: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              >
                <option value="">Select Destination</option>
                {destinations.map(dest => (
                  <option key={dest.id} value={dest.id}>{dest.city_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Article Desc</label>
              <input
                type="text"
                value={formData.articleDesc}
                onChange={(e) => setFormData({ ...formData, articleDesc: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Consignor</label>
              <select
                value={formData.consignorId}
                onChange={(e) => setFormData({ ...formData, consignorId: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              >
                <option value="">Select Consignor</option>
                {consignors.map(consignor => (
                  <option key={consignor.id} value={consignor.id}>{consignor.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Consignee</label>
              <select
                value={formData.consigneeId}
                onChange={(e) => setFormData({ ...formData, consigneeId: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              >
                <option value="">Select Consignee</option>
                {consignees.map(consignee => (
                  <option key={consignee.id} value={consignee.id}>{consignee.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Article Details Table */}
        {articles.length > 0 && (
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300 mb-3">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Article Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-green-100 border-b border-green-300">
                  <tr>
                    <th className="px-2 py-2 text-left font-bold">Article Type</th>
                    <th className="px-2 py-2 text-left font-bold">No Of Articles</th>
                    <th className="px-2 py-2 text-left font-bold">Rate</th>
                    <th className="px-2 py-2 text-left font-bold">Total</th>
                    <th className="px-2 py-2 text-left font-bold">Handling Rate</th>
                    <th className="px-2 py-2 text-left font-bold">Handling Total</th>
                    <th className="px-2 py-2 text-left font-bold">Freight</th>
                    <th className="px-2 py-2 text-left font-bold">Act Wt</th>
                    <th className="px-2 py-2 text-left font-bold">Charged Wt</th>
                    <th className="px-2 py-2 text-left font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article, idx) => (
                    <tr key={idx} className="border-b hover:bg-green-50">
                      <td className="px-2 py-2">{article.article_type || '-'}</td>
                      <td className="px-2 py-2">{article.no_of_articles}</td>
                      <td className="px-2 py-2">₹{parseFloat(article.rate).toFixed(2)}</td>
                      <td className="px-2 py-2">₹{parseFloat(article.total).toFixed(2)}</td>
                      <td className="px-2 py-2">₹{parseFloat(article.handling_rate).toFixed(2)}</td>
                      <td className="px-2 py-2">₹{parseFloat(article.handling_total).toFixed(2)}</td>
                      <td className="px-2 py-2">₹{parseFloat(article.freight).toFixed(2)}</td>
                      <td className="px-2 py-2">{parseFloat(article.actual_weight).toFixed(2)}</td>
                      <td className="px-2 py-2">{parseFloat(article.charged_weight).toFixed(2)}</td>
                      <td className="px-2 py-2 font-bold">₹{parseFloat(article.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Section */}
        <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200 mb-3">
          <div className="grid grid-cols-6 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Total Articles</label>
              <input
                type="number"
                value={formData.totalArticles}
                onChange={(e) => setFormData({ ...formData, totalArticles: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Freight</label>
              <input
                type="number"
                step="0.01"
                value={formData.freightAmount}
                onChange={(e) => setFormData({ ...formData, freightAmount: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">DD</label>
              <input
                type="number"
                step="0.01"
                value={formData.ddCharges}
                onChange={(e) => setFormData({ ...formData, ddCharges: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Handling</label>
              <input
                type="number"
                step="0.01"
                value={formData.handlingCharges}
                onChange={(e) => setFormData({ ...formData, handlingCharges: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Stationary</label>
              <input
                type="number"
                step="0.01"
                value={formData.stationaryCharges}
                onChange={(e) => setFormData({ ...formData, stationaryCharges: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Total Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Invoice & Tax Section */}
        <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200 mb-3">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Invoice No</label>
              <input
                type="text"
                value={formData.invoiceNo}
                onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Declared Value</label>
              <input
                type="number"
                step="0.01"
                value={formData.declaredValue}
                onChange={(e) => setFormData({ ...formData, declaredValue: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">E-Way Bill No</label>
              <input
                type="text"
                value={formData.ewayBillNo}
                onChange={(e) => setFormData({ ...formData, ewayBillNo: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tax Payable By</label>
              <select
                value={formData.taxPayableBy}
                onChange={(e) => setFormData({ ...formData, taxPayableBy: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              >
                <option value="">Select</option>
                <option value="consignor">Consignor</option>
                <option value="consignee">Consignee</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Account Type</label>
              <select
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              >
                <option value="">Select</option>
                <option value="paid">Paid</option>
                <option value="topay">To Pay</option>
                <option value="tobebilled">To Be Billed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">GST (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.gstPercent}
                onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">GST Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.gstAmount}
                onChange={(e) => setFormData({ ...formData, gstAmount: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Final Section */}
        <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200 mb-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Grand Total</label>
              <input
                type="number"
                step="0.01"
                value={formData.grandTotal}
                onChange={(e) => setFormData({ ...formData, grandTotal: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Roading Clerk</label>
              <input
                type="text"
                value={formData.roadingClerk}
                onChange={(e) => setFormData({ ...formData, roadingClerk: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Remarks</label>
              <input
                type="text"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                disabled={!saveEnabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleSave}
            disabled={!saveEnabled}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={18} />
            Save Changes
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all font-bold shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <RotateCcw size={18} />
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}

export default GCModify
