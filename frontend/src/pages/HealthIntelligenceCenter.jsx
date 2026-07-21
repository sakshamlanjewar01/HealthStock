import React, { useState, Suspense } from 'react';
import { Phone, X, Check, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ErrorBoundary from '../components/ErrorBoundary';
import useHealthIntelligenceData from '../hooks/useHealthIntelligenceData';
import { deleteAdherenceLog, addAdherenceLog } from '../services/dataService';
import DashboardTab from '../components/HealthIntelligenceCenter/DashboardTab';
import AlertsTab from '../components/HealthIntelligenceCenter/AlertsTab';

// Lazy-loaded components
const InventoryManager = React.lazy(() => import('../components/InventoryManager'));
const RefillReminder = React.lazy(() => import('../components/RefillReminder'));
const MedicationCalendar = React.lazy(() => import('../components/MedicationCalendar'));
const HealthProgress = React.lazy(() => import('../components/HealthProgress'));
const ActivityLog = React.lazy(() => import('./ActivityLog'));

export default function HealthIntelligenceCenter({ activeTab, setActiveTab }) {
  const {
    confirm,
    user,
    medicines,
    logs,
    refills,
    metrics,
    dataLoading,
    headerRef,
    showQuickLogModal,
    setShowQuickLogModal,
    selectedPharmacyRefillMed,
    setSelectedPharmacyRefillMed,
    showPharmacyModal,
    setShowPharmacyModal,
    isPharmacyRequestSent,
    recentRefillMedId,
    refillQuantity,
    setRefillQuantity,
    refillDosage,
    setRefillDosage,
    reportPeriod,
    customStartDate,
    customEndDate,
    tableSearchQuery,
    pendingLogAction,
    setPendingLogAction,
    interactionAlerts,
    alertsPageModal,
    setAlertsPageModal,
    filteredLogs,
    dashboardMetrics,
    loadData,
    handleOpenPharmacyModal,
    handleSendPharmacyRequest,
    handleRefill,
    handleDelete,
    handleAddMedicine,
    handleEditMedicine,
    handleLogDose,
    refillValidation
  } = useHealthIntelligenceData(activeTab, setActiveTab);

  const [loggingNote, setLoggingNote] = useState('');

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { isInvalid, maxAllowed, remainingSpace, totalQty } = refillValidation;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-0 pb-3 sm:pb-4 space-y-4 sm:space-y-6">

      {/* 2. DYNAMIC CONTENT RENDERING BY ACTIVE TAB */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="space-y-6 relative z-20"
        >
          {dataLoading ? (
            <div className="w-full space-y-6 pt-4">
              <div className="w-full h-24 bg-slate-100 rounded-3xl animate-pulse" />
              <div className="w-full h-64 bg-slate-100 rounded-3xl animate-pulse" />
            </div>
          ) : activeTab === 'dashboard' ? (
            <ErrorBoundary>
              <DashboardTab
                dashboardMetrics={dashboardMetrics}
                metrics={metrics}
                medicines={medicines}
                logs={logs}
                user={user}
                setActiveTab={setActiveTab}
                handleLogDose={handleLogDose}
                confirm={confirm}
                loadData={loadData}
                tableSearchQuery={tableSearchQuery}
              />
            </ErrorBoundary>
          ) : activeTab === 'inventory' ? (
            <ErrorBoundary>
              <Suspense fallback={<div className="w-full h-64 bg-slate-100 rounded-3xl animate-pulse" />}>
                <InventoryManager
                  medicines={medicines}
                  refills={refills}
                  logs={logs}
                  onRefill={handleRefill}
                  onDelete={handleDelete}
                  onAddMedicine={handleAddMedicine}
                  onEditMedicine={handleEditMedicine}
                  setActiveTab={setActiveTab}
                  onRequestPharmacyRefill={handleOpenPharmacyModal}
                  recentRefillMedId={recentRefillMedId}
                />
              </Suspense>
            </ErrorBoundary>
          ) : activeTab === 'refills' ? (
            <ErrorBoundary>
              <Suspense fallback={<div className="w-full h-64 bg-slate-100 rounded-3xl animate-pulse" />}>
                <RefillReminder
                  refills={refills}
                  medicines={medicines}
                  onRefill={handleRefill}
                  activeView="all"
                  setActiveTab={setActiveTab}
                  onRequestPharmacyRefill={handleOpenPharmacyModal}
                />
              </Suspense>
            </ErrorBoundary>
          ) : activeTab === 'activity' ? (
            <ErrorBoundary>
              <Suspense fallback={<div className="w-full h-64 bg-slate-100 rounded-3xl animate-pulse" />}>
                <ActivityLog
                  logs={logs}
                  medicines={medicines}
                  refills={refills}
                  metrics={dashboardMetrics || metrics}
                  onUpdate={loadData}
                  setActiveTab={setActiveTab}
                />
              </Suspense>
            </ErrorBoundary>
          ) : activeTab === 'calendar' ? (
            <ErrorBoundary>
              <Suspense fallback={<div className="w-full h-64 bg-slate-100 rounded-3xl animate-pulse" />}>
                <MedicationCalendar
                  medicines={medicines}
                  logs={logs}
                  onLogAction={async (medId, timeOfDay, status, date) => {
                    if (status === 'undo') {
                      const log = logs.find(l => l.medicineId === medId && l.timeOfDay === timeOfDay && l.date === date);
                      if (log) {
                        await deleteAdherenceLog(log._id || log.id);
                        loadData();
                      }
                    } else {
                      await addAdherenceLog({
                        medicineId: medId,
                        date,
                        timeOfDay,
                        status,
                        note: ''
                      });
                      loadData();
                    }
                  }}
                />
              </Suspense>
            </ErrorBoundary>
          ) : activeTab === 'progress' ? (
            <ErrorBoundary>
              <Suspense fallback={<div className="w-full h-64 bg-slate-100 rounded-3xl animate-pulse" />}>
                <HealthProgress
                  logs={logs}
                  medicines={medicines}
                />
              </Suspense>
            </ErrorBoundary>
          ) : activeTab === 'alerts' ? (
            <ErrorBoundary>
              <AlertsTab
                logs={logs}
                medicines={medicines}
                interactionAlerts={interactionAlerts}
                setAlertsPageModal={setAlertsPageModal}
                setActiveTab={setActiveTab}
              />
            </ErrorBoundary>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* SYMPTOM/LOG NOTE PROMPT DIALOG */}
      {pendingLogAction && (() => {
        const med = medicines.find(m => (m._id === pendingLogAction.medId || m.id === pendingLogAction.medId));
        const statusColor = pendingLogAction.status === 'taken' ? 'text-[#0F2F57] bg-[#C9D6E4]/30 border-[#C9D6E4]/40' :
          pendingLogAction.status === 'skipped' ? 'text-amber-500 bg-amber-50 border-amber-100' :
            'text-rose-500 bg-rose-50 border-rose-100';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/40 backdrop-blur-sm animate-fadeIn">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setPendingLogAction(null)} />

            <div className="bg-white p-6 rounded-3xl border border-slate-100 w-full max-w-md relative z-10 shadow-2xl animate-scaleUp text-left space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-[#0F2F57] flex items-center gap-2">
                  🛡️ Confirm Medication Log Action
                </h3>
                <p className="text-xs text-[#4B6B8B] mt-1">Please confirm you want to record the following intake event.</p>
              </div>

              <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Medication:</span>
                  <span className="font-extrabold text-[#0F2F57]">{med?.name || 'Medicine'}</span>
                </div>
                {med?.dosageStrength && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Dosage:</span>
                    <span className="text-[#0F2F57] font-semibold">{med.dosageStrength}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Scheduled Time:</span>
                  <span className="font-semibold text-slate-700">{pendingLogAction.time} dose</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Status to Log:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border uppercase tracking-wider ${statusColor}`}>
                    {pendingLogAction.status}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider text-left block">
                  Add Note / Symptoms (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder={
                    pendingLogAction.status === 'taken'
                      ? "e.g. Took with breakfast, feeling good..."
                      : "e.g. Nausea, headache, forgot at home..."
                  }
                  value={loggingNote}
                  onChange={e => setLoggingNote(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0F2F57]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleLogDose(pendingLogAction.medId, pendingLogAction.time, pendingLogAction.status, loggingNote);
                    setLoggingNote('');
                    setPendingLogAction(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-white shadow-sm ${pendingLogAction.status === 'taken' ? 'bg-[#0F2F57] hover:bg-[#1a3f6d]' :
                    pendingLogAction.status === 'skipped' ? 'bg-amber-600 hover:bg-amber-500' :
                      'bg-rose-600 hover:bg-rose-500'
                    }`}
                >
                  Confirm & Log
                </button>
                <button
                  onClick={() => {
                    setLoggingNote('');
                    setPendingLogAction(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ALERTS PAGE INTERACTIVE POPUP MODAL */}
      {alertsPageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setAlertsPageModal(null)} />
          <div className="bg-white border border-slate-100 p-6 rounded-3xl w-full max-w-md relative z-10 shadow-2xl text-left space-y-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F2F57] flex items-center gap-2">
                🛡️ {alertsPageModal.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">HealthStock Notification System</p>
            </div>

            <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100">
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {alertsPageModal.message}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setAlertsPageModal(null)}
                className="flex-1 py-2.5 bg-[#0F2F57] hover:bg-[#1a3f6d] text-white font-bold text-xs rounded-full transition-all cursor-pointer shadow-sm text-center"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK LOG INTAKE MODAL FOR MOBILE */}
      {showQuickLogModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-955/40 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowQuickLogModal(false)} />

          <div className="bg-white p-6 rounded-t-3xl sm:rounded-3xl border border-slate-100 w-full sm:max-w-md relative z-10 max-h-[80vh] overflow-y-auto shadow-2xl animate-scaleUp text-left">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#0F2F57]">Log New Intake</h3>
              <button
                onClick={() => setShowQuickLogModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {medicines.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <p className="text-sm">No medications tracked yet.</p>
                <button
                  onClick={() => { setShowQuickLogModal(false); setActiveTab('inventory'); }}
                  className="mt-4 px-4 py-2 bg-[#0F2F57] text-white text-xs font-bold rounded-full cursor-pointer"
                >
                  Add Medication
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Select Medication</label>
                  <select
                    id="quick-log-med"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#0F2F57] focus:outline-none focus:border-[#0F2F57]"
                  >
                    {medicines.map(m => (
                      <option key={m._id || m.id} value={m._id || m.id}>{m.name} ({m.dosageStrength || '1 dose'})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Time of Day</label>
                  <select
                    id="quick-log-time"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#0F2F57] focus:outline-none focus:border-[#0F2F57]"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button
                    onClick={async () => {
                      const medId = document.getElementById('quick-log-med').value;
                      const time = document.getElementById('quick-log-time').value;
                      await handleLogDose(medId, time, 'taken');
                      setShowQuickLogModal(false);
                    }}
                    className="py-3 bg-[#C9D6E4]/35 text-[#0F2F57] hover:bg-[#0F2F57] hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                  >
                    Log Taken
                  </button>
                  <button
                    onClick={async () => {
                      const medId = document.getElementById('quick-log-med').value;
                      const time = document.getElementById('quick-log-time').value;
                      await handleLogDose(medId, time, 'missed');
                      setShowQuickLogModal(false);
                    }}
                    className="py-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                  >
                    Log Missed
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pharmacy Dispatch Modal */}
      {showPharmacyModal && selectedPharmacyRefillMed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm animate-fadeIn">
          {/* Backdrop Click Closer */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowPharmacyModal(false)} />

          <div className="bg-white w-full max-w-[480px] rounded-3xl shadow-2xl z-10 animate-scaleUp text-left overflow-hidden">

            {/* ── HEADER ── */}
            <div className="flex items-start justify-between px-6 pt-6 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-[#2563EB]" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#0f172a] leading-tight">Refill Dispatch</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-snug max-w-[220px]">
                    Initiate a digital dispatch to your patient's registered pharmacy.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPharmacyModal(false)}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer transition-colors shrink-0 mt-1"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* ── INFO ROWS CARD ── */}
            <div className="mx-6 mb-4 border border-slate-200 rounded-2xl overflow-hidden">

              {/* TO Row */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TO</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedPharmacyRefillMed.pharmacyPhone ? (
                    <a
                      href={`tel:${selectedPharmacyRefillMed.pharmacyPhone}`}
                      className="text-[#2563EB] font-bold text-sm hover:underline"
                    >
                      {selectedPharmacyRefillMed.pharmacyPhone}
                    </a>
                  ) : (
                    <span className="text-[#2563EB] font-bold text-sm">555-0155</span>
                  )}
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5 text-[#2563EB]" />
                  </div>
                </div>
              </div>

              {/* Patient Name Row */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PATIENT NAME</span>
                </div>
                <span className="text-[#0f172a] font-extrabold text-sm">{user?.name || "Saksham Lanjewar"}</span>
              </div>

              {/* Medication Row */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4.5" y1="16.5" x2="19.5" y2="4.5"></line><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"></path></svg>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MEDICATION</span>
                </div>
                <span className="text-[#0f172a] font-extrabold text-sm">
                  {selectedPharmacyRefillMed.name} ({selectedPharmacyRefillMed.dosageStrength || "20mg"})
                </span>
              </div>

              {/* Rx Number Row */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RX NUMBER:</span>
                </div>
                <span className="text-[#0f172a] font-extrabold text-sm">{selectedPharmacyRefillMed.rxNumber || "RX789456"}</span>
              </div>

              {/* Doctor Row */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DOCTOR:</span>
                </div>
                <span className="text-[#0f172a] font-extrabold text-sm">Dr. {selectedPharmacyRefillMed.prescribedDoctor || "Dr. Martinez"}</span>
              </div>

              {/* Refills Remaining Row */}
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">REFILLS REMAINING</span>
                </div>
                <span className="text-[#2563EB] font-extrabold text-sm">
                  {selectedPharmacyRefillMed.refillsRemaining ?? 4} left
                </span>
              </div>

            </div>

            {/* ── INPUT FIELDS ── */}
            <div className="mx-6 mb-4 grid grid-cols-2 gap-3">

              {/* Refill Quantity */}
              <div className="border border-slate-200 rounded-2xl p-3.5">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Refill Quantity ({selectedPharmacyRefillMed.unit || 'Tablets'})
                </label>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    min="1"
                    max={maxAllowed}
                    value={refillQuantity}
                    onChange={e => {
                      const val = e.target.value;
                      setRefillQuantity(val === '' ? '' : parseInt(val, 10));
                    }}
                    className="w-full text-2xl font-bold text-[#0f172a] focus:outline-none bg-transparent pr-2"
                  />
                  <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#2563EB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4.5" y1="16.5" x2="19.5" y2="4.5"></line><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"></path></svg>
                  </div>
                </div>
              </div>

              {/* Dosage Strength */}
              <div className="border border-slate-200 rounded-2xl p-3.5">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Dosage Strength
                </label>
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={refillDosage}
                    onChange={e => setRefillDosage(e.target.value)}
                    className="w-full text-2xl font-bold text-[#0f172a] focus:outline-none bg-transparent pr-2 placeholder-slate-300"
                    placeholder="5mg"
                  />
                  <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#2563EB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                </div>
              </div>

            </div>

            {/* ── RECOMMENDED BADGE ── */}
            {refillQuantity !== '' && parseInt(refillQuantity, 10) >= 1 && parseInt(refillQuantity, 10) <= maxAllowed && (
              <div className="mx-6 mb-4 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <circle cx="12" cy="12" r="10" fill="#10B981" />
                  <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[10px] font-extrabold text-[#10B981] uppercase tracking-wider">
                  Recommended: {remainingSpace} to reach capacity of {totalQty}
                </span>
              </div>
            )}

            {/* Error messages */}
            {refillQuantity !== '' && parseInt(refillQuantity, 10) > maxAllowed && (
              <p className="mx-6 mb-4 text-[10px] text-rose-500 font-extrabold tracking-wide uppercase">
                ⚠️ Exceeds capacity! Max refill is {maxAllowed}.
              </p>
            )}
            {refillQuantity !== '' && parseInt(refillQuantity, 10) < 1 && (
              <p className="mx-6 mb-4 text-[10px] text-rose-500 font-extrabold tracking-wide uppercase">
                ⚠️ Quantity must be at least 1.
              </p>
            )}

            {/* ── INFO NOTICE ── */}
            <div className="mx-6 mb-5 bg-[#EFF6FF] border border-[#DBEAFE] rounded-2xl px-4 py-3.5 flex gap-3 text-[11px] text-slate-500 leading-relaxed font-medium">
              <div className="w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white font-extrabold text-[10px]">i</span>
              </div>
              <span>This initiates an automated digital dispatch of your prescription restock request to your pharmacy. Your doctor's details and Rx identifier are pre-populated.</span>
            </div>

            {/* ── FOOTER BUTTONS ── */}
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={() => setShowPharmacyModal(false)}
                className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-2xl border border-slate-200 transition-all active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendPharmacyRequest}
                disabled={isPharmacyRequestSent || isInvalid}
                className={`px-6 py-3 text-sm font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-2 active:scale-95 ${
                  isPharmacyRequestSent
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : isInvalid
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-[#2563EB]/25'
                }`}
              >
                {isPharmacyRequestSent ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" /> Dispatched!
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transform rotate-45 -translate-y-[1px]"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    Confirm Refill
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
