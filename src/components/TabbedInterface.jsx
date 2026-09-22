import React from 'react'
import { X, Plus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useTabs } from '../contexts/TabContext'
import Dashboard from '../pages/Dashboard'
import BranchMaster from '../pages/BranchMaster'
import UserDetails from '../pages/UserDetails'
import BranchManagement from '../pages/AdminManagement'
import RoleDetails from '../pages/RoleDetails'
import ScreenAssignment from '../pages/ScreenAssignment'
import SystemSettings from '../pages/SystemSettings'
import ManageUPI from '../pages/ManageUPI'
import LookupMaster from '../pages/LookupMaster'
import StateMaster from '../pages/StateMaster'
import DistrictMaster from '../pages/DistrictMaster'
import TalukMaster from '../pages/TalukMaster'
import Destination from '../pages/Destination'
import ConsignorMaster from '../pages/ConsignorMaster'
import ConsigneeMaster from '../pages/ConsigneeMaster'
import RateDetails from '../pages/RateDetails'
import DriverDetails from '../pages/DriverDetails'
import VehicleDetails from '../pages/VehicleDetails'
import BunkDetails from '../pages/BunkDetails'
import TransportMaster from '../pages/TransportMaster'
import GCEntry from '../pages/GCEntry'
import GCModify from '../pages/GCModify'
import ReceiveGCAck from '../pages/ReceiveGCAck'
import GCPrint from '../pages/GCPrint'
import GCTracking from '../pages/GCTracking'
import GCReport from '../pages/GCReport'
import WayBillAdminEdit from '../pages/WayBillAdminEdit'
import HeadDetails from '../pages/HeadDetails'
import CashBookDetails from '../pages/CashBookDetails'
import CashBookReport from '../pages/CashBookReport'
import ReceiveInward from '../pages/ReceiveInward'
import OwnerSettlement from '../pages/OwnerSettlement'
import SettlementHistory from '../pages/SettlementHistory'
import FuelTokenEntry from '../pages/FuelTokenEntry'
import BunkBillEntry from '../pages/BunkBillEntry'
import BunkLedgerReport from '../pages/BunkLedgerReport'
import BunkPaymentEntry from '../pages/BunkPaymentEntry'

import InwardReport from '../pages/InwardReport'
import BulkGCInward from '../pages/BulkGCInward'
import TripSheetEntry from '../pages/TripSheetEntry'
import LocalTrip from '../pages/LocalTrip'
import TripSheetAck from '../pages/TripSheetAck'
import TripSheetReport from '../pages/TripSheetReport'
import LocalTripReport from '../pages/LocalTripReport'
import TripSheetAlert from '../pages/TripSheetAlert'
import TripSheetPayment from '../pages/TripSheetPayment'
import ConsignorReportPrepare from '../pages/ConsignorReportPrepare'
import ConsignorReportView from '../pages/ConsignorReportView'

import GenerateAckReportId from '../pages/GenerateAckReportId'
import AckReportIdView from '../pages/AckReportIdView'
import GCWiseReceive from '../pages/GCWiseReceive'
import ConsignorWiseReceive from '../pages/ConsignorWiseReceive'
import ConsignorWiseReceiveWithoutId from '../pages/ConsignorWiseReceiveWithoutId'
import PaymentPendingReport from '../pages/PaymentPendingReport'
import WaybillTrack from '../pages/WaybillTrack'
import WaybillReportPage from '../pages/WaybillReportPage'
import ConsignorReportReports from '../pages/ConsignorReportReports'
import DispatchPendingReport from '../pages/DispatchPendingReport'
import TripSheetReportReports from '../pages/TripSheetReportReports'
import AuditLogInfo from '../pages/AuditLogInfo'
import InwardStatusReport from '../pages/InwardStatusReport'
import AckStatusReport from '../pages/AckStatusReport'
import ChangePassword from '../pages/ChangePassword'
import HeadwiseReport from '../pages/HeadwiseReport'
import BalanceSheet from '../pages/BalanceSheet'
import BookingAndDispatch from '../pages/BookingAndDispatch'
import ProfitAndLossReport from '../pages/ProfitAndLossReport'
import ConsignorHistoryReport from '../pages/ConsignorHistoryReport'
import UserHistoryDetails from '../pages/UserHistoryDetails'
import WaybillTallyReport from '../pages/WaybillTallyReport'
import IncomeExpenseReport from '../pages/IncomeExpenseReport'
import TripSheetTallyReport from '../pages/TripSheetTallyReport'
import Masters from '../pages/Masters'
import WayBill from '../pages/WayBill'
import Accounts from '../pages/Accounts'
import InwardWayBill from '../pages/InwardWayBill'
import TripSheet from '../pages/TripSheet'
import EWayBill from '../pages/EWayBill'
import ConsignorReport from '../pages/ConsignorReport'

