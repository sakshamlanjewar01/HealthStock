import React from 'react';
import { Activity, Package, RefreshCw, ClipboardList, Bell, Calendar, HeartPulse } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Activity },
    { id: 'inventory', label: 'Meds', icon: Package },
    { id: 'refills', label: 'Refills', icon: RefreshCw },
    { id: 'progress', label: 'Progress', icon: HeartPulse },
    { id: 'calendar', label: 'History', icon: Calendar },
    { id: 'alerts', label: 'Alerts', icon: Bell, hasDot: true }
  ];

  return (
    <nav className="md:hidden fixed bottom-5 left-4 right-4 bg-white/95 border border-slate-100/90 backdrop-blur-2xl z-50 flex justify-around items-center px-2 py-2.5 rounded-[22px] shadow-[0_16px_40px_rgba(15,47,87,0.1)] transition-all mobile-bottom-nav-floating">
      <AnimatePresence>
        {navItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
              className="flex flex-col items-center justify-center gap-1 flex-1 relative cursor-pointer group outline-none transition-all active:scale-95"
            >
              <div className="relative flex items-center justify-center w-12 h-7 z-10">
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTabIndicator"
                    className="absolute inset-0 bg-[#2563EB]/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  />
                )}
                <Icon className={`w-4.5 h-4.5 relative z-10 transition-colors duration-200 ${isActive ? 'text-[#2563EB]' : 'text-[#94A3B8] group-hover:text-[#0F2F57]'}`} />
                {tab.hasDot && (
                  <span className={`absolute top-0 right-2 w-2 h-2 rounded-full border border-white z-20 ${isActive ? 'bg-rose-500' : 'bg-rose-500 animate-pulse'}`}></span>
                )}
              </div>
              <span className={`text-[9px] tracking-wide font-bold text-center block leading-none transition-colors duration-200 ${isActive ? 'text-[#2563EB]' : 'text-[#94A3B8]'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </AnimatePresence>
    </nav>
  );
}
