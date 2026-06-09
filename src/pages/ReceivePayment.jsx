import React from 'react'
import { Plus, CreditCard, Info } from 'lucide-react'
import { useTabs } from '../contexts/TabContext'

function ReceivePayment() {
  const { addTab } = useTabs()
  
  const payments = [
    { id: 'PAY001', consignor: 'ABC Traders', amount: '₹45,000', date: '2025-01-07', method: 'Bank Transfer', status: 'Received' },
    { id: 'PAY002', consignor: 'XYZ Stores', amount: '₹32,000', date: '2025-01-06', method: 'Cash', status: 'Received' },
    { id: 'PAY003', consignor: 'PQR Exports', amount: '₹28,500', date: '2025-01-05', method: 'Cheque', status: 'Pending' },
  ]

  return (
    <div className="p-6 space-y-6 bg-gray-50/30 h-full overflow-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-600 rounded-2xl shadow-lg shadow-green-100">
            <CreditCard className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Receive Payments</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Payment History & Management</p>
          </div>
        </div>
        
        <button 
          onClick={() => addTab('Consignor Wise Receive', '/consignor-wise-receive', 'Consignor Wise Receive')}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-green-200 transition hover:bg-black hover:-translate-y-1 active:scale-95"
        >
          <Plus size={18} />
          Record New Payment
        </button>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-4">
        <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm">
          <Info size={20} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black text-emerald-900 uppercase tracking-wide">Usage Note</h3>
          <p className="text-xs text-emerald-700 font-medium leading-relaxed">
            This module provides a summary of all processed payments. To record a new payment for a specific GC or bulk consignor report, please use the 
            <strong> Record New Payment</strong> button above or select the specific receive mode from the sidebar.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Payment ID</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Consignor</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Method</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-black text-slate-800 text-sm">{payment.id}</td>
                  <td className="px-6 py-4 text-slate-600 font-bold text-sm uppercase">{payment.consignor}</td>
                  <td className="px-6 py-4 font-black text-green-600 text-sm">{payment.amount}</td>
                  <td className="px-6 py-4 text-slate-500 font-bold text-sm">{payment.date}</td>
                  <td className="px-6 py-4 text-slate-500 font-bold text-sm uppercase">{payment.method}</td>
                  <td className="px-6 py-4">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      payment.status === 'Received' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ReceivePayment
