import { useState, useEffect, useRef, useMemo } from 'react';
import {
  getMedicines, getAdherenceLogs, addAdherenceLog, deleteAdherenceLog,
  getRefills, addMedicine, updateMedicine, deleteMedicine, getAnalytics, requestPharmacyRefill
} from '../services/dataService';
import { calculateAdherenceMetrics, getLocalDateString } from '../services/insightsEngine';
import { checkInteractions } from '../services/drugInteractions';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';
import { useHealthStore } from '../context/HealthStoreContext';

export default function useHealthIntelligenceData(activeTab, setActiveTab) {
  const confirm = useConfirm();
  const { user } = useAuth();
  const { medicines, setMedicines, logs, setLogs } = useHealthStore();
  const [refills, setRefills] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(112);
  const [showQuickLogModal, setShowQuickLogModal] = useState(false);

  // Pharmacy Refill States
  const [selectedPharmacyRefillMed, setSelectedPharmacyRefillMed] = useState(null);
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);
  const [isPharmacyRequestSent, setIsPharmacyRequestSent] = useState(false);
  const [recentRefillMedId, setRecentRefillMedId] = useState(null);
  const [refillQuantity, setRefillQuantity] = useState(30);
  const [refillDosage, setRefillDosage] = useState('');

  // Lifted report filter states
  const [reportPeriod, setReportPeriod] = useState('Weekly');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [dashboardChartView, setDashboardChartView] = useState('Week');
  const [isOutreachScheduled, setIsOutreachScheduled] = useState(false);
  const [showTableFilter, setShowTableFilter] = useState(false);
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [todaySchedulePage, setTodaySchedulePage] = useState(1);

  // Note logging states
  const [pendingLogAction, setPendingLogAction] = useState(null); // { medId, time, status }
  const [interactionAlerts, setInteractionAlerts] = useState([]);
  const [activeAlarms, setActiveAlarms] = useState([]); // Array of { medId, medName, dosageStrength, time, unit }
  const [snoozedAlarms, setSnoozedAlarms] = useState([]); // Array of { medId, time, resumeAt }
  const [alertsPageModal, setAlertsPageModal] = useState(null); // { title: '', message: '', type: 'info' }

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleOpenPharmacyModal = (med) => {
    setSelectedPharmacyRefillMed(med);
    setShowPharmacyModal(true);
    setIsPharmacyRequestSent(false);

    const currentQty = med.currentQuantity || 0;
    const totalQty = med.totalQuantity || 30;
    const remainingSpace = Math.max(0, totalQty - currentQty);

    setRefillQuantity(remainingSpace > 0 ? remainingSpace : totalQty);
    setRefillDosage(med.dosageStrength || '');
  };

  // Load database state asynchronously from Express Server API
  const loadData = async () => {
    try {
      const medsList = await getMedicines();
      const logsList = await getAdherenceLogs();
      const refillsList = getRefills(medsList);

      // Scan for drug-drug interactions
      const alerts = await checkInteractions(medsList);
      setInteractionAlerts(alerts);

      // Derive date boundaries
      let startStr = '';
      let endStr = '';
      const now = new Date();

      if (reportPeriod === 'Weekly') {
        const d = new Date();
        d.setDate(now.getDate() - 7);
        startStr = d.toISOString().split('T')[0];
      } else if (reportPeriod === 'Monthly') {
        const d = new Date();
        d.setDate(now.getDate() - 30);
        startStr = d.toISOString().split('T')[0];
      } else if (reportPeriod === 'Yearly') {
        const d = new Date();
        d.setDate(now.getDate() - 365);
        startStr = d.toISOString().split('T')[0];
      } else if (reportPeriod === 'Custom') {
        startStr = customStartDate;
        endStr = customEndDate;
      }

      // Fetch Server-Side Adherence Analytics directly!
      const serverAnalytics = await getAnalytics(startStr, endStr);

      setMedicines(medsList);
      setLogs(logsList);
      setRefills(refillsList);

      if (serverAnalytics) {
        setMetrics(serverAnalytics);
      } else {
        // Client-side fallback if server connection fails
        const fallback = calculateAdherenceMetrics(logsList, medsList);
        setMetrics(fallback);
      }
    } catch (err) {
      console.error('[HealthIntelligenceCenter] API load failed:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSendPharmacyRequest = async () => {
    if (!selectedPharmacyRefillMed) return;
    setIsPharmacyRequestSent(true);

    const currentQty = selectedPharmacyRefillMed.currentQuantity || 0;
    const totalQty = selectedPharmacyRefillMed.totalQuantity || 30;
    const remainingSpace = Math.max(0, totalQty - currentQty);
    const maxAllowed = remainingSpace > 0 ? remainingSpace : totalQty;

    const inputQty = Math.min(maxAllowed, Math.max(1, parseInt(refillQuantity, 10) || 1));
    let newCurrentQuantity = currentQty + inputQty;

    if (remainingSpace === 0) {
      newCurrentQuantity = totalQty;
    }

    // Update the medicine stock and dosage strength in the database
    try {
      const updatedMed = {
        ...selectedPharmacyRefillMed,
        currentQuantity: newCurrentQuantity,
        dosageStrength: refillDosage
      };
      await updateMedicine(updatedMed);
      await loadData();
    } catch (err) {
      console.error('Failed to update stock quantity during refill confirmation:', err);
      alert(err.message || 'Failed to update stock quantity. Refill cancelled.');
      setIsPharmacyRequestSent(false);
      return;
    }

    const success = await requestPharmacyRefill({
      medicineId: selectedPharmacyRefillMed._id || selectedPharmacyRefillMed.id,
      medicineName: selectedPharmacyRefillMed.name,
      rxNumber: selectedPharmacyRefillMed.rxNumber,
      pharmacyPhone: selectedPharmacyRefillMed.pharmacyPhone || "No pharmacy contact",
      prescribedDoctor: selectedPharmacyRefillMed.prescribedDoctor,
      patientName: user?.name || "Patient"
    });

    if (success) {
      setTimeout(() => {
        setShowPharmacyModal(false);
        setIsPharmacyRequestSent(false);
        const medId = selectedPharmacyRefillMed._id || selectedPharmacyRefillMed.id;
        setRecentRefillMedId(medId);

        // Navigation: Go to inventory page
        setActiveTab('inventory');

        // Reset the blinking state after 8 seconds
        setTimeout(() => {
          setRecentRefillMedId(null);
        }, 8000);
      }, 2000);
    } else {
      setIsPharmacyRequestSent(false);
      alert('Failed to send refill request. Please try again.');
    }
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Patient Name,Last Activity,Status\nSarah Mitchell,Today 08:30 AM,Non-compliant\nRobert Kinsley,Yesterday 09:15 PM,Compliant";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "patient_adherence_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilteredLogs = (logsList, period, start, end) => {
    if (!logsList || logsList.length === 0) return [];

    let filtered = [...logsList];
    const now = new Date();

    if (period === 'Weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      const sevenDaysAgoStr = getLocalDateString(sevenDaysAgo);
      filtered = logsList.filter(log => log.date >= sevenDaysAgoStr);
    } else if (period === 'Monthly') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const thirtyDaysAgoStr = getLocalDateString(thirtyDaysAgo);
      filtered = logsList.filter(log => log.date >= thirtyDaysAgoStr);
    } else if (period === 'Yearly') {
      const oneYearAgo = new Date();
      oneYearAgo.setDate(now.getDate() - 365);
      const oneYearAgoStr = getLocalDateString(oneYearAgo);
      filtered = logsList.filter(log => log.date >= oneYearAgoStr);
    } else if (period === 'Custom') {
      if (start) {
        filtered = filtered.filter(log => log.date >= start);
      }
      if (end) {
        filtered = filtered.filter(log => log.date <= end);
      }
    }
    return filtered;
  };

  const filteredLogs = useMemo(() => {
    return getFilteredLogs(logs, reportPeriod, customStartDate, customEndDate);
  }, [logs, reportPeriod, customStartDate, customEndDate]);

  const dashboardMetrics = useMemo(() => {
    return metrics;
  }, [metrics]);

  // Track page header height so stats bar stacks precisely below it
  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (headerRef.current) {
        const isMobile = window.innerWidth < 768;
        setHeaderHeight(headerRef.current.offsetHeight + (isMobile ? 56 : 0));
      }
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    loadData();
    // Request desktop browser notifications permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [reportPeriod, customStartDate, customEndDate]);

  // Alarm and Snooze Scheduler Effect
  useEffect(() => {
    const checkAlarms = () => {
      const todayStr = getLocalDateString();
      const loggedTodayIds = logs
        .filter(l => l.date === todayStr)
        .map(l => `${l.medicineId}-${l.timeOfDay}`);

      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const current24 = `${currentHours}:${currentMinutes}`;

      const ampmHours = now.getHours() % 12 || 12;
      const ampmMin = String(now.getMinutes()).padStart(2, '0');
      const ampmStr = now.getHours() >= 12 ? 'PM' : 'AM';
      const currentAMPM = `${ampmHours}:${ampmMin} ${ampmStr}`;
      const currentAMPMZero = `${String(ampmHours).padStart(2, '0')}:${ampmMin} ${ampmStr}`;

      const triggerAlarm = (med, time) => {
        const medId = med._id || med.id;
        setActiveAlarms(prev => {
          if (prev.some(a => a.medId === medId && a.time === time)) return prev;
          return [...prev, {
            medId,
            medName: med.name,
            dosageStrength: med.dosageStrength,
            time,
            unit: med.unit
          }];
        });

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`💊 HealthStock Intake Alarm`, {
            body: `It's time to take your ${med.name} (${med.dosageStrength || '1 dose'}) for your ${time} schedule!`,
            requireInteraction: true
          });
        }
      };

      medicines.forEach(med => {
        const slots = (med.timeOfDay || '').split(/[,;&]|\band\b/i).map(t => t.trim()).filter(Boolean);
        const alarmTimes = (med.reminderTime || '').split(/[,;]/).map(t => t.trim()).filter(Boolean);

        slots.forEach((slotTime, index) => {
          const slotAlarmTime = alarmTimes[index] || (index === 0 ? alarmTimes[0] : null);

          if (!slotAlarmTime) return;

          const isTimeMatch =
            slotAlarmTime === current24 ||
            slotAlarmTime === currentAMPM ||
            slotAlarmTime === currentAMPMZero;

          if (isTimeMatch) {
            const medId = med._id || med.id;
            const doseKey = `${medId}-${slotTime}`;
            const isLogged = loggedTodayIds.includes(doseKey);

            const isAlreadyActive = activeAlarms.some(a => a.medId === medId && a.time === slotTime);
            const isAlreadySnoozed = snoozedAlarms.some(s => s.medId === medId && s.time === slotTime && s.resumeAt > Date.now());

            if (!isLogged && !isAlreadyActive && !isAlreadySnoozed) {
              triggerAlarm(med, slotTime);
            }
          }
        });
      });

      // 2. Check snoozed alarms
      snoozedAlarms.forEach(snooze => {
        if (Date.now() >= snooze.resumeAt) {
          const med = medicines.find(m => (m._id === snooze.medId || m.id === snooze.medId));
          if (med) {
            const doseKey = `${snooze.medId}-${snooze.time}`;
            const isLogged = loggedTodayIds.includes(doseKey);
            const isAlreadyActive = activeAlarms.some(a => a.medId === snooze.medId && a.time === snooze.time);
            if (!isLogged && !isAlreadyActive) {
              triggerAlarm(med, snooze.time);
            }
          }
          // Remove from snoozed list
          setSnoozedAlarms(prev => prev.filter(s => !(s.medId === snooze.medId && s.time === snooze.time)));
        }
      });
    };

    const interval = setInterval(checkAlarms, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [medicines, logs, activeAlarms, snoozedAlarms]);

  // Refill action handler
  const handleRefill = async (medId) => {
    const med = medicines.find(m => (m._id === medId || m.id === medId));
    if (med) {
      const updated = {
        ...med,
        currentQuantity: med.totalQuantity
      };
      await updateMedicine(updated);
      await loadData();
    }
  };

  // Delete medicine handler
  const handleDelete = async (medId) => {
    await deleteMedicine(medId);
    await loadData();
  };

  // Add medicine handler
  const handleAddMedicine = async (newMed) => {
    try {
      await addMedicine(newMed);
      await loadData();
    } catch (err) {
      if (err.requiresConfirmation) {
        const messages = err.interactions.map(i => `• ${i.interactsWith}: ${i.description} (Severity: ${i.severity})`).join('\n');
        const proceed = await confirm(`⚠️ WARNING! Drug Interactions Detected:\n\n${messages}\n\nDo you want to ignore these warnings and add the medication anyway?`);
        if (proceed) {
          await addMedicine({ ...newMed, ignoreWarnings: true });
          await loadData();
        }
      } else {
        alert(err.message || 'Failed to add medicine');
      }
    }
  };

  // Edit medicine handler
  const handleEditMedicine = async (updatedMed) => {
    await updateMedicine(updatedMed);
    await loadData();
  };

  // Log dose handler
  const handleLogDose = async (medId, time, status, note = '') => {
    const today = getLocalDateString();
    const med = medicines.find(m => (m._id === medId || m.id === medId));

    const newLog = {
      medicineId: medId,
      medicineName: med?.name || 'Medicine',
      date: today,
      timeOfDay: time,
      status, // taken, missed, skipped
      note
    };

    await addAdherenceLog(newLog);
    await loadData();
  };

  const getRefillValidation = () => {
    if (!selectedPharmacyRefillMed) return { isInvalid: false, maxAllowed: 0, remainingSpace: 0, currentQty: 0, totalQty: 30 };
    const currentQty = selectedPharmacyRefillMed.currentQuantity || 0;
    const totalQty = selectedPharmacyRefillMed.totalQuantity || 30;
    const remainingSpace = Math.max(0, totalQty - currentQty);
    const maxAllowed = remainingSpace > 0 ? remainingSpace : totalQty;
    const qty = parseInt(refillQuantity, 10);
    const isInvalid = isNaN(qty) || qty > maxAllowed || qty < 1 || refillQuantity === '';
    return { isInvalid, maxAllowed, remainingSpace, currentQty, totalQty };
  };

  const refillValidation = getRefillValidation();

  return {
    confirm,
    user,
    medicines,
    setMedicines,
    logs,
    setLogs,
    refills,
    setRefills,
    metrics,
    setMetrics,
    dataLoading,
    setDataLoading,
    headerRef,
    headerHeight,
    setHeaderHeight,
    showQuickLogModal,
    setShowQuickLogModal,
    selectedPharmacyRefillMed,
    setSelectedPharmacyRefillMed,
    showPharmacyModal,
    setShowPharmacyModal,
    isPharmacyRequestSent,
    setIsPharmacyRequestSent,
    recentRefillMedId,
    setRecentRefillMedId,
    refillQuantity,
    setRefillQuantity,
    refillDosage,
    setRefillDosage,
    reportPeriod,
    setReportPeriod,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    dashboardChartView,
    setDashboardChartView,
    isOutreachScheduled,
    setIsOutreachScheduled,
    showTableFilter,
    setShowTableFilter,
    tableSearchQuery,
    setTableSearchQuery,
    openMenuId,
    setOpenMenuId,
    todaySchedulePage,
    setTodaySchedulePage,
    pendingLogAction,
    setPendingLogAction,
    interactionAlerts,
    setInteractionAlerts,
    activeAlarms,
    setActiveAlarms,
    snoozedAlarms,
    setSnoozedAlarms,
    alertsPageModal,
    setAlertsPageModal,
    filteredLogs,
    dashboardMetrics,
    loadData,
    handleOpenPharmacyModal,
    handleSendPharmacyRequest,
    handleExportCSV,
    handleRefill,
    handleDelete,
    handleAddMedicine,
    handleEditMedicine,
    handleLogDose,
    refillValidation
  };
}
