import React, { useState, useEffect } from 'react'
import { X, Save, Loader2, CheckCircle, AlertCircle, FileEdit, Search, ChevronDown, ListFilter } from 'lucide-react'
import { API_BASE_URL } from '../config/api';

function BunkBillEntry() {
  const [formData, setFormData] = useState({
    bill_number: '',
    bill_date: new Date().toISOString().split('T')[0],
    bunk_id: '',
    total_amount: 0,
    remarks: '',
    branch_id: ''
  })

  const [masterData, setMasterData] = useState({ bunks: [] })
  const [tokens, setTokens] = useState([])
  const [selectedTokens, setSelectedTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchingTokens, setFetchingTokens] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })
  
  const [bunkSearch, setBunkSearch] = useState('')
  const [openBunkSelect, setOpenBunkSelect] = useState(false)

  const showNotify = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000)
  }

  useEffect(() => {
    const fetchBunks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/fuel/init-data`);
        const data = await response.json();
        if (data.success) {
          setMasterData({ bunks: data.bunks });
          const user = JSON.parse(localStorage.getItem('user'));
          if (user?.branch_id) setFormData(prev => ({ ...prev, branch_id: user.branch_id }));
        }
      } catch (err) {
        showNotify('error', 'Failed to load bunks');
      } finally {
        setLoading(false);
      }
    };
    fetchBunks();
  }, []);

  // Fetch pending tokens when bunk is selected
  useEffect(() => {
    if (formData.bunk_id) {
       fetchPendingTokens();
    } else {
       setTokens([]);
    }
  }, [formData.bunk_id]);

  const fetchPendingTokens = async () => {
    setFetchingTokens(true);
    try {
      const response = await fetch(`${API_BASE_URL}/fuel/tokens?status=ISSUED&bunk_id=${formData.bunk_id}`);
      const data = await response.json();
      if (data.success) {
        // Filter locally if backend pagination complicates things, but usually we want all issued tokens for this bunk
        setTokens(data.data.data || data.data || []);
      }
    } catch (err) {
      showNotify('error', 'Failed to fetch tokens');
    } finally {
      setFetchingTokens(false);
    }
  };

  const toggleToken = (token) => {
    const isSelected = selectedTokens.find(t => t.id === token.id);
    let newSelection;
    if (isSelected) {
      newSelection = selectedTokens.filter(t => t.id !== token.id);
    } else {
      newSelection = [...selectedTokens, token];
    }
    setSelectedTokens(newSelection);
    
    // Calculate total amount from selected tokens
    const total = newSelection.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    setFormData(prev => ({ ...prev, total_amount: total.toFixed(2) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bill_number || !formData.bunk_id || selectedTokens.length === 0) {
      showNotify('error', 'Please select at least one token and enter bill number');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/fuel/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          token_ids: selectedTokens.map(t => t.id)
        })
      });
      const data = await response.json();
      if (data.success) {
        showNotify('success', 'Bunk Bill recorded successfully!');
        // Reset
        setFormData({ ...formData, bill_number: '', total_amount: 0, remarks: '' });
        setSelectedTokens([]);
        fetchPendingTokens();
      } else {
        showNotify('error', data.message || 'Failed to save bill');
      }
    } catch (err) {
      showNotify('error', 'Server error while saving bill');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-orange-600" size={48} /></div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="w-full mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg border border-orange-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 flex items-center gap-3 text-white">
            <FileEdit size={28} />
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight">Bunk Bill Entry</h1>
              <p className="text-orange-100 text-sm">Upload bunk invoices and link fuel tokens</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6 border-b border-gray-100">
             <div className="flex flex-col gap-1.5 relative md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Fuel Bunk</label>
                <div 
                  className="flex items-center border border-gray-200 rounded-lg p-3 cursor-pointer bg-white"
                  onClick={() => setOpenBunkSelect(!openBunkSelect)}
                >
                  <Search size={18} className="text-gray-400 mr-2" />
                  <span className={formData.bunk_id ? 'text-gray-900 font-bold' : 'text-gray-400 font-medium'}>
                    {formData.bunk_id ? masterData.bunks.find(b => b.id == formData.bunk_id)?.bunk_name : 'Select Bunk...'}
                  </span>
                  <ChevronDown size={18} className="ml-auto text-gray-400" />
                </div>
                
                {openBunkSelect && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-2xl z-50 max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                      <input 
                        type="text" autoFocus placeholder="Search bunk..."
                        className="w-full p-2 text-sm border-0 focus:ring-0"
                        value={bunkSearch} onChange={(e) => setBunkSearch(e.target.value)}
                      />
                    </div>
                    {masterData.bunks.filter(b => b.bunk_name.toLowerCase().includes(bunkSearch.toLowerCase())).map(b => (
                      <div key={b.id} className="px-4 py-2.5 hover:bg-orange-50 cursor-pointer text-sm font-medium border-b border-gray-50 last:border-0" onClick={() => { setFormData({...formData, bunk_id: b.id}); setOpenBunkSelect(false); }}>
                        {b.bunk_name}
                      </div>
                    ))}
                  </div>
                )}
             </div>

             <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bill Number</label>
                <input type="text" value={formData.bill_number} onChange={(e) => setFormData({...formData, bill_number: e.target.value})} className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50/50 uppercase font-bold" placeholder="As per Invoice" required />
             </div>

             <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bill Date</label>
                <input type="date" value={formData.bill_date} onChange={(e) => setFormData({...formData, bill_date: e.target.value})} className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" required />
             </div>
          </form>

          <div className="p-8 flex items-center justify-between bg-orange-50/30">
             <div className="flex items-center gap-2 text-orange-800">
                <ListFilter size={20} />
                <h2 className="font-black uppercase tracking-widest text-sm">Issued Tokens (Select to link)</h2>
             </div>
             <div className="text-right">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter block leading-none">Total Bill Amount</span>
                <span className="text-3xl font-black text-orange-700">₹{parseFloat(formData.total_amount).toLocaleString()}</span>
             </div>
          </div>

          <div className="px-8 pb-8">
             <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                   <thead className="bg-gray-100 uppercase tracking-wider text-gray-600 font-black border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 w-12">#</th>
                        <th className="px-4 py-3">Token No</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Vehicle</th>
                        <th className="px-4 py-3">Driver</th>
                        <th className="px-4 py-3 text-right">Liters</th>
                        <th className="px-4 py-3 text-right">Amount (₹)</th>
                      </tr>
                   </thead>
                   <tbody>
                      {fetchingTokens ? (
                        <tr><td colSpan="7" className="p-10 text-center"><Loader2 className="animate-spin inline mr-2 text-orange-600" /> Loading Available Tokens...</td></tr>
                      ) : tokens.length === 0 ? (
                        <tr><td colSpan="7" className="p-10 text-center text-gray-400 font-bold italic">No pending issued tokens found for this bunk.</td></tr>
                      ) : tokens.map((t, idx) => {
                        const isSelected = selectedTokens.find(st => st.id === t.id);
                        return (
                          <tr 
                            key={t.id} 
                            onClick={() => toggleToken(t)} 
                            className={`border-b border-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-orange-600 text-white' : 'hover:bg-orange-50 text-gray-700 font-medium'}`}
                          >
                             <td className="px-4 py-3 text-center">{idx + 1}</td>
                             <td className="px-4 py-3 font-black underline tracking-tight">{t.token_number}</td>
                             <td className="px-4 py-3">{new Date(t.token_date).toLocaleDateString()}</td>
                             <td className="px-4 py-3">{t.vehicle?.vehicle_number}</td>
                             <td className="px-4 py-3 font-bold">{t.driver?.driver_name}</td>
                             <td className="px-4 py-3 text-right">{t.quantity} L</td>
                             <td className="px-4 py-3 text-right font-black">₹{parseFloat(t.amount).toFixed(2)}</td>
                          </tr>
                        )
                      })}
                   </tbody>
                </table>
             </div>

             <div className="mt-8 flex gap-4">
                <button 
                   onClick={handleSubmit} 
                   disabled={saving || selectedTokens.length === 0} 
                   className="flex-1 bg-orange-700 text-white font-black py-4 rounded-xl shadow-xl shadow-orange-100 hover:bg-orange-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                   {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                   {saving ? 'RECORDING BILL...' : `SUBMIT BILL (${selectedTokens.length} TOKENS SELECTED)`}
                </button>
             </div>
          </div>
        </div>
      </div>

      {notification.show && (
        <div className={`fixed bottom-8 right-8 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl z-50 animate-bounce ${
          notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <span className="font-bold">{notification.message}</span>
        </div>
      )}
    </div>
  )
}

export default BunkBillEntry
