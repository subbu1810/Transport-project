import React, { useState, useEffect, useRef } from 'react'
import { X, Printer, Loader2, CheckCircle, AlertCircle, HelpCircle, FileText } from 'lucide-react'
import GCEntryReceipt from '../components/GCEntryReceipt'
import { API_BASE_URL, STORAGE_URL } from '../config/api';
import { applyBranchOverrides } from '../utils/branchOverrides';




function GCEntry() {
  const [formData, setFormData] = useState({
    billDate: new Date().toISOString().split('T')[0],
    from: '',
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
    cashReceived: true,
    gstPercent: '0',
    gstAmount: '',
    grandTotal: '',
    remarks: '',
    totalActWt: '0.00',
    totalChgWt: '0.00'
  })

  const [articles, setArticles] = useState([
    { id: 1, type: '', noOfArticles: '', rate: '', total: 0.00, ddRate: '', ddTotal: 0.00, handlingRate: '', handlingTotal: 0.00, freight: '', freightTotal: 0.00, actWt: '', chargedWt: '', amount: 0.00 }
  ])

  const [consignors, setConsignors] = useState([])
  const [consignees, setConsignees] = useState([])
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [showReceipt, setShowReceipt] = useState(false)
  const [savedGC, setSavedGC] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [logoUrl, setLogoUrl] = useState(null)
  const [companyDetails, setCompanyDetails] = useState(null)
  const [allBranches, setAllBranches] = useState([])
  const [showHelp, setShowHelp] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const [checkLoading, setCheckLoading] = useState(false)
  const [printOnlyContent, setPrintOnlyContent] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [printMode, setPrintMode] = useState('full')

  const printRef = useRef()

  const showNotify = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000)
  }

  const [rates, setRates] = useState([])
  const [originBranches, setOriginBranches] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [lookupData, setLookupData] = useState({ articleTypes: [] })

  // Searchable Select State
  const [consignorSearch, setConsignorSearch] = useState('')
  const [consigneeSearch, setConsigneeSearch] = useState('')
  const [destinationSearch, setDestinationSearch] = useState('')
  const [openSelect, setOpenSelect] = useState(null) // 'consignor' | 'consignee' | 'destination' | null

  // Initial fetch - Consolidated into a single backend API call for performance
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    setCurrentUser(user)

    if (user) {
      setCompanyDetails(applyBranchOverrides(user, {
        company_name: user.transport_name || user.branch?.branch_name || 'Transport Logistics',
        address: user.transport_address || user.branch?.branch_address || '',
        phone: user.transport_phone || user.branch?.branch_phone || '',
        mobile: user.transport_mobile || '',
        email: user.email || '',
        owner_name: user.name,
        gstin: user.transport_gstin || user.gstin || user.gst_number || '',
        logo_path: user.transport_logo_url || null,
        upi_qr_path: user.upi_qr_url || null
      }))
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/waybills/init-data`);
        const initDataRes = await response.json();

        if (initDataRes.success) {
          const {
            branches,
            destinations,
            consignors,
            consignees,
            lookups,
            rates,
            settings
          } = initDataRes.data;

          setAllBranches(branches);
          setDestinations(destinations);
          setConsignors(consignors);
          setConsignees(consignees);
          setLookupData({ articleTypes: lookups });
          setRates(rates);

          // Configure form branches based on role
          if (user) {
            if (user.role === 'superadmin') {
              setOriginBranches(branches)
              if (!formData.from && branches.length > 0) {
                setFormData(prev => ({ ...prev, from: branches[0].id }))
              }
            } else {
              const userBranch = branches.find(b => b.id === user.branch_id) || {
                id: user.branch_id,
                branch_name: user.branch_name,
                branch_code: user.branch_code
              }
              setOriginBranches([userBranch])
              setFormData(prev => ({ ...prev, from: user.branch_id }))
            }
          }

          // Assign Global Settings into Company details
          setCompanyDetails(prev => applyBranchOverrides(user || JSON.parse(localStorage.getItem('user') || '{}'), {
            ...prev,
            logo_path: prev?.logo_path || settings.logo_path,
            upi_id: settings.upi_id,
            upi_account_holder: settings.upi_account_holder,
            upi_qr_path: prev?.upi_qr_path || settings.upi_qr_path,
            gstin: user.transport_gstin || user.gstin || user.gst_number || settings.gst_number || settings.gstin || prev?.gstin || ''
          }));
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        showNotify('error', 'Failed to load master data. Please check server.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (formData.from && formData.billDate) {
      checkClosingStatus()
    }
  }, [formData.from, formData.billDate])

  const checkClosingStatus = async () => {
    try {
      setCheckLoading(true)
      const bid = formData.from
      const date = formData.billDate
      if (!bid || !date) return

      const response = await fetch(`${API_BASE_URL}/day-book-closings?from_date=${date}&to_date=${date}&branch_id=${bid}`)
      const d = await response.json()
      if (d.success) {
        setIsClosed(d.data.length > 0)
      }
    } catch (err) {
      console.error('Error checking closing status:', err)
    } finally {
      setCheckLoading(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'SRK'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 3)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN')
  }

  // Handle Consignor Selection
  const handleConsignorChange = (consignorId) => {
    const selected = consignors.find(c => c.id === parseInt(consignorId))
    if (selected) {
      setFormData(prev => ({
        ...prev,
        consignor: consignorId,
        stationary: (selected.stationary_charges !== undefined && selected.stationary_charges !== null) ? selected.stationary_charges.toString() : prev.stationary,
        accountType: selected.freight_account ? selected.freight_account.toLowerCase() : prev.accountType
      }))
      // Trigger rate recalculation for existing articles
      recalculateAllArticles(consignorId, formData.to, articles)
    } else {
      setFormData(prev => ({ ...prev, consignor: consignorId }))
    }
  }

  // Handle Consignee Selection
  const handleConsigneeChange = (consigneeId) => {
    const selected = consignees.find(c => c.id === parseInt(consigneeId))
    if (selected) {
      const destinationId = selected.destination_id
      setFormData(prev => ({
        ...prev,
        consignee: consigneeId,
        to: (destinationId && !prev.to) ? destinationId.toString() : prev.to
      }))
      // Trigger rate recalculation
      recalculateAllArticles(formData.consignor, destinationId, articles)
    } else {
      setFormData(prev => ({ ...prev, consignee: consigneeId }))
    }
  }

  // Handle Destination Change
  const handleDestinationChange = (destId) => {
    setFormData(prev => ({ ...prev, to: destId, consignee: '' }))
    recalculateAllArticles(formData.consignor, destId, articles)
  }

  const recalculateAllArticles = (consignorId, destId, currentArticles) => {
    if (!consignorId || !destId) return;

    let foundDD = 0
    const updated = currentArticles.map(article => {
      // Find rate for this specific article type
      const rateRecord = rates.find(r =>
        r.consignor_id === parseInt(consignorId) &&
        r.destination_id === parseInt(destId) &&
        r.article_type === article.type &&
        r.is_active
      )

      if (rateRecord) {
        foundDD = rateRecord.dd_charges // Capture DD from rate master

        const newFreight = parseFloat(rateRecord.freight_charges) || article.freight
        const newHandling = parseFloat(rateRecord.handling_charges) || article.handlingRate
        const newDD = parseFloat(rateRecord.dd_charges) || 0

        return calculateArticleRow({
          ...article,
          rate: 0, // Reset article-based rate if a specialized freight-per-kg rate is found
          freight: newFreight,
          handlingRate: newHandling,
          ddRate: newDD
        })
      }
      return article
    })

    setArticles(updated)
    if (foundDD > 0) {
      setFormData(prev => ({ ...prev, dd: foundDD.toString() }))
    }
  }

  const calculateArticleRow = (updated) => {
    const noOfArticles = parseFloat(updated.noOfArticles) || 0
    const rate = parseFloat(updated.rate) || 0
    const ddRate = parseFloat(updated.ddRate) || 0
    const handlingRate = parseFloat(updated.handlingRate) || 0
    const freightPerKg = parseFloat(updated.freight) || 0
    const chargedWt = parseFloat(updated.chargedWt) || 0

    // Core Principle: Use EITHER Per-Article Rate OR Per-Kg Freight
    // If Freight per Kg is provided, it takes precedence for the freight basic total
    const articleBasicTotal = (rate > 0) ? (noOfArticles * rate) : 0
    const freightWeightTotal = (freightPerKg > 0) ? (chargedWt * freightPerKg) : 0

    // Total for this row's Freight component
    const total = (freightPerKg > 0) ? freightWeightTotal : articleBasicTotal

    const ddTotal = noOfArticles * ddRate
    const handlingTotal = noOfArticles * handlingRate
    const amount = total // Just the basic/freight total to show in column

    return {
      ...updated,
      total,
      ddTotal,
      handlingTotal,
      freightTotal: freightWeightTotal,
      amount
    }
  }

  // Article Change Handler
  const handleArticleChange = (id, field, value) => {
    const updatedArticles = articles.map(article => {
      if (article.id === id) {
        let updated = { ...article, [field]: value }

        // Precedence: If manually editing Freight per Kg, zero out the Article Rate
        if (field === 'freight') {
          updated.rate = 0
        }

        // Precedence: If manually editing Act Wt / Chg Wt, we often use Weight based. 
        // But we leave rate alone unless specifically told to override.

        // If type changed, check specific rate master first
        if (field === 'type') {
          const customRate = rates.find(r =>
            r.consignor_id === parseInt(formData.consignor) &&
            r.destination_id === parseInt(formData.to) &&
            r.article_type === value &&
            r.is_active
          )

          if (customRate) {
            updated.rate = 0
            updated.freight = parseFloat(customRate.freight_charges) || 0
            updated.handlingRate = parseFloat(customRate.handling_charges) || 0
            updated.ddRate = parseFloat(customRate.dd_charges) || 0
          } else {
            const selectedLookup = lookupData.articleTypes.find(l => l.code === value)
            if (selectedLookup) {
              updated.rate = parseFloat(selectedLookup.value) || 0
              updated.freight = 0
              updated.handlingRate = 0
              updated.ddRate = 0
            }
          }
        }

        return calculateArticleRow(updated)
      }
      return article
    })
    setArticles(updatedArticles)
  }

  // Update Summary Totals when articles change
  useEffect(() => {
    let totals = {
      articles: 0,
      freight: 0,
      dd: 0,
      handling: 0,
      actWt: 0,
      chgWt: 0
    }

    articles.forEach(a => {
      totals.articles += (parseFloat(a.noOfArticles) || 0)
      totals.freight += (parseFloat(a.total) || 0) // Already contains (rate*qty OR wt*freight)
      totals.dd += (parseFloat(a.ddTotal) || 0)
      totals.handling += (parseFloat(a.handlingTotal) || 0)
      totals.actWt += (parseFloat(a.actWt) || 0)
      totals.chgWt += (parseFloat(a.chargedWt) || 0)
    })

    const stationary = parseFloat(formData.stationary) || 0
    const subTotal = totals.freight + totals.dd + totals.handling + stationary

    const gstPercent = parseFloat(formData.gstPercent) || 0
    const gstAmount = (subTotal * gstPercent) / 100
    const grandTotal = subTotal + gstAmount

    setFormData(prev => ({
      ...prev,
      totalArticles: totals.articles.toString(),
      freight: totals.freight.toFixed(2),
      dd: totals.dd.toFixed(2),
      handling: totals.handling.toFixed(2),
      totalAmount: subTotal.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      totalActWt: totals.actWt.toFixed(2),
      totalChgWt: totals.chgWt.toFixed(2)
    }))
  }, [articles, formData.stationary, formData.gstPercent])

  const checkInvoiceUniqueness = async (invNo) => {
    if (!invNo || !formData.consignor) return;

    try {
      const response = await fetch(`${API_BASE_URL}/waybills?consignor_id=${formData.consignor}&invoice_no=${invNo}`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        showNotify('error', `Invoice No: ${invNo} is already registered for this consignor!`);
        // Maybe clear the field? Or just leave the error notification. 
        // User asked to "show error", so I will just show error.
      }
    } catch (err) {
      console.error('Uniqueness check failed', err);
    }
  }

  const handleSave = () => {
    if (isClosed) {
      showNotify('error', 'Access Denied: DayBook is closed for this date.')
      return
    }
    // 1. Basic Main Form Validation
    const requiredMainFields = [
      { key: 'from', label: 'From Branch' },
      { key: 'to', label: 'To Destination' },
      { key: 'consignor', label: 'Consignor' },
      { key: 'consignee', label: 'Consignee' },
      { key: 'articleDesc', label: 'Article Description' },
      { key: 'invoiceNo', label: 'Invoice No' },
      { key: 'declared', label: 'Declared Value' },
      { key: 'taxPayableBy', label: 'Tax Payable By' },
      { key: 'accountType', label: 'Account Type' },
      { key: 'gstPercent', label: 'GST Percentage' },
      { key: 'stationary', label: 'Stationary Charges' }
    ];

    for (const field of requiredMainFields) {
      if (formData[field.key] === undefined || formData[field.key] === null || formData[field.key].toString().trim() === '') {
        showNotify('error', `${field.label} is mandatory!`);
        return;
      }
    }

    // 2. Article Rows Validation
    if (articles.length === 0) {
      showNotify('error', 'At least one article row is required!');
      return;
    }

    for (let i = 0; i < articles.length; i++) {
      const art = articles[i];
      const rowNum = i + 1;

      if (!art.type) {
        showNotify('error', `Article Type is missing in row ${rowNum}`);
        return;
      }
      if (art.noOfArticles === '' || parseFloat(art.noOfArticles) <= 0) {
        showNotify('error', `Number of Articles must be greater than 0 in row ${rowNum}`);
        return;
      }
      if (art.ddRate === '') {
        showNotify('error', `DD Rate is missing in row ${rowNum} (Enter 0 if not applicable)`);
        return;
      }
      if (art.handlingRate === '') {
        showNotify('error', `Handling Rate is missing in row ${rowNum} (Enter 0 if not applicable)`);
        return;
      }
      if (art.freight === '') {
        showNotify('error', `Freight per Kg is missing in row ${rowNum}`);
        return;
      }
      if (art.actWt === '' || parseFloat(art.actWt) <= 0) {
        showNotify('error', `Actual Weight must be greater than 0 in row ${rowNum}`);
        return;
      }
      if (art.chargedWt === '' || parseFloat(art.chargedWt) <= 0) {
        showNotify('error', `Charged Weight must be greater than 0 in row ${rowNum}`);
        return;
      }
    }

    // 3. E-Way Bill Validation: Mandatory for declared value > 49,999
    const declaredValue = parseFloat(formData.declared) || 0;
    if (declaredValue > 49999 && (!formData.eWayBillNo || formData.eWayBillNo.trim() === '')) {
      showNotify('error', 'Declared Value exceeds ₹49,999. E-Way Bill No. is mandatory.');
      return;
    }

    setShowConfirmModal(true)
  }

  const confirmSave = async () => {
    setShowConfirmModal(false)
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
        cash_received: formData.accountType === 'paid' ? formData.cashReceived : false,
        gst_percent: parseFloat(formData.gstPercent) || 0,
        gst_amount: parseFloat(formData.gstAmount) || 0,
        grand_total: parseFloat(formData.grandTotal) || 0,
        remarks: formData.remarks,
        created_by: currentUser?.id,
        booking_clerk: currentUser?.full_name || currentUser?.name || 'ADMIN',
        articles: articles.map(art => ({
          article_type: art.type,
          no_of_articles: parseInt(art.noOfArticles) || 0,
          rate: parseFloat(art.rate) || 0,
          total: parseFloat(art.total) || 0,
          handling_rate: parseFloat(art.handlingRate) || 0,
          handling_total: parseFloat(art.handlingTotal) || 0,
          dd_rate: parseFloat(art.ddRate) || 0,
          dd_total: parseFloat(art.ddTotal) || 0,
          freight: parseFloat(art.freight) || 0,
          actual_weight: parseFloat(art.actWt) || 0,
          charged_weight: parseFloat(art.chargedWt) || 0,
          amount: parseFloat(art.amount) || 0
        }))
      }

      const response = await fetch(`${API_BASE_URL}/waybills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (data.success) {
        showNotify('success', 'GC Saved Successfully!')
        setSavedGC(data.data)
        setShowReceipt(true)
        // Note: handleReset is called when the user closes the Receipt Modal
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
      from: currentUser?.branch_id || (allBranches.length > 0 ? allBranches[0].id : ''),
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
      cashReceived: true,
      gstPercent: '0',
      gstAmount: '',
      grandTotal: '',
      remarks: '',
      totalActWt: '0.00',
      totalChgWt: '0.00'
    })
    setArticles([{ id: Date.now(), type: '', noOfArticles: '', rate: '', total: 0.00, ddRate: '', ddTotal: 0.00, handlingRate: '', handlingTotal: 0.00, freight: '', freightTotal: 0.00, actWt: '', chargedWt: '', amount: 0.00 }])
  }

  const handlePrint = (mode = 'full') => {
    setPrintMode(mode);
    setPrintOnlyContent(mode === 'content');
    setShowPrintPreview(true);
  }

  const executePrint = () => {
    const mode = printMode;
    const printableArea = document.getElementById('gc-entry-printable-receipt');
    if (!printableArea) {
      setTimeout(() => window.print(), 100);
      return;
    }

    const images = printableArea.querySelectorAll('img');
    const promises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        const timer = setTimeout(() => {
          img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
          resolve();
        }, 2000);
        img.onload = () => { clearTimeout(timer); resolve(); };
        img.onerror = () => { clearTimeout(timer); resolve(); };
      });
    });

    Promise.all(promises).then(() => {
      setTimeout(() => {
        const originalTitle = document.title;
        if (savedGC?.gc_number) document.title = `GC-${savedGC.gc_number}`;
        document.body.classList.add('is-printing-receipt');
        if (mode === 'content') document.body.classList.add('is-content-only');
        const cleanup = () => {
          document.title = originalTitle;
          document.body.classList.remove('is-printing-receipt');
          document.body.classList.remove('is-content-only');
          window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        window.print();
      }, 500);
    });
  }

  return (
    <div className="p-4">
      <div className="gc-entry-main-content">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">GC Entry</h1>
          <button
            onClick={() => setShowHelp(true)}
            className="p-1.5 bg-white text-blue-600 rounded-full shadow-sm hover:shadow-md hover:bg-blue-50 transition-all border border-blue-100 group"
            title="How to use GC Entry"
          >
            <HelpCircle size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          {/* Way Bill Entry Section */}
          <div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-200 mb-3">
            <h3 className="font-bold text-gray-800 mb-2 text-sm">Way Bill Entry</h3>
            <div className="grid grid-cols-4 gap-2 mb-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Bill Date <span className="text-red-500">*</span></label>
                <input type="date" value={formData.billDate} onChange={(e) => setFormData({ ...formData, billDate: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">From <span className="text-red-500">*</span></label>
                <select
                  value={formData.from}
                  onChange={(e) => setFormData({ ...formData, from: e.target.value, consignor: '' })}
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">To <span className="text-red-500">*</span></label>
                <SearchableSelect
                  placeholder="Search Destination"
                  options={destinations.map(d => ({ id: d.id, label: d.city_name || d.branch_name, raw: d }))}
                  value={formData.to}
                  onSelect={(id) => {
                    handleDestinationChange(id);
                    setOpenSelect(null);
                  }}
                  searchTerm={destinationSearch}
                  setSearchTerm={setDestinationSearch}
                  isOpen={openSelect === 'destination'}
                  onToggle={() => setOpenSelect(openSelect === 'destination' ? null : 'destination')}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Article Desc <span className="text-red-500">*</span></label>
                <input type="text" value={formData.articleDesc} onChange={(e) => setFormData({ ...formData, articleDesc: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Consignor <span className="text-red-500">*</span></label>
                <SearchableSelect
                  placeholder="Search Consignor (Name/Code)"
                  options={consignors
                    .filter(c => !formData.from || parseInt(c.branch_id) === parseInt(formData.from))
                    .map(c => ({ id: c.id, label: `${c.name} (${c.code || 'No Code'})`, raw: c }))
                  }
                  value={formData.consignor}
                  onSelect={(id) => {
                    handleConsignorChange(id);
                    setOpenSelect(null);
                  }}
                  searchTerm={consignorSearch}
                  setSearchTerm={setConsignorSearch}
                  isOpen={openSelect === 'consignor'}
                  onToggle={() => setOpenSelect(openSelect === 'consignor' ? null : 'consignor')}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Consignee <span className="text-red-500">*</span></label>
                <SearchableSelect
                  placeholder="Search Consignee (Name/Code)"
                  options={consignees
                    .filter(c => !formData.to || parseInt(c.destination_id) === parseInt(formData.to))
                    .map(c => ({ id: c.id, label: `${c.name} (${c.code || 'No Code'})`, raw: c }))
                  }
                  value={formData.consignee}
                  onSelect={(id) => {
                    handleConsigneeChange(id);
                    setOpenSelect(null);
                  }}
                  searchTerm={consigneeSearch}
                  setSearchTerm={setConsigneeSearch}
                  isOpen={openSelect === 'consignee'}
                  onToggle={() => setOpenSelect(openSelect === 'consignee' ? null : 'consignee')}
                />
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
                    <th rowSpan="2" className="px-2 py-1 text-left font-semibold border border-green-300">Article Type</th>
                    <th rowSpan="2" className="px-2 py-1 text-left font-semibold border border-green-300">No Of Article</th>
                    <th colSpan="2" className="px-2 py-1 text-center font-semibold border border-green-300">DD</th>
                    <th colSpan="2" className="px-2 py-1 text-center font-semibold border border-green-300">HANDLING</th>
                    <th rowSpan="2" className="px-2 py-1 text-left font-semibold border border-green-300">Freight Kg/Box</th>
                    <th rowSpan="2" className="px-2 py-1 text-left font-semibold border border-green-300">Act Wt/Box</th>
                    <th rowSpan="2" className="px-2 py-1 text-left font-semibold border border-green-300">Charged Wt/Box</th>
                    <th rowSpan="2" className="px-2 py-1 text-left font-semibold border border-green-300">Total Freight</th>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-center font-semibold border border-green-300 bg-green-50">Rate</th>
                    <th className="px-2 py-1 text-center font-semibold border border-green-300 bg-green-50">Total</th>
                    <th className="px-2 py-1 text-center font-semibold border border-green-300 bg-green-50">Rate</th>
                    <th className="px-2 py-1 text-center font-semibold border border-green-300 bg-green-50">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr key={article.id} className="border-b">
                      <td className="px-2 py-1 border border-green-200">
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
                      <td className="px-2 py-1 border border-green-200"><input type="number" value={article.noOfArticles} onChange={(e) => handleArticleChange(article.id, 'noOfArticles', e.target.value)} className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded" /></td>
                      <td className="px-2 py-1 border border-green-200"><input type="number" value={article.ddRate} onChange={(e) => handleArticleChange(article.id, 'ddRate', e.target.value)} className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded" /></td>
                      <td className="px-2 py-1 border border-green-200 text-center font-semibold text-gray-700 bg-gray-50">{article.ddTotal.toFixed(2)}</td>
                      <td className="px-2 py-1 border border-green-200"><input type="number" value={article.handlingRate} onChange={(e) => handleArticleChange(article.id, 'handlingRate', e.target.value)} className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded" /></td>
                      <td className="px-2 py-1 border border-green-200 text-center font-semibold text-gray-700 bg-gray-50">{article.handlingTotal.toFixed(2)}</td>
                      <td className="px-2 py-1 border border-green-200"><input type="number" value={article.freight} onChange={(e) => handleArticleChange(article.id, 'freight', e.target.value)} className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded" /></td>
                      <td className="px-2 py-1 border border-green-200"><input type="number" value={article.actWt} onChange={(e) => handleArticleChange(article.id, 'actWt', e.target.value)} className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded" /></td>
                      <td className="px-2 py-1 border border-green-200"><input type="number" value={article.chargedWt} onChange={(e) => handleArticleChange(article.id, 'chargedWt', e.target.value)} className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded" /></td>
                      <td className="px-2 py-1 border border-green-200 text-center font-bold text-green-700 bg-green-50/50">{article.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2">
                <button
                  onClick={() => setArticles([...articles, { id: Date.now(), type: '', noOfArticles: '', rate: '', total: 0.00, ddRate: '', ddTotal: 0.00, handlingRate: '', handlingTotal: 0.00, freight: '', freightTotal: 0.00, actWt: '', chargedWt: '', amount: 0.00 }])}
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tot Act Wt</label>
                <input type="text" readOnly value={formData.totalActWt} className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-blue-50 font-bold text-blue-700" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tot Chg Wt</label>
                <input type="text" readOnly value={formData.totalChgWt} className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-blue-50 font-bold text-blue-700" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Freight</label>
                <input type="text" readOnly value={formData.freight} className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">DD</label>
                <input type="text" readOnly value={formData.dd} className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Handling</label>
                <input type="text" readOnly value={formData.handling} className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Stationary <span className="text-red-500">*</span></label>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Invoice No <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.invoiceNo}
                  onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                  onBlur={(e) => checkInvoiceUniqueness(e.target.value)}
                  placeholder="Enter Invoice No"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Declared <span className="text-red-500">*</span></label>
                <input type="text" value={formData.declared} onChange={(e) => setFormData({ ...formData, declared: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">E-WayBill No</label>
                <input type="text" value={formData.eWayBillNo} onChange={(e) => setFormData({ ...formData, eWayBillNo: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tax Payable By <span className="text-red-500">*</span></label>
                <select value={formData.taxPayableBy} onChange={(e) => setFormData({ ...formData, taxPayableBy: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                  <option value="">Select</option>
                  <option value="consignor">Consignor</option>
                  <option value="consignee">Consignee</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Account Type <span className="text-red-500">*</span></label>
                <select value={formData.accountType} onChange={(e) => setFormData({ ...formData, accountType: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded font-bold">
                  <option value="">Select</option>
                  <option value="paid">Paid</option>
                  <option value="topay">To Pay</option>
                  <option value="account">Account</option>
                </select>
                {formData.accountType === 'paid' && (
                  <div className="mt-1 flex items-center gap-1.5 bg-green-50 p-1 rounded border border-green-200">
                    <input
                      type="checkbox"
                      id="cashReceived"
                      checked={formData.cashReceived}
                      onChange={(e) => setFormData({ ...formData, cashReceived: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="cashReceived" className="text-[10px] font-bold text-green-700 cursor-pointer select-none">
                      Cash Received
                    </label>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">GST(%) <span className="text-red-500">*</span></label>
                <input type="number" value={formData.gstPercent} onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">GST AMT</label>
                <input type="text" readOnly value={formData.gstAmount} className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 font-bold" />
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-200 mb-3">
            <div className="grid grid-cols-7 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Booking Clerk</label>
                <div className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 font-bold text-blue-800 uppercase overflow-hidden whitespace-nowrap text-ellipsis">
                  {currentUser?.full_name || currentUser?.name || currentUser?.username || 'ADMIN'} / {new Date().toLocaleTimeString()}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Grand Total</label>
                <input type="text" readOnly value={formData.grandTotal} className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 font-bold text-green-700 text-lg" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks</label>
                <input type="text" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            {isClosed && (
              <div className="flex items-center gap-2 px-6 py-2 bg-red-50 border-2 border-red-200 rounded-lg animate-pulse">
                <AlertCircle size={20} className="text-red-600" />
                <p className="font-black text-red-700 uppercase tracking-widest text-sm">Cannot Book: DayBook Closed</p>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving || isClosed}
              className={`px-10 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 ${saving || isClosed ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              {saving ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle size={24} />}
              {isClosed ? 'Restricted - DayBook Closed' : 'Save & Generate GC'}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-bold shadow-md flex items-center gap-2"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-green-100">
              <div className="p-8 text-center space-y-4 bg-gradient-to-b from-green-50 to-white">
                <div className="flex justify-center">
                  <div className="p-4 bg-green-100 rounded-full text-green-600 shadow-inner">
                    <AlertCircle size={40} />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Save GC Entry?</h2>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed px-2">
                    Are you sure you want to save this Goods Consignment? This will generate a new GC number.
                  </p>
                </div>
              </div>
              <div className="p-5 bg-gray-50/50 flex gap-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-2xl text-gray-500 text-xs font-black hover:bg-white hover:border-gray-300 transition-all uppercase tracking-widest"
                >
                  No, Review
                </button>
                <button
                  onClick={confirmSave}
                  className="flex-1 px-4 py-3 rounded-2xl text-white text-xs font-black shadow-lg shadow-green-100 transition-all hover:scale-105 active:scale-95 bg-green-600 hover:bg-green-700 uppercase tracking-widest"
                >
                  Yes, Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification.show && (
          <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-up ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
            {notification.type === 'success' ? <CheckCircle /> : <AlertCircle />}
            <p className="font-semibold">{notification.message}</p>
          </div>
        )}
      </div>

      {/* ── Receipt Options Modal (Step 1: Choose print type) ── */}
      {showReceipt && savedGC && !showPrintPreview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-green-100">
            <div className="p-6 bg-gradient-to-b from-green-50 to-white text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-green-100 rounded-full text-green-600">
                  <CheckCircle size={32} />
                </div>
              </div>
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">GC Saved!</h2>
              <p className="text-gray-500 text-sm font-medium mt-1">GC No: <span className="font-black text-green-700">{savedGC?.gc_number}</span></p>
              <p className="text-gray-400 text-xs mt-2">Choose how to print this receipt</p>
            </div>
            <div className="p-5 space-y-3">
              <button
                onClick={() => handlePrint('full')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 font-black transition shadow-lg active:scale-95"
              >
                <Printer size={20} /> Full Print
              </button>
              <button
                onClick={() => handlePrint('content')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 font-black transition shadow-lg active:scale-95"
              >
                <FileText size={20} /> Content Only Print
              </button>
              <button
                onClick={() => { setShowReceipt(false); handleReset(); }}
                className="w-full px-6 py-2.5 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 font-bold transition text-sm"
              >
                Skip & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fullscreen Print Preview Modal (Step 2: Isolated print area — mirrors GCPrint exactly) ── */}
      {showPrintPreview && savedGC && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center bg-gray-50 gc-entry-no-print">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <Printer size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-800 leading-none uppercase tracking-tight">Print Preview</h2>
                <p className="text-xs text-gray-500 font-bold mt-1">{printMode === 'content' ? 'CONTENT ONLY MODE' : 'FULL RECEIPT MODE'}</p>
              </div>
            </div>
            <button
              onClick={() => setShowPrintPreview(false)}
              className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-all text-gray-500 group"
            >
              <X size={28} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          {/* Receipt Preview — scrollable */}
          <div className="flex-1 overflow-auto bg-gray-200/50 p-4 md:p-8 flex justify-center" id="gc-entry-printable-receipt">
            <div className="bg-white shadow-2xl p-[5mm] md:p-[10mm] min-w-fit h-fit">
              <GCEntryReceipt
                waybill={savedGC}
                companyDetails={companyDetails}
                branches={allBranches}
                currentUser={currentUser}
                storageUrl={STORAGE_URL}
                onlyContent={printOnlyContent}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-white flex justify-center items-center gap-6 gc-entry-no-print shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button
              onClick={() => setShowPrintPreview(false)}
              className="px-8 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-sm hover:bg-gray-200 transition-all active:scale-95 border border-gray-200"
            >
              Back
            </button>
            <button
              onClick={executePrint}
              className="px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl font-black uppercase text-base hover:from-blue-700 hover:to-blue-900 transition-all flex items-center gap-3 shadow-xl shadow-blue-200 active:scale-95 group"
            >
              <Printer size={24} className="group-hover:scale-110 transition-transform" />
              Print Now
            </button>
          </div>

          <style>{`
            @media print {
              @page { size: A4 portrait; margin: 0mm; }

              /* Hide all UI except the receipt preview */
              .gc-entry-main-content,
              .gc-entry-no-print,
              .no-print { display: none !important; }

              body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                overflow: visible !important;
              }

              /* Clean up the scrollable preview wrapper */
              #gc-entry-printable-receipt,
              #gc-entry-printable-receipt > div {
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                box-shadow: none !important;
                width: 100% !important;
                display: block !important;
              }

              /* Container holding all 3 copies — using flex for better vertical distribution */
              .receipt-container {
                display: flex !important;
                flex-direction: column !important;
                width: 100% !important;
                height: 290mm !important;
                overflow: visible !important;
              }

              .receipt-copy {
                display: flex !important;
                flex-direction: column !important;
                border: none !important;
                box-shadow: none !important;
                height: 95mm !important;
                max-height: 95mm !important;
                width: 190mm !important;
                margin: 0 auto 2mm auto !important; 
                padding-top: 4mm !important; /* Default for full print */
                overflow: visible !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                box-sizing: border-box !important;
              }

              /* Content-Only vertical offsets — standardized across all modules */
              body.is-printing-receipt.is-content-only .receipt-copy-1 {
                padding-top: 12mm !important; /* Perfect at 1.2cm */
              }
              body.is-printing-receipt.is-content-only .receipt-copy-2 {
                padding-top: 6mm !important;  /* Balanced for second copy */
              }
              body.is-printing-receipt.is-content-only .receipt-copy-3 {
                padding-top: 0mm !important;  /* Minimal offset for third copy */
              }

              /* Full print specific borders - only if NOT content-only */
              body.is-printing-receipt:not(.is-content-only) .receipt-copy {
                border: 1px solid #000 !important;
              }

              .text-red-700, .text-red-800 { color: #000 !important; }
            }
          `}</style>
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
                  <h2 className="text-xl font-bold">GC Entry Guide</h2>
                  <p className="text-blue-100 text-xs">Learn how to create a Goods Consignment (GC)</p>
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
                    Basic Information
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 ml-10">
                    <li>• <span className="font-semibold text-gray-800">From/To:</span> Select origin branch and destination.</li>
                    <li>• <span className="font-semibold text-gray-800">Parties:</span> Choose Consignor and Consignee. Rates auto-load based on contract.</li>
                    <li>• <span className="font-semibold text-gray-800">Article Desc:</span> Brief description of the entire consignment.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-green-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">2</span>
                    Consignment Items
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 ml-10">
                    <li>• <span className="font-semibold text-gray-800">Article Type:</span> Select the item unit (Box, Bag, etc.).</li>
                    <li>• <span className="font-semibold text-gray-800">Rates:</span> DD Charge, Handling, and Freight are auto-calculated but can be tweaked.</li>
                    <li>• <span className="font-semibold text-gray-800">Weights:</span> Enter Actual vs Charged weight for correct billing.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-orange-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">3</span>
                    Financials & GST
                  </div>
                  <ul className="space-y-3 text-sm text-gray-600 ml-10">
                    <li>• <span className="font-semibold text-gray-800">Invoice No:</span> System checks for uniqueness for the consignor.</li>
                    <li>• <span className="font-semibold text-gray-800">E-Way Bill:</span> Mandatory if Declared Value {'>'} ₹49,999.</li>
                    <li>• <span className="font-semibold text-gray-800">Account Type:</span> Choose between Paid, To Pay, or Billed to Account.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-purple-700 font-bold uppercase text-xs tracking-wider">
                    <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">4</span>
                    Quick Actions
                  </div>
                  <div className="ml-10 space-y-2">
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">SAVE</span>
                      <span className="text-xs text-gray-500">Validates data and generates GC Number.</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded">RESET</span>
                      <span className="text-xs text-gray-500">Clears all fields for a fresh entry.</span>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-xs text-blue-800 leading-relaxed italic">
                        <strong>Pro Tip:</strong> Ensure the Consignor stationary charges are set in the Master to auto-load during entry!
                      </p>
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
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper component for Searchable Selection
const SearchableSelect = ({ placeholder, options, value, onSelect, searchTerm, setSearchTerm, isOpen, onToggle }) => {
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
        onClick={onToggle}
        tabIndex="0"
        className={`w-full px-2 py-1 text-sm border rounded cursor-pointer flex justify-between items-center transition-all bg-white outline-none
          ${isOpen ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm' : 'border-gray-300'}
          ${!isOpen && 'focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white'}
          ${!selectedOption && !searchTerm ? 'text-gray-400' : 'text-gray-800'}`}
      >
        <div className="truncate font-bold overflow-hidden flex-1">
          {isOpen ? (
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
        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
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

export default GCEntry