import ACKReportBundle from '../pages/ACKReportBundle'
import ReceivePayment from '../pages/ReceivePayment'
import Reports from '../pages/Reports'
import UpdateDelivery from '../pages/UpdateDelivery'
import DeliveryStatusReport from '../pages/DeliveryStatusReport'
import EmployeeManagement from '../pages/EmployeeManagement'
import AppWorkflow from '../pages/AppWorkflow'
import GCFormatPrint from '../pages/GCFormatPrint'
import RouteMaster from '../pages/RouteMaster'
import RouteTripSheetEntry from '../pages/RouteTripSheetEntry'
import RouteAnalytics from '../pages/RouteAnalytics'
import TechnicalSupport from '../pages/TechnicalSupport'
import MaintenanceBilling from '../pages/MaintenanceBilling'
import BackupOptions from '../pages/BackupOptions'
import MobileAppQR from '../pages/MobileAppQR'
import UploadPod from '../pages/UploadPod'
import PendingPodReport from '../pages/PendingPodReport'

function TabbedInterface() {
  const { tabs, activeTab, closeTab, switchTab, showLimitModal, setShowLimitModal } = useTabs()
  const [modal, setModal] = React.useState({
    isOpen: false,
    tabId: null,
    title: 'Close Tab?',
    message: ''
  })

  const handleCloseClick = (e, tabId) => {
    e.stopPropagation()
    const tabToClose = tabs.find(t => t.id === tabId)
    setModal({
      ...modal,
      isOpen: true,
      tabId: tabId,
      message: `Are you sure you want to close "${tabToClose?.title || 'this tab'}"? Any unsaved changes may be lost.`
    })
  }

  const confirmClose = () => {
    if (modal.tabId) {
      closeTab(modal.tabId)
    }
    setModal({ ...modal, isOpen: false, tabId: null })
  }

  const componentMap = {
    'dashboard': <Dashboard />,
    'branch-master': <BranchMaster />,
    'user-details': <UserDetails />,
    'admin-management': <BranchManagement />,
    'role-details': <RoleDetails />,
    'screen-assignment': <ScreenAssignment />,
    'manage-logo': <SystemSettings />,
    'manage-upi': <ManageUPI />,
    'lookup-master': <LookupMaster />,
    'state-master': <StateMaster />,
    'district-master': <DistrictMaster />,
    'taluk-master': <TalukMaster />,
    'destination': <Destination />,
    'consignor-master': <ConsignorMaster />,
    'consignee-master': <ConsigneeMaster />,
    'rate-details': <RateDetails />,
    'driver-details': <DriverDetails />,
    'vehicle-details': <VehicleDetails />,
    'bunk-details': <BunkDetails />,
    'transport-master': <TransportMaster />,
    'gc-entry': <GCEntry />,
    'gc-track': <GCTracking />,
    'gc-modify': <GCModify />,
    'receive-gc-ack': <ReceiveGCAck />,
    'gc-print': <GCPrint />,
    'gc-report': <GCReport />,
    'waybill-admin-edit': <WayBillAdminEdit />,
    'head-details': <HeadDetails />,
    'cash-book-details': <CashBookDetails />,
    'cash-book-report': <CashBookReport />,
    'cashbook-report': <CashBookReport />,
    'receive-inward': <ReceiveInward />,
    'owner-settlement': <OwnerSettlement />,
    'settlement-history': <SettlementHistory />,
    'fuel-token-entry': <FuelTokenEntry />,
    'bunk-bill-entry': <BunkBillEntry />,
    'bunk-payment-entry': <BunkPaymentEntry />,
    'bunk-ledger-report': <BunkLedgerReport />,

    'inward-report': <InwardReport />,
    'bulk-gc-inward': <BulkGCInward />,
    'trip-sheet-entry': <TripSheetEntry />,
    'local-trip-entry': <LocalTrip />,
    'trip-sheet-ack': <TripSheetAck />,
    'trip-sheet-report': <TripSheetReport />,
    'local-trip-report': <LocalTripReport />,
    'trip-sheet-alert': <TripSheetAlert />,
    'trip-sheet-payment': <TripSheetPayment />,
    'consignor-report-prepare': <ConsignorReportPrepare />,
    'consignor-report-view': <ConsignorReportView />,

    'generate-ack-report-id': <GenerateAckReportId />,
    'ack-report-id-view': <AckReportIdView />,
    'gc-wise-receive': <GCWiseReceive />,
    'consignor-wise-receive': <ConsignorWiseReceive />,
    'consignor-wise-receive-without-id': <ConsignorWiseReceiveWithoutId />,
    'payment-pending-report': <PaymentPendingReport />,
    'waybill-track': <WaybillTrack />,
    'waybill-track-report': <WaybillReportPage />,
    'waybill-report': <WaybillReportPage />,
    'consignor-report-reports': <ConsignorReportReports />,
    'dispatch-pending-report': <DispatchPendingReport />,
    'trip-sheet-report-reports': <TripSheetReportReports />,
    'audit-log-info': <AuditLogInfo />,
    'inward-status-report': <InwardStatusReport />,
    'ack-status-report': <AckStatusReport />,
    'change-password': <ChangePassword />,
    'headwise-report': <HeadwiseReport />,
    'balance-sheet': <BalanceSheet />,
    'booking-and-dispatch': <BookingAndDispatch />,
    'profit-and-loss-report': <ProfitAndLossReport />,
    'consignor-history-report': <ConsignorHistoryReport />,
    'user-history-details': <UserHistoryDetails />,
    'waybill-tally-report': <WaybillTallyReport />,
    'income-expense-report': <IncomeExpenseReport />,
    'trip-sheet-tally-report': <TripSheetTallyReport />,
    'masters': <Masters />,
    'waybill': <WayBill />,
    'accounts': <Accounts />,
    'inward-waybill': <InwardWayBill />,
    'trip-sheet': <TripSheet />,
    'eway-bill': <EWayBill />,
    'consignor-report': <ConsignorReport />,

    'ack-report-bundle': <ACKReportBundle />,
    'receive-payment': <ReceivePayment />,
    'reports': <Reports />,
    'update-delivery': <UpdateDelivery />,
    'upload-pod': <UploadPod />,
    'delivered-gc-report': <DeliveryStatusReport reportType="delivered" />,
    'undelivered-gc-report': <DeliveryStatusReport reportType="undelivered" />,
    'cancelled-gc-report': <DeliveryStatusReport reportType="cancelled" />,
    'rto-report': <DeliveryStatusReport reportType="rto" />,
    'pending-pod-report': <PendingPodReport />,
    'delivery-status-report': <DeliveryStatusReport />,
    'employee-management': <EmployeeManagement />,
    'app-workflow': <AppWorkflow />,
    'gc-format-print': <GCFormatPrint />,
    'route-master': <RouteMaster />,
    'route-trip-entry': <RouteTripSheetEntry />,
    'route-analytics': <RouteAnalytics />,
    'technical-support': <TechnicalSupport />,
    'maintenance-billing': <MaintenanceBilling />,
    'backup-options': <BackupOptions />,
    'mobile-app-qr': <MobileAppQR />
  }

  return (
    <div className="flex flex-col h-full relative print:block print:h-auto">
      {/* Modern Confirmation Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-3 bg-blue-50/50">
              <div className="flex justify-center">
                <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                  <AlertCircle size={32} />
                </div>
              </div>
              <h2 className="text-xl font-black text-blue-900">{modal.title}</h2>
              <p className="text-gray-600 text-xs font-medium leading-relaxed px-4">{modal.message}</p>
            </div>
            <div className="p-4 bg-white flex gap-3">
              <button
                onClick={() => setModal({ ...modal, isOpen: false, tabId: null })}
                className="flex-1 px-4 py-2.5 border-2 border-gray-100 rounded-xl text-gray-500 text-xs font-black hover:bg-gray-50 transition-all uppercase"
              >
                CANCEL
              </button>
              <button
                onClick={confirmClose}
                className="flex-1 px-4 py-2.5 rounded-xl text-white text-xs font-black shadow-lg transition-all hover:scale-105 active:scale-95 bg-blue-600 shadow-blue-100 hover:bg-blue-700 uppercase"
              >
                YES, CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Limit Reached Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-3 bg-orange-50/50">
              <div className="flex justify-center">
                <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                  <AlertCircle size={32} />
                </div>
              </div>
              <h2 className="text-xl font-black text-orange-900">Limit Reached!</h2>
              <p className="text-gray-600 text-xs font-medium leading-relaxed px-4">
                You can open a maximum of 8 tabs (excluding Dashboard).
                Please close an existing tab to open a new one.
              </p>
            </div>
            <div className="p-4 bg-white flex">
              <button
                onClick={() => setShowLimitModal(false)}
                className="flex-1 px-4 py-3 rounded-xl text-white text-xs font-black shadow-lg transition-all hover:scale-105 active:scale-95 bg-orange-600 shadow-orange-100 hover:bg-orange-700 uppercase"
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Tab Headers */}
      <div className="bg-gray-100 border-b border-gray-300 no-print">
        <div className="flex items-center overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center gap-2 px-4 py-2 border-r border-gray-300 cursor-pointer transition-colors ${activeTab === tab.id
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-200'
                }`}
              onClick={() => switchTab(tab.id)}
            >
              <span className="text-sm font-medium whitespace-nowrap">{tab.title}</span>
              {tabs.length > 1 && tab.id !== 'dashboard' && (
                <button
                  onClick={(e) => handleCloseClick(e, tab.id)}
                  className="p-1 hover:bg-gray-300 rounded transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-white relative print:block print:overflow-visible">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`h-full w-full ${activeTab === tab.id ? 'block' : 'hidden'}`}
          >
            {componentMap[tab.id] || <div className="p-6">Page not found: {tab.id}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TabbedInterface
