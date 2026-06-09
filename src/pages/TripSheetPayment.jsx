import React from 'react'
import { CreditCard, Clock, Truck, IndianRupee, Wrench } from 'lucide-react'

function TripSheetPayment() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">

      {/* Animated background blobs */}
      <div className="relative flex flex-col items-center text-center max-w-lg w-full">

        {/* Icon cluster */}
        <div className="relative mb-8">
          <div className="w-28 h-28 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-100 border border-indigo-100">
            <CreditCard size={52} className="text-indigo-500" />
          </div>
          {/* Floating badges */}
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 animate-bounce">
            <Wrench size={18} className="text-white" />
          </div>
          <div className="absolute -bottom-2 -left-4 w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Truck size={16} className="text-white" />
          </div>
          <div className="absolute top-1 -left-5 w-8 h-8 bg-green-400 rounded-xl flex items-center justify-center shadow-md shadow-green-100">
            <IndianRupee size={14} className="text-white" />
          </div>
        </div>

        {/* Coming Soon badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 border border-amber-200 rounded-full mb-5 shadow-sm">
          <Clock size={13} className="text-amber-500 animate-pulse" />
          <span className="text-[11px] font-black text-amber-600 uppercase tracking-widest">Coming Soon</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-gray-800 tracking-tight mb-3">
          Trip Sheet Payment
        </h1>

        {/* Description */}
        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
          This module is currently under development. It will allow you to manage
          transporter freight payments, track profit &amp; loss per trip, and generate
          payment vouchers — all in one place.
        </p>

        {/* Feature preview cards */}
        <div className="grid grid-cols-3 gap-3 w-full mb-8">
          {[
            { icon: IndianRupee, label: 'Freight Settlement', color: 'green' },
            { icon: CreditCard,  label: 'Payment Vouchers',   color: 'blue'  },
            { icon: Truck,       label: 'Profit & Loss',       color: 'purple'},
          ].map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border bg-${color}-50 border-${color}-100 opacity-60`}
            >
              <div className={`w-9 h-9 bg-${color}-100 rounded-xl flex items-center justify-center`}>
                <Icon size={18} className={`text-${color}-500`} />
              </div>
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider text-center leading-tight">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar — decorative */}
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-pulse"
            style={{ width: '35%' }}
          />
        </div>
        <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
          Development in progress — 35%
        </p>

      </div>
    </div>
  )
}

export default TripSheetPayment
