import React, { createContext, useContext, useState } from 'react'

const TabContext = createContext()

export function TabProvider({ children }) {
  const [tabs, setTabs] = useState([
    { id: 'dashboard', title: 'Dashboard', path: '/', active: true }
  ])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showLimitModal, setShowLimitModal] = useState(false)

  const addTab = (title, path, component) => {
    const existingTab = tabs.find(tab => tab.path === path)

    if (existingTab) {
      setActiveTab(existingTab.id)
      return
    }

    // Check if we reached the limit of 6 tabs (excluding dashboard)
    const extraTabsCount = tabs.filter(tab => tab.id !== 'dashboard').length
    if (extraTabsCount >= 6) {
      setShowLimitModal(true)
      return
    }

    const newTab = {
      id: path.replace('/', '') || 'dashboard',
      title,
      path,
      component,
      active: true
    }

    setTabs(prev => [...prev, newTab])
    setActiveTab(newTab.id)
  }

  const closeTab = (tabId) => {
    // Prevent closing dashboard tab
    if (tabId === 'dashboard') return

    if (tabs.length === 1) return

    const newTabs = tabs.filter(tab => tab.id !== tabId)
    setTabs(newTabs)

    if (activeTab === tabId) {
      const lastTab = newTabs[newTabs.length - 1]
      setActiveTab(lastTab.id)
    }
  }

  const switchTab = (tabId) => {
    setActiveTab(tabId)
  }

  const value = {
    tabs,
    activeTab,
    showLimitModal,
    setShowLimitModal,
    addTab,
    closeTab,
    switchTab
  }

  return (
    <TabContext.Provider value={value}>
      {children}
    </TabContext.Provider>
  )
}

export function useTabs() {
  const context = useContext(TabContext)
  if (!context) {
    throw new Error('useTabs must be used within a TabProvider')
  }
  return context
}
