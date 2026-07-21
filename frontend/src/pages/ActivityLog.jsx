import React, { useState, useEffect } from 'react';
import {
  ClipboardList, Calendar, Check, X, AlertCircle, Search,
  TrendingUp, BarChart, ArrowLeft, ArrowRight, Heart, SlidersHorizontal, CalendarDays, ArrowUpDown, Bookmark, Frown,
  ArrowDownToLine, Printer, Share2
} from 'lucide-react';
import { updateAdherenceLog } from '../services/dataService';
import HealthReportExport from '../components/HealthReportExport';

const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

export default function ActivityLog({ logs, medicines = [], refills = [], metrics, onUpdate, setActiveTab }) {
  const [filterMed, setFilterMed] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [filterDate, setFilterDate] = useState('All');

  // Advanced filter states
  const [filterSlot, setFilterSlot] = useState('All');
  const [notesOnly, setNotesOnly] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterMed, filterStatus, filterDate, filterSlot, notesOnly, customStartDate, customEndDate, sortOrder, searchQuery]);

  const ITEMS_PER_PAGE = 10;

  const isEditable = (log) => {
    if (!log.timestamp) return true;
    const logTime = Number(log.timestamp);
    const now = Date.now();
    const diffMs = now - logTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours <= 24;
  };

  const medNames = ['All', ...new Set(logs.map(log => log.medicineName))];

  const totalCount = logs.length;
  const takenCount = logs.filter(l => l.status === 'taken').length;
  const skippedCount = logs.filter(l => l.status === 'skipped').length;
  const missedCount = logs.filter(l => l.status === 'missed').length;
  
  let adherenceRate = metrics?.score;
  if (adherenceRate === undefined) {
    if (totalCount > 0) {
      const penalizedDenominator = takenCount + missedCount + (skippedCount * 0.5);
      adherenceRate = Math.round((takenCount / (penalizedDenominator || 1)) * 100);
      adherenceRate = Math.min(100, Math.max(0, adherenceRate));
    } else {
      adherenceRate = 0;
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchMed = filterMed === 'All' || log.medicineName === filterMed;
    const matchStatus = filterStatus === 'All' || log.status === filterStatus;
    const matchSlot = filterSlot === 'All' || (log.timeOfDay && log.timeOfDay.toLowerCase().includes(filterSlot.toLowerCase()));
    const matchNotes = !notesOnly || (log.note && log.note.trim() !== '');

    let matchDate = true;
    if (filterDate === 'Today') {
      const todayStr = new Date().toDateString();
      matchDate = parseLocalDate(log.date).toDateString() === todayStr;
    } else if (filterDate === 'Past7') {
      const logTime = parseLocalDate(log.date).getTime();
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      matchDate = logTime >= sevenDaysAgo;
    }

    if (customStartDate) {
      const startMs = parseLocalDate(customStartDate).setHours(0, 0, 0, 0);
      const logMs = parseLocalDate(log.date).getTime();
      if (logMs < startMs) matchDate = false;
    }
    if (customEndDate) {
      const endMs = parseLocalDate(customEndDate).setHours(23, 59, 59, 999);
      const logMs = parseLocalDate(log.date).getTime();
      if (logMs > endMs) matchDate = false;
    }

    const matchQuery = searchQuery.trim() === '' ||
      log.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.note && log.note.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchMed && matchStatus && matchSlot && matchNotes && matchDate && matchQuery;
  });

  if (sortOrder === 'newest') {
    filteredLogs.reverse();
  }

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleStatusChange = async (logId, newStatus) => {
    await updateAdherenceLog(logId, newStatus);
    onUpdate();
  };

  const clearFilters = () => {
    setFilterMed('All');
    setFilterStatus('All');
    setFilterDate('All');
    setSearchQuery('');
    setFilterSlot('All');
    setNotesOnly(false);
    setCustomStartDate('');
    setCustomEndDate('');
    setSortOrder('newest');
  };

  return (
    <div className="space-y-6 text-left w-full mx-auto pb-8 relative z-20">

      {/* Activity Management Header Area */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mt-2 mb-6 sm:mt-6 sm:mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#061D4C] tracking-tight">Activity Management</h1>
          <p className="text-sm text-[#64748B] mt-2 max-w-lg">Review your chronological medication history and intake statistics.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
          <HealthReportExport
            variant="activity_log"
            medicines={medicines}
            refills={refills}
            logs={logs}
          />
        </div>
      </div>

      {/* Medication History Sub-Header */}
      <div className="flex items-center gap-3 pt-2 pl-1 mb-2">
        <div className="w-10 h-10 bg-[#EFF6FF] rounded-2xl flex items-center justify-center shrink-0">
          <ClipboardList className="w-5 h-5 text-[#2563EB]" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-[#061D4C] tracking-tight">Medication History</h3>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Review, audit and modify medication logs from past days.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Adherence Rate Card */}
        <div className="bg-white rounded-[2rem] shadow-[0px_10px_30px_rgba(37,99,235,0.08)] border border-[#E2E8F0] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden h-[180px] sm:h-[200px]">
          <p className="text-[10px] font-extrabold text-[#2563EB] uppercase tracking-widest mb-4">Adherence Score</p>
          <div className="flex flex-col gap-1.5 z-10">
            <span className="text-5xl font-black text-[#2563EB] leading-none">{adherenceRate}%</span>
            <span className="text-sm font-bold text-[#10B981]">Excellent</span>
          </div>
          {/* Custom leaf-shield illustration on the right */}
          <div className="absolute right-4 bottom-4 w-28 h-28 opacity-90 hidden sm:block">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="35" fill="#EFF6FF" opacity="0.6" />
              <path d="M30 65c-4-5-2-12 3-12s8 4 4 12-7 0-7 0z" fill="#10B981" opacity="0.8" />
              <path d="M70 55c5-4 10-2 10 3s-3 8-10 4 0-7 0-7z" fill="#34D399" opacity="0.8" />
              <path d="M45 75c-2-8 3-12 8-10s4 8-8 10z" fill="#059669" opacity="0.6" />
              <path d="M50 30c-10 0-15 5-15 5v18c0 10 15 17 15 17s15-7 15-17V35s-5-5-15-5z" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
              <path d="M43 49 l5 5 l10 -10" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="w-[65%] sm:w-[50%] mt-auto relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-[#2563EB] rounded-full" style={{ width: `${adherenceRate}%` }} />
          </div>
        </div>

        {/* Dose Log Breakdown Card */}
        <div className="bg-white rounded-[2rem] shadow-[0px_10px_30px_rgba(37,99,235,0.08)] border border-[#E2E8F0] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden h-[180px] sm:h-[200px]">
          <p className="text-[10px] font-extrabold text-[#2563EB] uppercase tracking-widest mb-4">Dose Log</p>
          <div className="flex justify-between items-center px-2 sm:px-6">
            <div className="text-center flex flex-col items-center">
              <span className="text-4xl font-black text-[#10B981] leading-none">{takenCount}</span>
              <span className="text-[11px] text-[#64748B] font-bold mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Taken
              </span>
            </div>
            <div className="text-center flex flex-col items-center">
              <span className="text-4xl font-black text-[#F59E0B] leading-none">{skippedCount}</span>
              <span className="text-[11px] text-[#64748B] font-bold mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" /> Skip
              </span>
            </div>
            <div className="text-center flex flex-col items-center">
              <span className="text-4xl font-black text-[#EF4444] leading-none">{missedCount}</span>
              <span className="text-[11px] text-[#64748B] font-bold mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" /> Missed
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <p className="text-[10px] text-slate-400 font-bold">Historical distribution</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-4 pt-4">
        {/* Search Bar & Filters Button Side-by-Side */}
        <div className="flex items-center gap-3 w-full">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-full text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F2F57]/10 focus:border-[#0F2F57] transition-all shadow-sm"
              placeholder="Search medicines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFiltersMenu(!showFiltersMenu)}
            className={`flex items-center gap-2 px-5 py-2.5 bg-white border rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer ${showFiltersMenu ? 'border-[#0F2F57] text-[#0F2F57]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pl-0.5">
          {/* Medicine Dropdown Pill */}
          <div className="relative">
            <select
              value={filterMed}
              onChange={e => setFilterMed(e.target.value)}
              className="appearance-none pl-4 pr-9 py-2 rounded-full text-[11px] font-bold tracking-wide transition-all outline-none cursor-pointer shadow-sm"
              style={{ backgroundColor: '#2563EB', border: '1px solid #2563EB', color: 'white' }}
            >
              {medNames.map(med => (
                <option key={med} value={med} className="text-slate-800 bg-white">
                  {med === 'All' ? 'All Medicines' : med}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] font-bold text-slate-400">
              ▼
            </div>
          </div>

          {/* Status Dropdown Pill */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="appearance-none pl-4 pr-9 py-2 rounded-full text-[11px] font-bold tracking-wide transition-all outline-none cursor-pointer shadow-sm"
              style={{ backgroundColor: '#2563EB', border: '1px solid #2563EB', color: 'white' }}
            >
              <option value="All">All Statuses</option>
              <option value="taken">Taken</option>
              <option value="skipped">Skipped</option>
              <option value="missed">Missed</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] font-bold text-slate-400">
              ▼
            </div>
          </div>

          {/* Date Dropdown Pill */}
          <div className="relative">
            <select
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="appearance-none pl-4 pr-9 py-2 rounded-full text-[11px] font-bold tracking-wide transition-all outline-none cursor-pointer shadow-sm"
              style={{ backgroundColor: '#2563EB', border: '1px solid #2563EB', color: 'white' }}
            >
              <option value="All">All-time</option>
              <option value="Today">Today</option>
              <option value="Past7">Past 7 Days</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] font-bold text-slate-400">
              ▼
            </div>
          </div>
        </div>

        {/* Advanced Filters Dropdown Panel */}
        {showFiltersMenu && (
          <div className="bg-white border border-slate-100 p-5 rounded-2xl space-y-4 animate-fadeIn text-left shadow-sm mt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#0F2F57]" /> Advanced Filter Suite
              </h4>
              <button onClick={clearFilters} className="text-[#4B6B8B] hover:text-[#0F2F57] font-bold tracking-wider uppercase text-[9px] cursor-pointer">
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Sort</label>
                <select
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-600 px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-[#0F2F57] cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Slot</label>
                <select
                  value={filterSlot}
                  onChange={e => setFilterSlot(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-600 px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-[#0F2F57] cursor-pointer"
                >
                  <option value="All">All Slots</option>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                </select>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <h5 className="text-[11px] font-bold text-[#0F2F57]">Notes & Symptoms Only</h5>
                <p className="text-[9px] text-slate-500">Show only entries containing written remarks.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input type="checkbox" checked={notesOnly} onChange={() => setNotesOnly(!notesOnly)} className="sr-only peer" />
                <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#0F2F57]" />
              </label>
            </div>
          </div>
        )}

        <p className="text-[11px] text-[#4B6B8B] font-semibold pl-2 pt-2">Showing {filteredLogs.length} logged entries</p>
      </div>

      {/* Logs List OR Empty State */}
      {filteredLogs.length > 0 ? (
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 p-4 sm:p-8">

          {/* Desktop View Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="pb-4 text-caption font-bold text-[#0F2F57] uppercase tracking-wider pl-4">Medication</th>
                  <th className="pb-4 text-caption font-bold text-[#0F2F57] uppercase tracking-wider">Date & Time</th>
                  <th className="pb-4 text-caption font-bold text-[#0F2F57] uppercase tracking-wider">Remarks / Symptoms</th>
                  <th className="pb-4 text-caption font-bold text-[#0F2F57] uppercase tracking-wider">Status</th>
                  <th className="pb-4 text-caption font-bold text-[#0F2F57] uppercase tracking-wider text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="border-t border-slate-100">
                {paginatedLogs.map((log, idx) => {
                  const editable = isEditable(log);
                  const formattedDate = parseLocalDate(log.date).toLocaleDateString(undefined, {
                    weekday: 'short', month: 'short', day: 'numeric'
                  });

                  const getMedEmoji = (name) => {
                    const lower = name.toLowerCase();
                    if (lower.includes('albuterol') || lower.includes('inhaler')) return '🌬️';
                    if (lower.includes('vitamin') || lower.includes('capsule')) return '💊';
                    if (lower.includes('liquid') || lower.includes('cough')) return '🧪';
                    if (lower.includes('drops')) return '💧';
                    return '💊';
                  };

                  const statusColors = {
                    taken: { bg: 'bg-[#C9D6E4]/35 text-[#0F2F57] border-[#C9D6E4]/40' },
                    skipped: { bg: 'bg-amber-50 text-amber-500 border-amber-100' },
                    missed: { bg: 'bg-rose-50 text-rose-500 border-rose-100' }
                  };
                  const currentStatusColor = statusColors[log.status] || statusColors.taken;

                  return (
                    <tr key={log._id || log.id || idx} className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-lg shrink-0 shadow-sm">
                            {getMedEmoji(log.medicineName)}
                          </div>
                          <div>
                            <p className="text-body font-bold text-[#0F2F57]">{log.medicineName}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Log ID: {log._id || log.id || idx}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-small font-semibold text-slate-500">
                        <div>{formattedDate}</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{log.timeOfDay} slot</div>
                      </td>
                      <td className="py-4 text-small text-slate-600">
                        <p className="font-medium max-w-xs truncate" title={log.note || 'No symptoms reported'}>
                          {log.note ? `"${log.note}"` : 'No symptoms reported'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {log.note ? 'Patient remark' : 'Adherence entry'}
                        </p>
                      </td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border uppercase tracking-wider ${currentStatusColor.bg}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-4">
                        {editable ? (
                          <div className="inline-flex gap-1 bg-slate-50 p-0.5 rounded-full border border-slate-150 shadow-inner">
                            <button
                              onClick={() => handleStatusChange(log._id || log.id, 'taken')}
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${log.status === 'taken'
                                ? 'bg-[#0F2F57] text-white shadow-sm'
                                : 'text-slate-400 hover:text-[#0F2F57] hover:bg-white'
                                }`}
                              title="Mark Taken"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(log._id || log.id, 'skipped')}
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${log.status === 'skipped'
                                ? 'bg-amber-500 text-white-force shadow-sm'
                                : 'text-slate-400 hover:text-amber-500 hover:bg-white'
                                }`}
                              title="Mark Skipped"
                            >
                              <AlertCircle className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(log._id || log.id, 'missed')}
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${log.status === 'missed'
                                ? 'bg-[#F34D4D] text-white-force shadow-sm'
                                : 'text-slate-400 hover:text-[#F34D4D] hover:bg-white'
                                }`}
                              title="Mark Missed"
                            >
                              <X className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-semibold px-2.5 py-1 bg-slate-50 rounded-xl border border-slate-200">
                            Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View Cards */}
          <div className="block sm:hidden space-y-3">
            {paginatedLogs.map((log, idx) => {
              const editable = isEditable(log);
              const formattedDate = parseLocalDate(log.date).toLocaleDateString(undefined, {
                weekday: 'short', month: 'short', day: 'numeric'
              });

              const getMedEmoji = (name) => {
                const lower = name.toLowerCase();
                if (lower.includes('albuterol') || lower.includes('inhaler')) return '🌬️';
                if (lower.includes('vitamin') || lower.includes('capsule')) return '💊';
                if (lower.includes('liquid') || lower.includes('cough')) return '🧪';
                if (lower.includes('drops')) return '💧';
                return '💊';
              };

              const statusColors = {
                taken: { bg: 'bg-[#C9D6E4]/35 text-[#0F2F57] border-[#C9D6E4]/40' },
                skipped: { bg: 'bg-amber-50 text-amber-500 border-amber-100' },
                missed: { bg: 'bg-rose-50 text-rose-500 border-rose-100' }
              };
              const currentStatusColor = statusColors[log.status] || statusColors.taken;

              return (
                <div key={log._id || log.id || idx} className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.01)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.02)] text-left flex flex-col">
                  {/* Row 1: Logo + Medication Name + Status Badge */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-lg shrink-0 shadow-sm">
                        {getMedEmoji(log.medicineName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-body font-bold text-[#0F2F57] truncate">{log.medicineName}</p>
                        <p className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">ID: {log._id || log.id || idx}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider shrink-0 ${currentStatusColor.bg}`}>
                      {log.status}
                    </span>
                  </div>

                  {/* Row 2: Date, Time & Remarks */}
                  <div className="border-t border-slate-100/60 pt-2.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>{formattedDate}</span>
                      <span className="text-[10px] text-slate-405 font-medium">{log.timeOfDay} slot</span>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl p-2.5 border border-slate-100/30 text-xs text-slate-620">
                      <p className="font-semibold text-[10px] text-slate-400 uppercase tracking-widest leading-none mb-1">Remarks</p>
                      <p className="italic text-slate-600 line-clamp-3">{log.note ? `"${log.note}"` : 'No symptoms or remarks reported'}</p>
                    </div>
                  </div>

                  {/* Row 3: Action Buttons */}
                  <div className="flex justify-end pt-1 border-t border-slate-100/40 mt-1">
                    {editable ? (
                      <div className="inline-flex gap-1 bg-slate-50 p-0.5 rounded-full border border-slate-150 shadow-inner">
                        <button
                          onClick={() => handleStatusChange(log._id || log.id, 'taken')}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${log.status === 'taken'
                            ? 'bg-[#0F2F57] text-white shadow-sm'
                            : 'text-slate-400 hover:text-[#0F2F57] hover:bg-white'
                            }`}
                          title="Mark Taken"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(log._id || log.id, 'skipped')}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${log.status === 'skipped'
                            ? 'bg-amber-500 text-white-force shadow-sm'
                            : 'text-slate-400 hover:text-amber-500 hover:bg-white'
                            }`}
                          title="Mark Skipped"
                        >
                          <AlertCircle className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(log._id || log.id, 'missed')}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${log.status === 'missed'
                            ? 'bg-[#F34D4D] text-white-force shadow-sm'
                            : 'text-slate-400 hover:text-[#F34D4D] hover:bg-white'
                            }`}
                          title="Mark Missed"
                        >
                          <X className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-405 italic font-semibold px-2.5 py-1 bg-slate-50 rounded-xl border border-slate-200">
                        Locked (24h passed)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 mt-4 border-t border-slate-100/50">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white/60 hover:bg-white text-slate-600 disabled:text-slate-300 disabled:hover:bg-white/60 text-xs font-bold rounded-full transition-all shadow-sm border border-slate-100/50 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <div className="text-xs font-bold text-slate-400">
                Page <span className="text-[#0F2F57]">{currentPage}</span> of <span className="text-[#0F2F57]">{totalPages}</span>
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white/60 hover:bg-white text-slate-600 disabled:text-slate-300 disabled:hover:bg-white/60 text-xs font-bold rounded-full transition-all shadow-sm border border-slate-100/50 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-[0px_10px_30px_rgba(37,99,235,0.08)] border border-[#E2E8F0] p-12 sm:p-20 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-64 h-64 mx-auto mb-2 flex items-center justify-center relative">
            {/* High-fidelity Vector Clipboard & Magnifier SVG */}
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="70" fill="#EBF4FC" opacity="0.5" />
              <circle cx="100" cy="100" r="85" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
              
              {/* Leaves in background */}
              <path d="M60 130c-5-8-2-15 5-15s10 5 5 15-10 0-10 0z" fill="#A7F3D0" opacity="0.5" />
              <path d="M140 110c8-5 15-2 15 5s-5 10-15 5 0-10 0-10z" fill="#A7F3D0" opacity="0.5" />

              {/* Clipboard */}
              <rect x="75" y="55" width="50" height="75" rx="6" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
              <rect x="88" y="49" width="24" height="10" rx="3" fill="#3B82F6" stroke="#2563EB" strokeWidth="2" />
              
              {/* Checklist Lines */}
              <rect x="90" y="72" width="25" height="3" rx="1.5" fill="#BFDBFE" />
              <rect x="90" y="84" width="25" height="3" rx="1.5" fill="#BFDBFE" />
              <rect x="90" y="96" width="15" height="3" rx="1.5" fill="#BFDBFE" />
              
              {/* Checklist Circles */}
              <circle cx="83" cy="73.5" r="2" fill="#2563EB" />
              <circle cx="83" cy="85.5" r="2" fill="#2563EB" />
              <circle cx="83" cy="97.5" r="2" fill="#2563EB" />

              {/* Magnifying Glass (Bottom Right of Clipboard) */}
              <circle cx="120" cy="115" r="10" stroke="#2563EB" strokeWidth="3" fill="#FFFFFF" />
              <line x1="127" y1="122" x2="137" y2="132" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-[#061D4C] tracking-tight">No matching medication logs found.</h4>
          <p className="text-sm text-[#64748B]">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
}
