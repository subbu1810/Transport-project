import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import TabbedInterface from './components/TabbedInterface'
import { TabProvider } from './contexts/TabContext'
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
import UnloadReport from './pages/UnloadReport'
import ACKReportBundle from './pages/ACKReportBundle'
import ReceivePayment from './pages/ReceivePayment'
import Reports from './pages/Reports'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Session is no longer persistent across reloads as requested
    // If you want persistence, move this back to checking localStorage
    setIsAuthenticated(false)
    setLoading(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setIsAuthenticated(false)
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
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

  return (
    <Router>
      {!isAuthenticated ? (
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <TabProvider>
          <div className="flex h-screen bg-gray-100">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} onLogout={handleLogout} />
              <main className="flex-1 overflow-auto">
                <TabbedInterface />
              </main>
            </div>
          </div>
        </TabProvider>
      )}
    </Router>
  )
}

export default App
