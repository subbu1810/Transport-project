import React, { useState, useEffect, useRef } from 'react'
import { X, Printer, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const API_URL = 'http://localhost:8000/api/v1'

function GCEntry() {
  const [formData, setFormData] = useState({
    billDate: new Date().toISOString().split('T')[0],
    from: 'SINDHANUIR',
    to: '',
    consignor: '',
    consignee: '',
    address: '',
    articleDesc: '',
    totalArticles: '',
    freight: '',
    dd: '',
    handling: '',
    stationary: '',
    totalAmount: '',
    invoiceNo: '',
    declared: '',
    eWayBillNo: '',
    taxPayableBy: '',
    accountType: '',
    gstPercent: '',
    gstAmount: '',
    grandTotal: '',
    roadingClerk: '',
    remarks: ''
  })

  const [articles, setArticles] = useState([
    { id: 1, type: '', noOfArticles: 0, rate: 0.00, total: 0.00, handlingRate: 0.00, handlingTotal: 0.00, freight: 0.00, actWt: 0.00, chargedWt: 0.00, amount: 0.00 }
  ])

  const [consignors, setConsignors] = useState([])
  const [consignees, setConsignees] = useState([])
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [showReceipt, setShowReceipt] = useState(false)
  const [savedGC, setSavedGC] = useState(null)

  const printRef = useRef()

  const showNotify = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000)
  }

  // Fetch consignors from API
  const fetchConsignors = async () => {
    try {
      console.log('Fetching consignors from:', `${API_URL}/consignors`)
      const response = await fetch(`${API_URL}/consignors`)
      const data = await response.json()
      console.log('Consignors response:', data)
      if (data.success) {
        setConsignors(data.data)
        console.log('Consignors loaded:', data.data.length, 'items')
      } else {
        console.error('Consignors API error:', data.message)
      }
    } catch (err) {
      console.error('Error fetching consignors:', err)
    }
  }

  // Fetch consignees from API
  const fetchConsignees = async () => {
    try {
      console.log('Fetching consignees from:', `${API_URL}/consignees`)
      const response = await fetch(`${API_URL}/consignees`)
      const data = await response.json()
      console.log('Consignees response:', data)
      if (data.success) {
        setConsignees(data.data)
        console.log('Consignees loaded:', data.data.length, 'items')
      } else {
        console.error('Consignees API error:', data.message)
      }
    } catch (err) {
      console.error('Error fetching consignees:', err)
    }
  }

  const [originBranches, setOriginBranches] = useState([])
  const [currentUser, setCurrentUser] = useState(null)


  const [lookupData, setLookupData] = useState({
    articleTypes: []
  })

  const fetchLookups = async () => {
    try {
      const response = await fetch(`${API_URL}/lookups`)
      const data = await response.json()
      if (data.success) {
        setLookupData({
          articleTypes: data.data.filter(l => l.type === 'ARTICLE_TYPE' && l.is_active)
        })
      }
    } catch (err) {
      console.error('Error fetching lookups:', err)
    }
  }

  // Initial fetch
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    setCurrentUser(user)

    const initBranches = async () => {
      try {
        const response = await fetch(`${API_URL}/branches`)
        const data = await response.json()
        if (data.success) {
          const allBranches = data.data
          setDestinations(allBranches) // Show all branches in 'To'

          if (user) {
            if (user.role === 'superadmin') {
              setOriginBranches(allBranches)
            } else {
              // For admin, only show their own branch in 'From'
              const userBranch = allBranches.find(b => b.id === user.branch_id) || {
                id: user.branch_id,
                branch_name: user.branch_name,
                branch_code: user.branch_code
              }
              setOriginBranches([userBranch])
              setFormData(prev => ({ ...prev, from: user.branch_id }))
            }
          }
        }
      } catch (err) {
        console.error('Error fetching branches:', err)
      }
    }

    initBranches()
    fetchConsignors()
    fetchConsignees()
    fetchLookups()
  }, [])

  // When 'from' branch changes, we no longer need to filter destinations if it should show all
  useEffect(() => {
    // Keep this empty or remove if you want 'all branches' to always be visible
    // if (formData.from) {
    //   fetchDestinationsForBranch(formData.from)
    // }
  }, [formData.from])

  // Article Change Handler
  const handleArticleChange = (id, field, value) => {
    const updatedArticles = articles.map(article => {
      if (article.id === id) {
        let updated = { ...article, [field]: value }

        // If type changed, auto-fill rate from lookup value
        if (field === 'type') {
          const selectedLookup = lookupData.articleTypes.find(l => l.code === value)
          if (selectedLookup) {
            updated.rate = parseFloat(selectedLookup.value) || 0
          }
        }

        // Auto calculations
        const noOfArticles = parseFloat(updated.noOfArticles) || 0
        const rate = parseFloat(updated.rate) || 0
        const handlingRate = parseFloat(updated.handlingRate) || 0
        const freight = parseFloat(updated.freight) || 0

        updated.total = noOfArticles * rate
        updated.handlingTotal = noOfArticles * handlingRate
        updated.amount = updated.total + updated.handlingTotal + freight

        return updated
      }
      return article
    })
    setArticles(updatedArticles)
  }

  // Update Summary Totals when articles change
  useEffect(() => {
    const totalArticles = articles.reduce((sum, a) => sum + (parseFloat(a.noOfArticles) || 0), 0)
    const totalFreight = articles.reduce((sum, a) => sum + (parseFloat(a.freight) || 0), 0)
    const totalHandling = articles.reduce((sum, a) => sum + (parseFloat(a.handlingTotal) || 0), 0)
    const rowAmounts = articles.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0)

    // Add other charges from formData
    const dd = parseFloat(formData.dd) || 0
    const stationary = parseFloat(formData.stationary) || 0

    const subTotal = rowAmounts + dd + stationary
    const gstPercent = parseFloat(formData.gstPercent) || 0
    const gstAmount = (subTotal * gstPercent) / 100
    const grandTotal = subTotal + gstAmount

    setFormData(prev => ({
      ...prev,
      totalArticles: totalArticles.toString(),
      freight: totalFreight.toString(),
      handling: totalHandling.toString(),
      totalAmount: subTotal.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      grandTotal: grandTotal.toFixed(2)
    }))
  }, [articles, formData.dd, formData.stationary, formData.gstPercent])

  const handleSave = async () => {
    // Basic validation
    if (!formData.to || !formData.consignor || !formData.consignee) {
      showNotify('error', 'Please fill all required fields (To, Consignor, Consignee)')
      return
    }

    try {
      setSaving(true)
      const payload = {
        bill_date: formData.billDate,
        origin_branch_id: parseInt(formData.from),
        destination_id: parseInt(formData.to),
        consignor_id: parseInt(formData.consignor),
        consignee_id: parseInt(formData.consignee),
        article_desc: formData.articleDesc,
        total_articles: parseInt(formData.totalArticles) || 0,
        freight_amount: parseFloat(formData.freight) || 0,
        dd_charges: parseFloat(formData.dd) || 0,
        handling_charges: parseFloat(formData.handling) || 0,
        stationary_charges: parseFloat(formData.stationary) || 0,
        total_amount: parseFloat(formData.totalAmount) || 0,
        invoice_no: formData.invoiceNo,
        declared_value: parseFloat(formData.declared) || 0,
        eway_bill_no: formData.eWayBillNo,
        tax_payable_by: formData.taxPayableBy,
        account_type: formData.accountType,
        gst_percent: parseFloat(formData.gstPercent) || 0,
        gst_amount: parseFloat(formData.gstAmount) || 0,
        grand_total: parseFloat(formData.grandTotal) || 0,
        roading_clerk: formData.roadingClerk,
        remarks: formData.remarks,
        articles: articles.map(art => ({
          article_type: art.type,
          no_of_articles: parseInt(art.noOfArticles) || 0,
          rate: parseFloat(art.rate) || 0,
          total: parseFloat(art.total) || 0,
          handling_rate: parseFloat(art.handlingRate) || 0,
          handling_total: parseFloat(art.handlingTotal) || 0,
          freight: parseFloat(art.freight) || 0,
          actual_weight: parseFloat(art.actWt) || 0,
          charged_weight: parseFloat(art.chargedWt) || 0,
          amount: parseFloat(art.amount) || 0
        }))
      }

      const response = await fetch(`${API_URL}/waybills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (data.success) {
        showNotify('success', 'GC Saved Successfully!')
        setSavedGC(data.data)
        setShowReceipt(true)
      } else {
        showNotify('error', data.message || 'Failed to save GC')
      }
    } catch (err) {
      console.error('Save error:', err)
      showNotify('error', 'Server error while saving GC')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setFormData({
      billDate: new Date().toISOString().split('T')[0],
      from: 'SINDHANUIR',
      to: '',
      consignor: '',
      consignee: '',
      address: '',
      articleDesc: '',
      totalArticles: '',
      freight: '',
      dd: '',
      handling: '',
      stationary: '',
      totalAmount: '',
      invoiceNo: '',
      declared: '',
      eWayBillNo: '',
      taxPayableBy: '',
      accountType: '',
      gstPercent: '',
      gstAmount: '',
      grandTotal: '',
      roadingClerk: '',
      remarks: ''
    })
    setArticles([{ id: 1, type: '', noOfArticles: 0, rate: 0.00, total: 0.00, handlingRate: 0.00, handlingTotal: 0.00, freight: 0.00, actWt: 0.00, chargedWt: 0.00, amount: 0.00 }])
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">GC Entry</h1>

      <div className="bg-white rounded-lg shadow-md p-4">
        {/* Way Bill Entry Section */}
        <div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-200 mb-3">
          <h3 className="font-bold text-gray-800 mb-2 text-sm">Way Bill Entry</h3>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Bill Date</label>
              <input type="date" value={formData.billDate} onChange={(e) => setFormData({ ...formData, billDate: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">From</label>
              <select
                value={formData.from}
                onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                disabled={currentUser?.role !== 'superadmin'}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded disabled:bg-gray-100 font-bold"
              >
                {!formData.from && <option value="">Select Branch</option>}
                {originBranches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">To</label>
              <select value={formData.to} onChange={(e) => setFormData({ ...formData, to: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                <option value="">Select Destination</option>
                {destinations.map((destination) => (
                  <option key={destination.id} value={destination.id}>
                    {destination.branch_name || destination.city_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Article Desc</label>
              <input type="text" value={formData.articleDesc} onChange={(e) => setFormData({ ...formData, articleDesc: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Consignor</label>
              <select value={formData.consignor} onChange={(e) => setFormData({ ...formData, consignor: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                <option value="">Select Consignor</option>
                {consignors.map((consignor) => (
                  <option key={consignor.id} value={consignor.id}>
                    {consignor.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Consignee</label>
              <select value={formData.consignee} onChange={(e) => setFormData({ ...formData, consignee: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                <option value="">Select Consignee</option>
                {consignees.map((consignee) => (
                  <option key={consignee.id} value={consignee.id}>
                    {consignee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Article Details Table */}
        <div className="bg-green-50 p-3 rounded-lg border-2 border-green-300 mb-3">
          <h3 className="font-bold text-gray-800 mb-2 text-sm">Article Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-green-100 border-b border-green-300">
                <tr>
                  <th className="px-2 py-1 text-left font-semibold">Article Type</th>
                  <th className="px-2 py-1 text-left font-semibold">No Of Article</th>
                  <th className="px-2 py-1 text-left font-semibold">Rate</th>
                  <th className="px-2 py-1 text-left font-semibold">Total</th>
                  <th className="px-2 py-1 text-left font-semibold">HANDLING Rate</th>
                  <th className="px-2 py-1 text-left font-semibold">Total</th>
                  <th className="px-2 py-1 text-left font-semibold">Freight</th>
                  <th className="px-2 py-1 text-left font-semibold">Act Wt</th>
                  <th className="px-2 py-1 text-left font-semibold">Charged Wt</th>
                  <th className="px-2 py-1 text-left font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className="border-b">
                    <td className="px-2 py-1">
                      <select
                        value={article.type}
                        onChange={(e) => handleArticleChange(article.id, 'type', e.target.value)}
                        className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded"
                      >
                        <option value="">Select</option>
                        {lookupData.articleTypes.map(type => (
                          <option key={type.id} value={type.code}>{type.code}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1"><input type="number" value={article.noOfArticles} onChange={(e) => handleArticleChange(article.id, 'noOfArticles', e.target.value)} className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded" /></td>
                    <td className="px-2 py-1"><input type="number" value={article.rate} onChange={(e) => handleArticleChange(article.id, 'rate', e.target.value)} className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded" /></td>
                    <td className="px-2 py-1 text-center font-semibold text-gray-700">{article.total.toFixed(2)}</td>
                    <td className="px-2 py-1"><input type="number" value={article.handlingRate} onChange={(e) => handleArticleChange(article.id, 'handlingRate', e.target.value)} className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded" /></td>
                    <td className="px-2 py-1 text-center font-semibold text-gray-700">{article.handlingTotal.toFixed(2)}</td>
                    <td className="px-2 py-1"><input type="number" value={article.freight} onChange={(e) => handleArticleChange(article.id, 'freight', e.target.value)} className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded" /></td>
                    <td className="px-2 py-1"><input type="number" value={article.actWt} onChange={(e) => handleArticleChange(article.id, 'actWt', e.target.value)} className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded" /></td>
                    <td className="px-2 py-1"><input type="number" value={article.chargedWt} onChange={(e) => handleArticleChange(article.id, 'chargedWt', e.target.value)} className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded" /></td>
                    <td className="px-2 py-1 text-center font-bold text-green-700">{article.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2">
              <button
                onClick={() => setArticles([...articles, { id: Date.now(), type: '', noOfArticles: 0, rate: 0.00, total: 0.00, handlingRate: 0.00, handlingTotal: 0.00, freight: 0.00, actWt: 0.00, chargedWt: 0.00, amount: 0.00 }])}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition font-semibold"
              >
                + Add Row
              </button>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-200 mb-3">
          <div className="grid grid-cols-6 gap-2 mb-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Total Articles</label>
              <input type="text" readOnly value={formData.totalArticles} className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Freight</label>
              <input type="text" readOnly value={formData.freight} className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">DD</label>
              <input type="number" value={formData.dd} onChange={(e) => setFormData({ ...formData, dd: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Handling</label>
              <input type="text" readOnly value={formData.handling} className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Stationary</label>
              <input type="number" value={formData.stationary} onChange={(e) => setFormData({ ...formData, stationary: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Total Amount</label>
              <input type="text" readOnly value={formData.totalAmount} className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 font-bold text-green-700" />
            </div>
          </div>
        </div>

        {/* Invoice & Tax Section */}
        <div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-200 mb-3">
          <div className="grid grid-cols-7 gap-2 mb-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Invoice No</label>
              <input type="text" value={formData.invoiceNo} onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Declared</label>
              <input type="text" value={formData.declared} onChange={(e) => setFormData({ ...formData, declared: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">E-WayBill No</label>
              <input type="text" value={formData.eWayBillNo} onChange={(e) => setFormData({ ...formData, eWayBillNo: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tax Payable By</label>
              <select value={formData.taxPayableBy} onChange={(e) => setFormData({ ...formData, taxPayableBy: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                <option value="">Select</option>
                <option value="consignor">Consignor</option>
                <option value="consignee">Consignee</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Account Type</label>
              <select value={formData.accountType} onChange={(e) => setFormData({ ...formData, accountType: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                <option value="">Select</option>
                <option value="paid">Paid</option>
                <option value="topay">To Pay</option>
                <option value="tobebilled">To Be Billed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">GST(%)</label>
              <input type="number" value={formData.gstPercent} onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">GST AMT</label>
              <input type="text" readOnly value={formData.gstAmount} className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 font-bold" />
            </div>
          </div>
        </div>

        {/* Final Section */}
        <div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-200 mb-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Grand Total</label>
              <input type="text" readOnly value={formData.grandTotal} className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 font-bold text-green-700 text-lg" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Roading Clerk</label>
              <input type="text" value={formData.roadingClerk} onChange={(e) => setFormData({ ...formData, roadingClerk: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks</label>
              <input type="text" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-center">
          <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold shadow-md flex items-center gap-2">
            Validate
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : 'Save'}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-bold shadow-md flex items-center gap-2"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification.show && (
        <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-up ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
          {notification.type === 'success' ? <CheckCircle /> : <AlertCircle />}
          <p className="font-semibold">{notification.message}</p>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && savedGC && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 flex justify-center py-10 px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-8 relative self-start">
            <button
              onClick={() => setShowReceipt(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 print:hidden transition-colors"
            >
              <X size={28} />
            </button>
            <div className="flex justify-between items-center mb-6 print:hidden">
              <h2 className="text-2xl font-bold text-gray-800">GC Receipt Preview</h2>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition shadow-lg"
              >
                <Printer size={20} /> Print Receipt
              </button>
            </div>

            {/* Print Area */}
            <div id="printable-receipt" className="receipt-container">
              {[1, 2, 3].map((copyNum) => (
                <div key={copyNum} className="receipt-copy">
                  {/* Copy Label */}
                  <div className="receipt-label">
                    {copyNum === 1 ? 'CONSIGNOR COPY' : copyNum === 2 ? 'CONSIGNEE COPY' : 'OFFICE COPY'}
                  </div>

                  {/* Header */}
                  <div className="receipt-header">
                    <div className="header-left">
                      <span className="owner-name">Sri Kampli Somappa Prasanna</span>
                      <div className="logo-box">SRK</div>
                    </div>
                    <div className="header-center">
                      <h1 className="company-name">SRI RADHAKRISHNA LOGISTICS</h1>
                      <p className="address-text">
                        Ramana Cotton Industries, D.No. 86, W.No. 10, Andral Road, BALLARI-583101 (K.S.) Cell: 8197395650, 6360605692, 9902089382<br />
                        Branches: Bangalore - 9980346949, Chikkaballapur - 7676464594, Davanagere - 9743409410, Gangavathi - 7760562838, Raichur - 9480556449, Sindhanur - 6366732667, Shahapur - 9019943109
                      </p>
                    </div>
                    <div className="header-right">
                      <div className="contact-info">Email : srrklogistics07@gmail.com</div>
                      <div className="contact-info">Transport ID: 29BIVPR3224F2ZS</div>
                      <div className="qr-box"></div>
                    </div>
                  </div>

                  {/* GC Details Grid */}
                  <div className="details-table">
                    <table className="w-full text-[10px] font-bold border-t border-b border-red-800">
                      <tbody>
                        <tr>
                          <td className="w-1/4 py-1">GC Number:</td>
                          <td className="w-1/4 text-red-700">{savedGC.gc_number}</td>
                          <td className="w-1/4">Invoice No:</td>
                          <td className="w-1/4">{savedGC.invoice_no || '-'}</td>
                        </tr>
                        <tr>
                          <td className="py-1">Date:</td>
                          <td>{savedGC.bill_date}</td>
                          <td>Consignee:</td>
                          <td>{savedGC.consignee?.name}</td>
                        </tr>
                        <tr>
                          <td className="py-1">Consignor:</td>
                          <td>{savedGC.consignor?.name}</td>
                          <td>To:</td>
                          <td>{savedGC.destination?.city_name}</td>
                        </tr>
                        <tr>
                          <td className="py-1">From:</td>
                          <td>{savedGC.origin_branch?.branch_name || 'SINDHANUR'}</td>
                          <td>Payable By:</td>
                          <td className="uppercase">{savedGC.tax_payable_by}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Articles Table */}
                  <table className="w-full mt-2 border-collapse text-[10px] font-bold">
                    <thead>
                      <tr className="bg-gray-50 border-b border-red-800 text-red-800">
                        <th className="text-left py-1">Article Type</th>
                        <th className="text-right py-1">Qty</th>
                        <th className="text-right py-1">Rate</th>
                        <th className="text-right py-1">Freight</th>
                        <th className="text-right py-1">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedGC.articles?.map((art, idx) => (
                        <tr key={idx} className="border-b border-gray-100 last:border-b-0">
                          <td className="py-0.5">{art.article_type}</td>
                          <td className="text-right py-0.5">{art.no_of_articles}</td>
                          <td className="text-right py-0.5">{parseFloat(art.rate).toFixed(2)}</td>
                          <td className="text-right py-0.5">{parseFloat(art.freight).toFixed(2)}</td>
                          <td className="text-right py-0.5">{parseFloat(art.amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals Section */}
                  <div className="flex justify-end mt-2 text-[10px] font-bold text-gray-800">
                    <div className="w-48">
                      <div className="flex justify-between border-b border-gray-200">
                        <span>Sub Total:</span>
                        <span>₹{savedGC.total_amount}</span>
                      </div>
                      {parseFloat(savedGC.gst_amount) > 0 && (
                        <div className="flex justify-between border-b border-gray-200">
                          <span>GST ({savedGC.gst_percent}%):</span>
                          <span>₹{savedGC.gst_amount}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-red-800 text-xl font-black mt-1">
                        <span>TOTAL:</span>
                        <span className="underline border-double border-b-2 border-red-800">₹{savedGC.grand_total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Note */}
                  <div className="footer-note">
                    Note : 1) We are not responsible for Damage, Leakage of goods 2) Unloading by party 3) Booked at owner's risk
                  </div>
                </div>
              ))}
            </div>

            <style>{`
              #printable-receipt {
                color: #991b1b;
                margin-top: 20px;
              }
              .receipt-copy {
                border: 1px solid #991b1b;
                padding: 10px;
                margin-bottom: 10px;
                position: relative;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              }
              .receipt-label {
                position: absolute;
                top: 5px;
                right: 10px;
                font-size: 10px;
                font-weight: 800;
                color: #991b1b;
                font-style: italic;
              }
              .receipt-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 10px;
                border-bottom: 1.5px solid #991b1b;
                padding-bottom: 5px;
              }
              .header-left { width: 15%; }
              .header-center { width: 70%; text-align: center; }
              .header-right { width: 15%; text-align: right; }
              
              .owner-name { font-size: 8px; font-weight: 800; display: block; }
              .logo-box { width: 40px; height: 40px; border: 1.5px solid #991b1b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px; margin-top: 5px; }
              .company-name { font-size: 20px; font-weight: 950; margin: 0; line-height: 1; letter-spacing: -1px; }
              .address-text { font-size: 8px; font-weight: 700; margin-top: 2px; line-height: 1.2; }
              .contact-info { font-size: 7px; font-weight: 800; line-height: 1.1; }
              .qr-box { width: 40px; height: 40px; border: 1px solid #991b1b; margin-left: auto; margin-top: 2px; }
              
              .footer-note { 
                border-top: 1px dashed #991b1b; 
                margin-top: 10px; 
                padding-top: 5px; 
                font-size: 8px; 
                font-weight: 800; 
                text-align: center; 
                font-style: italic;
              }

              @media print {
                @page { size: A4; margin: 5mm; }
                body * { visibility: hidden; }
                #printable-receipt, #printable-receipt * { visibility: visible; }
                #printable-receipt {
                   position: fixed;
                   top: 2mm;
                   left: 2mm;
                   right: 2mm;
                   display: block;
                }
                .receipt-copy {
                   height: 90mm;
                   margin-bottom: 5mm;
                   page-break-inside: avoid;
                   border: 1px solid #991b1b !important;
                }
                .text-red-700 { color: #991b1b !important; }
                .text-red-800 { color: #991b1b !important; }
                header, footer, nav, aside { display: none !important; }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  )
}

export default GCEntry
