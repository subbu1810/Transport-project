import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTabs } from '../contexts/TabContext'
import {
  LayoutDashboard,
  Settings,
  FileText,
  DollarSign,
  TrendingUp,
  Truck,
  Package,
  BarChart3,
  CheckCircle,
  Download,
  CreditCard,
  ChevronDown,
  Search,
  Filter,
  CheckCircle2,
  FileEdit,
  LocateFixed,
  CheckSquare,
  Users,
  Image as ImageIcon,
  GitBranch,
  ShieldCheck,
  Printer,
  Fuel,
  Headphones,
  Database
} from 'lucide-react'

import { API_BASE_URL } from '../config/api'

function Sidebar({ isOpen, onToggle }) {
  const [expandedMenu, setExpandedMenu] = useState(null)
  const { addTab } = useTabs()

  const [userRole, setUserRole] = useState('admin')
  const [allowedScreens, setAllowedScreens] = useState([])

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        const role = (user.role || 'admin').toLowerCase()
        setUserRole(role)

        // Fetch assignments for all roles except superadmin 
        // superadmin gets all screens by default
        if (role !== 'superadmin' && user.id) {
          fetch(`${API_BASE_URL}/screen-assignments/admin/${user.id}`)
            .then(res => res.json())
            .then(data => {
              if (data.success && Array.isArray(data.data)) {
                setAllowedScreens(data.data.map(s => s.screen_path))
              }
            })
            .catch(err => console.error(err))
        }
      } catch (e) {
        console.error('Sidebar Init Error:', e)
      }
    }
  }, [])

  const menuItems = [
    {
      label: 'Administrator',
      icon: Settings,
      submenu: [
        { label: 'Branch Master', path: '/branch-master', icon: LayoutDashboard },
        { label: 'User Details', path: '/user-details', icon: LayoutDashboard },
        { label: 'Role Details', path: '/role-details', icon: LayoutDashboard },
        { label: 'Screen Assignment', path: '/screen-assignment', icon: LayoutDashboard },
        { label: 'Manage Logo', path: '/manage-logo', icon: ImageIcon },
        { label: 'Manage UPI', path: '/manage-upi', icon: CreditCard },
        { label: 'Employee Management', path: '/employee-management', icon: Users },
      ]
    },
    {
      label: 'Masters',
      icon: LayoutDashboard,
      submenu: [
        { label: 'Lookup Master', path: '/lookup-master', icon: LayoutDashboard },
        { label: 'State Master', path: '/state-master', icon: LayoutDashboard },
        { label: 'District Master', path: '/district-master', icon: LayoutDashboard },
        { label: 'Taluk Master', path: '/taluk-master', icon: LayoutDashboard },
        { label: 'Destination', path: '/destination', icon: LayoutDashboard },
        { label: 'Consignor Master', path: '/consignor-master', icon: LayoutDashboard },
        { label: 'Consignee Master', path: '/consignee-master', icon: LayoutDashboard },
        { label: 'Rate Details', path: '/rate-details', icon: LayoutDashboard },
        { label: 'Bunk Details', path: '/bunk-details', icon: LayoutDashboard },
        { label: 'Transport Master', path: '/transport-master', icon: LayoutDashboard },
        { label: 'Route Mapping', path: '/route-master', icon: GitBranch },
      ]
    },
    {
      label: 'Vehicle Management',
      icon: Truck,
      submenu: [
        { label: 'Vehicle Details', path: '/vehicle-details', icon: Truck },
        { label: 'Driver Details', path: '/driver-details', icon: Users },
        { label: 'Settlement History', path: '/settlement-history', icon: FileText },
      ]
    },
    {
      label: 'Fuel Management',
      icon: Fuel,
      submenu: [
        { label: 'Fuel Token Entry', path: '/fuel-token-entry', icon: FileText },
        { label: 'Bunk Bill Entry', path: '/bunk-bill-entry', icon: FileEdit },
        { label: 'Bunk Payment Entry', path: '/bunk-payment-entry', icon: CreditCard },
        { label: 'Bunk Ledger Report', path: '/bunk-ledger-report', icon: BarChart3 },
      ]
    },
    {
      label: 'Way Bill',
      icon: FileText,
      submenu: [
        { label: 'GC Entry', path: '/gc-entry', icon: FileText },
        { label: 'GC Modify', path: '/gc-modify', icon: FileEdit },
        { label: 'GC Track', path: '/gc-track', icon: LocateFixed },
        { label: 'GC Print', path: '/gc-print', icon: FileText },
        { label: 'GC Report', path: '/gc-report', icon: FileText },
        { label: 'WayBill Admin/Edit', path: '/waybill-admin-edit', icon: FileText },
      ]
    },
    {
      label: 'Accounts',
      icon: DollarSign,
      submenu: [
        { label: 'Head Details', path: '/head-details', icon: DollarSign },
        { label: 'Cash Book Details', path: '/cash-book-details', icon: DollarSign },
        { label: 'Cash Book Report', path: '/cash-book-report', icon: DollarSign },
        { label: 'Maintenance Billing', path: '/maintenance-billing', icon: CreditCard },
      ]
    },
    {
      label: 'Inward Way Bill',
      icon: TrendingUp,
      submenu: [
        { label: 'Bulk GC Inward', path: '/bulk-gc-inward', icon: TrendingUp },
        { label: 'Receive Inward', path: '/receive-inward', icon: TrendingUp },
        { label: 'Inward Report', path: '/inward-report', icon: TrendingUp },
      ]
    },
    {
      label: 'Trip Sheet',
      icon: Truck,
      submenu: [
        { label: 'Trip Sheet Entry', path: '/trip-sheet-entry', icon: Truck },
        { label: 'Local Trip Entry', path: '/local-trip-entry', icon: Truck },
        { label: 'Trip Sheet Ack & Settle', path: '/trip-sheet-ack', icon: Truck },
        { label: 'Trip Sheet Report', path: '/trip-sheet-report', icon: Truck },
        { label: 'Local Trip Report', path: '/local-trip-report', icon: Truck },
        { label: 'Trip Sheet Alert', path: '/trip-sheet-alert', icon: Truck },
        { label: 'Trip Sheet Payment', path: '/trip-sheet-payment', icon: Truck },
      ]
    },
    {
      label: 'Update Delivery',
      icon: CheckCircle2,
      submenu: [
        { label: 'Update Delivery', path: '/update-delivery', icon: CheckCircle2 },
        { label: 'Upload POD', path: '/upload-pod', icon: ImageIcon },
        { label: 'Delivered GC Report', path: '/delivered-gc-report', icon: BarChart3 },
        { label: 'Undelivered GC Report', path: '/undelivered-gc-report', icon: BarChart3 },
        { label: 'Cancelled GC Report', path: '/cancelled-gc-report', icon: BarChart3 },
        { label: 'RTO Report', path: '/rto-report', icon: BarChart3 },
        { label: 'Pending POD Report', path: '/pending-pod-report', icon: BarChart3 },
      ]
    },
    {
      label: 'Consignor Report',
      icon: Package,
      submenu: [
        { label: 'Consignor Report Prepare', path: '/consignor-report-prepare', icon: Package },
        { label: 'Consignor Report View', path: '/consignor-report-view', icon: Package },
      ]
    },
    {
      label: 'ACK Report Bundle',
      icon: CheckCircle,
      submenu: [
        { label: 'Generate Ack Report ID', path: '/generate-ack-report-id', icon: CheckCircle },
        { label: 'Ack Report ID View', path: '/ack-report-id-view', icon: CheckCircle },
        { label: 'Ack ID Report', path: '/ack-report-bundle', icon: CheckCircle },
      ]
    },
    {
      label: 'Receive Payment',
      icon: CreditCard,
      submenu: [
        { label: 'GC Wise Receive', path: '/gc-wise-receive', icon: CreditCard },
        { label: 'Consignor Wise Receive With Id', path: '/consignor-wise-receive', icon: CreditCard },
        { label: 'Consignor Wise Receive Without Id', path: '/consignor-wise-receive-without-id', icon: CreditCard },
        { label: 'Payment Pending Report', path: '/payment-pending-report', icon: CreditCard },
      ]
    },
    {
      label: 'Reports',
      icon: BarChart3,
      submenu: [
        { label: 'Waybill Report', path: '/waybill-report', icon: BarChart3 },
        { label: 'Dispatch Pending Report', path: '/dispatch-pending-report', icon: BarChart3 },
        { label: 'Audit Log Info', path: '/audit-log-info', icon: BarChart3 },
        { label: 'Inward Status Report', path: '/inward-status-report', icon: BarChart3 },
        { label: 'Ack Status Report', path: '/ack-status-report', icon: BarChart3 },
        { label: 'HeadWise Report', path: '/headwise-report', icon: BarChart3 },
        { label: 'Balance Sheet', path: '/balance-sheet', icon: BarChart3 },
        { label: 'Booking And Dispatch', path: '/booking-and-dispatch', icon: BarChart3 },
        { label: 'Profit And Loss Report', path: '/profit-and-loss-report', icon: BarChart3 },
        { label: 'Consignor History Report', path: '/consignor-history-report', icon: BarChart3 },
        { label: 'User History Details', path: '/user-history-details', icon: BarChart3 },
        { label: 'WayBill Tally Report', path: '/waybill-tally-report', icon: BarChart3 },
        { label: 'Income/Expense Report', path: '/income-expense-report', icon: BarChart3 },
        { label: 'Trip Sheet Tally Report', path: '/trip-sheet-tally-report', icon: BarChart3 },
      ]
    },
    {
      label: 'Route Management',
      icon: GitBranch,
      submenu: [
        { label: 'Route Mapping', path: '/route-master', icon: GitBranch },
        { label: 'Route Trip Entry', path: '/route-trip-entry', icon: Truck },
        { label: 'Route Analytics', path: '/route-analytics', icon: BarChart3 },
      ]
    },
    {
      label: 'Security Settings',
      icon: ShieldCheck,
      submenu: [
        { label: 'Application Flow', path: '/app-workflow', icon: GitBranch },
        { label: 'Change Password', path: '/change-password', icon: Settings },
        { label: 'GC Format Print/Download', path: '/gc-format-print', icon: Printer },
        { label: 'Backup Options', path: '/backup-options', icon: Database },
      ]
    },
    {
      label: 'Technical Support',
      icon: Headphones,
      path: '/technical-support'
    }
  ]

  return (
    <aside
      className={`${isOpen ? 'w-64' : 'w-20'
        } bg-[#e8f5e9] border-r border-[#c8e6c9] transition-all duration-300 overflow-y-auto overflow-x-hidden`}
    >
      <nav className="p-2 space-y-1">
        {menuItems.map(item => {
          // For superadmin, show everything
          if (userRole === 'superadmin') return item

          // For regular admin, filter submenus based on assignments
          if (item.submenu) {
            const visibleSubmenus = item.submenu.filter(sub =>
              allowedScreens.includes(sub.path) || sub.path === '/change-password'
            )
            if (visibleSubmenus.length === 0) return null
            return { ...item, submenu: visibleSubmenus }
          }

          if (item.path === '/technical-support') return item

          return null
        })
          .filter(Boolean)
          .map((item, index) => (
            <div key={index}>
              {item.submenu ? (
                <div className="mb-1">
                  <button
                    onClick={() => setExpandedMenu(expandedMenu === index ? null : index)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded hover:bg-white/50 transition text-gray-800 font-bold text-sm"
                  >
                    <item.icon size={20} className="text-gray-500 flex-shrink-0" />
                    {isOpen && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${expandedMenu === index ? 'rotate-180' : ''}`}
                        />
                      </>
                    )}
                  </button>
                  {isOpen && expandedMenu === index && item.submenu.map((subitem, subindex) => (
                    <button
                      key={subindex}
                      onClick={() => addTab(subitem.label, subitem.path, subitem.label)}
                      className="flex items-center gap-2 px-9 py-2 rounded hover:bg-white transition text-gray-600 text-[13px] font-medium w-full text-left"
                    >
                      <span>{subitem.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => addTab(item.label, item.path, item.label)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-white/50 transition text-gray-800 font-bold text-sm w-full text-left"
                >
                  <item.icon size={20} className="text-gray-500 flex-shrink-0" />
                  {isOpen && <span>{item.label}</span>}
                </button>
              )}
            </div>
          ))}
      </nav>
    </aside>
  )
}

export default Sidebar
