import React, { useState } from 'react';
import { FileText, Download, Printer, Share2, Loader, CheckCircle, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { calculateAdherenceMetrics } from '../services/insightsEngine';

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
  return timeStr;
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

// ─── Color palette for the PDF (RGB values) ───
const C = {
  bg: [2, 6, 23],
  bgCard: [15, 23, 42],
  bgLight: [30, 41, 59],
  border: [51, 65, 85],
  textDim: [100, 116, 139],
  textMuted: [148, 163, 184],
  textBody: [203, 213, 225],
  textLight: [226, 232, 240],
  white: [255, 255, 255],
  teal: [45, 212, 191],
  tealDark: [13, 148, 136],
  blue: [59, 130, 246],
  rose: [244, 63, 94],
  amber: [245, 158, 11],
  green: [34, 197, 94],
};

export default function HealthReportExport({
  medicines,
  refills,
  metrics: initialMetrics,
  logs = [],
  variant = 'default',
  reportPeriod: propReportPeriod,
  setReportPeriod: propSetReportPeriod,
  customStartDate: propCustomStartDate,
  setCustomStartDate: propSetCustomStartDate,
  customEndDate: propCustomEndDate,
  setCustomEndDate: propSetCustomEndDate
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [localReportPeriod, localSetReportPeriod] = useState('Weekly');
  const [localCustomStartDate, localSetCustomStartDate] = useState('');
  const [localCustomEndDate, localSetCustomEndDate] = useState('');

  const reportPeriod = propReportPeriod !== undefined ? propReportPeriod : localReportPeriod;
  const setReportPeriod = propSetReportPeriod !== undefined ? propSetReportPeriod : localSetReportPeriod;
  const customStartDate = propCustomStartDate !== undefined ? propCustomStartDate : localCustomStartDate;
  const setCustomStartDate = propSetCustomStartDate !== undefined ? propSetCustomStartDate : localSetCustomStartDate;
  const customEndDate = propCustomEndDate !== undefined ? propCustomEndDate : localCustomEndDate;
  const setCustomEndDate = propSetCustomEndDate !== undefined ? propSetCustomEndDate : localSetCustomEndDate;

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const getFilteredMetricsAndData = () => {
    if (!logs || logs.length === 0) return { activeMetrics: initialMetrics, activeLogs: [] };
    let filteredLogs = [...logs];
    if (reportPeriod === 'Weekly') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      filteredLogs = logs.filter(log => new Date(log.date) >= d);
    } else if (reportPeriod === 'Monthly') {
      const d = new Date(); d.setDate(d.getDate() - 30);
      filteredLogs = logs.filter(log => new Date(log.date) >= d);
    } else if (reportPeriod === 'Yearly') {
      const d = new Date(); d.setDate(d.getDate() - 365);
      filteredLogs = logs.filter(log => new Date(log.date) >= d);
    } else if (reportPeriod === 'Custom') {
      if (customStartDate) filteredLogs = filteredLogs.filter(log => log.date >= customStartDate);
      if (customEndDate) filteredLogs = filteredLogs.filter(log => log.date <= customEndDate);
    }
    const activeMetrics = calculateAdherenceMetrics(filteredLogs, medicines);
    return { activeMetrics, activeLogs: filteredLogs };
  };

  const { activeMetrics, activeLogs } = getFilteredMetricsAndData();

  // ─── jsPDF native drawing — single continuous page ───
  const buildPDF = () => {
    const W = 595; // A4 width in pt
    const M = 40;  // margin
    const CW = W - 2 * M;
    const todayStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const totalDoses = activeMetrics.takenCount + activeMetrics.skippedCount + activeMetrics.missedCount;

    // ── First pass: estimate total height ──
    let estY = 0;
    estY += 260; // cover/header
    estY += 160; // adherence summary cards
    estY += 50 + medicines.length * 32; // medications table
    estY += 120; // weekly stats
    estY += 90;  // time-of-day
    estY += 50 + Object.keys(activeMetrics.medicineStats).length * 44; // per-med compliance
    estY += 50 + (refills?.length || 0) * 30; // refills table
    estY += 50 + medicines.length * 36; // inventory overview
    estY += 50 + (activeMetrics.insights?.length || 0) * 60; // insights
    estY += 100; // KPIs
    const noteLogs = (activeLogs || []).filter(l => l.note && l.note.trim() !== '').slice(0, 15);
    estY += 50 + noteLogs.length * 26; // clinical notes
    const recentLogs = (activeLogs || []).slice(0, 20);
    estY += 50 + recentLogs.length * 20; // activity log
    estY += 80; // footer
    const pageH = Math.max(estY + 80, 842);

    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: [W, pageH] });
    let y = M;

    // ── Utilities ──
    const setColor = (c) => pdf.setTextColor(c[0], c[1], c[2]);
    const setDraw = (c) => pdf.setDrawColor(c[0], c[1], c[2]);
    const setFill = (c) => pdf.setFillColor(c[0], c[1], c[2]);

    const drawRoundedRect = (x, ry, w, h, r, fillColor, borderColor) => {
      setFill(fillColor);
      if (borderColor) { setDraw(borderColor); pdf.roundedRect(x, ry, w, h, r, r, 'FD'); }
      else { pdf.roundedRect(x, ry, w, h, r, r, 'F'); }
    };

    const truncate = (text, maxWidth, fontSize) => {
      pdf.setFontSize(fontSize);
      if (!text) return '';
      if (pdf.getTextWidth(text) <= maxWidth) return text;
      while (text.length > 0 && pdf.getTextWidth(text + '...') > maxWidth) text = text.slice(0, -1);
      return text + '...';
    };

    const sectionDivider = (title) => {
      y += 12;
      setColor(C.teal);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title.toUpperCase(), M, y);
      y += 5;
      setDraw(C.teal);
      pdf.setLineWidth(1.5);
      pdf.line(M, y, M + 80, y);
      pdf.setLineWidth(0.5);
      setDraw(C.bgLight);
      pdf.line(M + 82, y, W - M, y);
      y += 18;
    };

    // ── Fill background ──
    setFill(C.bg);
    pdf.rect(0, 0, W, pageH, 'F');

    // ═══════════════════════════════════════
    //  HEADER / COVER SECTION
    // ═══════════════════════════════════════
    setFill(C.teal);
    pdf.rect(0, 0, W, 6, 'F'); // accent bar

    y = 50;
    setColor(C.teal);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('HEALTHSTOCK', M, y);
    setColor(C.tealDark);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('HEALTH INTELLIGENCE', M + pdf.getTextWidth('HEALTHSTOCK  ') + 10, y - 6, { charSpace: 1.5 });

    y += 8;
    setFill(C.teal);
    pdf.rect(M, y, 50, 2.5, 'F');
    setFill(C.blue);
    pdf.rect(M + 52, y, 25, 2.5, 'F');

    y += 25;
    setColor(C.white);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Patient Medication Adherence & Inventory Health Report', M, y);

    y += 16;
    setColor(C.textMuted);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${reportPeriod} Report  •  Generated ${todayStr}  •  Confidential — Patient Copy`, M, y);

    y += 25;
    setDraw(C.bgLight);
    pdf.line(M, y, W - M, y);
    y += 20;

    // ═══════════════════════════════════════
    //  ADHERENCE SUMMARY
    // ═══════════════════════════════════════
    sectionDivider('Adherence Summary');

    const scoreBoxW = (CW - 15) / 2;

    // Score card
    drawRoundedRect(M, y, scoreBoxW, 90, 6, C.bgCard, C.bgLight);
    setColor(C.textDim);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ADHERENCE SCORE', M + 15, y + 18);
    setColor(C.teal);
    pdf.setFontSize(36);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${activeMetrics.score}%`, M + 15, y + 52);
    setColor(C.textMuted);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Level: ${activeMetrics.level}`, M + 15, y + 68);
    // Score bar
    setFill(C.bgLight);
    pdf.roundedRect(M + 15, y + 75, scoreBoxW - 30, 5, 2, 2, 'F');
    const filledW = (activeMetrics.score / 100) * (scoreBoxW - 30);
    setFill(activeMetrics.score >= 75 ? C.teal : activeMetrics.score >= 50 ? C.amber : C.rose);
    pdf.roundedRect(M + 15, y + 75, Math.max(filledW, 4), 5, 2, 2, 'F');

    // Intake breakdown card
    const rightX = M + scoreBoxW + 15;
    drawRoundedRect(rightX, y, scoreBoxW, 90, 6, C.bgCard, C.bgLight);
    setColor(C.textDim);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INTAKE LOG BREAKDOWN', rightX + 15, y + 18);

    const statItems = [
      { label: 'Taken', value: activeMetrics.takenCount, color: C.teal },
      { label: 'Skipped', value: activeMetrics.skippedCount, color: C.amber },
      { label: 'Missed', value: activeMetrics.missedCount, color: C.rose },
    ];
    const statBoxW = (scoreBoxW - 50) / 3;
    statItems.forEach((item, i) => {
      const sx = rightX + 15 + i * (statBoxW + 8);
      drawRoundedRect(sx, y + 28, statBoxW, 36, 4, C.bg, null);
      setColor(item.color);
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text(item.label.toUpperCase(), sx + statBoxW / 2, y + 40, { align: 'center' });
      setColor(C.white);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(String(item.value), sx + statBoxW / 2, y + 56, { align: 'center' });
    });
    setColor(C.textDim);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Scheduled Doses: ${totalDoses}`, rightX + 15, y + 82);

    y += 105;

    // ═══════════════════════════════════════
    //  MEDICATIONS TABLE
    // ═══════════════════════════════════════
    sectionDivider('Active Medications Catalog');

    if (medicines.length > 0) {
      const colWidths = [130, 100, 140, 100, 45];
      const headers = ['Medicine', 'Purpose', 'Schedule & Alarm', 'Food / Instructions', 'Rate'];

      drawRoundedRect(M, y, CW, 20, 3, C.bgCard, null);
      setColor(C.textDim);
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'bold');
      let hx = M + 8;
      headers.forEach((h, i) => { pdf.text(h.toUpperCase(), hx, y + 13); hx += colWidths[i]; });
      y += 24;

      medicines.forEach((m) => {
        setDraw(C.bgLight);
        pdf.line(M, y, W - M, y);
        y += 3;
        let rx = M + 8;

        setColor(C.textLight);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text(truncate(m.name, colWidths[0] - 12, 8), rx, y + 10);
        if (m.dosageStrength) {
          setColor(C.textDim); pdf.setFontSize(6); pdf.setFont('helvetica', 'normal');
          pdf.text(m.dosageStrength, rx, y + 19);
        }
        rx += colWidths[0];

        setColor(C.textBody); pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
        pdf.text(truncate(m.purpose || 'General Health', colWidths[1] - 10, 7), rx, y + 10);
        rx += colWidths[1];

        pdf.text(truncate(renderScheduleDisplay(m.timeOfDay, m.reminderTime), colWidths[2] - 10, 7), rx, y + 10);
        rx += colWidths[2];

        pdf.text(truncate(m.foodAssociation || 'None', colWidths[3] - 10, 7), rx, y + 10);
        if (m.specialInstructions) {
          setColor(C.teal); pdf.setFontSize(5.5);
          pdf.text(truncate(m.specialInstructions, colWidths[3] - 10, 5.5), rx, y + 19);
        }
        rx += colWidths[3];

        const rate = activeMetrics.medicineStats[m._id || m.id]?.rate ?? (m.successRate || 0);
        setColor(rate >= 75 ? C.teal : rate >= 50 ? C.amber : C.rose);
        pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
        pdf.text(`${rate}%`, rx, y + 10);
        y += 28;
      });
    } else {
      setColor(C.textDim); pdf.setFontSize(8); pdf.text('No medications currently tracked.', M, y); y += 15;
    }

    // ═══════════════════════════════════════
    //  WEEKLY STATS
    // ═══════════════════════════════════════
    sectionDivider('Weekly Adherence Performance');

    const days = Object.keys(activeMetrics.weeklyStats);
    const dayBoxW = (CW - (days.length - 1) * 5) / days.length;
    days.forEach((day, i) => {
      const dx = M + i * (dayBoxW + 5);
      const val = activeMetrics.weeklyStats[day];
      drawRoundedRect(dx, y, dayBoxW, 48, 4, C.bgCard, C.bgLight);
      setColor(C.textDim); pdf.setFontSize(6); pdf.setFont('helvetica', 'bold');
      pdf.text(day.substring(0, 3).toUpperCase(), dx + dayBoxW / 2, y + 14, { align: 'center' });
      setColor(val >= 75 ? C.teal : val >= 50 ? C.amber : C.rose);
      pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
      pdf.text(`${val}%`, dx + dayBoxW / 2, y + 36, { align: 'center' });
    });
    y += 60;

    // ═══════════════════════════════════════
    //  TIME-OF-DAY ADHERENCE
    // ═══════════════════════════════════════
    sectionDivider('Time-of-Day Adherence');

    const timeSlots = Object.keys(activeMetrics.timeOfDayStats || {});
    if (timeSlots.length > 0) {
      const slotBoxW = (CW - (timeSlots.length - 1) * 8) / timeSlots.length;
      timeSlots.forEach((slot, i) => {
        const sx = M + i * (slotBoxW + 8);
        const val = activeMetrics.timeOfDayStats[slot];
        drawRoundedRect(sx, y, slotBoxW, 42, 4, C.bgCard, C.bgLight);
        setColor(C.textDim); pdf.setFontSize(6.5); pdf.setFont('helvetica', 'bold');
        pdf.text(slot.toUpperCase(), sx + slotBoxW / 2, y + 14, { align: 'center' });
        setColor(val >= 75 ? C.teal : val >= 50 ? C.amber : C.rose);
        pdf.setFontSize(13); pdf.setFont('helvetica', 'bold');
        pdf.text(`${val}%`, sx + slotBoxW / 2, y + 33, { align: 'center' });
      });
      y += 55;
    }

    // ═══════════════════════════════════════
    //  PER-MEDICINE COMPLIANCE BARS
    // ═══════════════════════════════════════
    sectionDivider('Per-Medicine Compliance');

    const medIds = Object.keys(activeMetrics.medicineStats);
    if (medIds.length > 0) {
      medIds.forEach(id => {
        const item = activeMetrics.medicineStats[id];
        setColor(C.textBody); pdf.setFontSize(8); pdf.setFont('helvetica', 'bold');
        pdf.text(item.name, M, y + 8);
        setColor(item.rate >= 75 ? C.teal : item.rate >= 50 ? C.amber : C.rose);
        pdf.text(`${item.rate}%`, W - M, y + 8, { align: 'right' });

        setFill(C.bgLight);
        pdf.roundedRect(M, y + 13, CW, 5, 2, 2, 'F');
        setFill(item.rate >= 75 ? C.teal : item.rate >= 50 ? C.amber : C.rose);
        pdf.roundedRect(M, y + 13, Math.max((item.rate / 100) * CW, 5), 5, 2, 2, 'F');

        setColor(C.textDim); pdf.setFontSize(6); pdf.setFont('helvetica', 'normal');
        pdf.text(`Taken: ${item.taken}  |  Total: ${item.total}`, M, y + 26);
        y += 35;
      });
    }

    // ═══════════════════════════════════════
    //  STOCK & REFILLS
    // ═══════════════════════════════════════
    sectionDivider('Stock Depletion & Refill Projections');

    if (refills && refills.length > 0) {
      const rCols = [160, 110, 120, 125];
      const rHeaders = ['Medication', 'Current Stock', 'Est. Days Left', 'Priority'];
      drawRoundedRect(M, y, CW, 20, 3, C.bgCard, null);
      setColor(C.textDim); pdf.setFontSize(6.5); pdf.setFont('helvetica', 'bold');
      let rhx = M + 10;
      rHeaders.forEach((h, i) => { pdf.text(h.toUpperCase(), rhx, y + 13); rhx += rCols[i]; });
      y += 24;

      refills.forEach(refill => {
        setDraw(C.bgLight); pdf.line(M, y, W - M, y); y += 3;
        let rx2 = M + 10;

        setColor(C.textLight); pdf.setFontSize(8); pdf.setFont('helvetica', 'bold');
        pdf.text(truncate(refill.medicineName, rCols[0] - 15, 8), rx2, y + 10);
        rx2 += rCols[0];

        setColor(C.textBody); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
        pdf.text(`${refill.remainingQuantity} ${refill.unit || 'units'}`, rx2, y + 10);
        rx2 += rCols[1];

        const dl = refill.estimatedDaysLeft;
        setColor(dl <= 3 ? C.rose : dl <= 7 ? C.amber : C.textBody);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${dl} Days`, rx2, y + 10);
        rx2 += rCols[2];

        const pColor = refill.priority === 'Critical' ? C.rose : refill.priority === 'High' ? C.amber : refill.priority === 'Medium' ? C.amber : C.teal;
        const badgeText = refill.priority || 'Normal';
        pdf.setFontSize(6.5);
        const badgeW = pdf.getTextWidth(badgeText) + 12;
        setFill(pColor);
        pdf.roundedRect(rx2, y + 2, badgeW, 13, 3, 3, 'F');
        setColor(C.white); pdf.setFont('helvetica', 'bold');
        pdf.text(badgeText, rx2 + 6, y + 11);
        y += 24;
      });
    } else {
      setColor(C.textDim); pdf.setFontSize(8);
      pdf.text('All medications adequately stocked. No refills required.', M, y); y += 15;
    }

    // ═══════════════════════════════════════
    //  INVENTORY OVERVIEW (compact grid)
    // ═══════════════════════════════════════
    sectionDivider('Inventory Overview');

    if (medicines.length > 0) {
      const invBoxW = (CW - 10) / 2;
      let invRow = 0;
      const invStartY = y;
      medicines.forEach((med, i) => {
        const col = i % 2;
        const ix = M + col * (invBoxW + 10);
        const iy = invStartY + invRow * 50;
        drawRoundedRect(ix, iy, invBoxW, 42, 5, C.bgCard, C.bgLight);

        setColor(C.white); pdf.setFontSize(8); pdf.setFont('helvetica', 'bold');
        pdf.text(truncate(med.name, invBoxW - 90, 8), ix + 10, iy + 16);

        const sp = med.totalQuantity > 0 ? Math.round((med.currentQuantity / med.totalQuantity) * 100) : 0;
        setColor(C.textMuted); pdf.setFontSize(6.5); pdf.setFont('helvetica', 'normal');
        pdf.text(`${med.currentQuantity} / ${med.totalQuantity} ${med.unit || 'units'}`, ix + 10, iy + 28);

        setFill(C.bgLight); pdf.roundedRect(ix + 10, iy + 32, invBoxW - 75, 4, 2, 2, 'F');
        setFill(sp > 50 ? C.teal : sp > 20 ? C.amber : C.rose);
        pdf.roundedRect(ix + 10, iy + 32, Math.max((sp / 100) * (invBoxW - 75), 3), 4, 2, 2, 'F');

        setColor(sp > 50 ? C.teal : sp > 20 ? C.amber : C.rose);
        pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
        pdf.text(`${sp}%`, ix + invBoxW - 25, iy + 24, { align: 'center' });

        if (col === 1) invRow++;
      });
      if (medicines.length % 2 !== 0) invRow++;
      y = invStartY + invRow * 50 + 5;
    }

    // ═══════════════════════════════════════
    //  BEHAVIORAL INSIGHTS
    // ═══════════════════════════════════════
    sectionDivider('Behavioral Analysis & Insights');

    if (activeMetrics.insights && activeMetrics.insights.length > 0) {
      activeMetrics.insights.forEach(insight => {
        const dotColor = insight.type === 'success' ? C.teal : insight.type === 'warning' ? C.amber : C.rose;
        const label = insight.type === 'success' ? 'FAVORABLE' : insight.type === 'warning' ? 'ATTENTION' : 'CRITICAL';

        const textLines = pdf.splitTextToSize(insight.text, CW - 40);
        const cardH = textLines.length * 11 + 26;
        drawRoundedRect(M, y, CW, cardH, 5, C.bgCard, C.bgLight);

        setFill(dotColor); pdf.circle(M + 14, y + 14, 3, 'F');
        setColor(C.textDim); pdf.setFontSize(6); pdf.setFont('helvetica', 'bold');
        pdf.text(label, M + 24, y + 16);

        setColor(C.textBody); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
        pdf.text(textLines, M + 14, y + 30);
        y += cardH + 8;
      });
    } else {
      setColor(C.textDim); pdf.setFontSize(8);
      pdf.text('No specific insights available for this period.', M, y); y += 15;
    }

    // ═══════════════════════════════════════
    //  KEY PERFORMANCE INDICATORS
    // ═══════════════════════════════════════
    sectionDivider('Key Performance Indicators');

    const kpiItems = [
      { label: 'Score', value: `${activeMetrics.score}%`, color: C.teal },
      { label: 'Total Doses', value: String(totalDoses), color: C.blue },
      { label: 'Medicines', value: String(medicines.length), color: C.teal },
      { label: 'Refill Alerts', value: String(refills?.filter(r => r.priority === 'Critical' || r.priority === 'High').length || 0), color: C.rose },
    ];
    const kpiW = (CW - 24) / 4;
    kpiItems.forEach((kpi, i) => {
      const kx = M + i * (kpiW + 8);
      drawRoundedRect(kx, y, kpiW, 48, 5, C.bgCard, C.bgLight);
      setColor(C.textDim); pdf.setFontSize(6); pdf.setFont('helvetica', 'bold');
      pdf.text(kpi.label.toUpperCase(), kx + kpiW / 2, y + 14, { align: 'center' });
      setColor(kpi.color); pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
      pdf.text(kpi.value, kx + kpiW / 2, y + 36, { align: 'center' });
    });
    y += 65;

    // ═══════════════════════════════════════
    //  CLINICAL NOTES
    // ═══════════════════════════════════════
    sectionDivider('Patient-Logged Clinical Notes');

    if (noteLogs.length > 0) {
      const nCols = [75, 115, 75, 250];
      const nHeaders = ['Date', 'Medication', 'Status', 'Note / Symptom'];
      drawRoundedRect(M, y, CW, 18, 3, C.bgCard, null);
      setColor(C.textDim); pdf.setFontSize(6.5); pdf.setFont('helvetica', 'bold');
      let nhx = M + 8;
      nHeaders.forEach((h, i) => { pdf.text(h.toUpperCase(), nhx, y + 12); nhx += nCols[i]; });
      y += 22;

      noteLogs.forEach(log => {
        setDraw(C.bgLight); pdf.line(M, y, W - M, y); y += 3;
        let nx = M + 8;
        setColor(C.textBody); pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
        pdf.text(new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), nx, y + 10);
        nx += nCols[0];
        setColor(C.textLight); pdf.setFont('helvetica', 'bold');
        pdf.text(truncate(log.medicineName || '', nCols[1] - 10, 7), nx, y + 10);
        nx += nCols[1];

        const sColor = log.status === 'taken' ? C.teal : log.status === 'skipped' ? C.amber : C.rose;
        pdf.setFontSize(6); const sText = (log.status || '').toUpperCase();
        const sBW = pdf.getTextWidth(sText) + 10;
        setFill(sColor); pdf.roundedRect(nx, y + 2, sBW, 12, 3, 3, 'F');
        setColor(C.white); pdf.setFont('helvetica', 'bold'); pdf.text(sText, nx + 5, y + 10);
        nx += nCols[2];

        setColor(C.textBody); pdf.setFontSize(7); pdf.setFont('helvetica', 'italic');
        pdf.text(truncate(`"${log.note}"`, nCols[3] - 10, 7), nx, y + 10);
        y += 20;
      });
    } else {
      drawRoundedRect(M, y, CW, 30, 5, C.bgCard, C.bgLight);
      setColor(C.textDim); pdf.setFontSize(8); pdf.setFont('helvetica', 'italic');
      pdf.text('No notes or symptoms logged during this period.', M + CW / 2, y + 18, { align: 'center' });
      y += 38;
    }

    // ═══════════════════════════════════════
    //  RECENT ACTIVITY LOG
    // ═══════════════════════════════════════
    sectionDivider('Recent Dose Activity Log');

    if (recentLogs.length > 0) {
      const aCols = [70, 130, 95, 90, 130];
      const aHeaders = ['Date', 'Medication', 'Time Slot', 'Status', 'Note'];
      drawRoundedRect(M, y, CW, 18, 3, C.bgCard, null);
      setColor(C.textDim); pdf.setFontSize(6.5); pdf.setFont('helvetica', 'bold');
      let ahx = M + 8;
      aHeaders.forEach((h, i) => { pdf.text(h.toUpperCase(), ahx, y + 12); ahx += aCols[i]; });
      y += 22;

      recentLogs.forEach(log => {
        setDraw(C.bgLight); pdf.line(M, y, W - M, y); y += 2;
        let ax = M + 8;
        setColor(C.textBody); pdf.setFontSize(6.5); pdf.setFont('helvetica', 'normal');
        pdf.text(new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), ax, y + 9);
        ax += aCols[0];
        setColor(C.textLight); pdf.setFont('helvetica', 'bold');
        pdf.text(truncate(log.medicineName || '', aCols[1] - 10, 6.5), ax, y + 9);
        ax += aCols[1];
        setColor(C.textBody); pdf.setFont('helvetica', 'normal');
        pdf.text(log.timeOfDay || '-', ax, y + 9);
        ax += aCols[2];
        const lc = log.status === 'taken' ? C.teal : log.status === 'skipped' ? C.amber : C.rose;
        setColor(lc); pdf.setFont('helvetica', 'bold');
        pdf.text((log.status || '-').toUpperCase(), ax, y + 9);
        ax += aCols[3];
        setColor(C.textDim); pdf.setFontSize(6); pdf.setFont('helvetica', 'normal');
        pdf.text(truncate(log.note || '-', aCols[4] - 10, 6), ax, y + 9);
        y += 16;
      });
    } else {
      setColor(C.textDim); pdf.setFontSize(8);
      pdf.text('No dose logs recorded for this period.', M, y); y += 15;
    }

    // ═══════════════════════════════════════
    //  FOOTER
    // ═══════════════════════════════════════
    y += 20;
    setDraw(C.bgLight);
    pdf.line(M, y, W - M, y);
    y += 12;
    setColor(C.textDim);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`HealthStock Health Intelligence Report  •  ${reportPeriod} Summary  •  Generated: ${todayStr}`, W / 2, y, { align: 'center' });
    y += 10;
    pdf.setFontSize(6);
    setColor(C.textDim);
    pdf.text('This report is auto-generated for personal health tracking. It is not a substitute for professional medical advice.', W / 2, y, { align: 'center' });

    return pdf;
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    triggerToast("Generating your professional healthcare PDF report...");

    try {
      await new Promise(r => setTimeout(r, 100)); // let UI update
      const pdf = buildPDF();
      pdf.save(`HealthStock_Health_Report_${reportPeriod}_${new Date().toISOString().split('T')[0]}.pdf`);
      triggerToast("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      triggerToast("Error generating PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    try {
      const pdf = buildPDF();
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
      triggerToast("Sent to printer!");
    } catch (err) {
      console.error("Print error:", err);
      triggerToast("Error printing. Please try again.");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'HealthStock Health Adherence Report',
      text: `My adherence score is ${activeMetrics.score}%! Keeping track of my medication inventory and stats.`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        triggerToast("Report shared successfully!");
      } catch (err) {
        console.log("Share failed", err);
      }
    } else {
      const shareText = `HealthStock Adherence Report Summary:
- Adherence Score: ${activeMetrics.score}% (${activeMetrics.level})
- Taken: ${activeMetrics.takenCount} doses, Skipped: ${activeMetrics.skippedCount} doses, Missed: ${activeMetrics.missedCount} doses.
Generated via HealthStock Patient Portal.`;
      navigator.clipboard.writeText(shareText);
      triggerToast("Adherence report summary copied to clipboard for sharing!");
    }
  };

  const buttonClass = variant === 'activity_log'
    ? 'px-5 py-2.5 font-bold text-xs rounded-full border-none transition-all cursor-pointer flex items-center gap-1.5'
    : variant === 'slim'
      ? 'px-3 py-1.5 text-[11px] rounded-xl flex items-center gap-1 transition-all cursor-pointer font-bold'
      : 'px-4 py-2 text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-bold';

  const selectClass = variant === 'activity_log'
    ? 'appearance-none bg-white border border-slate-200 text-slate-600 text-[11px] font-bold px-4 py-2.5 rounded-full focus:outline-none focus:border-[#0F2F57] focus:ring-2 focus:ring-[#0F2F57]/10 cursor-pointer shadow-sm'
    : variant === 'slim'
      ? 'bg-slate-950 border border-slate-800 text-slate-300 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-[#0F2F57] cursor-pointer'
      : 'bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-[#0F2F57] cursor-pointer';

  const dateInputClass = variant === 'activity_log'
    ? 'bg-white border border-slate-200 text-slate-600 text-[11px] font-semibold px-3 py-2 rounded-full focus:outline-none focus:border-[#0F2F57] focus:ring-2 focus:ring-[#0F2F57]/10 cursor-pointer shadow-sm'
    : selectClass;

  const bgClass = variant === 'activity_log'
    ? 'bg-[#0F2F57] hover:bg-[#1a3f6d] text-white shadow-[0_4px_12px_rgba(15,47,87,0.2)]'
    : variant === 'slim'
      ? 'bg-slate-950 border border-slate-800 text-slate-200 hover:bg-slate-800'
      : 'bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800';

  const pdfBtnClass = variant === 'activity_log'
    ? 'bg-[#0F2F57] hover:bg-[#1a3f6d] disabled:bg-slate-300 text-white shadow-[0_4px_12px_rgba(15,47,87,0.2)]'
    : 'bg-[#0F2F57] hover:bg-[#1a3f6d] disabled:bg-slate-800 text-white shadow-lg shadow-[#0F2F57]/10';

  const controls = variant === 'activity_log' ? (
    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
      
      {/* Standalone Report Period Select */}
      <div className="relative bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer">
        <select
          value={reportPeriod}
          onChange={(e) => setReportPeriod(e.target.value)}
          className="appearance-none bg-transparent text-[11px] font-bold text-[#061D4C] outline-none cursor-pointer pr-4"
        >
          <option value="Weekly">Weekly Report</option>
          <option value="Monthly">Monthly Report</option>
          <option value="Yearly">Yearly Report</option>
          <option value="Custom">Custom Range</option>
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Standalone PDF Button */}
      <button
        onClick={handleDownloadPDF}
        disabled={isGenerating}
        className="bg-white border border-[#E2E8F0] hover:border-slate-300 rounded-xl px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all flex items-center gap-2 text-[11px] font-bold text-[#061D4C] cursor-pointer disabled:opacity-50"
      >
        {isGenerating ? (
          <Loader className="w-3.5 h-3.5 animate-spin text-[#EF4444]" />
        ) : (
          <svg className="w-3.5 h-3.5 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        <span>PDF</span>
      </button>

      {/* Standalone Print Button */}
      <button
        onClick={handlePrint}
        className="bg-white border border-[#E2E8F0] hover:border-slate-300 rounded-xl px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all flex items-center gap-2 text-[11px] font-bold text-[#061D4C] cursor-pointer"
      >
        <Printer className="w-3.5 h-3.5 text-[#2563EB]" />
        <span>Print</span>
      </button>

      {/* Standalone Share Button */}
      <button
        onClick={handleShare}
        className="bg-white border border-[#E2E8F0] hover:border-slate-300 rounded-xl px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all flex items-center gap-2 text-[11px] font-bold text-[#061D4C] cursor-pointer"
      >
        <Share2 className="w-3.5 h-3.5 text-[#2563EB]" />
        <span>Share</span>
      </button>
      
      {/* Custom Date Range Picker */}
      {reportPeriod === 'Custom' && (
        <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-xl px-3 py-1.5 shadow-sm mt-1">
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="bg-transparent text-[10px] text-slate-600 font-semibold outline-none cursor-pointer"
          />
          <span className="text-slate-300 text-xs font-bold">→</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="bg-transparent text-[10px] text-slate-600 font-semibold outline-none cursor-pointer"
          />
        </div>
      )}
    </div>
  ) : (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto relative z-10">
      <select
        value={reportPeriod}
        onChange={(e) => setReportPeriod(e.target.value)}
        className={`${selectClass} w-full sm:w-auto`}
        style={{ appearance: 'auto', WebkitAppearance: 'menulist' }}
      >
        <option value="Weekly">Weekly Report</option>
        <option value="Monthly">Monthly Report</option>
        <option value="Yearly">Yearly Report</option>
        <option value="Custom">Custom Range</option>
      </select>

      {reportPeriod === 'Custom' && (
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className={`${dateInputClass} flex-1 sm:flex-initial min-w-0`} />
          <span className="text-slate-400 text-xs font-semibold px-0.5">to</span>
          <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className={`${dateInputClass} flex-1 sm:flex-initial min-w-0`} />
        </div>
      )}

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button onClick={handleDownloadPDF} disabled={isGenerating} className={`${buttonClass} flex-1 sm:flex-initial ${pdfBtnClass} justify-center`}>
          {isGenerating ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          {isGenerating ? 'Compiling...' : 'PDF'}
        </button>
        <button onClick={handlePrint} className={`${buttonClass} flex-1 sm:flex-initial ${bgClass} justify-center`}>
          <Printer className="w-3.5 h-3.5" /> Print
        </button>
        <button onClick={handleShare} className={`${buttonClass} flex-1 sm:flex-initial ${bgClass} justify-center`}>
          <Share2 className="w-3.5 h-3.5" /> Share
        </button>
      </div>
    </div>
  );



  return (
    <>
      {variant === 'slim' || variant === 'activity_log' ? (
        controls
      ) : (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" /> Professional Health Reports
            </h3>
            <p className="text-xs text-slate-400">Export clinically styled Weekly, Monthly or Custom range summaries</p>
          </div>
          {controls}
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-slate-100 px-4 py-3 rounded-2xl flex items-center gap-2.5 shadow-2xl animate-slideUp">
          <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </>
  );
}
