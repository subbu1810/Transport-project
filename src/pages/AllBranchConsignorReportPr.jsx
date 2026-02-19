import React, { useState } from 'react'

function AllBranchConsignorReportPr() {
  const [transactionDate, setTransactionDate] = useState('08/12/2025')
  const [filters, setFilters] = useState({
    fromDate: '06/12/2025',
    toDate: '06/12/2025',
    branch: '',
    consignor: '',
    freightType: ''
  })

  const [gcDetails] = useState([
    { billDate: '', gcNum: '', destination: '', deliverStatus: '', amountPaid: '', freight: '', invoiceNo: '', articles: '', rate: '', weight: '', freight2: '', ddCharges: '', handling: '', stationary: '', service: '' }
  ])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">All Branch Consignor Report Prepare</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300 flex items-center gap-4">
          <label className="font-semibold text-gray-800">Transaction Date</label>
          <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} className="px-3 py-2 border-2 border-gray-300 rounded-lg" />
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Generate Consignor ID</button>
        </div>

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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
              <select value={filters.branch} onChange={(e) => setFilters({...filters, branch: e.target.value})} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg">
                <option value="">Select</option>
              </select>
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
          </div>
          <div className="mt-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Get Details</button>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
          <h3 className="font-bold text-gray-800 mb-4">GC Details View</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100 border-b-2 border-yellow-300">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Bill Date</th>
                  <th className="px-3 py-2 text-left font-semibold">GC Num</th>
                  <th className="px-3 py-2 text-left font-semibold">Destination</th>
                  <th className="px-3 py-2 text-left font-semibold">Deliver Status</th>
                  <th className="px-3 py-2 text-left font-semibold">Amount Paid?</th>
                  <th className="px-3 py-2 text-left font-semibold">Freight</th>
                  <th className="px-3 py-2 text-left font-semibold">Invoice No</th>
                  <th className="px-3 py-2 text-left font-semibold">Articles</th>
                  <th className="px-3 py-2 text-left font-semibold">Rate</th>
                  <th className="px-3 py-2 text-left font-semibold">Weight</th>
                  <th className="px-3 py-2 text-left font-semibold">Freight</th>
                  <th className="px-3 py-2 text-left font-semibold">DD Charges</th>
                  <th className="px-3 py-2 text-left font-semibold">Handling</th>
                  <th className="px-3 py-2 text-left font-semibold">Stationary</th>
                  <th className="px-3 py-2 text-left font-semibold">Service</th>
                </tr>
              </thead>
              <tbody>
                {gcDetails.map((gc, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">{gc.billDate}</td>
                    <td className="px-3 py-2">{gc.gcNum}</td>
                    <td className="px-3 py-2">{gc.destination}</td>
                    <td className="px-3 py-2">{gc.deliverStatus}</td>
                    <td className="px-3 py-2">{gc.amountPaid}</td>
                    <td className="px-3 py-2">{gc.freight}</td>
                    <td className="px-3 py-2">{gc.invoiceNo}</td>
                    <td className="px-3 py-2">{gc.articles}</td>
                    <td className="px-3 py-2">{gc.rate}</td>
                    <td className="px-3 py-2">{gc.weight}</td>
                    <td className="px-3 py-2">{gc.freight2}</td>
                    <td className="px-3 py-2">{gc.ddCharges}</td>
                    <td className="px-3 py-2">{gc.handling}</td>
                    <td className="px-3 py-2">{gc.stationary}</td>
                    <td className="px-3 py-2">{gc.service}</td>
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

export default AllBranchConsignorReportPr
