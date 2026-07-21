import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell, CheckCircle2, AlertTriangle, Calendar, TrendingUp, X,
  Send, Check, Phone, ArrowLeft, RefreshCw, Heart, Plus, ClipboardList, ArrowRight, Shield, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { requestPharmacyRefill } from '../services/dataService';

export default function RefillReminder({ refills, medicines = [], onRefill, activeView = 'all', setActiveTab, onRequestPharmacyRefill }) {
  const { user } = useAuth();
  const patientName = user?.name || "Patient";

  const priorityWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
  const sortedRefills = [...refills].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  const alertRefills = sortedRefills.filter(r => r.priority !== 'Low');

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-rose-50 text-[#EF4444] border border-rose-150 font-extrabold';
      case 'High': return 'bg-orange-50 text-orange-600 border border-orange-150 font-extrabold';
      case 'Medium': return 'bg-amber-50 text-amber-600 border border-amber-150 font-semibold';
      default: return 'bg-slate-50 text-slate-500 border border-slate-200 font-medium';
    }
  };

  if (activeView === 'widget') {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between min-h-[360px] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <h3 className="text-base font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
            <Bell className="w-4.5 h-4.5 text-amber-400" />
            Refill Warnings & Alerts
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Medicines requiring inventory restocking</p>
        </div>
        <div className="h-60 mt-4 overflow-y-auto pr-1 space-y-3.5">
          {alertRefills.length > 0 ? (
            alertRefills.map((refill) => {
              const med = medicines.find(m => (m._id === refill.medicineId || m.id === refill.medicineId));
              return (
                <div key={refill.id} className="flex items-center justify-between p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/80 transition-all hover:bg-slate-900/70 text-left">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100">{refill.medicineName}</span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(refill.priority)}`}>
                        {refill.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {refill.remainingQuantity} remaining • Est. <span className="text-teal-400">{refill.estimatedDaysLeft} days left</span>
                    </p>
                  </div>
                  {med && med.refillsRemaining <= 0 ? (
                    <span className="text-[10px] font-bold text-rose-455 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 text-center">
                      No Refills
                    </span>
                  ) : (
                    <button
                      onClick={() => onRefill(refill.medicineId)}
                      className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white border border-[#2563EB] text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    >
                      Refill
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-6 text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-teal-400 mb-2 opacity-80" />
              <p className="text-xs">All inventories healthy. No refills needed!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const totalMeds = medicines.length;
  const criticalCount = refills.filter(r => r.priority === 'Critical').length;
  const highCount = refills.filter(r => r.priority === 'High').length;
  const lowCount = refills.filter(r => r.priority === 'Medium').length;
  const totalAlerts = criticalCount + highCount + lowCount;

  const sortedByDays = [...refills].sort((a, b) => a.estimatedDaysLeft - b.estimatedDaysLeft);
  const earliest = sortedByDays[0];

  const totalDailyDoses = medicines.reduce((sum, m) => sum + (m.dosesPerDay || 1), 0);
  const totalDailyUnits = medicines.length > 0 ? medicines[0].unit : 'Tablets';

  return (
    <div className="space-y-6 text-left max-w-md mx-auto md:max-w-none">

      {/* Page Header Area with Hero Leaf & Pill Bottle SVG */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-2 mb-8 relative">
        <div className="flex-1">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#061D4C] tracking-tight">Refills Management</h1>
          <p className="text-sm text-[#64748B] mt-2 max-w-lg">Track low stocks, estimate remaining supply days, and request prescription refills with our intelligent monitoring system.</p>
        </div>
        <div className="hidden md:block shrink-0 w-48 h-32 relative">
          <svg width="180" height="120" viewBox="0 0 180 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -right-4 -top-8">
            <circle cx="110" cy="70" r="40" fill="#EBF4FC" opacity="0.5" />
            <path d="M120 40c-15 0-25 15-20 30s25 15 20-30z" fill="#10B981" opacity="0.15" />
            <path d="M70 70c0-15 15-25 30-20s15 25-30 20z" fill="#A7F3D0" opacity="0.3" />
            <path d="M80 90c-5-8-2-15 5-15s10 5 5 15-10 0-10 0z" fill="#10B981" />
            <path d="M140 70c8-5 15-2 15 5s-5 10-15 5 0-10 0-10z" fill="#34D399" />
            <rect x="90" y="45" width="40" height="50" rx="6" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2.5" />
            <rect x="86" y="38" width="48" height="8" rx="3" fill="#60A5FA" stroke="#3B82F6" strokeWidth="2" />
            <path d="M102 68 h16 M110 60 v16" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
            <circle cx="138" cy="88" r="10" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="2" />
            <line x1="131" y1="88" x2="145" y2="88" stroke="#93C5FD" strokeWidth="2" />
            <rect x="110" y="88" width="10" height="20" rx="5" fill="#BFDBFE" transform="rotate(45 110 88)" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Refill Alert Status Card */}
        <div className="bg-white p-4 sm:p-5 rounded-[2rem] border border-[#E2E8F0] shadow-[0px_10px_30px_rgba(37,99,235,0.08)] flex items-center gap-4 relative overflow-hidden h-30 sm:h-32">
          <div className="w-12 h-12 rounded-full bg-[#E6F7F0] flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-[#10B981]" />
          </div>
          <div className="space-y-0.5 text-left flex-1 min-w-0 flex flex-col h-full justify-between py-1">
            <div className="flex items-center gap-1">
              <p className="text-[9px] font-extrabold text-[#10B981] uppercase tracking-widest">Refill Alert Status</p>
              <ChevronRight className="w-3 h-3 text-[#10B981]" />
            </div>
            <p className={`text-lg sm:text-xl font-bold tracking-tight truncate ${totalAlerts > 0 ? 'text-[#EF4444]' : 'text-[#061D4C]'}`}>
              {totalAlerts > 0 ? `${totalAlerts} Alerts Active` : 'All Systems Healthy'}
            </p>
            <p className="text-[9px] font-bold text-[#64748B] flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> {criticalCount} Critical</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" /> {highCount} High</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" /> {lowCount} Warnings</span>
            </p>
          </div>
        </div>

        {/* Next Restock Target Card */}
        <div className="bg-white p-4 sm:p-5 rounded-[2rem] border border-[#E2E8F0] shadow-[0px_10px_30px_rgba(37,99,235,0.08)] flex items-center gap-4 relative overflow-hidden h-30 sm:h-32">
          <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
            {/* Custom Target Icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#2563EB]">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <div className="space-y-0.5 text-left flex-1 min-w-0 flex flex-col h-full justify-between py-1">
            <div className="flex items-center gap-1">
              <p className="text-[9px] font-extrabold text-[#2563EB] uppercase tracking-widest">Next Restock Target</p>
              <ChevronRight className="w-3 h-3 text-[#2563EB]" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-[#061D4C] tracking-tight truncate">
              {earliest ? earliest.medicineName : 'None'}
            </p>
            <p className="text-[10px] text-[#64748B] font-semibold">
              {earliest ? `Depletes in ${earliest.estimatedDaysLeft} Days` : 'Stock Fully Loaded'}
            </p>
          </div>
        </div>

        {/* Daily Dosage Card */}
        <div className="bg-white p-4 sm:p-5 rounded-[2rem] border border-[#E2E8F0] shadow-[0px_10px_30px_rgba(37,99,235,0.08)] flex items-center gap-4 relative overflow-hidden h-30 sm:h-32">
          <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center shrink-0">
            {/* Custom Capsule Icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#6366F1] rotate-45">
              <path d="M12 2a5 5 0 0 0-5 5v10a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z" />
              <path d="M7 12h10" />
            </svg>
          </div>
          <div className="space-y-0.5 text-left flex-1 min-w-0 flex flex-col h-full justify-between py-1">
            <p className="text-[9px] font-extrabold text-[#6366F1] uppercase tracking-widest">Daily Dosage</p>
            <div className="flex items-end justify-between w-full">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#061D4C] leading-none">{totalDailyDoses}</span>
                <span className="text-xs font-bold text-[#061D4C]">Tablets</span>
                <span className="text-[10px] text-[#64748B] font-semibold">/ day</span>
              </div>
              <div className="w-7 h-7 bg-[#EFF6FF] rounded-full flex items-center justify-center text-[#2563EB]">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-[9px] text-[#64748B] font-semibold">
              Aggregated daily intake of {totalMeds} medicines
            </p>
          </div>
        </div>
      </div>

      {/* Main Refills list container */}
      <div className="space-y-4">
        {sortedRefills.length > 0 ? (
          sortedRefills.map((refill, index) => {
            const med = medicines.find(m => (m._id === refill.medicineId || m.id === refill.medicineId));
            const stockRatio = med ? (med.currentQuantity / med.totalQuantity) * 100 : 100;

            const colorPalette = [
              { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
              { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
              { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
              { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
              { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' }
            ];
            const theme = colorPalette[index % colorPalette.length];
            const showRequestRefill = refill.medicineName.toLowerCase() !== 'vitamin d3';

            return (
              <div
                key={refill.id}
                className="bg-white border border-[#E2E8F0] rounded-[2rem] p-5 shadow-[0_10px_30px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_40px_rgba(37,99,235,0.12)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all duration-300 relative overflow-hidden group"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-center shrink-0 border ${theme.bg} ${theme.border} ${theme.text}`}>
                    <span className="text-[9px] font-bold tracking-wider uppercase opacity-85">Days Left</span>
                    <span className="text-xl font-black tracking-tight mt-0.5">{refill.estimatedDaysLeft}</span>
                  </div>

                  <div className="space-y-1 text-left flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-base sm:text-lg font-bold text-[#061D4C] tracking-tight leading-snug truncate">
                        {refill.medicineName}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getPriorityBadgeClass(refill.priority)}`}>
                        {refill.priority} Priority
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#64748B] flex-wrap mt-1">
                      <span className="font-semibold">
                        Stock: <strong className="text-[#334155]">{refill.remainingQuantity}</strong> / {med ? med.totalQuantity : '?'} {refill.unit}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>
                        Est. Days Left: <strong className="text-[#334155]">{refill.estimatedDaysLeft} Days</strong>
                      </span>
                    </div>

                    <div className="w-48 bg-slate-100 rounded-full h-1 overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all ${refill.remainingQuantity <= med?.refillThreshold ? 'bg-[#EF4444]' : 'bg-[#2563EB]'
                          }`}
                        style={{ width: `${Math.min(100, stockRatio)}%` }}
                      />
                    </div>

                    {med && med.refillsRemaining <= 0 && (
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-[#EF4444] bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-xl w-fit">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                        No Refills Left - Requires Doctor Action
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full sm:w-auto flex justify-end shrink-0 pl-0 sm:pl-0">
                  {showRequestRefill && (() => {
                    if (med && med.refillsRemaining <= 0) {
                      return (
                        <button
                          disabled
                          className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 text-slate-400 font-extrabold text-sm tracking-wide rounded-full flex items-center justify-center gap-1.5 border border-slate-200 cursor-not-allowed shadow-none"
                        >
                          <X className="w-4 h-4 stroke-[3]" /> Requires Prescription
                        </button>
                      );
                    }
                    return (
                      <button
                        onClick={() => onRequestPharmacyRefill(med)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-sm tracking-wide rounded-full flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-transparent shadow-[0_8px_24px_rgba(37,99,235,0.20)]"
                      >
                        <Plus className="w-4 h-4 stroke-[3] text-white" /> Request Refill
                      </button>
                    );
                  })()}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-[2rem] p-12 flex flex-col items-center justify-center text-center shadow-[0_10px_30px_rgba(37,99,235,0.08)] border border-[#E2E8F0] mt-8 min-h-[400px]">
            <div className="w-64 h-64 mx-auto mb-6 flex items-center justify-center relative">
              {/* High-fidelity Vector Clipboard & Notification Bell SVG */}
              <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="70" fill="#EBF4FC" opacity="0.5" />
                <circle cx="100" cy="100" r="85" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
                
                {/* Clipboard */}
                <rect x="70" y="45" width="60" height="85" rx="8" fill="#FFFFFF" stroke="#2563EB" strokeWidth="3" />
                {/* Clipboard Clip */}
                <rect x="85" y="38" width="30" height="12" rx="4" fill="#3B82F6" stroke="#2563EB" strokeWidth="2.5" />
                <circle cx="100" cy="44" r="2" fill="#FFFFFF" />

                {/* Checklist Lines */}
                <rect x="85" y="65" width="30" height="4" rx="2" fill="#BFDBFE" />
                <rect x="85" y="78" width="30" height="4" rx="2" fill="#BFDBFE" />
                <rect x="85" y="91" width="20" height="4" rx="2" fill="#BFDBFE" />
                
                {/* Checklist Circles */}
                <circle cx="78" cy="67" r="3" stroke="#2563EB" strokeWidth="2" fill="none" />
                <circle cx="78" cy="80" r="3" stroke="#2563EB" strokeWidth="2" fill="none" />
                <circle cx="78" cy="93" r="3" stroke="#2563EB" strokeWidth="2" fill="none" />

                {/* Bell Notification Badge (Bottom Right) */}
                <circle cx="120" cy="115" r="16" fill="#10B981" stroke="#FFFFFF" strokeWidth="3" />
                <path d="M120 108a3 3 0 00-3 3v4h6v-4a3 3 0 00-3-3zm-1 9a1 1 0 002 0h-2z" fill="#FFFFFF" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#061D4C] mb-2 tracking-tight">No medication refills scheduled.</h3>
            <p className="text-[#64748B] text-sm max-w-sm mx-auto mb-8 leading-relaxed">
              Your medication inventory is currently up to date. You will receive notifications here when a prescription needs to be refilled.
            </p>
            <button
              onClick={() => setActiveTab('inventory')}
              className="px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-full transition-all shadow-[0_8px_24px_rgba(37,99,235,0.20)] flex items-center gap-2 cursor-pointer"
            >
              Check Inventory Status <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
