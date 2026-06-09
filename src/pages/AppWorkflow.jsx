import React, { useState } from 'react'
import { 
  Database, FileText, Truck, Package, CheckCircle2, CreditCard, 
  ShieldCheck, ArrowDown, Search, Info, Layers, ExternalLink, 
  ChevronDown, ChevronUp, Zap, HelpCircle, Activity, BarChart3,
  X, Server, Code2, Cpu, Globe, Lock, GitMerge, FileCheck,
  CheckCircle, List, Settings, Smartphone, FileSearch, TrendingUp, AlertTriangle,
  History, PieChart, Users, ArrowRight, Play, LogIn, Map, Layout,
  ClipboardList, RefreshCw, Send, MoveRight, ClipboardCheck,
  Receipt, Landmark, BarChart
} from 'lucide-react'

const AppWorkflow = () => {
  const [expandedStage, setExpandedStage] = useState(1)
  const [showFlow, setShowFlow] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const sectors = [
    {
      id: 1,
      title: "Core Administration",
      icon: Settings,
      tag: "Infrastructure",
      description: "Security, role management, and regional foundation.",
      groups: [
        { name: "Global Admin", modules: ["Branch Master", "User Details", "Role Details", "Screen Assignment", "Manage Logo", "Manage UPI", "Change Password"] },
        { name: "Regional Setup", modules: ["State Master", "District Master", "Taluk Master", "Destination", "Lookup Master"] },
        { name: "Personnel", modules: ["Employee Management", "Driver Details"] }
      ]
    },
    {
      id: 2,
      title: "Masters & Relations",
      icon: Database,
      tag: "Business",
      description: "Managing consignors, consignees, and third-party transport partners.",
      groups: [
        { name: "Partner Profiles", modules: ["Consignor Master", "Consignee Master", "Transport Master"] },
        { name: "Price Engine", modules: ["Rate Details (Freight/DD/Handling Matrices)"] },
        { name: "Fleet Masters", modules: ["Vehicle Details", "Bunk Details"] }
      ]
    },
    {
      id: 3,
      title: "WayBill (GC) Operations",
      icon: FileText,
      tag: "Outward",
      description: "The primary operational loop for cargo booking and modification.",
      groups: [
        { name: "Booking Control", modules: ["GC Entry", "GC Modify", "WayBill Admin/Edit"] },
        { name: "Documentation", modules: ["GC Print", "GC Report", "GC Track"] }
      ]
    },
    {
      id: 4,
      title: "Trip Sheet & Fleet",
      icon: Truck,
      tag: "Logistics",
      description: "Consolidating GCs into vehicles and managing transit voyages.",
      groups: [
        { name: "Voyage Management", modules: ["Trip Sheet Entry", "Trip Sheet Ack", "Trip Sheet Alert"] },
        { name: "Settlements", modules: ["Trip Sheet Verification", "Trip Sheet Payment", "Trip Sheet Report", "Trip Sheet Tally Report"] }
      ]
    },
    {
      id: 5,
      title: "Inward & Inventory",
      icon: Package,
      tag: "Terminal",
      description: "Reception of heavy vehicles and cargo verification at terminals.",
      groups: [
        { name: "Reception", modules: ["Bulk GC Inward", "Receive Inward", "Inward Report", "Inward Status Report"] }
      ]
    },
    {
      id: 6,
      title: "Delivery & Return POD",
      icon: CheckCircle2,
      tag: "Finalization",
      description: "Handing over cargo and closing the proof-of-delivery loop.",
      groups: [
        { name: "Delivery Ops", modules: ["Update Delivery", "Delivered GC Report", "Undelivered GC Report", "Cancelled GC Report", "RTO Report"] }
      ]
    },
    {
      id: 7,
      title: "ACK Report Bundling",
      icon: FileSearch,
      tag: "Compliance",
      description: "Bundling physical PODs for institutional records and audit tracing.",
      groups: [
        { name: "Bundling", modules: ["Receive GC Ack", "Generate Ack Report ID", "Ack Report ID View", "Ack ID Report", "Ack Status Report"] }
      ]
    },
    {
      id: 8,
      title: "Revenue & Payments",
      icon: CreditCard,
      tag: "Financials",
      description: "Collecting money from direct bookings, accounts, and bill-t-pay clients.",
      groups: [
        { name: "Collections", modules: ["GC Wise Receive", "Consignor Wise Receive", "Payment Pending Report"] },
        { name: "Consignor Reports", modules: ["Consignor Report Prepare", "Consignor Report View"] }
      ]
    },
    {
      id: 9,
      title: "Accounts & Audit",
      icon: PieChart,
      tag: "Settlement",
      description: "Finalizing the daily ledger and ensuring audit transparency.",
      groups: [
        { name: "Ledger", modules: ["Head Details", "Cash Book Details", "Cash Book Report", "Audit Log Info"] },
        { name: "Finalization", modules: ["DayBook Closing (Locking Entire Date)"] }
      ]
    },
    {
      id: 10,
      title: "Intelligence & MIS",
      icon: TrendingUp,
      tag: "Management",
      description: "360° view of business health, P&L, and operational efficiency.",
      groups: [
        { name: "Operational MIS", modules: ["Waybill Report", "Dispatch Pending Report", "Booking And Dispatch"] },
        { name: "Financial MIS", modules: ["HeadWise Report", "Balance Sheet", "Profit And Loss Report", "Income/Expense Report", "WayBill Tally Report"] },
        { name: "User Insight", modules: ["User History Details", "Consignor History Report"] }
      ]
    }
  ]

  const allModules = sectors.flatMap(s => s.groups.flatMap(g => g.modules))
  const filteredModules = searchQuery.length > 0 
    ? allModules.filter(m => m.toLowerCase().includes(searchQuery.toLowerCase()))
    : []

  const flowPhases = [
    {
      title: "Phase 01: Outward Logistics",
      stages: [
        { name: "Authentication", icon: LogIn, tag: "Entry" },
        { name: "Branch Selection", icon: Map, tag: "Gate" },
        { name: "Partner Masters", icon: Database, tag: "Foundation" },
        { name: "GC Booking", icon: FileText, tag: "Booking" },
        { name: "Fleet Loading", icon: Truck, tag: "Dispatch" }
      ]
    },
    {
      title: "Phase 02: Inward & Finalization",
      stages: [
        { name: "Transit Arrival", icon: Package, tag: "Arrival" },
        { name: "Verify Inward", icon: RefreshCw, tag: "Audit" },
        { name: "Final Delivery", icon: Send, tag: "POD" },
        { name: "Paper Return", icon: ClipboardCheck, tag: "ACK" }
      ]
    },
    {
      title: "Phase 03: Settlement & MIS",
      stages: [
        { name: "Payment Receipt", icon: Receipt, tag: "Cash" },
        { name: "Cash Ledger", icon: Landmark, tag: "DayBook" },
        { name: "DayBook Close", icon: Lock, tag: "Lock" },
        { name: "P&L Analytics", icon: BarChart, tag: "MIS" }
      ]
    }
  ]

  return (
    <div className="bg-white min-h-screen font-sans selection:bg-emerald-50 text-slate-900">
      
      {/* Searchable System Header */}
      <div className="bg-slate-900 text-white sticky top-0 z-[100] border-b border-white/5 drop-shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
                <ShieldCheck size={20} />
             </div>
             <div>
                <h1 className="text-lg font-black uppercase tracking-tighter leading-none">Garuda System Roadmap</h1>
                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-1 italic">Total Enterprise Mapping v6.3</p>
             </div>
          </div>
          
          <div className="relative flex-1 max-w-md">
             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
             <input 
              type="text" 
              placeholder="Search ANY module (e.g. Rate Master, P&L, ACK)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-700"
             />
             {filteredModules.length > 0 && (
               <div className="absolute top-14 left-0 right-0 bg-white shadow-2xl rounded-2xl border border-slate-200 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                  {filteredModules.map((m, i) => (
                    <div key={i} className="px-5 py-3 text-[10px] font-black text-slate-700 uppercase hover:bg-emerald-100 cursor-pointer border-b border-slate-50 last:border-0">{m}</div>
                  ))}
               </div>
             )}
          </div>

          <button onClick={() => setShowFlow(true)} className="px-6 py-2.5 bg-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 group shadow-lg shadow-emerald-500/20">
             <GitMerge size={14} className="group-hover:rotate-180 transition-transform duration-500" /> Matrix Flow
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-14 text-center">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight uppercase italic underline decoration-emerald-500 decoration-4 underline-offset-8">Operational Sovereignty.</h2>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-8 flex items-center justify-center gap-4">
              <span className="w-10 h-px bg-slate-200" />
              10 Dynamic Life Cycle Sectors
              <span className="w-10 h-px bg-slate-200" />
            </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
           {sectors.map((sector) => (
             <div key={sector.id} className={`rounded-[2.5rem] border transition-all duration-500 ${expandedStage === sector.id ? 'bg-[#f8faf8] border-emerald-500 shadow-2xl ring-4 ring-emerald-500/5' : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-900/10'}`}>
                <div 
                  className="px-8 py-8 flex items-center justify-between cursor-pointer group"
                  onClick={() => setExpandedStage(expandedStage === sector.id ? null : sector.id)}
                >
                   <div className="flex items-center gap-8">
                      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 ${expandedStage === sector.id ? 'bg-emerald-600 text-white shadow-xl scale-110' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 shadow-inner'}`}>
                         <sector.icon size={30} />
                      </div>
                      <div>
                         <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">{sector.tag} Sector</span>
                         <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-1 group-hover:translate-x-1 transition-transform">{sector.title}</h3>
                      </div>
                   </div>
                   <div className="flex items-center gap-10">
                      <p className="hidden lg:block text-[11px] font-bold text-slate-400 italic text-right max-w-xs leading-relaxed uppercase tracking-tight">
                        {sector.description}
                      </p>
                      <div className={`p-3 rounded-full transition-all duration-300 ${expandedStage === sector.id ? 'bg-emerald-600 shadow-lg -rotate-180' : 'bg-white border border-slate-100'}`}>
                         {expandedStage === sector.id ? <ChevronUp size={24} className="text-white" /> : <ChevronDown size={24} className="text-slate-300" />}
                      </div>
                   </div>
                </div>

                {expandedStage === sector.id && (
                  <div className="px-12 pb-14 pt-4 border-t border-slate-200/50 animate-in fade-in slide-in-from-top-4 duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                        {sector.groups.map((group, gIdx) => (
                          <div key={gIdx} className="space-y-6">
                             <h5 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em] border-b-2 border-emerald-100 pb-2">{group.name}</h5>
                             <div className="flex flex-col gap-3">
                                {group.modules.map((m, mIdx) => (
                                  <div key={mIdx} className="flex gap-4 group/m items-center">
                                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-200 group-hover/m:bg-emerald-500 group-hover/m:scale-125 transition-all" />
                                     <span className="text-[11px] font-black text-slate-500 uppercase group-hover/m:text-slate-900 transition-colors cursor-default">{m}</span>
                                  </div>
                                ))}
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
             </div>
           ))}
        </div>
      </div>

      {/* MATRIX FLOW MODAL - 3 PHASE COVERAGE */}
      {showFlow && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-8 animate-in fade-in duration-500">
           <div className="w-full max-w-6xl bg-white rounded-[4rem] shadow-2xl flex flex-col h-[90vh] overflow-hidden border-4 border-emerald-500/20">
              
              <div className="p-10 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white">
                 <div className="flex items-center gap-6">
                    <div className="p-4 bg-emerald-600 rounded-[2rem] shadow-emerald-200 shadow-2xl">
                       <GitMerge size={28} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Unified Process Matrix</h2>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">End-to-End Operational Lifecycle Mapping</p>
                    </div>
                 </div>
                 <button onClick={() => setShowFlow(false)} className="p-5 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-[2rem] transition-all shadow-xl">
                    <X size={32} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-20 custom-scrollbar bg-[#fdfdfd]">
                 {flowPhases.map((phase, pIdx) => (
                   <div key={pIdx} className="space-y-10">
                      <div className="flex items-center gap-6">
                         <span className="bg-emerald-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{phase.title.split(':')[0]}</span>
                         <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">{phase.title.split(':')[1]}</h3>
                         <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-0">
                         {phase.stages.map((stage, sIdx) => (
                           <React.Fragment key={sIdx}>
                             {/* Large Matrix Node */}
                             <div className="flex flex-col items-center group relative w-32">
                                <div className="w-20 h-20 bg-white border-4 border-slate-50 rounded-[2.2rem] flex items-center justify-center shadow-2xl group-hover:border-emerald-500 group-hover:scale-110 transition-all duration-500 relative z-20">
                                   <stage.icon size={28} className="text-slate-900 group-hover:text-emerald-600 transition-colors" />
                                   <div className="absolute inset-2 border border-slate-100 rounded-[1.8rem] pointer-events-none" />
                                </div>
                                <div className="mt-8 text-center">
                                   <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.3em] font-bold">{stage.tag}</span>
                                   <h4 className="text-[11px] font-black text-slate-900 uppercase mt-2 tracking-tighter leading-none">{stage.name}</h4>
                                </div>
                             </div>

                             {/* Horizontal Flow Link */}
                             {sIdx < phase.stages.length - 1 && (
                               <div className="hidden lg:flex w-20 h-[3px] bg-slate-100 relative mt-[-3.5rem] overflow-hidden">
                                  <div className="absolute inset-0 bg-emerald-500 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-1000" />
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-200" />
                               </div>
                             )}
                           </React.Fragment>
                         ))}
                      </div>
                   </div>
                 ))}
                 
                 {/* Connection between Phase 1 and 2 Indicator */}
                 <div className="flex flex-col items-center gap-4 py-10 opacity-20">
                    <div className="w-px h-20 bg-emerald-500" />
                    <ArrowDown size={24} className="text-emerald-500 animate-bounce" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cross-Module Integration</span>
                 </div>
              </div>

              <div className="p-10 border-t border-slate-50 bg-white flex flex-col md:flex-row items-center justify-between">
                 <div className="flex items-center gap-4">
                    <Info size={20} className="text-emerald-600" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-lg leading-relaxed">
                      "This matrix represents the full 84-module lifecycle of the system.<br/> Every transition point requires specific role-based authorization."
                    </p>
                 </div>
                 <button onClick={() => setShowFlow(false)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all active:scale-95">
                    Return to Map
                 </button>
              </div>

           </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800;900&display=swap');
        .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        .animate-in {
          animation: animate-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        @keyframes animate-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  )
}

export default AppWorkflow
