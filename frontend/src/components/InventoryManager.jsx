import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useConfirm } from '../context/ConfirmContext';
import {
  Package, RefreshCw, AlertTriangle, Plus, Trash2, ShieldAlert, Phone,
  Search, ArrowLeft, SlidersHorizontal, Bookmark, Edit, ClipboardCheck, Activity, Calendar, Clock, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
    return timeStr;
  }
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1].substring(0, 2);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  }
};

const convertTo24h = (timeStr) => {
  if (!timeStr) return '08:00';
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }
  const match24 = trimmed.match(/^(\d{2}):(\d{2})$/);
  if (match24) return trimmed;

  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    const timeParts = parts[0].split(':');
    let hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1] || '00';
    const ampm = parts[1].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }
  return trimmed;
};

const renderScheduleDisplay = (timeOfDay, reminderTime) => {
  const slots = (timeOfDay || '').split(/[,;&]|\band\b/i).map(t => t.trim()).filter(Boolean);
  const alarmTimes = (reminderTime || '').split(/[,;]/).map(t => t.trim()).filter(Boolean);

  if (slots.length === 0) return 'None';

  const paired = slots.map((slot, idx) => {
    const timeVal = alarmTimes[idx] || alarmTimes[0];
    return timeVal ? `${slot} (${formatTime12h(timeVal)})` : slot;
  });

  return paired.join(', ');
};

