import React from 'react';
import { Calendar, Shield, Package, Plus, ChevronRight } from 'lucide-react';

export default function AlertsTab({
  logs,
  medicines,
  interactionAlerts,
  setAlertsPageModal,
  setActiveTab
}) {
  return (
    <div className="space-y-8 text-left w-full mx-auto pt-4 pb-12 relative z-20">
      {/* Header */}
      <div className="bg-white rounded-[2rem] border border-slate-100/80 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-2 mb-6">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-[#FF2056] text-white flex items-center justify-center shrink-0 font-extrabold text-xl shadow-[0_4px_12px_rgba(255,32,86,0.2)]">
            !
          </span>
          <h1 className="text-3xl font-extrabold text-[#0F2F57] tracking-tight">Important Alerts</h1>
        </div>
        <p className="text-sm text-[#4B6B8B] font-medium mt-1 max-w-2xl leading-relaxed">
          Your personal safety dashboard. Stay on top of missed medications, potential drug interactions, and critical refill reminders to ensure your health is never compromised.
        </p>
      </div>

      {/* Two Columns Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Column 1: Missed Medications */}
        <div className="bg-white border border-slate-100/80 rounded-[2rem] p-5 sm:p-7 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.02)] min-h-[400px] sm:min-h-[420px]">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FFF5F5] flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF2056" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-[17px] font-bold text-[#0F2F57] tracking-tight">Missed Medications</h3>
                <p className="text-[10px] text-[#4B6B8B] font-extrabold uppercase tracking-wider mt-0.5">
                  {logs.filter(l => l.status === 'missed').length} Missed Doses
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {logs.filter(l => l.status === 'missed').length > 0 ? (
                logs.filter(l => l.status === 'missed').map((log, idx) => (
                  <div key={`${log._id || log.id}-${idx}`} className="bg-[#FFF5F5] border border-[#FFE4E6] rounded-2xl p-4 flex items-center justify-between gap-3 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF2056] shrink-0" />
                      <div className="text-left">
                        <p className="font-bold text-[#0F2F57] text-xs sm:text-[13px] leading-tight">{log.medicineName}</p>
                        <p className="text-[11px] text-[#4B6B8B] font-medium mt-0.5">Missed {log.date} at {log.timeOfDay}</p>
                      </div>
                    </div>
                    <button onClick={() => setAlertsPageModal({ title: `Missed Dose: ${log.medicineName}`, message: `Dose scheduled at ${log.timeOfDay} on ${log.date} was marked as missed.` })} className="text-xs font-bold text-[#FF2056] hover:underline transition-colors cursor-pointer">Review</button>
                  </div>
                ))
              ) : (
                <div className="bg-[#FFF5F5]/60 border border-[#FFE4E6]/80 rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Calendar className="w-5 h-5 text-[#FF2056]" />
                  </div>
                  <p className="text-xs text-[#881337] font-bold">No missed medication alerts.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Low Stock Warnings */}
        <div className="bg-white border border-[#E2E8F0] rounded-[2rem] p-5 sm:p-7 flex flex-col justify-between shadow-[0px_10px_30px_rgba(37,99,235,0.08)] min-h-[400px] sm:min-h-[420px]">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FFFBEB] flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 stroke-[2] text-[#F59E0B]" />
              </div>
              <div className="text-left">
                <h3 className="text-[17px] font-bold text-[#061D4C] tracking-tight">Low Stock Warnings</h3>
                <p className="text-[10px] text-[#F59E0B] font-extrabold uppercase tracking-wider mt-0.5">Pharmacy Inventory</p>
              </div>
            </div>

            {(() => {
              const lowStockMedicines = medicines.filter(m => (m.currentQuantity || 0) < (m.refillThreshold !== undefined ? m.refillThreshold : 5));
              return lowStockMedicines.length > 0 ? (
                <div className="space-y-4 overflow-y-auto max-h-[300px] pr-1">
                  {lowStockMedicines.map((med) => {
                    const capacityRatio = med.totalQuantity ? (med.currentQuantity / med.totalQuantity) * 100 : 0;
                    return (
                      <div key={med._id || med.id} className="bg-slate-50 border border-slate-100 rounded-3xl p-5 space-y-4 text-left">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-[#061D4C] text-[13px]">{med.name}</p>
                            <p className="text-[10px] text-[#64748B] mt-0.5">{med.dosageStrength || '1 Dose'}</p>
                          </div>
                          <span className="bg-rose-50 text-[#FF2056] font-extrabold text-[11px] tracking-wide rounded-full px-3 py-1 border border-rose-100">
                            {med.currentQuantity <= 2 ? 'Critical' : 'Low Stock'}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.max(5, Math.min(100, capacityRatio))}%` }} />
                          </div>
                          <div className="flex justify-between items-center text-[10px] pt-1">
                            <span className="text-[#64748B] font-medium">Remaining Stock: <strong className="text-[#061D4C] font-bold">{med.currentQuantity} / {med.totalQuantity || 30}</strong> Units</span>
                            <button onClick={() => setActiveTab('refills')} className="px-3.5 py-1.5 bg-[#EFF6FF] hover:bg-[#2563EB] hover:text-white text-[#2563EB] font-extrabold text-[11px] tracking-wide rounded-full flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer border border-transparent">
                              <Plus className="w-3.5 h-3.5 stroke-[3]" /> Request Refill
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#FFFBEB]/60 border border-[#FEF3C7] rounded-3xl p-6 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Package className="w-5 h-5 text-[#F59E0B]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#061D4C] font-extrabold">All stocks are sufficient.</p>
                    <p className="text-[10px] text-[#64748B] mt-1 leading-relaxed">No medication levels are currently below low stock thresholds.</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
