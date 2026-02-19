import React, { useState } from 'react'

function ConsignorWiseReceive() {
  const [filters, setFilters] = useState({
    fromDate: '11/01/2024',
    toDate: '06/12/2025',
    consignor: '',
    freightType: '',
    branch: 'SINDHANUIR'
  })

  const [paymentData, setPaymentData] = useState({
    receivedDate: '06/12/2025',
    outstandingBalance: '',
    discount: '',
    prevAdvance: '',
    totalBalance: '',
    paidAmount: '',
    bookingAmount: '',
    modeOfPay: '',
    doCheckNo: '',
    doCheckDate: '06/12/2025',
    remarks: ''
  })

  const [waybills] = useState([
    { billDate: '', gcNum: '', destination: '', articleDesc: '', noOfArticles: '', amount: '' }
  ])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Consignor Wise Receive</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">Search Consignor Waybill Details</h3>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
              <input type="date" value={filters.fromDate} onChange={(e) => setFilters({...filters, fromDate: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
              <input type="date" value={filters.toDate} onChange={(e) => setFilters({...filters, toDate: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Consignor</label>
              <select value={filters.consignor} onChange={(e) => setFilters({...filters, consignor: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                <option value="">Select</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Freight Type</label>
              <select value={filters.freightType} onChange={(e) => setFilters({...filters, freightType: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                <option value="">Select</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
              <select value={filters.branch} onChange={(e) => setFilters({...filters, branch: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                <option>SINDHANUIR</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Get Details</button>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-300">
          <h3 className="font-bold text-gray-800 mb-4">PAYMENT RECEIVE</h3>
          
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Received Date</label>
              <input type="date" value={paymentData.receivedDate} onChange={(e) => setPaymentData({...paymentData, receivedDate: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Outstanding Balance</label>
              <input type="text" value={paymentData.outstandingBalance} onChange={(e) => setPaymentData({...paymentData, outstandingBalance: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Discount</label>
              <input type="text" value={paymentData.discount} onChange={(e) => setPaymentData({...paymentData, discount: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Prev Advance</label>
              <input type="text" value={paymentData.prevAdvance} onChange={(e) => setPaymentData({...paymentData, prevAdvance: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Total Balance</label>
              <input type="text" value={paymentData.totalBalance} onChange={(e) => setPaymentData({...paymentData, totalBalance: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Paid Amount</label>
              <input type="text" value={paymentData.paidAmount} onChange={(e) => setPaymentData({...paymentData, paidAmount: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Booking Amount</label>
              <input type="text" value={paymentData.bookingAmount} onChange={(e) => setPaymentData({...paymentData, bookingAmount: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Excess Amount</label>
              <input type="text" className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-pink-50" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
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
            <div></div>
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

        <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
          <h3 className="font-bold text-gray-800 mb-4">Waybill Details View</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100 border-b-2 border-yellow-300">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Bill Date</th>
                  <th className="px-4 py-2 text-left font-semibold">GC Num</th>
                  <th className="px-4 py-2 text-left font-semibold">Destination</th>
                  <th className="px-4 py-2 text-left font-semibold">Article Desc</th>
                  <th className="px-4 py-2 text-left font-semibold">No Of Articles</th>
                  <th className="px-4 py-2 text-left font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {waybills.map((wb, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{wb.billDate}</td>
                    <td className="px-4 py-2">{wb.gcNum}</td>
                    <td className="px-4 py-2">{wb.destination}</td>
                    <td className="px-4 py-2">{wb.articleDesc}</td>
                    <td className="px-4 py-2">{wb.noOfArticles}</td>
                    <td className="px-4 py-2">{wb.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsignorWiseReceive
