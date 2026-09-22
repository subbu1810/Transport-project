import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import TabbedInterface from './components/TabbedInterface'
import { TabProvider } from './contexts/TabContext'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import BranchMaster from './pages/BranchMaster'
import UserDetails from './pages/UserDetails'
import RoleDetails from './pages/RoleDetails'
import ScreenAssignment from './pages/ScreenAssignment'
import Masters from './pages/Masters'
import WayBill from './pages/WayBill'
import Accounts from './pages/Accounts'
import InwardWayBill from './pages/InwardWayBill'
import TripSheet from './pages/TripSheet'
import EWayBill from './pages/EWayBill'
import ConsignorReport from './pages/ConsignorReport'

import ACKReportBundle from './pages/ACKReportBundle'
import ReceivePayment from './pages/ReceivePayment'
import Reports from './pages/Reports'
import AppWorkflow from './pages/AppWorkflow'
import ChangePassword from './pages/ChangePassword'
import RouteMaster from './pages/RouteMaster'
import RouteTripSheetEntry from './pages/RouteTripSheetEntry'
import MaintenanceBilling from './pages/MaintenanceBilling'
import MaintenanceAlert from './components/MaintenanceAlert'
import BackupOptions from './pages/BackupOptions'
import MobileAppQR from './pages/MobileAppQR'
import ForceBackupOverlay from './components/ForceBackupOverlay'
function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [isBackupLocked, setIsBackupLocked] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkBackupStatus = async (user) => {
    if (!user) {
        setIsBackupLocked(false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/settings/backup/global-status`);
        const data = await response.json();
        
        if (data.success) {
            setIsBackupLocked(data.locked);
            if (!data.locked) {
                // Keep local storage in sync just in case
                if (data.last_download) {
                    localStorage.setItem('last_backup_download_date', data.last_download.created_at);
                }
            }
        } else {
            // Fallback to local storage if API fails
            const lastBackupDateStr = localStorage.getItem('last_backup_download_date');
            if (!lastBackupDateStr) {
                setIsBackupLocked(true);
            } else {
                const diffTime = Math.abs(new Date() - new Date(lastBackupDateStr));
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                setIsBackupLocked(diffDays >= 7);
            }
        }
    } catch (error) {
        console.error('Failed to check global backup status', error);
        // Fallback to local storage
        const lastBackupDateStr = localStorage.getItem('last_backup_download_date');
        if (!lastBackupDateStr) {
            setIsBackupLocked(true);
        } else {
            const diffTime = Math.abs(new Date() - new Date(lastBackupDateStr));
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setIsBackupLocked(diffDays >= 7);
        }
    }
  };

  const checkMaintenanceStatus = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    
    try {
      const user = JSON.parse(userStr);
      const isSuperAdmin = user.role?.role_name?.toLowerCase() === 'superadmin' || user.role?.role_name?.toLowerCase() === 'super admin';
      const branchQuery = isSuperAdmin ? '' : `&branch_id=${user.branch_id}`;
      
      const response = await fetch(`${API_BASE_URL}/maintenance/pending-bill?transport_id=${user.transport_id}${branchQuery}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        const bill = data.data[0];
        const today = new Date();
        const overdue = today.getDate() > 5 && (
          bill.bill_year < today.getFullYear() || 
          (bill.bill_year === today.getFullYear() && bill.bill_month < (today.getMonth() + 1))
        );
        setIsLocked(overdue);
      } else {
        setIsLocked(false);
      }
    } catch (error) {
      console.error('Lockdown check failed:', error);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setIsAuthenticated(true);
      checkMaintenanceStatus();
      checkBackupStatus(user);
    } else {
      setIsAuthenticated(false)
    }
    setLoading(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setIsLocked(false)
    setIsBackupLocked(false)
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        checkMaintenanceStatus();
        checkBackupStatus(user);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-green-600 to-green-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  if (showSplash) {
    return <LandingPage onComplete={() => setShowSplash(false)} />
  }

  // Lockdown View
  if (isAuthenticated && isLocked) {
    return (
      <Router>
        <div className="h-screen flex flex-col bg-gray-50">
          <div className="bg-red-600 text-white p-4 text-center font-bold flex items-center justify-center gap-2">
            <AlertTriangle size={20} />
            SYSTEM LOCKED: OVERDUE MAINTENANCE DUES DETECTED
          </div>
          <div className="flex-1 overflow-auto">
            <MaintenanceBilling />
          </div>
          <div className="p-4 border-t bg-white text-center">
            <button onClick={handleLogout} className="text-red-600 font-bold hover:underline">Logout</button>
          </div>
        </div>
      </Router>
    )
  }

  if (isAuthenticated && isBackupLocked) {
      return <ForceBackupOverlay onComplete={() => {
          localStorage.setItem('last_backup_download_date', new Date().toISOString());
          checkBackupStatus(JSON.parse(localStorage.getItem('user'))); // re-verify with backend
      }} />
  }

  return (
    <Router>
      {!isAuthenticated ? (
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <TabProvider>
          <div className="flex h-screen bg-gray-100 print:block print:h-auto">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex-1 flex flex-col overflow-hidden print:block print:overflow-visible">
              <MaintenanceAlert />
              <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} onLogout={handleLogout} />
              <main className="flex-1 flex flex-col overflow-hidden print:block print:overflow-visible">
                <div className="flex-1 overflow-auto print:block print:overflow-visible">
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/branch-master" element={<BranchMaster />} />
                    <Route path="/user-details" element={<UserDetails />} />
                    <Route path="/role-details" element={<RoleDetails />} />
                    <Route path="/screen-assignment" element={<ScreenAssignment />} />
                    <Route path="/app-workflow" element={<AppWorkflow />} />
                    <Route path="/change-password" element={<ChangePassword />} />
                    <Route path="/route-master" element={<RouteMaster />} />
                    <Route path="/route-trip-entry" element={<RouteTripSheetEntry />} />
                    <Route path="/maintenance-billing" element={<MaintenanceBilling />} />
                    <Route path="/backup-options" element={<BackupOptions />} />
                    <Route path="/mobile-app-qr" element={<MobileAppQR />} />
                    {/* Simplified route handling for tab system */}
                    <Route path="*" element={<TabbedInterface />} />
                  </Routes>
                </div>
                <footer className="py-2 z-50 text-center text-[11px] font-bold text-gray-500 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] no-print">
                  &copy; {new Date().getFullYear()} S Square G Tech Solutions Pvt Ltd. All Rights Reserved.
                </footer>
              </main>
            </div>
          </div>
        </TabProvider>
      )}
    </Router>
  )
}

export default App
