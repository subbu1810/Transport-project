import React, { useState } from 'react'

function GCWiseReceive() {
  const [gcNumber, setGcNumber] = useState('')
  const [paymentData, setPaymentData] = useState({
    receivedDate: '06/12/2025',
    outstanding: '',
    discount: '',
    balance: '',
    paidAmount: '',
    payerName: '',
    modeOfPay: '',
    doCheckNo: '',
    doCheckDate: '06/12/2025',
    remarks: ''
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">GC Wise Receive</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300 flex items-center gap-4">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">BY GC-NUM</button>
          <input type="text" placeholder="ENTER GCNUMBER TO SEARCH" value={gcNumber} onChange={(e) => setGcNumber(e.target.value)} className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg bg-black text-white" />
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">TOPAY PAYMENT RECEIVE BY GC NUM</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Received Date</label>
              <input type="date" value={paymentData.receivedDate} onChange={(e) => setPaymentData({...paymentData, receivedDate: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Outstanding</label>
              <input type="text" value={paymentData.outstanding} onChange={(e) => setPaymentData({...paymentData, outstanding: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Discount</label>
              <input type="text" value={paymentData.discount} onChange={(e) => setPaymentData({...paymentData, discount: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Balance</label>
              <input type="text" value={paymentData.balance} onChange={(e) => setPaymentData({...paymentData, balance: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Paid Amount</label>
              <input type="text" value={paymentData.paidAmount} onChange={(e) => setPaymentData({...paymentData, paidAmount: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payer Name</label>
              <input type="text" value={paymentData.payerName} onChange={(e) => setPaymentData({...paymentData, payerName: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mode of Pay</label>
              <select value={paymentData.modeOfPay} onChange={(e) => setPaymentData({...paymentData, modeOfPay: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                <option value="">Select</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">DD/CHEQUE NO</label>
              <input type="text" value={paymentData.doCheckNo} onChange={(e) => setPaymentData({...paymentData, doCheckNo: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">DD/CHEQUE Date</label>
              <input type="date" value={paymentData.doCheckDate} onChange={(e) => setPaymentData({...paymentData, doCheckDate: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
            <input type="text" value={paymentData.remarks} onChange={(e) => setPaymentData({...paymentData, remarks: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
          </div>

          <div className="flex gap-2">
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Receive Payment</button>
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Reset</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GCWiseReceive
