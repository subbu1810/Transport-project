import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Search, Save, RotateCcw, CheckCircle, AlertCircle, Loader2, X, HelpCircle, Trash2 } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function WayBillAdminEdit() {
  const [gcNumber, setGcNumber] = useState('')
  const [waybillId, setWaybillId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [user, setUser] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [editReason, setEditReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const showNotify = (type, message) => {
    setNotification({ show: true, type, message })
    if (type === 'success') {
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000)
    }
  }

  const [displayData, setDisplayData] = useState({
    from: '',
    to: '',
    consignor: '',
    consignee: ''
  })

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
    remarks: ''
  })

  const [articles, setArticles] = useState([])
  const [branches, setBranches] = useState([])
  const [consignors, setConsignors] = useState([])
  const [consignees, setConsignees] = useState([])
  const [destinations, setDestinations] = useState([])

  useEffect(() => {
    fetchMasterData()
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        setUser(JSON.parse(userStr))
      } catch (e) {
        console.error('Error parsing user data')
      }
    }
  }, [])

  const fetchMasterData = async () => {
    try {
      setError('')
      const [
        branchesRes,
        consignorsRes,
        consigneesRes,
        destinationsRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/branches`).then(res => { if (!res.ok) throw new Error('Branches failed'); return res.json() }),
        fetch(`${API_BASE_URL}/consignors`).then(res => { if (!res.ok) throw new Error('Consignors failed'); return res.json() }),
        fetch(`${API_BASE_URL}/consignees`).then(res => { if (!res.ok) throw new Error('Consignees failed'); return res.json() }),
        fetch(`${API_BASE_URL}/destinations`).then(res => { if (!res.ok) throw new Error('Destinations failed'); return res.json() })
      ])

      let masterDataLoaded = true
      if (branchesRes.success) setBranches(branchesRes.data)
      else masterDataLoaded = false

      if (consignorsRes.success) setConsignors(consignorsRes.data)
      else masterDataLoaded = false

      if (consigneesRes.success) setConsignees(consigneesRes.data)
      else masterDataLoaded = false

      if (destinationsRes.success) setDestinations(destinationsRes.data)
      else masterDataLoaded = false

      if (!masterDataLoaded) {
        setError('Master data partially loaded. Some dropdowns might be empty.')
      }

    } catch (err) {
      console.error('Error fetching master data:', err)
      setError(`Failed to load master data: ${err.message}. Please refresh.`)
    }
  }

  const handleSearch = async () => {
    if (!gcNumber.trim()) {
      showNotify('error', 'Please enter a GC Number')
      return
    }

    setSearching(true)
    setError('')
    setSuccess('')
    setNotification({ show: false, type: '', message: '' })
    setWaybillId(null)

    try {
      const response = await axios.get(`${API_BASE_URL}/waybills/search/${gcNumber}`)
      
      if (response.data.success && response.data.data) {
        const waybill = response.data.data
        setWaybillId(waybill.id)

        // Safe date parsing to YYYY-MM-DD
        let formattedDate = ''
        if (waybill.bill_date) {
          const d = new Date(waybill.bill_date)
          if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().split('T')[0]
          } else {
            const parts = waybill.bill_date.split('-')
            if (parts.length === 3) {
              if (parts[0].length === 4) formattedDate = waybill.bill_date 
              else formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`
            }
          }
        }

        setFormData({
          billDate: formattedDate || waybill.bill_date || '',
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
          remarks: waybill.remarks || '',
          status: waybill.status
        })
        setDisplayData({
          from: waybill.origin_branch?.branch_name || 'N/A',
          to: waybill.destination?.city_name || 'N/A',
          consignor: waybill.consignor?.name || 'N/A',
          consignee: waybill.consignee?.name || 'N/A'
        })
        setArticles(waybill.articles || [])
        setOriginalData(JSON.parse(JSON.stringify(waybill))) 

        // Branch-based Access Control for Admin role
        if (user?.role !== 'superadmin' && parseInt(user?.branch_id) !== parseInt(waybill.origin_branch_id)) {
          setError(`ACCESS DENIED: This GC belongs to ${waybill.origin_branch?.branch_name || 'another branch'}. Only users from the Booked (Origin) branch can modify it.`);
          setWaybillId(null); // Clear ID to prevent editing
          return;
        }

        setSuccess('GC: ' + gcNumber + ' Loaded. Enter Modify details below.')
      } else {
        setError(response.data.message || 'GC Number not found.')
      }
    } catch (err) {
      console.error('Error searching waybill:', err)
      setError(`Search failed: ${err.message}`)
    } finally {
      setSearching(false)
    }
  }

  const handleSave = async () => {
    if (!waybillId) {
      showNotify('error', 'No waybill loaded to save.')
      return
    }

    // E-Way Bill Validation: Mandatory for declared value > 49,999
    const dVal = parseFloat(formData.declaredValue) || 0;
    if (dVal > 49999 && (!formData.ewayBillNo || formData.ewayBillNo.trim() === '')) {
      showNotify('error', 'Declared Value exceeds ₹49,999. E-Way Bill No. is mandatory.');
      return;
    }

    // Check for changes to prompt for reason
    const hasChanges = JSON.stringify(formData) !== JSON.stringify({
      billDate: originalData.bill_date ? new Date(originalData.bill_date).toISOString().split('T')[0] : '',
      originBranchId: originalData.origin_branch_id || '',
      destinationId: originalData.destination_id || '',
      consignorId: originalData.consignor_id || '',
      consigneeId: originalData.consignee_id || '',
      articleDesc: originalData.article_desc || '',
      totalArticles: originalData.total_articles || '',
      freightAmount: originalData.freight_amount || '',
      ddCharges: originalData.dd_charges || '',
      handlingCharges: originalData.handling_charges || '',
      stationaryCharges: originalData.stationary_charges || '',
      totalAmount: originalData.total_amount || '',
      invoiceNo: originalData.invoice_no || '',
      declaredValue: originalData.declared_value || '',
      ewayBillNo: originalData.eway_bill_no || '',
      taxPayableBy: originalData.tax_payable_by || '',
      accountType: originalData.account_type || '',
      gstPercent: originalData.gst_percent || '',
      gstAmount: originalData.gst_amount || '',
      remarks: originalData.remarks || ''
    })

    if (hasChanges && !editReason) {
      setShowReasonModal(true)
      return
    }

    setLoading(true)
    setNotification({ show: false, type: '', message: '' })

    try {
      const payload = {
        bill_date: formData.billDate,
        origin_branch_id: formData.originBranchId,
        destination_id: formData.destinationId,
        consignor_id: formData.consignorId,
        consignee_id: formData.consigneeId,
        article_desc: formData.articleDesc,
        total_articles: parseInt(formData.totalArticles) || 0,
        freight_amount: parseFloat(formData.freightAmount) || 0,
        dd_charges: parseFloat(formData.ddCharges) || 0,
        handling_charges: parseFloat(formData.handlingCharges) || 0,
        stationary_charges: parseFloat(formData.stationaryCharges) || 0,
        total_amount: parseFloat(formData.totalAmount) || 0,
        invoice_no: formData.invoiceNo,
        declared_value: parseFloat(formData.declaredValue) || 0,
        eway_bill_no: formData.ewayBillNo,
        tax_payable_by: formData.taxPayableBy,
        account_type: formData.accountType,
        gst_percent: parseFloat(formData.gstPercent) || 0,
        gst_amount: parseFloat(formData.gstAmount) || 0,
        remarks: formData.remarks,
        articles: articles.map(art => ({
          ...art,
          no_of_articles: parseInt(art.no_of_articles) || 0,
          rate: parseFloat(art.rate) || 0,
          actual_weight: parseFloat(art.actual_weight) || 0,
          charged_weight: parseFloat(art.charged_weight) || 0
        })),
        edit_reason: editReason || "Admin General Update",
        admin_id: user?.id
      }

      const response = await axios.put(`${API_BASE_URL}/waybills/${waybillId}`, payload)

      if (response.data.success) {
        showNotify('success', 'Waybill updated successfully!')
        setShowReasonModal(false)
        setEditReason('')
        setOriginalData(null)
        handleReset()
      } else {
        showNotify('error', response.data.message || 'Failed to update waybill.')
      }
    } catch (err) {
      console.error('Error updating waybill:', err)
      showNotify('error', 'An error occurred while saving. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelGC = async () => {
    if (!waybillId) return
    
    if (formData.status === 'Delivered' || formData.status === 'CANCELLED') {
      showNotify('error', `Cannot cancel a waybill that is already ${formData.status}.`)
      return
    }

    if (!cancelReason) {
      setShowCancelModal(true)
      return
    }

    setIsCancelling(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/waybills/${waybillId}/cancel`, {
        cancel_reason: cancelReason,
        branch_id: user?.branch_id,
        role: user?.role
      })

      if (response.data.success) {
        showNotify('success', 'Waybill cancelled successfully! Financial entries reversed.')
        setShowCancelModal(false)
        setCancelReason('')
        handleReset()
      } else {
        showNotify('error', response.data.message || 'Cancellation failed.')
      }
    } catch (err) {
      console.error('Cancellation error:', err)
      showNotify('error', err.response?.data?.message || 'Error occurred during cancellation.')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleReset = () => {
    setGcNumber('')
    setWaybillId(null)
    setError('')
    setSuccess('')
    setNotification({ show: false, type: '', message: '' })
    setDisplayData({ from: '', to: '', consignor: '', consignee: '' })
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
      taxPayableBy: '',
      accountType: '',
      gstPercent: '',
      gstAmount: '',
      grandTotal: '',
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
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-800">WayBill Admin/Edit</h1>
        <button
          onClick={() => setShowHelp(true)}
          className="p-1.5 bg-white text-blue-600 rounded-full shadow-sm hover:shadow-md hover:bg-blue-50 transition-all border border-blue-100 group"
          title="Admin Guide"
        >
          <HelpCircle size={20} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Obsolete Warning Banner */}
      <div className="p-4 bg-amber-50 border-2 border-amber-300 text-amber-800 rounded-lg flex items-start gap-3 shadow-sm">
        <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-extrabold text-sm uppercase tracking-wide">⚠️ Page Obsolete / Deprecated</h4>
          <p className="text-xs mt-1 font-semibold leading-relaxed">
            This page is obsolete. Please use the <span className="font-black underline text-amber-900">GC Modify</span> page instead to edit Consignments. 
            To edit consignments belonging to other branches, please log in as a <span className="font-black text-amber-900">Super Admin</span>.
          </p>
        </div>
      </div>

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

        {/* Messages */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-bold text-sm animate-in fade-in slide-in-from-top-2 duration-300">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 font-bold text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        {/* Popup Modal Notification */}
        {notification.show && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border ${notification.type === 'success' ? 'border-green-100' : 'border-red-100'}`}>
              <div className={`p-8 text-center space-y-4 ${notification.type === 'success' ? 'bg-gradient-to-b from-green-50/50 to-white' : 'bg-gradient-to-b from-red-50/50 to-white'}`}>
                <div className="flex justify-center relative">
                  <div className={`p-4 rounded-full shadow-inner ${notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {notification.type === 'success' ? <CheckCircle size={40} /> : <AlertCircle size={40} />}
                  </div>
                  <button
                    onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                    className="absolute -top-4 -right-4 p-1 rounded-full bg-white shadow-md text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-2">
                  <h2 className={`text-2xl font-black uppercase tracking-tight ${notification.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                    {notification.type === 'success' ? 'SUCCESS!' : 'ERROR!'}
                  </h2>
                  <p className="text-gray-600 text-sm font-black leading-relaxed px-4">
                    {notification.message}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 flex">
                <button
                  onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                  className={`flex-1 px-4 py-3 rounded-2xl text-white text-xs font-black shadow-lg transition-all hover:scale-105 active:scale-95 uppercase tracking-widest ${notification.type === 'success' ? 'bg-green-600 shadow-green-100 hover:bg-green-700' : 'bg-red-600 shadow-red-100 hover:bg-red-700'}`}
                >
                  OKAY
                </button>
              </div>
            </div>
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
                  <div className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm font-bold uppercase">
                    {displayData.from}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">To</label>
                  <div className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm font-bold uppercase">
                    {displayData.to}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Consignor</label>
                  <div className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm font-bold uppercase">
                    {displayData.consignor}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Consignee</label>
                  <div className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm font-bold uppercase">
                    {displayData.consignee}
                  </div>
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
                disabled={loading || formData.status === 'CANCELLED'}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold text-sm flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {loading && <Loader2 className="animate-spin" size={20} />}
                {loading ? 'Saving...' : 'Save & Update'}
              </button>
              
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={formData.status === 'Delivered' || formData.status === 'CANCELLED'}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold text-sm flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                <Trash2 size={18} />
                Cancel GC
              </button>

              <button
                onClick={handleReset}
                className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-bold text-sm flex items-center gap-2 shadow-lg"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>

            {showReasonModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm shadow-2xl">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 animate-in zoom-in duration-200 border border-amber-100">
                  <div className="flex items-center gap-3 mb-4 text-amber-600">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <Save size={24} />
                    </div>
                    <h2 className="text-lg font-black uppercase tracking-tight">Admin Authorization</h2>
                  </div>

                  <p className="text-slate-500 text-[10px] font-black leading-relaxed mb-6 uppercase tracking-wider">
                    "You are modifying critical Waybill data. Please enter a valid reason for this audit log."
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modification Reason *</label>
                      <textarea
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        placeholder="Explain why these changes are being made..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-amber-500 outline-none font-bold text-slate-700 text-sm h-24 resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowReasonModal(false)}
                        className="flex-1 py-3 border-2 border-slate-100 rounded-xl text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={!editReason.trim()}
                        className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-amber-100 transition-all disabled:opacity-50"
                      >
                        Confirm Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showCancelModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm shadow-2xl">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 animate-in zoom-in duration-200 border border-red-100">
                  <div className="flex items-center gap-3 mb-4 text-red-600">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <Trash2 size={24} />
                    </div>
                    <h2 className="text-lg font-black uppercase tracking-tight">Void Waybill (Cancel)</h2>
                  </div>

                  <div className="p-4 bg-red-50 rounded-xl mb-6">
                    <p className="text-red-800 text-xs font-bold leading-relaxed">
                      WARNING: Cancelling this GC will void all charges and create a reversal entry in the cash book. This action cannot be undone.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cancellation Reason *</label>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Explain why this GC is being cancelled..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-red-500 outline-none font-bold text-slate-700 text-sm h-24 resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowCancelModal(false)}
                        className="flex-1 py-3 border-2 border-slate-100 rounded-xl text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all"
                      >
                        Abort
                      </button>
                      <button
                        onClick={handleCancelGC}
                        disabled={!cancelReason.trim() || isCancelling}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isCancelling && <Loader2 className="animate-spin" size={14} />}
                        Confirm Cancellation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-blue-100">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <HelpCircle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Admin Edit Guide</h2>
                  <p className="text-blue-100 text-xs">Managing critical waybill modifications</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">1</span>
                    Search GC
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 ml-10">
                    <li>• Enter the <span className="font-semibold text-gray-800">GC Number</span> in the green search bar.</li>
                    <li>• Use the <span className="font-semibold text-gray-800 uppercase text-[10px]">Search</span> button to load historical data.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">2</span>
                    Modify Details
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 ml-10">
                    <li>• Update <span className="font-semibold text-gray-800">Date, Article Counts</span>, or <span className="font-semibold text-gray-800">Weights</span>.</li>
                    <li>• Recalculate <span className="font-semibold text-gray-800">Freight</span> and <span className="font-semibold text-gray-800">Grand Total</span> carefully.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">3</span>
                    Audit Trail
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 ml-10">
                    <li>• A <span className="font-semibold text-gray-800">Reason for Modification</span> is mandatory for all admin edits.</li>
                    <li>• These changes are logged under your <span className="font-semibold text-gray-800 uppercase text-[10px]">Admin ID</span>.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-red-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">!</span>
                    High Value Goods
                  </div>
                  <div className="ml-10">
                    <p className="text-xs text-gray-500 leading-relaxed italic">
                      For items over <span className="font-bold">₹49,999</span>, the E-Way Bill Number is <span className="text-red-500 font-bold underline">Mandatory</span> and will be validated on save.
                    </p>
                  </div>
                </section>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-6 py-2 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-all shadow-lg"
              >
                Understand & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WayBillAdminEdit
