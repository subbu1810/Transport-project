import React, { createContext, useContext, useState } from 'react'

const TabContext = createContext()

export function TabProvider({ children }) {
  const [tabs, setTabs] = useState([
    { id: 'dashboard', title: 'Dashboard', path: '/', active: true }
  ])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [tabData, setTabData] = useState({})

  const addTab = (title, path, data = null) => {
    const id = path.replace('/', '') || 'dashboard'

    if (data) {
      setTabData(prev => ({ ...prev, [id]: data }))
    }

    const existingTab = tabs.find(tab => tab.id === id)
    if (existingTab) {
      setActiveTab(id)
      return
    }

    // Check if we reached the limit of 8 tabs (excluding dashboard)
    const extraTabsCount = tabs.filter(tab => tab.id !== 'dashboard').length
    if (extraTabsCount >= 8) {
      setShowLimitModal(true)
      return
    }

    const newTab = {
      id,
      title,
      path,
      active: true
    }

    setTabs(prev => [...prev, newTab])
    setActiveTab(id)
  }

  const setTabDataForTab = (tabId, data) => {
    setTabData(prev => ({ ...prev, [tabId]: data }))
  }

  const clearTabData = (tabId) => {
    setTabData(prev => {
      const next = { ...prev }
      delete next[tabId]
      return next
    })
  }

  const closeTab = (tabId) => {
    // Prevent closing dashboard tab
    if (tabId === 'dashboard') return

    if (tabs.length === 1) return

    const newTabs = tabs.filter(tab => tab.id !== tabId)
    setTabs(newTabs)

    // Also clear its data
    clearTabData(tabId)

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
    tabData,
    showLimitModal,
    setShowLimitModal,
    addTab,
    closeTab,
    switchTab,
    setTabDataForTab,
    clearTabData
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
