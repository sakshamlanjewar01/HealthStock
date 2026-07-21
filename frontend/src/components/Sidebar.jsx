import React from 'react';
import { Activity, Package, RefreshCw, ClipboardList, Bell, Settings, LogOut, Calendar, Heart, HeartPulse } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

export default function Sidebar({ user, activeTab, setActiveTab, setActiveModal, logout }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'refills', label: 'Refills', icon: RefreshCw },
    { id: 'progress', label: 'Progress', icon: HeartPulse },
    { id: 'calendar', label: 'History', icon: Calendar },
    { id: 'alerts', label: 'Alerts', icon: Bell }
  ];

  return (
    <aside className="hidden md:flex w-64 lg:w-72 flex-col justify-between z-40 sticky top-0 h-screen shrink-0 min-w-0 p-4 sm:p-6 gap-6">
      {/* SOLID WHITE CONTAINER */}
      <div className="bg-white rounded-[2rem] p-5 flex flex-col gap-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex-1 overflow-y-auto no-scrollbar">

        {/* Sidebar Header Brand */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 select-none px-1 text-left"
        >
          <Logo className="w-9 h-9" />
          <div className="flex flex-col text-left">
            <h1 className="text-[17px] font-black tracking-tight leading-none text-[#0F2F57]">
              Healthstock
            </h1>
            <span className="text-[#95A6B7] text-[8px] font-black tracking-[0.2em] uppercase mt-0.5">
              INTELLIGENCE
            </span>
          </div>
        </motion.div>





        {/* Sidebar Menu Links */}
        <nav className="space-y-1 text-left relative mt-2">
          <AnimatePresence>
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer z-10 ${isActive ? '!text-white' : 'text-[#334155] hover:text-[#2563EB] hover:bg-[#EFF6FF]'
                    }`}
                >
                  {/* Animated Background Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-[#2563EB] rounded-2xl shadow-none -z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? '!text-white' : 'text-[#64748B]'}`} />
                  <span className={`relative z-10 ${isActive ? '!text-white' : ''}`}>{tab.label}</span>
                </button>
              );
            })}
          </AnimatePresence>
        </nav>

        {/* Bottom Actions inside a beautiful card wrapper */}
        <div className="bg-slate-50/60 border border-slate-100 rounded-3xl p-3 pt-5 pb-5 space-y-1.5 mt-auto">
          <button
            onClick={() => setActiveModal('settings')}
            className="flex items-center gap-3 w-full px-4 py-3 text-[#0F2F57] hover:text-[#0B53FA] rounded-2xl transition-all cursor-pointer text-xs font-bold text-left hover:bg-white hover:shadow-xs"
          >
            <Settings className="w-4.5 h-4.5 text-slate-400" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 w-full px-4 py-3 text-rose-500 hover:text-rose-600 rounded-2xl transition-all cursor-pointer text-xs font-bold text-left hover:bg-rose-50/60"
          >
            <LogOut className="w-4.5 h-4.5 text-rose-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
