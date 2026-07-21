import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertCircle, Clock, Info, Check, ShieldAlert, RefreshCw } from 'lucide-react';
import { API_URL } from '../config.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MedicationCalendar({ medicines = [], logs = [], onLogAction }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getLocalDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleExportCalendar = () => {
    window.open(`${API_URL}/data/calendar/export`, '_blank');
  };

  const renderPillIcon = (shape, color) => {
    const colorMap = {
      Red: '#EF4444',
      Blue: '#3B82F6',
      Green: '#10B981',
      Yellow: '#F59E0B',
      Orange: '#F97316',
      Purple: '#8B5CF6',
      Pink: '#EC4899',
      White: '#E2E8F0'
    };
    const fill = colorMap[color] || '#E2E8F0';
    switch (shape) {
      case 'Capsule':
        return (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="8" width="14" height="8" rx="4" fill={fill} stroke={fill} strokeWidth="1.5" />
            <line x1="12" y1="8" x2="12" y2="16" stroke="#000" strokeWidth="1.5" opacity="0.35" />
          </svg>
        );
      case 'Liquid':
        return (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5V3H16V5M9 5H15M6 10C6 7.79 7.79 6 10 6H14C16.21 6 18 7.79 18 10V19C18 20.1 17.1 21 16 21H8C6.9 21 6 20.1 6 19V10Z" fill={fill} stroke={fill} strokeWidth="1.5" />
            <rect x="9" y="11" width="6" height="6" fill="#000" opacity="0.25" rx="1" />
          </svg>
        );
      case 'Drops':
        return (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill={fill} stroke={fill} strokeWidth="1.5" />
          </svg>
        );
      default: // Tablet
        return (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill={fill} stroke={fill} strokeWidth="1.5" />
            <line x1="6" y1="12" x2="18" y2="12" stroke="#000" strokeWidth="1.5" opacity="0.3" />
          </svg>
        );
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get calendar month details
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthTotalDays - i,
        monthOffset: -1,
        date: new Date(year, month - 1, prevMonthTotalDays - i)
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        monthOffset: 0,
        date: new Date(year, month, i)
      });
    }

    // Next month padding days
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({
        day: i,
        monthOffset: 1,
        date: new Date(year, month + 1, i)
      });
    }

    return days;
  }, [year, month]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Helper: map day index to weekday name
  const getDayName = (dayIndex) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  // Check if a medication is scheduled on a date
  const isMedScheduledOnDate = (med, date) => {
    const dayName = getDayName(date.getDay());
    const schedule = med.scheduleDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return schedule.includes(dayName);
  };

  // Get scheduled medicines for a date
  const getScheduledMedsForDate = (date) => {
    return medicines.filter(med => isMedScheduledOnDate(med, date));
  };

  // Get adherence log status on a date for a medicine & time
  const getLogForMedOnDate = (medId, timeOfDay, date) => {
    const dateStr = getLocalDateString(date);
    return logs.find(log => log.medicineId === medId && log.timeOfDay === timeOfDay && log.date === dateStr);
  };

  // Calculate day compliance rating for dots/indicators
  const getDayComplianceStatus = (date) => {
    const dateStr = getLocalDateString(date);
    const todayStr = getLocalDateString(new Date());
    
    // Ignore future dates
    if (dateStr > todayStr) return 'upcoming';

    const scheduled = getScheduledMedsForDate(date);
    if (scheduled.length === 0) return 'none';

    // Map scheduled medications to their expected time slots
    const expectedSlots = [];
    scheduled.forEach(med => {
      const times = (med.timeOfDay || 'Morning').split(/[,;&]|\band\b/i).map(t => t.trim()).filter(Boolean);
      times.forEach(t => expectedSlots.push({ medId: med._id || med.id, time: t }));
    });

    let takenCount = 0;
    let missedCount = 0;

    expectedSlots.forEach(slot => {
      const log = logs.find(l => l.medicineId === slot.medId && l.timeOfDay === slot.time && l.date === dateStr);
      if (log) {
        if (log.status === 'taken') takenCount++;
        else missedCount++;
      } else {
        // If past date and not logged, it counts as missed/unlogged
        if (dateStr < todayStr) missedCount++;
      }
    });

    if (takenCount === expectedSlots.length) return 'all-taken';
    if (missedCount > 0 && takenCount > 0) return 'partial';
    if (missedCount === expectedSlots.length) return 'all-missed';
    return 'pending';
  };

  const formatSelectedDate = () => {
    return `${getDayName(selectedDate.getDay())}, ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;
  };

  const scheduledMedsForSelectedDay = getScheduledMedsForDate(selectedDate);

  // Group scheduled medicines for selected day
  const timeBlocks = useMemo(() => {
    const blocks = {
      'Morning': [],
      'Afternoon': [],
      'Evening': [],
      'Night': [],
      'As Needed': []
    };

    scheduledMedsForSelectedDay.forEach(med => {
      const times = (med.timeOfDay || 'Morning').split(/[,;&]|\band\b/i).map(t => t.trim()).filter(Boolean);
      times.forEach(t => {
        const blockName = blocks[t] ? t : 'As Needed';
        blocks[blockName].push(med);
      });
    });

    return blocks;
  }, [scheduledMedsForSelectedDay]);

  const pillColorMap = {
    Red: 'bg-rose-500',
    Blue: 'bg-blue-500',
    Green: 'bg-emerald-500',
    Yellow: 'bg-amber-400',
    Orange: 'bg-orange-500',
    Purple: 'bg-purple-500',
    Pink: 'bg-pink-500',
    White: 'bg-slate-300'
  };

  // Date comparison variables
  const todayStr = getLocalDateString(new Date());
  const selectedDateStr = getLocalDateString(selectedDate);
  const isSelectedToday = selectedDateStr === todayStr;
  const isSelectedPast = selectedDateStr < todayStr;
  const isSelectedFuture = selectedDateStr > todayStr;

  return (
    <div className="flex flex-col lg:flex-row gap-6 text-left animate-fadeIn">
      {/* Monthly Grid Section */}
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
        
        {/* Month Selector Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-50 text-[#2563EB] rounded-2xl flex items-center justify-center shrink-0">
              <CalendarIcon className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#061D4C] tracking-tight">{MONTHS[month]} {year}</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Medication schedule calendar</p>
            </div>
          </div>
          <div className="flex gap-2 items-center justify-between sm:justify-end w-full sm:w-auto">
            <button
              onClick={handleExportCalendar}
              className="px-3.5 py-2 border border-[#DBEAFE] bg-[#EFF6FF] text-[#2563EB] hover:bg-[#2563EB] hover:text-white font-extrabold text-[10px] rounded-xl tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Download calendar .ics file"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sync Calendar
            </button>
            <div className="flex gap-2 items-center shrink-0">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              <button
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 mt-4 text-center">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-[10px] font-extrabold text-[#4B6B8B] uppercase tracking-widest py-1.5">{day}</div>
          ))}

          {calendarDays.map((slot, index) => {
            const scheduled = getScheduledMedsForDate(slot.date);
            const isSelected = selectedDate.toDateString() === slot.date.toDateString();
            const isToday = new Date().toDateString() === slot.date.toDateString();
            const isCurrentMonth = slot.monthOffset === 0;
            const compliance = getDayComplianceStatus(slot.date);

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(slot.date)}
                className={`min-h-[85px] p-1.5 rounded-2xl flex flex-col justify-between border text-left transition-all active:scale-95 cursor-pointer relative ${
                  isSelected
                    ? 'border-[#2563EB] bg-blue-50/50 shadow-sm shadow-blue-500/5'
                    : isToday
                    ? 'border-[#3B82F6] bg-slate-50'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                } ${!isCurrentMonth && 'opacity-40'}`}
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-black px-1.5 py-0.5 rounded-lg ${
                      isToday ? 'bg-[#2563EB] text-white' : 'text-[#061D4C]'
                    }`}>{slot.day}</span>
                    
                    {/* Compliance Indicator Dot */}
                    {compliance === 'all-taken' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-sm" title="All taken" />
                    )}
                    {compliance === 'partial' && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shadow-sm" title="Partially taken" />
                    )}
                    {compliance === 'all-missed' && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shadow-sm" title="All missed" />
                    )}
                  </div>
                  {scheduled.length > 0 && (
                    <span className="text-[9px] font-extrabold text-[#2563EB] bg-blue-50 px-1 rounded-md">{scheduled.length} meds</span>
                  )}
                </div>

                {/* Scheduled med dot tags */}
                <div className="flex flex-col gap-1 mt-1.5 w-full">
                  {scheduled.slice(0, 3).map((med, idx) => (
                    <div
                      key={idx}
                      className="hidden sm:flex items-center gap-1 text-[9px] font-extrabold text-[#0F2F57] bg-slate-50 rounded px-1.5 py-0.5 truncate border border-slate-100"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pillColorMap[med.pillColor] || 'bg-slate-300'}`} />
                      <span className="truncate">{med.name}</span>
                    </div>
                  ))}
                  {/* Dots for mobile fallback */}
                  <div className="flex sm:hidden gap-0.5 flex-wrap">
                    {scheduled.map((med, idx) => (
                      <span key={idx} className={`w-1.5 h-1.5 rounded-full shrink-0 ${pillColorMap[med.pillColor] || 'bg-slate-300'}`} />
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Schedule Panel Detail */}
      <div className="w-full lg:w-[350px] bg-white rounded-[2rem] border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col">
        <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h4 className="text-sm font-black text-[#061D4C] uppercase tracking-wider">Day Schedule</h4>
            <p className="text-xs text-[#2563EB] font-bold mt-1">{formatSelectedDate()}</p>
          </div>
          {/* Header Badge */}
          {isSelectedToday && (
            <span className="bg-blue-100 text-[#2563EB] text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Today</span>
          )}
          {isSelectedPast && (
            <span className="bg-slate-100 text-slate-500 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">History</span>
          )}
          {isSelectedFuture && (
            <span className="bg-[#E6F7F0] text-[#10B981] text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Upcoming</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 py-4 max-h-[480px]">
          {scheduledMedsForSelectedDay.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
              <Clock className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">No scheduled intakes</p>
              <p className="text-[10px] text-slate-400 max-w-[200px] text-center">There are no medications scheduled for this day.</p>
            </div>
          ) : (
            Object.keys(timeBlocks).map(blockName => {
              const meds = timeBlocks[blockName];
              if (meds.length === 0) return null;

              return (
                <div key={blockName} className="space-y-2">
                  <h5 className="text-[10px] font-black text-[#4B6B8B] uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-1">
                    <span>●</span> {blockName}
                  </h5>
                  <div className="space-y-2">
                    {meds.map((med, idx) => {
                      const log = getLogForMedOnDate(med._id || med.id, blockName, selectedDate);
                      
                      return (
                        <div
                          key={idx}
                          className="bg-[#F8FAFC] border border-slate-100 rounded-2xl p-3 flex justify-between items-center gap-3"
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <div className="bg-white p-1.5 rounded-xl border border-slate-100 flex-shrink-0 mt-0.5 shadow-sm">
                              {renderPillIcon(med.pillShape || 'Tablet', med.pillColor || 'White')}
                            </div>
                            <div className="space-y-1 text-left min-w-0 flex-1">
                              <h6 className="font-extrabold text-sm text-[#0F2F57] tracking-tight truncate">{med.name}</h6>
                              <p className="text-[10px] text-[#64748B] font-semibold">
                                {med.dosageStrength || 'Standard'} • {med.unit || 'Tablets'}
                              </p>
                              {med.foodAssociation && med.foodAssociation !== 'None' && (
                                <span className="inline-block text-[9px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] px-2 py-0.5 rounded-full mt-1">
                                  {med.foodAssociation}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Compliance state rendering */}
                          <div className="flex items-center gap-1">
                            
                            {/* CASE 1: TODAY - Fully Interactive */}
                            {isSelectedToday && (
                              <>
                                {log ? (
                                  <div className="flex items-center gap-1">
                                    {log.status === 'taken' && (
                                      <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Taken
                                      </span>
                                    )}
                                    {log.status === 'skipped' && (
                                      <span className="text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Skipped
                                      </span>
                                    )}
                                    {log.status === 'missed' && (
                                      <span className="text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                        <XCircle className="w-3.5 h-3.5 text-rose-500" /> Missed
                                      </span>
                                    )}
                                    {onLogAction && (
                                      <button
                                        onClick={() => onLogAction(med._id || med.id, blockName, 'undo', getLocalDateString(selectedDate))}
                                        className="text-xs font-bold text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
                                      >
                                        Undo
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  onLogAction && (
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => onLogAction(med._id || med.id, blockName, 'taken', getLocalDateString(selectedDate))}
                                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 border border-emerald-100 text-emerald-600 hover:text-white font-extrabold text-[10px] rounded-xl tracking-wide uppercase transition-colors cursor-pointer"
                                      >
                                        Take
                                      </button>
                                      <button
                                        onClick={() => onLogAction(med._id || med.id, blockName, 'skipped', getLocalDateString(selectedDate))}
                                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-500 border border-amber-100 text-amber-600 hover:text-white font-extrabold text-[10px] rounded-xl tracking-wide uppercase transition-colors cursor-pointer"
                                      >
                                        Skip
                                      </button>
                                    </div>
                                  )
                                )}
                              </>
                            )}

                            {/* CASE 2: PAST DATES - Read-Only History */}
                            {isSelectedPast && (
                              <>
                                {log ? (
                                  <div className="flex items-center">
                                    {log.status === 'taken' && (
                                      <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 select-none">
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Taken
                                      </span>
                                    )}
                                    {log.status === 'skipped' && (
                                      <span className="text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 select-none">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Skipped
                                      </span>
                                    )}
                                    {log.status === 'missed' && (
                                      <span className="text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 select-none">
                                        <XCircle className="w-3.5 h-3.5 text-rose-500" /> Missed
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  /* If no log recorded, it is marked as unlogged history (read-only missed) */
                                  <span className="text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 select-none">
                                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Unlogged
                                  </span>
                                )}
                              </>
                            )}

                            {/* CASE 3: FUTURE DATES - Read-Only Scheduled Upcoming */}
                            {isSelectedFuture && (
                              <span className="text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 select-none">
                                <Clock className="w-3.5 h-3.5 text-slate-400" /> Scheduled
                              </span>
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sync ICS notice banner */}
        <div className="bg-[#EFF6FF] border border-[#DBEAFE] p-3.5 rounded-2xl text-[10px] text-[#475569] leading-relaxed font-semibold flex items-start gap-2.5 shadow-sm mt-auto">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <span>
            {isSelectedToday && "Doses for today can be logged as Taken or Skipped in real-time."}
            {isSelectedPast && "This is a historical day. Compliance logs are locked and cannot be edited."}
            {isSelectedFuture && "These are future upcoming intakes. Logging will become active on this date."}
          </span>
        </div>
      </div>
    </div>
  );
}
