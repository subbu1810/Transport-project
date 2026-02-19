import React, { useState } from 'react'
import { ArrowDownCircle, Truck } from 'lucide-react'
import ReceiveInward from './ReceiveInward'
import LocalTrip from './LocalTrip'

const TABS = [
  { id: 'inward', label: 'Inward Way Bill', icon: ArrowDownCircle, color: 'blue' },
  { id: 'local-trip', label: 'Local Trip', icon: Truck, color: 'purple' },
]

function InwardWayBill() {
  const [activeTab, setActiveTab] = useState('inward')

  return (
    <div className="flex flex-col h-full">
      {/* Subtab Bar */}
      <div className="bg-white border-b border-gray-200 px-4 pt-3 flex items-end gap-1 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const colorMap = {
            blue: {
              active: 'border-blue-600 text-blue-700 bg-blue-50',
              inactive: 'border-transparent text-gray-500 hover:text-blue-600 hover:bg-blue-50/50',
              icon: isActive ? 'text-blue-600' : 'text-gray-400',
              dot: 'bg-blue-500'
            },
            purple: {
              active: 'border-purple-600 text-purple-700 bg-purple-50',
              inactive: 'border-transparent text-gray-500 hover:text-purple-600 hover:bg-purple-50/50',
              icon: isActive ? 'text-purple-600' : 'text-gray-400',
              dot: 'bg-purple-500'
            }
          }
          const c = colorMap[tab.color]

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl border-b-2 font-bold text-sm transition-all duration-150 ${isActive ? c.active : c.inactive}`}
            >
              {isActive && (
                <div className={`w-1.5 h-1.5 rounded-full ${c.dot} shadow-sm`}></div>
              )}
              <Icon size={14} className={c.icon} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {activeTab === 'inward' && <ReceiveInward />}
        {activeTab === 'local-trip' && <LocalTrip />}
      </div>
    </div>
  )
}

export default InwardWayBill
