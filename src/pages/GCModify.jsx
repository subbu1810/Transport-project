import React, { useState, useEffect, useRef } from 'react'
import { Search, Save, RotateCcw, CheckCircle, XCircle, X, HelpCircle } from 'lucide-react'
import { API_BASE_URL, STORAGE_URL } from '../config/api';

function GCModify() {
  const [gcNumber, setGcNumber] = useState('')
  const [waybillId, setWaybillId] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [saveEnabled, setSaveEnabled] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [popup, setPopup] = useState(null) // { type: 'success'|'error', message: string }
  const [isDelivered, setIsDelivered] = useState(false)

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
  
  // Searchable Select State
  const [consignorSearch, setConsignorSearch] = useState('')
  const [consigneeSearch, setConsigneeSearch] = useState('')
  const [destinationSearch, setDestinationSearch] = useState('')
  const [openSelect, setOpenSelect] = useState(null) // 'consignor' | 'consignee' | 'destination' | null

  const [user, setUser] = useState(null)
  const [editReason, setEditReason] = useState('')
  const [originalAmounts, setOriginalAmounts] = useState({})
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
    fetchBranches()
    fetchConsignors()
    fetchConsignees()
    fetchDestinations()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches`)
      const data = await response.json()
      if (data.success) setBranches(data.data)
    } catch (err) {
      console.error('Error fetching branches:', err)
    }
  }

  const fetchConsignors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/consignors`)
      const data = await response.json()
      if (data.success) setConsignors(data.data)
    } catch (err) {
      console.error('Error fetching consignors:', err)
    }
  }

  const fetchConsignees = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/consignees`)
      const data = await response.json()
      if (data.success) setConsignees(data.data)
    } catch (err) {
      console.error('Error fetching consignees:', err)
    }
  }

  const fetchDestinations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/destinations`)
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

      const response = await fetch(`${API_BASE_URL}/waybills/search/${gcNumber}`)
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
          remarks: waybill.remarks || ''
        })

        // Store original amounts to detect changes
        setOriginalAmounts({
          freightAmount: waybill.freight_amount,
          ddCharges: waybill.dd_charges,
          handlingCharges: waybill.handling_charges,
          stationaryCharges: waybill.stationary_charges,
          totalAmount: waybill.total_amount,
          gstAmount: waybill.gst_amount,
          grandTotal: waybill.grand_total,
          declaredValue: waybill.declared_value
        })
        setEditReason('')

        setArticles(waybill.articles || [])

        if (waybill.status?.toUpperCase() === 'DELIVERED' || waybill.deliver_status?.toUpperCase() === 'DELIVERED') {
          setIsDelivered(true)
          setError('CRITICAL: This GC has already been DELIVERED. Modification is strictly prohibited.')
          setSaveEnabled(false)
        } else if (user?.role !== 'superadmin' && parseInt(user?.branch_id) !== parseInt(waybill.origin_branch_id)) {
          setIsDelivered(false)
          setError(`ACCESS DENIED: This GC belongs to ${waybill.origin_branch?.branch_name || 'another branch'}. Only Booked (Origin) branch users can modify it.`)
          setSaveEnabled(false)
        } else {
          setIsDelivered(false)
          setSaveEnabled(true)
          setSuccess('GC details loaded successfully!')
        }
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

  // Auto-calculate totals whenever basic amounts change
  const handleArticleChange = (index, field, value) => {
    const newArticles = [...articles];
    let updated = { ...newArticles[index], [field]: value };
    
    const noOfArt = parseInt(updated.no_of_articles) || 0;
    const cWt = parseFloat(updated.charged_weight) || 0;
    
    const ddRate = parseFloat(updated.dd_rate) || 0;
    updated.dd_total = noOfArt * ddRate;
    
    const hndRate = parseFloat(updated.handling_rate) || 0;
    updated.handling_total = noOfArt * hndRate;
    
    const frt = parseFloat(updated.freight) || 0;
    updated.amount = cWt * frt;
    updated.total = updated.amount;
    
    newArticles[index] = updated;
    setArticles(newArticles);
  }

  // Recalculate global totals when articles change
  useEffect(() => {
    if (!waybillId || articles.length === 0) return;

    let totalArt = 0, totalFrt = 0, totalDD = 0, totalHnd = 0;
    articles.forEach(a => {
      totalArt += parseInt(a.no_of_articles) || 0;
      totalFrt += parseFloat(a.amount) || 0;
      totalDD += parseFloat(a.dd_total) || 0;
      totalHnd += parseFloat(a.handling_total) || 0;
    });

    setFormData(prev => {
      if (
        parseInt(prev.totalArticles) === totalArt &&
        parseFloat(prev.freightAmount || 0) === totalFrt &&
        parseFloat(prev.ddCharges || 0) === totalDD &&
        parseFloat(prev.handlingCharges || 0) === totalHnd
      ) {
        return prev;
      }
      return {
        ...prev,
        totalArticles: totalArt,
        freightAmount: totalFrt.toFixed(2),
        ddCharges: totalDD.toFixed(2),
        handlingCharges: totalHnd.toFixed(2)
      };
    });
  }, [articles, waybillId]);

  useEffect(() => {
    if (!waybillId) return;

    const freight = parseFloat(formData.freightAmount) || 0;
    const dd = parseFloat(formData.ddCharges) || 0;
    const handling = parseFloat(formData.handlingCharges) || 0;
    const stationary = parseFloat(formData.stationaryCharges) || 0;
    
    const subTotal = freight + dd + handling + stationary;
    const gstPercent = parseFloat(formData.gstPercent) || 0;
    const gstAmount = (subTotal * gstPercent) / 100;
    const grandTotal = subTotal + gstAmount;

    setFormData(prev => {
      // Only update if values actually changed to avoid unnecessary renders
      if (
        parseFloat(prev.totalAmount || 0) === parseFloat(subTotal.toFixed(2)) &&
        parseFloat(prev.gstAmount || 0) === parseFloat(gstAmount.toFixed(2)) &&
        parseFloat(prev.grandTotal || 0) === parseFloat(grandTotal.toFixed(2))
      ) {
        return prev;
      }
      return {
        ...prev,
        totalAmount: subTotal.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        grandTotal: grandTotal.toFixed(2)
      };
    });
  }, [
    formData.freightAmount, 
    formData.ddCharges, 
    formData.handlingCharges, 
    formData.stationaryCharges, 
    formData.gstPercent, 
    waybillId
  ]);

  const isAmountChanged = () => {
    const parse = (val) => parseFloat(val) || 0;
    return (
      parse(formData.freightAmount) !== parse(originalAmounts.freightAmount) ||
      parse(formData.ddCharges) !== parse(originalAmounts.ddCharges) ||
      parse(formData.handlingCharges) !== parse(originalAmounts.handlingCharges) ||
      parse(formData.stationaryCharges) !== parse(originalAmounts.stationaryCharges) ||
      parse(formData.totalAmount) !== parse(originalAmounts.totalAmount) ||
      parse(formData.gstAmount) !== parse(originalAmounts.gstAmount) ||
      parse(formData.grandTotal) !== parse(originalAmounts.grandTotal) ||
      parse(formData.declaredValue) !== parse(originalAmounts.declaredValue)
    )
  }

  const handleSave = async () => {
    if (!waybillId) {
      setError('No waybill loaded to save')
      return
    }

    // E-Way Bill Validation: Mandatory for declared value > 49,999
    const dVal = parseFloat(formData.declaredValue) || 0;
    if (dVal > 49999 && (!formData.ewayBillNo || formData.ewayBillNo.trim() === '')) {
      setError('Declared Value exceeds ₹49,999. E-Way Bill No. is mandatory.');
      return;
    }

    if (isAmountChanged() && (user?.role === 'superadmin' || user?.role === 'admin') && !editReason) {
      setShowReasonModal(true)
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
        remarks: formData.remarks,
        articles: articles,
        edit_reason: editReason,
        admin_id: user?.id
      }

      const response = await fetch(`${API_BASE_URL}/waybills/${waybillId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Branch-Id': user?.branch_id || ''
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        setShowReasonModal(false)
        setEditReason('')
        setPopup({ type: 'success', message: `GC ${gcNumber} updated successfully!` })
        // Clear the entire form after success
        handleReset()
      } else {
        setShowReasonModal(false)
        setPopup({ type: 'error', message: data.message || 'Failed to update waybill' })
      }
    } catch (err) {
      setShowReasonModal(false)
      setPopup({ type: 'error', message: 'Network error – could not reach the server.' })
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
      remarks: ''
    })
    setArticles([])
    setSaveEnabled(false)
    setIsDelivered(false)
    setError('')
    setSuccess('')
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-800">GC Modify</h1>
        <button
          onClick={() => setShowHelp(true)}
          className="p-1.5 bg-white text-blue-600 rounded-full shadow-sm hover:shadow-md hover:bg-blue-50 transition-all border border-blue-100 group"
          title="Tracking Guide"
        >
          <HelpCircle size={20} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        {/* Search Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-2 border border-green-200 rounded-md mb-3 flex items-center justify-start">
          <div className="flex items-center gap-2 w-full max-w-3xl">
            <select className="px-2 py-1.5 text-[10px] border border-green-300 rounded-[4px] focus:outline-none focus:border-green-500 font-bold bg-white text-green-800">
              <option>BY GC-NUM</option>
            </select>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="ENTER GC NUMBER TO SEARCH"
                value={gcNumber}
                onChange={(e) => setGcNumber(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && searchGC()}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-[4px] focus:border-green-500 focus:ring-1 focus:ring-green-200 outline-none font-medium"
              />
            </div>
            <button
              onClick={searchGC}
              disabled={searchLoading}
              className="px-4 py-1.5 bg-green-600 text-white rounded-[4px] hover:bg-green-700 transition-all text-xs font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {searchLoading ? (
                <>
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  Searching
                </>
              ) : (
                <>
                  <Search size={14} />
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
        <div className="bg-yellow-50 p-2.5 rounded-lg border-2 border-yellow-200 mb-2">
          <h3 className="font-bold text-gray-800 mb-2 text-sm">Way Bill Edit</h3>
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Bill Date</label>
              <input
                type="date"
                value={formData.billDate}
                onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                disabled={true}
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
              <SearchableSelect
                placeholder="Search Destination"
                options={destinations.map(d => ({ id: d.id, label: d.city_name || d.branch_name, raw: d }))}
                value={formData.destinationId}
                onSelect={(id) => {
                  setFormData(prev => ({ ...prev, destinationId: id }));
                  setOpenSelect(null);
                }}
                searchTerm={destinationSearch}
                setSearchTerm={setDestinationSearch}
                isOpen={openSelect === 'destination'}
                onToggle={() => setOpenSelect(openSelect === 'destination' ? null : 'destination')}
                disabled={!saveEnabled}
              />
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
              <SearchableSelect
                placeholder="Search Consignor (Name/Code)"
                options={consignors
                  .filter(c => !formData.originBranchId || parseInt(c.branch_id) === parseInt(formData.originBranchId))
                  .map(c => ({ id: c.id, label: `${c.name} (${c.code || 'No Code'})`, raw: c }))
                }
                value={formData.consignorId}
                onSelect={(id) => {
                  setFormData(prev => ({ ...prev, consignorId: id }));
                  setOpenSelect(null);
                }}
                searchTerm={consignorSearch}
                setSearchTerm={setConsignorSearch}
                isOpen={openSelect === 'consignor'}
                onToggle={() => setOpenSelect(openSelect === 'consignor' ? null : 'consignor')}
                disabled={!saveEnabled}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Consignee</label>
              <SearchableSelect
                placeholder="Search Consignee (Name/Code)"
                options={consignees
                  .filter(c => !formData.destinationId || parseInt(c.destination_id) === parseInt(formData.destinationId))
                  .map(c => ({ id: c.id, label: `${c.name} (${c.code || 'No Code'})`, raw: c }))
                }
                value={formData.consigneeId}
                onSelect={(id) => {
                  setFormData(prev => ({ ...prev, consigneeId: id }));
                  setOpenSelect(null);
                }}
                searchTerm={consigneeSearch}
                setSearchTerm={setConsigneeSearch}
                isOpen={openSelect === 'consignee'}
                onToggle={() => setOpenSelect(openSelect === 'consignee' ? null : 'consignee')}
                disabled={!saveEnabled}
              />
            </div>
          </div>
        </div>

        {/* Article Details Table */}
        {articles.length > 0 && (
          <div className="bg-green-50 p-2.5 rounded-lg border-2 border-green-300 mb-2">
            <h3 className="font-bold text-gray-800 mb-2 text-sm">Article Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-green-100 border-b border-green-300">
                  <tr>
                    <th className="px-2 py-2 text-left font-bold">Article Type</th>
                    <th className="px-2 py-2 text-left font-bold">No Of Articles</th>
                    <th className="px-2 py-2 text-left font-bold">DD Rate</th>
                    <th className="px-2 py-2 text-left font-bold">DD Total</th>
                    <th className="px-2 py-2 text-left font-bold">Handling Rate</th>
                    <th className="px-2 py-2 text-left font-bold">Handling Total</th>
                    <th className="px-2 py-2 text-left font-bold">Freight per Kg</th>
                    <th className="px-2 py-2 text-left font-bold">Act Wt</th>
                    <th className="px-2 py-2 text-left font-bold">Charged Wt</th>
                    <th className="px-2 py-2 text-left font-bold">Total Freight</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article, idx) => (
                    <tr key={idx} className="border-b hover:bg-green-50">
                      <td className="px-2 py-1">{article.article_type || '-'}</td>
                      <td className="px-2 py-1">
                        <input type="number" value={article.no_of_articles || ''} onChange={(e) => handleArticleChange(idx, 'no_of_articles', e.target.value)} disabled={!saveEnabled} className="w-16 px-1 py-1 text-xs border border-gray-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-200 outline-none disabled:bg-gray-100" />
                      </td>
                      <td className="px-2 py-1">
                        <input type="number" step="0.01" value={article.dd_rate || ''} onChange={(e) => handleArticleChange(idx, 'dd_rate', e.target.value)} disabled={!saveEnabled} className="w-16 px-1 py-1 text-xs border border-gray-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-200 outline-none disabled:bg-gray-100" />
                      </td>
                      <td className="px-2 py-1 font-bold text-gray-700">₹{parseFloat(article.dd_total || 0).toFixed(2)}</td>
                      <td className="px-2 py-1">
                        <input type="number" step="0.01" value={article.handling_rate || ''} onChange={(e) => handleArticleChange(idx, 'handling_rate', e.target.value)} disabled={!saveEnabled} className="w-16 px-1 py-1 text-xs border border-gray-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-200 outline-none disabled:bg-gray-100" />
                      </td>
                      <td className="px-2 py-1 font-bold text-gray-700">₹{parseFloat(article.handling_total || 0).toFixed(2)}</td>
                      <td className="px-2 py-1">
                        <input type="number" step="0.01" value={article.freight || ''} onChange={(e) => handleArticleChange(idx, 'freight', e.target.value)} disabled={!saveEnabled} className="w-16 px-1 py-1 text-xs border border-gray-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-200 outline-none disabled:bg-gray-100" />
                      </td>
                      <td className="px-2 py-1">
                        <input type="number" step="0.01" value={article.actual_weight || ''} onChange={(e) => handleArticleChange(idx, 'actual_weight', e.target.value)} disabled={!saveEnabled} className="w-16 px-1 py-1 text-xs border border-gray-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-200 outline-none disabled:bg-gray-100" />
                      </td>
                      <td className="px-2 py-1">
                        <input type="number" step="0.01" value={article.charged_weight || ''} onChange={(e) => handleArticleChange(idx, 'charged_weight', e.target.value)} disabled={!saveEnabled} className="w-16 px-1 py-1 text-xs border border-gray-300 rounded focus:border-green-500 focus:ring-1 focus:ring-green-200 outline-none disabled:bg-gray-100" />
                      </td>
                      <td className="px-2 py-1 font-black text-green-700">₹{parseFloat(article.amount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Section */}
        <div className="bg-yellow-50 p-2.5 rounded-lg border-2 border-yellow-200 mb-2">
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Articles</label>
              <input
                type="number"
                value={formData.totalArticles}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100 outline-none font-bold text-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Act Wt</label>
              <div className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-blue-50 font-bold text-blue-700">
                {articles.reduce((sum, a) => sum + (parseFloat(a.actual_weight) || 0), 0).toFixed(2)}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Chg Wt</label>
              <div className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-blue-50 font-bold text-blue-700">
                {articles.reduce((sum, a) => sum + (parseFloat(a.charged_weight) || 0), 0).toFixed(2)}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Freight</label>
              <input
                type="number"
                step="0.01"
                value={formData.freightAmount}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100 outline-none font-bold text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">DD</label>
              <input
                type="number"
                step="0.01"
                value={formData.ddCharges}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100 outline-none font-bold text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Handling</label>
              <input
                type="number"
                step="0.01"
                value={formData.handlingCharges}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100 outline-none font-bold text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Stationary</label>
              <input
                type="number"
                step="0.01"
                value={formData.stationaryCharges}
                onChange={(e) => setFormData({ ...formData, stationaryCharges: e.target.value })}
                disabled={!saveEnabled || (user?.role !== 'superadmin' && user?.role !== 'admin')}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Total</label>
              <input
                type="number"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                disabled={!saveEnabled || (user?.role !== 'superadmin' && user?.role !== 'admin')}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100 font-black text-green-700"
              />
            </div>
          </div>
        </div>

        {/* Invoice & Tax Section */}
        <div className="bg-yellow-50 p-2.5 rounded-lg border-2 border-yellow-200 mb-2">
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
                disabled={!saveEnabled || (user?.role !== 'superadmin' && user?.role !== 'admin')}
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
                <option value="account">Account</option>
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
                disabled={!saveEnabled || (user?.role !== 'superadmin' && user?.role !== 'admin')}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Final Section */}
        <div className="bg-yellow-50 p-2.5 rounded-lg border-2 border-yellow-200 mb-2">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Grand Total</label>
              <input
                type="number"
                step="0.01"
                value={formData.grandTotal}
                onChange={(e) => setFormData({ ...formData, grandTotal: e.target.value })}
                disabled={!saveEnabled || (user?.role !== 'superadmin' && user?.role !== 'admin')}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none disabled:bg-gray-100 font-bold"
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

      {/* Edit Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 animate-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <div className="p-2 bg-amber-50 rounded-lg">
                <RotateCcw size={24} />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tight">Modification Required</h2>
            </div>

            <p className="text-slate-500 text-xs font-bold leading-relaxed mb-6 italic">
              "You are changing billed amounts. Please provide a valid justification for this audit-sensitive action."
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Adjustment *</label>
                <textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g., Typo in freight, Discount approved by management..."
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
                  Authorize Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success / Error Popup */}
      {popup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden`}>
            {/* Coloured top bar */}
            <div className={`h-1.5 w-full ${popup.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full flex-shrink-0 ${popup.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                  {popup.type === 'success'
                    ? <CheckCircle size={28} className="text-green-600" />
                    : <XCircle size={28} className="text-red-500" />}
                </div>
                <div className="flex-1">
                  <h3 className={`text-base font-black mb-1 ${popup.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                    {popup.type === 'success' ? 'Updated Successfully' : 'Update Failed'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    {popup.message}
                  </p>
                </div>
                <button
                  onClick={() => setPopup(null)}
                  className="text-slate-300 hover:text-slate-500 transition-colors mt-0.5"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setPopup(null)}
                  className={`px-6 py-2 rounded-xl text-white text-sm font-black shadow-md transition-all ${popup.type === 'success'
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-100'
                    : 'bg-red-500 hover:bg-red-600 shadow-red-100'}`}
                >
                  {popup.type === 'success' ? 'Got it' : 'Dismiss'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
                  <h2 className="text-xl font-bold">Modification Guide</h2>
                  <p className="text-blue-100 text-xs">How to safely update waybill records</p>
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
                    Retrieving Records
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 ml-10">
                    <li>• Enter the <span className="font-semibold text-gray-800">GC Number</span> and press Enter or click Search.</li>
                    <li>• If the GC is found, all details (parties, amounts, articles) will load automatically.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-red-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">!</span>
                    Strict Rules
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 ml-10">
                    <li>• <span className="font-semibold text-gray-800">Delivered Status:</span> GCs already marked as Delivered <span className="text-red-600 font-bold underline">CANNOT</span> be modified.</li>
                    <li>• <span className="font-semibold text-gray-800">Field Locks:</span> Certain fields might be disabled based on your user role.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-orange-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">2</span>
                    Audit Compliance
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 ml-10">
                    <li>• <span className="font-semibold text-gray-800">Justification:</span> If you change any financial amount (Freight, DD, Handling, etc.), you <span className="italic underline">must</span> provide a valid reason.</li>
                    <li>• <span className="font-semibold text-gray-800">Audit Log:</span> The reason, admin ID, and timestamp are permanently recorded.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-purple-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">3</span>
                    Saving Changes
                  </div>
                  <div className="ml-10 space-y-2">
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">SAVE</span>
                      <span className="text-xs text-gray-500">Updates the database and clears the form.</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded">RESET</span>
                      <span className="text-xs text-gray-500">Discards edits and clears search results.</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-6 py-2 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-all shadow-lg"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GCModify

// Helper component for Searchable Selection
const SearchableSelect = ({ placeholder, options, value, onSelect, searchTerm, setSearchTerm, isOpen, onToggle, disabled }) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef(null);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.id.toString() === value?.toString());

  useEffect(() => {
    if (isOpen) {
      // Prioritize highlighting the already selected option if it's in the filtered list
      const idx = filteredOptions.findIndex(opt => opt.id.toString() === value?.toString());
      setActiveIndex(idx >= 0 ? idx : 0);
    } else {
      setActiveIndex(-1);
    }
  }, [isOpen, searchTerm]);

  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listRef.current) {
      const activeElement = listRef.current.children[activeIndex];
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [activeIndex, isOpen]);

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        onToggle();
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        setActiveIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
        e.preventDefault();
        break;
      case 'ArrowUp':
        setActiveIndex(prev => Math.max(prev - 1, 0));
        e.preventDefault();
        break;
      case 'PageDown':
        setActiveIndex(prev => Math.min(prev + 10, filteredOptions.length - 1));
        e.preventDefault();
        break;
      case 'PageUp':
        setActiveIndex(prev => Math.max(prev - 10, 0));
        e.preventDefault();
        break;
      case 'Enter':
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          onSelect(filteredOptions[activeIndex].id);
          setSearchTerm('');
        } else {
          onToggle();
        }
        e.preventDefault();
        break;
      case 'Escape':
        onToggle();
        e.preventDefault();
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <div
        onClick={disabled ? undefined : onToggle}
        tabIndex={disabled ? undefined : "0"}
        className={`w-full px-2 py-1.5 text-sm border rounded cursor-pointer flex justify-between items-center transition-all outline-none
          ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300' : 'bg-white text-gray-800'}
          ${isOpen && !disabled ? 'border-green-600 ring-2 ring-green-100 shadow-sm' : 'border-gray-300'}
          ${!isOpen && !disabled && 'focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:bg-white'}
          ${!selectedOption && !searchTerm ? 'text-gray-400 font-normal' : 'text-gray-800 font-bold'}`}
      >
        <div className="truncate overflow-hidden flex-1">
          {isOpen && !disabled ? (
            <input
              autoFocus
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full outline-none bg-transparent"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            selectedOption ? selectedOption.label : placeholder
          )}
        </div>
        <div className={`transition-transform duration-200 ${isOpen && !disabled ? 'rotate-180' : ''}`}>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={onToggle}></div>
          <div
            ref={listRef}
            className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onSelect(opt.id);
                    setSearchTerm('');
                  }}
                  className={`px-3 py-2 text-xs font-bold cursor-pointer transition-colors border-b border-gray-50 flex items-center justify-between
                    ${activeIndex === index ? 'bg-green-600 text-white' :
                      (value?.toString() === opt.id.toString() ? 'bg-green-50 text-green-700' : 'hover:bg-green-50 text-gray-700 hover:text-green-600')}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {value?.toString() === opt.id.toString() && (
                    <svg className={`w-3 h-3 ${activeIndex === index ? 'text-white' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-400 text-xs font-bold uppercase tracking-widest italic">
                No matching results
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