export default function InventoryManager({ medicines, refills, logs = [], onRefill, onDelete, onAddMedicine, onEditMedicine, setActiveTab, onRequestPharmacyRefill, recentRefillMedId }) {
  const confirm = useConfirm();
  const downloadCalendar = async () => {
    try {
      const { API_URL } = await import('../config.js');
      const res = await fetch(`${API_URL}/data/calendar/export`, { credentials: 'include' });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'medication-schedule.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Failed to export calendar', err);
    }
  };


  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'REFILLS', 'CHRONIC'
  const [flaggedMeds, setFlaggedMeds] = useState({});
  const [editingMedicine, setEditingMedicine] = useState(null);

  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterFood, setFilterFood] = useState('All');
  const [filterShape, setFilterShape] = useState('All');
  const [filterStockStatus, setFilterStockStatus] = useState('All'); // 'All', 'Low/Out', 'Healthy'
  const [inventorySortBy, setInventorySortBy] = useState('name'); // 'name', 'stockLowToHigh', 'capacityHighToLow'

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTotalQty, setNewTotalQty] = useState('');
  const [newCurrentQty, setNewCurrentQty] = useState('');
  const [newUnit, setNewUnit] = useState('Tablets');
  const [morningChecked, setMorningChecked] = useState(true);
  const [afternoonChecked, setAfternoonChecked] = useState(false);
  const [eveningChecked, setEveningChecked] = useState(false);
  const [nightChecked, setNightChecked] = useState(false);
  const [customTimeChecked, setCustomTimeChecked] = useState(false);
  const [customTimeText, setCustomTimeText] = useState('');
  const [newPharmacyEmail, setNewPharmacyEmail] = useState('');
  const [newDosageStrength, setNewDosageStrength] = useState('');
  const [newFoodAssociation, setNewFoodAssociation] = useState('None');
  const [newSpecialInstructions, setNewSpecialInstructions] = useState('');

  // Custom multi-dose reminder slots and dates
  const [useSeparateAlarms, setUseSeparateAlarms] = useState(false);
  const [singleAlarmTime, setSingleAlarmTime] = useState('08:00');
  const [slotTimes, setSlotTimes] = useState({
    Morning: '08:00',
    Afternoon: '13:00',
    Evening: '19:00',
    Night: '22:00',
    Custom: '12:00'
  });
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [newEndDate, setNewEndDate] = useState('');
  const [newPrescribedDoctor, setNewPrescribedDoctor] = useState('');
  const [newPurpose, setNewPurpose] = useState('');
  const [newRefillThreshold, setNewRefillThreshold] = useState(5);
  const [newRxNumber, setNewRxNumber] = useState('');

  // Pill shape/color and refills
  const [newPillShape, setNewPillShape] = useState('Tablet');
  const [newPillColor, setNewPillColor] = useState('White');
  const [newRefillsRemaining, setNewRefillsRemaining] = useState(0);
  const [newPharmacyPhone, setNewPharmacyPhone] = useState('');

  // Collapsible toggle state for advanced configuration
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);

  const checkedSlotsCount = [morningChecked, afternoonChecked, eveningChecked, nightChecked, customTimeChecked].filter(Boolean).length;

  const colorMap = {
    Red: '#ef4444',
    Blue: '#3b82f6',
    Green: '#10b981',
    Yellow: '#eab308',
    Orange: '#f97316',
    Purple: '#8b5cf6',
    Pink: '#ec4899',
    White: '#f8fafc'
  };

  const renderPillIcon = (shape, color) => {
    const fill = colorMap[color] || '#f8fafc';
    switch (shape) {
      case 'Capsule':
        return (
          <svg className="w-8 h-8 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="8" width="14" height="8" rx="4" fill={fill} stroke={fill} strokeWidth="1.5" />
            <line x1="12" y1="8" x2="12" y2="16" stroke="#000" strokeWidth="1.5" opacity="0.35" />
          </svg>
        );
      case 'Liquid':
        return (
          <svg className="w-8 h-8 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5V3H16V5M9 5H15M6 10C6 7.79 7.79 6 10 6H14C16.21 6 18 7.79 18 10V19C18 20.1 17.1 21 16 21H8C6.9 21 6 20.1 6 19V10Z" fill={fill} stroke={fill} strokeWidth="1.5" />
            <rect x="9" y="11" width="6" height="6" fill="#000" opacity="0.25" rx="1" />
          </svg>
        );
      case 'Drops':
        return (
          <svg className="w-8 h-8 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill={fill} stroke={fill} strokeWidth="1.5" />
          </svg>
        );
      default: // Tablet
        return (
          <svg className="w-8 h-8 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill={fill} stroke={fill} strokeWidth="1.5" />
            <line x1="6" y1="12" x2="18" y2="12" stroke="#000" strokeWidth="1.5" opacity="0.3" />
          </svg>
        );
    }
  };

  const getStatusDetails = (currentQty, dosesPerDay, refillThreshold = 5) => {
    const dosesRemaining = currentQty;
    if (dosesRemaining <= 0) {
      return { label: 'Out of Stock', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', indicator: 'bg-rose-500' };
    }
    if (dosesRemaining < refillThreshold) {
      return { label: 'Critical Stock', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', indicator: 'bg-rose-500' };
    }
    if (dosesRemaining >= refillThreshold && dosesRemaining <= refillThreshold * 2) {
      return { label: 'Low Stock', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', indicator: 'bg-amber-500' };
    }
    return { label: 'Healthy Stock', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20', indicator: 'bg-teal-500' };
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-rose-500/25 text-rose-300 border-rose-500/40';
      case 'High': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'Medium': return 'bg-amber-500/15 text-amber-300 border-amber-500/20';
      default: return 'bg-teal-500/10 text-teal-300 border-teal-500/20';
    }
  };

  const handleStartEdit = (med) => {
    setEditingMedicine(med);
    setNewName(med.name || '');
    setNewTotalQty(med.totalQuantity || '');
    setNewCurrentQty(med.currentQuantity || '');
    setNewUnit(med.unit || 'Tablets');

    const slots = (med.timeOfDay || '').split(/[,;&]|\band\b/i).map(t => t.trim().toLowerCase());
    const isMorning = slots.includes('morning');
    const isAfternoon = slots.includes('afternoon');
    const isEvening = slots.includes('evening');
    const isNight = slots.includes('night');

    const standardSlots = ['morning', 'afternoon', 'evening', 'night'];
    const customSlot = slots.find(s => s && !standardSlots.includes(s));

    setMorningChecked(isMorning);
    setAfternoonChecked(isAfternoon);
    setEveningChecked(isEvening);
    setNightChecked(isNight);
    if (customSlot) {
      setCustomTimeChecked(true);
      setCustomTimeText(customSlot);
    } else {
      setCustomTimeChecked(false);
      setCustomTimeText('');
    }

    setNewPharmacyEmail(med.pharmacyEmail || '');
    setNewDosageStrength(med.dosageStrength || '');
    setNewFoodAssociation(med.foodAssociation || 'None');
    setNewSpecialInstructions(med.specialInstructions || '');

    const alarmTimes = (med.reminderTime || '').split(/[,;]/).map(t => t.trim()).filter(Boolean);
    const isSeparate = alarmTimes.length > 1;
    setUseSeparateAlarms(isSeparate);

    if (isSeparate) {
      const timesCopy = {
        Morning: '08:00',
        Afternoon: '13:00',
        Evening: '19:00',
        Night: '22:00',
        Custom: '12:00'
      };

      let alarmIdx = 0;
      if (isMorning) timesCopy.Morning = convertTo24h(alarmTimes[alarmIdx++] || '08:00');
      if (isAfternoon) timesCopy.Afternoon = convertTo24h(alarmTimes[alarmIdx++] || '13:00');
      if (isEvening) timesCopy.Evening = convertTo24h(alarmTimes[alarmIdx++] || '19:00');
      if (isNight) timesCopy.Night = convertTo24h(alarmTimes[alarmIdx++] || '22:00');
      if (customSlot) timesCopy.Custom = convertTo24h(alarmTimes[alarmIdx++] || '12:00');
      setSlotTimes(timesCopy);
    } else {
      setSingleAlarmTime(convertTo24h(med.reminderTime || '08:00'));
    }

    setNewStartDate(med.startDate ? new Date(med.startDate).toISOString().split('T')[0] : '');
    setNewEndDate(med.endDate ? new Date(med.endDate).toISOString().split('T')[0] : '');
    setNewPrescribedDoctor(med.prescribedDoctor || '');
    setNewPurpose(med.purpose || '');
    setNewRefillThreshold(med.refillThreshold !== undefined ? med.refillThreshold : 5);
    setNewRxNumber(med.rxNumber || '');
    setNewPillShape(med.pillShape || 'Tablet');
    setNewPillColor(med.pillColor || 'White');
    setNewRefillsRemaining(med.refillsRemaining || 0);
    setNewPharmacyPhone(med.pharmacyPhone || '');
    setShowAdvancedDetails(true);
    setShowAddForm(false);
  };

  const handleCancelForm = () => {
    setEditingMedicine(null);
    setNewName('');
    setNewTotalQty('');
    setNewCurrentQty('');
    setNewUnit('Tablets');
    setMorningChecked(true);
    setAfternoonChecked(false);
    setEveningChecked(false);
    setNightChecked(false);
    setCustomTimeChecked(false);
    setCustomTimeText('');
    setNewPharmacyEmail('');
    setNewDosageStrength('');
    setNewFoodAssociation('None');
    setNewSpecialInstructions('');
    setUseSeparateAlarms(false);
    setSingleAlarmTime('08:00');
    setSlotTimes({
      Morning: '08:00',
      Afternoon: '13:00',
      Evening: '19:00',
      Night: '22:00',
      Custom: '12:00'
    });
    setNewStartDate(new Date().toISOString().split('T')[0]);
    setNewEndDate('');
    setNewPrescribedDoctor('');
    setNewPurpose('');
    setNewRefillThreshold(5);
    setNewRxNumber('');
    setNewPillShape('Tablet');
    setNewPillColor('White');
    setNewRefillsRemaining(0);
    setNewPharmacyPhone('');
    setShowAdvancedDetails(false);
    setShowAddForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let total = newTotalQty ? parseInt(newTotalQty) : 0;
    let current = newCurrentQty ? parseInt(newCurrentQty) : 0;

    if (total > 0 && current === 0) current = total;
    else if (current > 0 && total === 0) total = current;

    if (!newName || total <= 0 || current < 0) {
      alert("Error: Please specify a valid medication name and quantity.");
      return;
    }

    if (newStartDate && newEndDate && new Date(newStartDate) > new Date(newEndDate)) {
      alert("Error: Medication Start Date cannot be after the End Date.");
      return;
    }

    const timeParts = [];
    if (morningChecked) timeParts.push('Morning');
    if (afternoonChecked) timeParts.push('Afternoon');
    if (eveningChecked) timeParts.push('Evening');
    if (nightChecked) timeParts.push('Night');
    if (customTimeChecked && customTimeText.trim()) {
      timeParts.push(customTimeText.trim());
    }

    const computedTimeOfDay = timeParts.join(', ') || 'Morning';
    const computedDosesPerDay = timeParts.length || 1;

    const isSeparateAlarmsActive = useSeparateAlarms && checkedSlotsCount > 1;

    // Combine individual slot alarm times or use single alarm time
    let computedReminderTime = '08:00';
    if (isSeparateAlarmsActive) {
      const reminderTimeParts = [];
      if (morningChecked) reminderTimeParts.push(slotTimes.Morning);
      if (afternoonChecked) reminderTimeParts.push(slotTimes.Afternoon);
      if (eveningChecked) reminderTimeParts.push(slotTimes.Evening);
      if (nightChecked) reminderTimeParts.push(slotTimes.Night);
      if (customTimeChecked) reminderTimeParts.push(slotTimes.Custom);
      computedReminderTime = reminderTimeParts.join(', ') || '08:00';
    } else {
      computedReminderTime = singleAlarmTime || '08:00';
    }

    const payload = {
      name: newName,
      totalQuantity: total,
      currentQuantity: current,
      unit: newUnit,
      dosesPerDay: computedDosesPerDay,
      timeOfDay: computedTimeOfDay,
      scheduleDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      dosageStrength: newDosageStrength,
      foodAssociation: newFoodAssociation,
      specialInstructions: newSpecialInstructions,
      reminderTime: computedReminderTime,
      startDate: newStartDate || undefined,
      endDate: newEndDate || undefined,
      prescribedDoctor: newPrescribedDoctor,
      purpose: newPurpose,
      refillThreshold: parseInt(newRefillThreshold) || 5,
      rxNumber: newRxNumber,
      pillShape: newPillShape,
      pillColor: newPillColor,
      refillsRemaining: parseInt(newRefillsRemaining) || 0,
      pharmacyPhone: newPharmacyPhone,
      pharmacyEmail: newPharmacyEmail
    };

    if (editingMedicine) {
      onEditMedicine({
        ...payload,
        _id: editingMedicine._id,
        id: editingMedicine.id
      });
    } else {
      onAddMedicine(payload);
    }

    handleCancelForm();
  };

  const trendData = [];
  const now = new Date();
  for (let i = 0; i < 10; i++) {
    const futureDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dayStr = futureDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    let totalCurrentPredict = 0;
    medicines.forEach(m => {
      const dailyUsage = m.dosesPerDay || 1;
      const predictedQty = Math.max(0, m.currentQuantity - (dailyUsage * i));
      totalCurrentPredict += predictedQty;
    });

    trendData.push({
      date: dayStr,
      "Stock Levels": totalCurrentPredict
    });
  }

  const usageData = medicines.map(m => ({
    name: m.name,
    "Daily Usage": m.dosesPerDay || 1
  })).sort((a, b) => b["Daily Usage"] - a["Daily Usage"]);

  // Filtering Logic
  const filteredMedicines = medicines.filter(med => {
    // 1. Search Query Filter
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (med.purpose && med.purpose.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. Active Tab Filter
    let matchesTab = true;
    if (activeFilter === 'REFILLS') {
      const refillInfo = refills.find(r => r.medicineId === (med._id || med.id)) || {};
      const priority = refillInfo.priority || 'Low';
      matchesTab = ['Critical', 'High'].includes(priority) || (med.currentQuantity < (med.refillThreshold || 5));
    } else if (activeFilter === 'CHRONIC') {
      // Mock logic for "CHRONIC" - assume chronic if usage is >= 1 per day consistently
      matchesTab = med.dosesPerDay >= 1;
    }

    // 3. Food Association Filter
    const matchesFood = filterFood === 'All' || med.foodAssociation === filterFood;

    // 4. Pill Shape Filter
    const matchesShape = filterShape === 'All' || med.pillShape === filterShape;

    // 5. Stock Status Filter
    let matchesStock = true;
    if (filterStockStatus === 'Low/Out') {
      matchesStock = med.currentQuantity <= (med.refillThreshold || 5);
    } else if (filterStockStatus === 'Healthy') {
      matchesStock = med.currentQuantity > (med.refillThreshold || 5);
    }

    return matchesSearch && matchesTab && matchesFood && matchesShape && matchesStock;
  });

  // Sorting Logic
  if (inventorySortBy === 'name') {
    filteredMedicines.sort((a, b) => a.name.localeCompare(b.name));
  } else if (inventorySortBy === 'stockLowToHigh') {
    filteredMedicines.sort((a, b) => a.currentQuantity - b.currentQuantity);
  } else if (inventorySortBy === 'capacityHighToLow') {
    filteredMedicines.sort((a, b) => b.totalQuantity - a.totalQuantity);
  }

  const refillsCount = medicines.filter(med => {
    const refillInfo = refills.find(r => r.medicineId === (med._id || med.id)) || {};
    const priority = refillInfo.priority || 'Low';
    return ['Critical', 'High'].includes(priority) || (med.currentQuantity < (med.refillThreshold || 5));
  }).length;

  const totalLogs = logs.length;
  const takenLogs = logs.filter(l => l.status === 'taken').length;
  const complianceScore = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 76;

  return (
    <div className="space-y-6 sm:space-y-8 mt-1 pb-20 relative z-20">


      {/* 1. HEADER, SEARCH & FILTERS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="text-left shrink-0 flex items-center justify-between w-full lg:w-auto">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F2F57] tracking-tight leading-tight">Medication Inventory</h2>
            <p className="text-xs text-[#4B6B8B] font-medium mt-1">Manage and track your pharmaceutical supplies.</p>
          </div>
          <button
            onClick={downloadCalendar}
            className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 border border-slate-100 text-slate-600 hover:text-[#0F2F57] hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Calendar className="w-4 h-4 text-[#0F2F57]/70" /> Sync Calendar
          </button>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 w-full">
          {/* Left: Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-2xl self-start">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${activeFilter === 'ALL' ? 'bg-[#2563EB] text-white shadow-sm' : 'bg-transparent text-slate-700 hover:text-black'}`}
            >
              All Items
            </button>
            <button
              onClick={() => setActiveFilter('REFILLS')}
              className={`px-4 py-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${activeFilter === 'REFILLS' ? 'bg-[#2563EB] text-white shadow-sm' : 'bg-transparent text-slate-700 hover:text-black'}`}
            >
              Refills needed
            </button>
            <button
              onClick={() => setActiveFilter('CHRONIC')}
              className={`px-4 py-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${activeFilter === 'CHRONIC' ? 'bg-[#2563EB] text-white shadow-sm' : 'bg-transparent text-slate-700 hover:text-black'}`}
            >
              Chronic Care
            </button>
          </div>

          {/* Right: Actions and Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 lg:flex-1">
            {/* SEARCH */}
            <div className="relative flex-1 sm:max-w-xs flex items-center">
              <div className="absolute left-3 z-10 pointer-events-none">
                <Search className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                style={{ paddingLeft: '40px', paddingRight: '40px', paddingTop: '10px', paddingBottom: '10px', height: '42px', border: '2.5px solid #000000' }}
                className="block w-full bg-white rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] font-bold"
                placeholder="Search medication"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="absolute right-3 z-10 flex items-center text-slate-500 hover:text-[#0F2F57] cursor-pointer"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* ADD BUTTON */}
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4 text-white" /> Add Medicine
            </button>

            {/* SYNC CALENDAR */}
            <button
              onClick={downloadCalendar}
              className="hidden lg:flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-white border border-[#E2E8F0] hover:border-slate-300 text-[#2563EB] hover:text-[#1D4ED8] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0"
            >
              <Calendar className="w-4 h-4 text-[#2563EB]" /> Sync to Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel (Light Theme) */}
      {showAdvancedFilters && (
        <div className="bg-white border border-slate-100 p-5 rounded-2xl space-y-4 animate-fadeIn text-left shadow-[0_8px_30px_rgb(0,0,0,0.02)] mt-2">
          <h4 className="text-[10px] font-bold text-[#4B6B8B] uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#0F2F57]" /> Advanced Stock Filters
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Food Intake</label>
              <select value={filterFood} onChange={e => setFilterFood(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-605 px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-[#0F2F57] cursor-pointer">
                <option value="All">All</option>
                <option value="None">None</option>
                <option value="Before Food">Before Food</option>
                <option value="With Food">With Food</option>
                <option value="After Food">After Food</option>
                <option value="Empty Stomach">Empty Stomach</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Pill Shape</label>
              <select value={filterShape} onChange={e => setFilterShape(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-605 px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-[#0F2F57] cursor-pointer">
                <option value="All">All Shapes</option>
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Liquid">Liquid Bottle</option>
                <option value="Drops">Drops</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Stock Status</label>
              <select value={filterStockStatus} onChange={e => setFilterStockStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-605 px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-[#0F2F57] cursor-pointer">
                <option value="All">All Levels</option>
                <option value="Low/Out">Low / Out of Stock</option>
                <option value="Healthy">Healthy Stock</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Sort</label>
              <select value={inventorySortBy} onChange={e => setInventorySortBy(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-605 px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-[#0F2F57] cursor-pointer">
                <option value="name">Name (A-Z)</option>
                <option value="stockLowToHigh">Stock (Low to High)</option>
                <option value="capacityHighToLow">Capacity (High to Low)</option>
              </select>
            </div>
          </div>
          {(filterFood !== 'All' || filterShape !== 'All' || filterStockStatus !== 'All' || inventorySortBy !== 'name') && (
            <div className="flex justify-end pt-1">
              <button onClick={() => { setFilterFood('All'); setFilterShape('All'); setFilterStockStatus('All'); setInventorySortBy('name'); }} className="text-[#0F2F57] hover:underline font-bold tracking-wider uppercase text-[10px] cursor-pointer">
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. ADD/EDIT MEDICATION MODAL DIALOG (Redesigned to match image) */}
      {(showAddForm || editingMedicine) && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/30 backdrop-blur-sm animate-fadeIn"
          onClick={handleCancelForm}
        >
          <div
            className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl relative max-h-[95vh] sm:max-h-[90vh] overflow-y-auto animate-slideUp sm:animate-zoomIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-1" />

            {/* ── HEADER ── */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <span className="text-2xl">💊</span>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#1a1f36] leading-tight">
                    {editingMedicine ? 'Edit Medication' : 'Add New Medication'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Add medication details, schedule and inventory information</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-base mt-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

              {/* ── SECTION 1: GENERAL DETAILS ── */}
              <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#3B5BDB] text-base">👤</span>
                  <h3 className="text-sm font-bold text-[#3B5BDB]">General Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Medicine Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Medicine Name <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">📎</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Metoprolol"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#3B5BDB] focus:ring-1 focus:ring-[#3B5BDB]/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Dosage Strength */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Dosage Strength</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🛡️</span>
                      <input
                        type="text"
                        placeholder="e.g. 50mg, 100mcg"
                        value={newDosageStrength}
                        onChange={e => setNewDosageStrength(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#3B5BDB] focus:ring-1 focus:ring-[#3B5BDB]/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Unit Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Unit Type <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">📋</span>
                    <select
                      value={newUnit}
                      onChange={e => setNewUnit(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#3B5BDB] focus:ring-1 focus:ring-[#3B5BDB]/20 transition-all cursor-pointer appearance-none"
                    >
                      <option value="Tablets">Tablets</option>
                      <option value="Capsules">Capsules</option>
                      <option value="ml">ml (Syrup)</option>
                      <option value="Drops">Drops</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▾</span>
                  </div>
                </div>
              </div>

              {/* ── SECTION 2: DOSING & SCHEDULE ── */}
              <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#3B5BDB] text-base">📅</span>
                  <h3 className="text-sm font-bold text-[#3B5BDB]">Dosing &amp; Schedule</h3>
                </div>

                {/* Time of Day Card Toggles */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-500">Time of Day (Select all that apply)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* Morning */}
                    <button
                      type="button"
                      onClick={() => setMorningChecked(!morningChecked)}
                      className={`relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                        morningChecked
                          ? 'border-[#3B5BDB] bg-indigo-50/70'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {morningChecked && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#3B5BDB] rounded-full flex items-center justify-center">
                          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                      <span className="text-xl">☀️</span>
                      <span className={`text-xs font-semibold ${ morningChecked ? 'text-[#3B5BDB]' : 'text-slate-600' }`}>Morning</span>
                    </button>

                    {/* Afternoon */}
                    <button
                      type="button"
                      onClick={() => setAfternoonChecked(!afternoonChecked)}
                      className={`relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                        afternoonChecked
                          ? 'border-[#3B5BDB] bg-indigo-50/70'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {afternoonChecked && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#3B5BDB] rounded-full flex items-center justify-center">
                          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                      <span className="text-xl">⛅</span>
                      <span className={`text-xs font-semibold ${ afternoonChecked ? 'text-[#3B5BDB]' : 'text-slate-600' }`}>Afternoon</span>
                    </button>

                    {/* Evening */}
                    <button
                      type="button"
                      onClick={() => setEveningChecked(!eveningChecked)}
                      className={`relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                        eveningChecked
                          ? 'border-[#3B5BDB] bg-indigo-50/70'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {eveningChecked && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#3B5BDB] rounded-full flex items-center justify-center">
                          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                      <span className="text-xl">🌅</span>
                      <span className={`text-xs font-semibold ${ eveningChecked ? 'text-[#3B5BDB]' : 'text-slate-600' }`}>Evening</span>
                    </button>

                    {/* Night */}
                    <button
                      type="button"
                      onClick={() => setNightChecked(!nightChecked)}
                      className={`relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                        nightChecked
                          ? 'border-[#3B5BDB] bg-indigo-50/70'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {nightChecked && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#3B5BDB] rounded-full flex items-center justify-center">
                          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                      <span className="text-xl">🌙</span>
                      <span className={`text-xs font-semibold ${ nightChecked ? 'text-[#3B5BDB]' : 'text-slate-600' }`}>Night</span>
                    </button>
                  </div>
                </div>

                {/* Custom Time Slot */}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer select-none w-fit">
                    <input
                      type="checkbox"
                      checked={customTimeChecked}
                      onChange={e => setCustomTimeChecked(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 accent-[#3B5BDB] cursor-pointer"
                    />
                    Custom Time Slot
                  </label>
                  {customTimeChecked && (
                    <input
                      type="text"
                      placeholder="e.g. Bedtime, As Needed, With Lunch"
                      value={customTimeText}
                      onChange={e => setCustomTimeText(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#3B5BDB] focus:ring-1 focus:ring-[#3B5BDB]/20 transition-all"
                    />
                  )}
                </div>

                {/* Alarm Time */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  {checkedSlotsCount > 1 && (
                    <label className="flex items-center gap-2 text-xs text-slate-500 font-semibold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={useSeparateAlarms}
                        onChange={e => setUseSeparateAlarms(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 accent-[#3B5BDB] cursor-pointer"
                      />
                      Configure separate alarm times for each slot
                    </label>
                  )}

                  {(useSeparateAlarms && checkedSlotsCount > 1) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {morningChecked && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500">Morning Alarm Time</label>
                          <input type="time" required value={slotTimes.Morning} onChange={e => setSlotTimes(prev => ({ ...prev, Morning: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#3B5BDB] cursor-pointer" />
                        </div>
                      )}
                      {afternoonChecked && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500">Afternoon Alarm Time</label>
                          <input type="time" required value={slotTimes.Afternoon} onChange={e => setSlotTimes(prev => ({ ...prev, Afternoon: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#3B5BDB] cursor-pointer" />
                        </div>
                      )}
                      {eveningChecked && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500">Evening Alarm Time</label>
                          <input type="time" required value={slotTimes.Evening} onChange={e => setSlotTimes(prev => ({ ...prev, Evening: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#3B5BDB] cursor-pointer" />
                        </div>
                      )}
                      {nightChecked && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500">Night Alarm Time</label>
                          <input type="time" required value={slotTimes.Night} onChange={e => setSlotTimes(prev => ({ ...prev, Night: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#3B5BDB] cursor-pointer" />
                        </div>
                      )}
                      {customTimeChecked && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-500">"{customTimeText || 'Custom'}" Alarm Time</label>
                          <input type="time" required value={slotTimes.Custom} onChange={e => setSlotTimes(prev => ({ ...prev, Custom: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#3B5BDB] cursor-pointer" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Reminder Alarm Time</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🕐</span>
                        <input
                          type="time"
                          required
                          value={singleAlarmTime}
                          onChange={e => setSingleAlarmTime(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#3B5BDB] focus:ring-1 focus:ring-[#3B5BDB]/20 cursor-pointer transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── SECTION 3: INVENTORY QUANTITIES ── */}
              <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#3B5BDB] text-base">📦</span>
                  <h3 className="text-sm font-bold text-[#3B5BDB]">Inventory Quantities</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Total Capacity */}
                  <div className="border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                      <span className="text-base">📦</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Total Capacity Quantity</label>
                      <input
                        type="number" min="1" placeholder="e.g. 30"
                        value={newTotalQty}
                        onChange={e => setNewTotalQty(e.target.value)}
                        className="w-full text-sm font-semibold text-slate-600 placeholder-slate-300 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Current Stock */}
                  <div className="border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <span className="text-base">🟩</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Current Stock Quantity</label>
                      <input
                        type="number" min="0" placeholder="e.g. 30"
                        value={newCurrentQty}
                        onChange={e => setNewCurrentQty(e.target.value)}
                        className="w-full text-sm font-semibold text-slate-600 placeholder-slate-300 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Refills Remaining */}
                  <div className="border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
                      <span className="text-base">🔄</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Refills Remaining</label>
                      <input
                        type="number" min="0"
                        value={newRefillsRemaining}
                        onChange={e => setNewRefillsRemaining(e.target.value)}
                        className="w-full text-sm font-bold text-slate-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Refill Alert Threshold */}
                  <div className="border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                      <span className="text-base">🔔</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Refill Alert Threshold</label>
                      <input
                        type="number" min="0"
                        value={newRefillThreshold}
                        onChange={e => setNewRefillThreshold(e.target.value)}
                        className="w-full text-sm font-bold text-slate-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECTION 4: ADVANCED DETAILS ACCORDION ── */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer select-none hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#3B5BDB] text-base">🛡️</span>
                    <div>
                      <span className="text-sm font-bold text-[#3B5BDB]">Advanced Details</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Pill shape/color, Pharmacy, Rx details and more</p>
                    </div>
                  </div>
                  <span className="text-slate-400 text-xs">{showAdvancedDetails ? '▲' : '▼'}</span>
                </button>

                {showAdvancedDetails && (
                  <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pill Shape</label>
                      <select value={newPillShape} onChange={e => setNewPillShape(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:bg-white focus:border-[#3B5BDB] cursor-pointer transition-all">
                        <option value="Tablet">Tablet</option>
                        <option value="Capsule">Capsule</option>
                        <option value="Liquid">Liquid Bottle</option>
                        <option value="Drops">Drops</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pill Color</label>
                      <select value={newPillColor} onChange={e => setNewPillColor(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:bg-white focus:border-[#3B5BDB] cursor-pointer transition-all">
                        <option value="White">White</option>
                        <option value="Red">Red</option>
                        <option value="Blue">Blue</option>
                        <option value="Green">Green</option>
                        <option value="Yellow">Yellow</option>
                        <option value="Orange">Orange</option>
                        <option value="Purple">Purple</option>
                        <option value="Pink">Pink</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Purpose / Indication</label>
                      <input type="text" placeholder="e.g. Blood pressure, Diabetes" value={newPurpose} onChange={e => setNewPurpose(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#3B5BDB] transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prescribed Doctor</label>
                      <input type="text" placeholder="e.g. Dr. Jameson" value={newPrescribedDoctor} onChange={e => setNewPrescribedDoctor(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#3B5BDB] transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rx / Prescription Number</label>
                      <input type="text" placeholder="e.g. RX-982741" value={newRxNumber} onChange={e => setNewRxNumber(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#3B5BDB] transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Special Instructions</label>
                      <input type="text" placeholder="e.g. Do not crush, take with food" value={newSpecialInstructions} onChange={e => setNewSpecialInstructions(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#3B5BDB] transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pharmacy Phone Number</label>
                      <input type="text" placeholder="e.g. (555) 019-2834" value={newPharmacyPhone} onChange={e => setNewPharmacyPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#3B5BDB] transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pharmacy Email Address</label>
                      <input type="email" placeholder="e.g. restock@pharmacy.com" value={newPharmacyEmail} onChange={e => setNewPharmacyEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#3B5BDB] transition-all" />
                    </div>
                  </div>
                )}
              </div>

              {/* ── FOOTER BUTTONS ── */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#3B5BDB] hover:bg-[#3451c7] text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-[#3B5BDB]/25 cursor-pointer"
                >
                  <span>💾</span>
                  {editingMedicine ? 'Save Changes' : 'Save Medication'}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 3. URGENT DYNAMIC REFILL ALERTS */}
      {refills.some(r => r.priority === 'Critical' || r.priority === 'High') && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-4 items-start animate-pulse">
          <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-rose-600">Urgent Refill Warning Alert</h4>
            <div className="text-xs text-rose-600/80 space-y-1 leading-relaxed">
              {refills.filter(r => r.priority === 'Critical' || r.priority === 'High').map((refill, idx) => (
                <p key={idx}>
                  • <strong>{refill.medicineName}</strong>: {refill.remainingQuantity <= 0 ? 'Stock is entirely depleted' : `Only ${refill.remainingQuantity} ${refill.unit} remaining (Est. ${refill.estimatedDaysLeft} days left)`}. Please request a refill immediately.
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* 4. MEDICATION CARDS GRID (FULL WIDTH) */}
      <div className="w-full space-y-6">
        {filteredMedicines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-left">
            {filteredMedicines.map((med) => {
              const mId = med._id || med.id;
              const refillInfo = refills.find(r => r.medicineId === mId) || {};
              const status = getStatusDetails(med.currentQuantity, med.dosesPerDay, med.refillThreshold);
              const daysRemaining = refillInfo.estimatedDaysLeft ?? 0;
              const isDepleted = med.currentQuantity <= 0;

              return (
                <div
                  key={mId}
                  className="bg-white hover:-translate-y-1 transition-all duration-300 rounded-[2rem] border border-slate-100 flex flex-col relative overflow-hidden group text-left shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-md"
                >
                  {/* Left color bar based on stock priority status */}
                  <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${status.label === 'Healthy Stock' ? 'bg-emerald-500' :
                    status.label === 'Low Stock' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />

                  <div className="p-4 sm:p-5 flex flex-col h-full pl-6">
                    {/* Top Row: Icon + Name/Dose + Status Badge */}
                    <div className="flex justify-between items-start gap-2.5">
                      <div className="flex gap-3 items-start min-w-0 flex-1">
                        <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 flex-shrink-0">
                          {renderPillIcon(med.pillShape || 'Tablet', med.pillColor || 'Blue')}
                        </div>
                        <div className="flex flex-col pt-0.5 min-w-0 flex-1 text-left">
                          <h3 className="text-[15px] font-bold text-[#0F2F57] tracking-wide truncate" title={med.name}>{med.name}</h3>
                          {med.dosageStrength && (
                            <span className="text-[9px] font-bold bg-slate-50 border border-slate-155 text-[#4B6B8B] px-2 py-0.5 rounded-md uppercase tracking-wider mt-1 w-fit truncate">
                              {med.dosageStrength}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className={`text-[8px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border shrink-0 ${status.color}`}>
                          {status.label}
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => onRequestPharmacyRefill && onRequestPharmacyRefill(med)}
                            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                              recentRefillMedId === mId
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-600 animate-pulse scale-110 shadow-sm shadow-emerald-200'
                                : 'bg-white hover:bg-slate-50 text-[#0F2F57] border-slate-150'
                            }`}
                            title="Request Pharmacy Refill"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${recentRefillMedId === mId ? 'animate-spin' : ''}`} style={recentRefillMedId === mId ? { animationDuration: '2s' } : undefined} />
                          </button>
                          <button
                            onClick={() => handleStartEdit(med)}
                            className="p-1.5 bg-white hover:bg-slate-50 text-[#0F2F57] border border-slate-150 rounded-xl transition-all cursor-pointer"
                            title="Edit Medicine"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              const userConfirmed = await confirm(`Are you sure you want to delete ${med.name}?`);
                              if (userConfirmed) {
                                onDelete(mId);
                              }
                            }}
                            className="p-1.5 bg-white hover:bg-rose-50 text-rose-500 border border-slate-150 rounded-xl transition-all cursor-pointer"
                            title="Delete Medicine"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Remaining Stock Section */}
                    <div className="mt-5 space-y-2">
                      <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-[0.15em]">
                        <span className="text-slate-400">Remaining Stock</span>
                        <span className="text-[#0F2F57] font-bold tracking-wider">
                          {med.currentQuantity} / {med.totalQuantity} <span className="text-slate-400 font-medium">TABLETS</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${status.label === 'Healthy Stock' ? 'bg-emerald-500' :
                            status.label === 'Low Stock' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} style={{ width: `${Math.min(100, (med.currentQuantity / med.totalQuantity) * 100)}%` }} />
                      </div>

                      {/* Refill Forecast Countdown */}
                      <div className="flex items-center gap-1 mt-2 text-[10px] font-extrabold uppercase tracking-wide">
                        {(() => {
                          const dailyDoses = med.dosesPerDay || 1;
                          const remainingDays = dailyDoses > 0 ? Math.floor(med.currentQuantity / dailyDoses) : 0;
                          
                          if (med.currentQuantity <= 0) {
                            return (
                              <span className="text-rose-500 flex items-center gap-1 select-none">
                                <AlertCircle className="w-3.5 h-3.5" /> Depleted! Immediate Refill Needed
                              </span>
                            );
                          }

                          const targetDate = new Date();
                          targetDate.setDate(targetDate.getDate() + remainingDays);
                          const forecastStr = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          
                          const colorClass = remainingDays <= 5 ? 'text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg' : 'text-[#2563EB] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg';
                          
                          return (
                            <span className={`${colorClass} flex items-center gap-1 select-none`}>
                              <Clock className="w-3.5 h-3.5" /> Depletes: {forecastStr} ({remainingDays === 1 ? '1 day' : `${remainingDays} days`} left)
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Schedule & Pharmacy Contact / Last Taken */}
                    <div className="mt-6 space-y-4">
                      <div className="space-y-1 text-left">
                        <h4 className="text-[9px] text-slate-400 uppercase font-bold tracking-[0.15em]">Dosage Schedule</h4>
                        <p className="text-[13px] text-slate-700 tracking-wide">{renderScheduleDisplay(med.timeOfDay, med.reminderTime)}</p>
                      </div>

                      {med.timeOfDay && med.timeOfDay.toLowerCase().includes('as needed') ? (
                        <div className="space-y-1 text-left">
                          <h4 className="text-[9px] text-slate-400 uppercase font-bold tracking-[0.15em]">Last Taken</h4>
                          <p className="text-[13px] text-slate-700 tracking-wide">
                            {(() => {
                              const lastLog = logs
                                .filter(l => (l.medicineId === mId || l.medicineId === med.id) && l.status === 'taken')
                                .sort((a, b) => b.timestamp - a.timestamp)[0];

                              if (!lastLog) return 'Never';
                              const logDate = new Date(lastLog.timestamp);
                              const now = new Date();
                              const isToday = logDate.toDateString() === now.toDateString();
                              const yesterday = new Date(now);
                              yesterday.setDate(now.getDate() - 1);
                              const isYesterday = logDate.toDateString() === yesterday.toDateString();
                              const timeStr = logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                              if (isToday) return `Today, ${timeStr}`;
                              if (isYesterday) return `Yesterday, ${timeStr}`;
                              return `${logDate.toLocaleDateString()}, ${timeStr}`;
                            })()}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1 text-left">
                          <h4 className="text-[9px] text-slate-400 uppercase font-bold tracking-[0.15em]">Pharmacy Contact</h4>
                          <a
                            href={`tel:${med.pharmacyPhone || '+18005550123'}`}
                            className="text-[13px] text-[#0F2F57] hover:underline flex items-center gap-1.5 transition-colors tracking-wide"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#0F2F57]" /> {med.pharmacyPhone || '+1 (800) 555-0123'}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Critical Action Block (If depleted) */}
                    {isDepleted && (
                      <div className="mt-5 space-y-3">
                        <div className="text-center">
                          <h4 className="text-[13px] font-bold text-[#0F2F57] mb-1">Critical Action Required</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed px-2">
                            Medication cycle broken. Automated refill was triggered via Apex Pharmacy but requires patient authorization.
                          </p>
                        </div>
                        <button
                          onClick={() => onRefill(mId)}
                          className="w-full py-2.5 bg-[#0F2F57] hover:bg-[#1a3f6d] text-white text-[10px] font-black uppercase tracking-widest rounded-full transition-colors cursor-pointer"
                        >
                          Authorize Refill
                        </button>
                      </div>
                    )}

                    {!isDepleted && (
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-100">
                          <span className="text-[8px] text-slate-400 uppercase font-bold tracking-[0.15em] mb-1">Est. Days</span>
                          <span className="text-sm font-semibold text-slate-700">{daysRemaining}d</span>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-100">
                          <span className="text-[8px] text-slate-400 uppercase font-bold tracking-[0.15em] mb-1">Refills</span>
                          <span className="text-sm font-semibold text-slate-700">{med.refillsRemaining}</span>
                        </div>
                      </div>
                    )}

                    {/* Spacer to push priority row to bottom if needed */}
                    <div className="flex-1 min-h-[1.25rem]"></div>

                    {/* Refill Priority Row */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-[0.15em]">Refill Priority</span>
                      <span className={`px-3.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getPriorityBadgeClass(refillInfo.priority)}`}>
                        {refillInfo.priority || 'LOW'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-[2rem] p-12 flex flex-col items-center justify-center text-center shadow-[0px_10px_30px_rgba(37,99,235,0.08)] mt-2 min-h-[500px] relative">
            <div className="w-64 h-64 mx-auto mb-6 flex items-center justify-center relative">
              {/* High-fidelity Vector Medical Illustration */}
              <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Ambient Glow Circles */}
                <circle cx="120" cy="120" r="80" fill="url(#ambient_glow)" opacity="0.15" />
                <circle cx="120" cy="120" r="95" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="120" cy="120" r="110" stroke="#F1F5F9" strokeWidth="1" />
                
                {/* Floating elements */}
                <path d="M100 45h6v-6h-6v6zm3 3v-9" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
                <path d="M170 200h6v-6h-6v6zm3 3v-9" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
                <path d="M30 160h6v-6h-6v6zm3 3v-9" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
                <circle cx="176" cy="65" r="4" stroke="#38BDF8" strokeWidth="2" fill="none" />
                <circle cx="104" cy="76" r="3" stroke="#38BDF8" strokeWidth="2" fill="none" />
                <circle cx="60" cy="208" r="3.5" stroke="#38BDF8" strokeWidth="1.5" fill="none" />
                
                {/* Pill Capsule (Left, Green Pastel) */}
                <g transform="rotate(-30 80 140)">
                  <rect x="55" y="110" width="30" height="60" rx="15" fill="#A7F3D0" />
                  <path d="M55 140h30" stroke="#FFFFFF" strokeWidth="2" />
                  <rect x="55" y="110" width="30" height="60" rx="15" stroke="#34D399" strokeWidth="2" fill="none" opacity="0.3" />
                </g>

                {/* Round Tablet (Right, Light Blue/White) */}
                <circle cx="152" cy="152" r="22" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2.5" />
                <line x1="136.5" y1="136.5" x2="167.5" y2="167.5" stroke="#BFDBFE" strokeWidth="2.5" strokeLinecap="round" />

                {/* Medicine Box (Center, 3D Isometric View) */}
                <g transform="translate(10, 10)">
                  {/* Front Face */}
                  <path d="M100 95 L135 110 L135 155 L100 140 Z" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2" />
                  {/* Right Face */}
                  <path d="M135 110 L170 95 L170 140 L135 155 Z" fill="#E0F2FE" stroke="#3B82F6" strokeWidth="2" />
                  {/* Top Face */}
                  <path d="M100 95 L135 80 L170 95 L135 110 Z" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2" />
                  {/* Blue Cross on Front Face */}
                  <path d="M112 113 h12 M118 107 v12" stroke="#2563EB" strokeWidth="4.5" strokeLinecap="round" />
                </g>
                
                <defs>
                  <radialGradient id="ambient_glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="1" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#061D4C] mb-2">No Tracking Profiles Found</h3>
            <p className="text-sm text-[#64748B] mb-6 max-w-sm">Create your first medication tracking profile to start managing your health journey.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-8 py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold rounded-2xl transition-all cursor-pointer shadow-lg flex items-center gap-2 shadow-[0_8px_24px_rgba(37,99,235,0.2)]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Add Medication
            </button>

            {/* Floating Action Plus Button positioned inside bottom-right corner */}
            <button
              onClick={() => setShowAddForm(true)}
              className="absolute bottom-6 right-6 w-14 h-14 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer font-bold"
              title="Add New Medication"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
