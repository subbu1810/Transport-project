import React, { useState, useEffect, useRef } from 'react'
import { X, Printer, Loader2, CheckCircle, AlertCircle, Fuel, Search, ChevronDown } from 'lucide-react'
import { API_BASE_URL } from '../config/api';

function FuelTokenEntry() {
  const [formData, setFormData] = useState({
    token_date: new Date().toISOString().split('T')[0],
    bunk_id: '',
    vehicle_id: '',
    driver_id: '',
    trip_sheet_id: '',
    quantity: '',
    rate: '',
    amount: '',
    remarks: '',
    branch_id: ''
  })

  const [masterData, setMasterData] = useState({
    bunks: [],
    vehicles: [],
    drivers: [],
    branches: [],
    next_token_no: ''
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  const [showToken, setShowToken] = useState(false)
  const [savedToken, setSavedToken] = useState(null)
  
  // Search states
  const [searchTerms, setSearchTerms] = useState({ bunk: '', vehicle: '', driver: '' })
  const [openSelect, setOpenSelect] = useState(null)

  const showNotify = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000)
  }

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/fuel/init-data`);
        const data = await response.json();
        if (data.success) {
          setMasterData(data);
          // Set default branch from user
          const user = JSON.parse(localStorage.getItem('user'));
          if (user && user.branch_id) {
            setFormData(prev => ({ ...prev, branch_id: user.branch_id }));
          }
        }
      } catch (err) {
        showNotify('error', 'Failed to load master data');
      } finally {
        setLoading(false);
      }
    };
    fetchInitData();
  }, []);

  // Update amount when qty or rate changes
  useEffect(() => {
    const qty = parseFloat(formData.quantity) || 0;
    const rate = parseFloat(formData.rate) || 0;
    if (qty && rate) {
      setFormData(prev => ({ ...prev, amount: (qty * rate).toFixed(2) }));
    }
  }, [formData.quantity, formData.rate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bunk_id || !formData.vehicle_id || !formData.amount) {
      showNotify('error', 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/fuel/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        showNotify('success', 'Fuel Token issued successfully!');
        setSavedToken(data.data);
        setShowToken(true);
        // Reset form
        setFormData({
          ...formData,
          bunk_id: '',
          vehicle_id: '',
          driver_id: '',
          quantity: '',
          rate: '',
          amount: '',
          remarks: ''
        });
        setSearchTerms({ bunk: '', vehicle: '', driver: '' });
      } else {
        showNotify('error', data.message || 'Failed to save token');
      }
    } catch (err) {
      showNotify('error', 'Server error while saving token');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="animate-spin text-orange-600" size={48} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="w-full mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-orange-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <Fuel size={28} />
              <div>
                <h1 className="text-2xl font-bold">Fuel Token Entry</h1>
                <p className="text-orange-100 text-sm">Issue fuel tokens to vehicle drivers</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-orange-100 text-xs uppercase font-bold tracking-wider">Next Token No</span>
              <p className="text-xl font-mono font-black">{masterData.next_token_no}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Token Date</label>
                <input
                  type="date"
                  value={formData.token_date}
                  onChange={(e) => setFormData({ ...formData, token_date: e.target.value })}
                  className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50/50"
                  required
                />
              </div>

              {/* Bunk Selection */}
              <div className="flex flex-col gap-1.5 relative md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Select Fuel Bunk *</label>
                <div 
                  className="flex items-center border border-gray-200 rounded-lg p-3 cursor-pointer bg-white"
                  onClick={() => setOpenSelect(openSelect === 'bunk' ? null : 'bunk')}
                >
                  <Search size={18} className="text-gray-400 mr-2" />
                  <span className={formData.bunk_id ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                    {formData.bunk_id ? masterData.bunks.find(b => b.id == formData.bunk_id)?.bunk_name : 'Search Bunk...'}
                  </span>
                  <ChevronDown size={18} className="ml-auto text-gray-400" />
                </div>
                
                {openSelect === 'bunk' && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-xl z-50 max-h-60 overflow-y-auto">
                    <div className="p-2 sticky top-0 bg-white border-b border-gray-100">
                      <input 
                        type="text" 
                        autoFocus
                        placeholder="Type to search..."
                        className="w-full p-2 text-sm border-0 focus:ring-0"
                        value={searchTerms.bunk}
                        onChange={(e) => setSearchTerms({...searchTerms, bunk: e.target.value})}
                      />
                    </div>
                    {masterData.bunks
                      .filter(b => b.bunk_name.toLowerCase().includes(searchTerms.bunk.toLowerCase()))
                      .map(b => (
                        <div 
                          key={b.id}
                          className="px-4 py-2.5 hover:bg-orange-50 cursor-pointer text-sm"
                          onClick={() => {
                            setFormData({...formData, bunk_id: b.id});
                            setOpenSelect(null);
                          }}
                        >
                          <div className="font-bold text-gray-800">{b.bunk_name}</div>
                          <div className="text-[10px] text-gray-400 uppercase">{b.tin_number || 'No GSTIN'} | {b.bunk_address}</div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vehicle Selection */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold text-gray-500 uppercase">Select Vehicle *</label>
                <div 
                  className="flex items-center border border-gray-200 rounded-lg p-3 cursor-pointer bg-white"
                  onClick={() => setOpenSelect(openSelect === 'vehicle' ? null : 'vehicle')}
                >
                  <Search size={18} className="text-gray-400 mr-2" />
                  <span className={formData.vehicle_id ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                    {formData.vehicle_id ? masterData.vehicles.find(v => v.id == formData.vehicle_id)?.vehicle_number : 'Search Vehicle...'}
                  </span>
                  <ChevronDown size={18} className="ml-auto text-gray-400" />
                </div>
                
                {openSelect === 'vehicle' && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-xl z-50 max-h-60 overflow-y-auto">
                    <div className="p-2 sticky top-0 bg-white border-b border-gray-100">
                      <input 
                        type="text" 
                        autoFocus
                        placeholder="Search vehicle number..."
                        className="w-full p-2 text-sm border-0 focus:ring-0"
                        value={searchTerms.vehicle}
                        onChange={(e) => setSearchTerms({...searchTerms, vehicle: e.target.value})}
                      />
                    </div>
                    {masterData.vehicles
                      .filter(v => v.vehicle_number.toLowerCase().includes(searchTerms.vehicle.toLowerCase()))
                      .map(v => (
                        <div 
                          key={v.id}
                          className="px-4 py-2.5 hover:bg-orange-50 cursor-pointer text-sm"
                          onClick={() => {
                            setFormData({...formData, vehicle_id: v.id, driver_id: v.driver_id || ''});
                            setOpenSelect(null);
                          }}
                        >
                          <div className="font-bold text-gray-800">{v.vehicle_number}</div>
                          <div className="text-[10px] text-gray-400 uppercase">{v.vehicle_type} | Owner: {v.owner_name}</div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>

              {/* Driver Selection */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold text-gray-500 uppercase">Select Driver *</label>
                <div 
                  className="flex items-center border border-gray-200 rounded-lg p-3 cursor-pointer bg-white"
                  onClick={() => setOpenSelect(openSelect === 'driver' ? null : 'driver')}
                >
                  <Search size={18} className="text-gray-400 mr-2" />
                  <span className={formData.driver_id ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                    {formData.driver_id ? masterData.drivers.find(d => d.id == formData.driver_id)?.driver_name : 'Search Driver...'}
                  </span>
                  <ChevronDown size={18} className="ml-auto text-gray-400" />
                </div>
                
                {openSelect === 'driver' && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-xl z-50 max-h-60 overflow-y-auto">
                    <div className="p-2 sticky top-0 bg-white border-b border-gray-100">
                      <input 
                        type="text" 
                        autoFocus
                        placeholder="Search driver name..."
                        className="w-full p-2 text-sm border-0 focus:ring-0"
                        value={searchTerms.driver}
                        onChange={(e) => setSearchTerms({...searchTerms, driver: e.target.value})}
                      />
                    </div>
                    {masterData.drivers
                      .filter(d => d.driver_name.toLowerCase().includes(searchTerms.driver.toLowerCase()))
                      .map(d => (
                        <div 
                          key={d.id}
                          className="px-4 py-2.5 hover:bg-orange-50 cursor-pointer text-sm"
                          onClick={() => {
                            setFormData({...formData, driver_id: d.id});
                            setOpenSelect(null);
                          }}
                        >
                          <div className="font-bold text-gray-800">{d.driver_name}</div>
                          <div className="text-[10px] text-gray-400 uppercase">{d.driver_code} | ph: {d.phone}</div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-orange-50/50 p-6 rounded-xl border border-orange-100">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Quantity (Liters)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="p-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 font-bold"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Rate (per Liter)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  className="p-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase text-orange-700">Total Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Auto Calculated"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="p-3 border border-orange-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-600 text-orange-700 font-black text-xl"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Remarks / Trip Details</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 h-24"
                placeholder="Optional: Mention trip number or specific instructions..."
              />
            </div>

            <div className="pt-4 border-t border-gray-100 flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-700 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Fuel size={20} />}
                {saving ? 'GENERATING TOKEN...' : 'GENERATE FUEL TOKEN'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed bottom-8 right-8 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl z-50 animate-bounce ${
          notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <span className="font-bold">{notification.message}</span>
        </div>
      )}

      {/* Printable Token Modal (Simplified) */}
      {showToken && savedToken && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-orange-50">
              <h3 className="font-bold text-orange-800 uppercase tracking-widest text-sm">Fuel Token Preview</h3>
              <button onClick={() => setShowToken(false)} className="p-1 hover:bg-white rounded-full"><X size={20} /></button>
            </div>
            
            <div id="fuel-token-print" className="p-8 font-mono text-center space-y-4">
               <div className="border-4 border-double border-orange-600 p-6 space-y-4">
                  <h2 className="text-2xl font-black text-orange-600 underline">FUEL TOKEN</h2>
                  <div className="flex justify-between text-left text-sm font-bold pt-4">
                    <span>TOKEN NO: {savedToken.token_number}</span>
                    <span>DATE: {new Date(savedToken.token_date).toLocaleDateString()}</span>
                  </div>
                  <div className="border-t border-b border-gray-300 py-4 text-left space-y-1">
                    <p className="text-lg font-black uppercase tracking-tighter">BUNK: {savedToken.bunk?.bunk_name}</p>
                    <p>VEHICLE: {savedToken.vehicle?.vehicle_number}</p>
                    <p>DRIVER: {savedToken.driver?.driver_name}</p>
                  </div>
                  <div className="bg-gray-100 p-4 text-3xl font-black text-orange-700">
                    {savedToken.quantity} LITERS
                  </div>
                  <div className="pt-4 flex justify-between items-end h-24">
                    <div className="text-[10px] text-gray-500 text-left">
                       <p>Authorized By</p>
                       <p className="font-bold uppercase pt-8">Logistics Admin</p>
                    </div>
                    <div className="text-[10px] text-gray-500 text-right">
                       <p>Driver / Signatory</p>
                       <p className="border-t border-gray-300 w-24 pt-1 mt-8">Signature</p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
              <button 
                onClick={() => window.print()}
                className="flex-1 bg-orange-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-700"
              >
                <Printer size={20} /> PRINT TOKEN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FuelTokenEntry
