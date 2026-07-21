import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, AlertCircle, Heart, Activity, Calendar, ShieldAlert, FileText, Printer, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { API_URL } from '../config.js';

const COMMON_SYMPTOMS = ["Dizziness", "Headache", "Nausea", "Fatigue", "Chest Pain", "Shortness of Breath", "Insomnia", "Muscle Aches"];

export default function SymptomTracker({ logs = [], medicines = [] }) {
  const [symptomLogs, setSymptomLogs] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [severity, setSeverity] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('new'); // 'new', 'history', 'trends'

  const fetchSymptomLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/data/symptoms`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSymptomLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching symptom logs:', err);
    }
  };

  useEffect(() => {
    fetchSymptomLogs();
  }, []);

  const handleSymptomToggle = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleSaveLog = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      date,
      severity,
      symptoms: selectedSymptoms,
      bloodPressure: systolic && diastolic ? { systolic: parseInt(systolic, 10), diastolic: parseInt(diastolic, 10) } : undefined,
      heartRate: heartRate ? parseInt(heartRate, 10) : undefined,
      notes
    };

    try {
      const res = await fetch(`${API_URL}/data/symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        alert("Symptom log saved successfully!");
        fetchSymptomLogs();
        setSeverity(1);
        setSelectedSymptoms([]);
        setSystolic('');
        setDiastolic('');
        setHeartRate('');
        setNotes('');
        setActiveTab('history');
      }
    } catch (err) {
      alert("Error saving symptom log: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Correlation Diagnostic Engine
  const correlationAnalysis = React.useMemo(() => {
    if (symptomLogs.length === 0 || logs.length === 0) return null;
    const highSeverityLogs = symptomLogs.filter(sl => sl.severity >= 5);
    if (highSeverityLogs.length === 0) return null;

    const correlations = [];
    highSeverityLogs.forEach(sLog => {
      const missedOnDate = logs.filter(l => l.date === sLog.date && (l.status === 'missed' || l.status === 'skipped'));
      if (missedOnDate.length > 0) {
        missedOnDate.forEach(log => {
          correlations.push({
            date: sLog.date,
            symptomSeverity: sLog.severity,
            symptoms: sLog.symptoms.join(', ') || 'General discomfort',
            missedMed: log.medicineName,
            time: log.timeOfDay
          });
        });
      }
    });
    return correlations;
  }, [symptomLogs, logs]);

  // Formats historical vitals into Recharts-friendly timeline sorting oldest to newest
  const chartData = React.useMemo(() => {
    return [...symptomLogs]
      .reverse()
      .map(log => ({
        date: log.date.substring(5), // MM-DD for label readability
        Severity: log.severity,
        Systolic: log.bloodPressure?.systolic || null,
        Diastolic: log.bloodPressure?.diastolic || null,
        HeartRate: log.heartRate || null
      }));
  }, [symptomLogs]);

  // Triggers professional printer layout view
  const triggerDoctorReportPrint = () => {
    const printWindow = window.open('', '_blank');
    const logsRowsHtml = symptomLogs.map(l => `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 10px; font-weight: bold;">${l.date}</td>
        <td style="padding: 10px; text-align: center;"><span style="background: #FEE2E2; color: #EF4444; padding: 3px 8px; border-radius: 6px; font-weight: bold;">${l.severity}/10</span></td>
        <td style="padding: 10px;">${l.symptoms.join(', ') || 'None'}</td>
        <td style="padding: 10px; text-align: center;">${l.bloodPressure?.systolic && l.bloodPressure?.diastolic ? `${l.bloodPressure.systolic}/${l.bloodPressure.diastolic} mmHg` : '--'}</td>
        <td style="padding: 10px; text-align: center;">${l.heartRate ? `${l.heartRate} bpm` : '--'}</td>
        <td style="padding: 10px; color: #4A5568;">${l.notes || '--'}</td>
      </tr>
    `).join('');

    const medsHtml = medicines.map(m => `
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px; border-radius: 12px; margin-bottom: 8px;">
        <strong style="color: #0F2F57;">${m.name}</strong> - ${m.dosageStrength || 'Standard Dose'} (${m.unit || 'Tablets'})
        <div style="font-size: 11px; color: #718096; margin-top: 4px;">Schedule: ${m.timeOfDay} • Stock: ${m.currentQuantity} / ${m.totalQuantity}</div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>HealthStock Intelligence - Doctor Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #2D3748; padding: 40px; margin: 0; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #0F2F57; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: 900; color: #0F2F57; text-transform: uppercase; }
            .section-title { font-size: 15px; font-weight: 800; color: #0F2F57; text-transform: uppercase; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin: 25px 0 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background: #F8FAFC; padding: 12px 10px; text-align: left; border-bottom: 2px solid #E2E8F0; color: #4A5568; text-transform: uppercase; font-size: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Clinical Adherence & Vital Sign Report</div>
              <div style="font-size: 12px; color: #718096; margin-top: 5px;">Generated on: ${new Date().toLocaleDateString()}</div>
            </div>
            <div style="text-align: right;">
              <strong style="color: #0F2F57;">HealthStock Intelligence</strong>
              <div style="font-size: 11px; color: #718096;">Secure Patient Dossier</div>
            </div>
          </div>
          
          <div class="section-title">Current Prescriptions & Inventory</div>
          ${medsHtml || '<p style="font-size: 12px;">No active prescriptions logged.</p>'}

          <div class="section-title">Vitals & Symptoms Timeline</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th style="text-align: center;">Severity</th>
                <th>Symptoms</th>
                <th style="text-align: center;">Blood Pressure</th>
                <th style="text-align: center;">Heart Rate</th>
                <th>Clinical Notes</th>
              </tr>
            </thead>
            <tbody>
              ${logsRowsHtml || '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #A0AEC0;">No logs recorded yet.</td></tr>'}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 pt-2 text-left animate-fadeIn">
      {/* Tab Selector Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-rose-50 text-[#FF2056] rounded-2xl flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-[#FF2056]" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#061D4C] tracking-tight">Symptom Tracker</h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Log side effects & analyze correlations</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
              activeTab === 'new' ? 'bg-white text-[#061D4C] shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Log Vitals
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
              activeTab === 'trends' ? 'bg-white text-[#061D4C] shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Analytics & Trends
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
              activeTab === 'history' ? 'bg-white text-[#061D4C] shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            History ({symptomLogs.length})
          </button>
        </div>
      </div>

      {activeTab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vitals Form */}
          <form onSubmit={handleSaveLog} className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-5">
            <h4 className="text-sm font-black text-[#061D4C] uppercase tracking-wider pb-2 border-b border-slate-50 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#2563EB]" /> Log Daily Symptoms & Vitals
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-[#061D4C] uppercase tracking-wider block">Log Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-white border-2 border-black focus:border-[#2563EB] rounded-2xl px-4 py-3 text-sm text-[#061D4C] focus:outline-none font-bold shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-[#061D4C] uppercase tracking-wider block">Symptom Severity</label>
                  <span className="text-xs font-black text-[#FF2056] bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">{severity} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={severity}
                  onChange={e => setSeverity(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#FF2056] mt-2.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-[#061D4C] uppercase tracking-wider block">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  placeholder="e.g. 120"
                  value={systolic}
                  onChange={e => setSystolic(e.target.value)}
                  className="w-full bg-white border-2 border-black focus:border-[#2563EB] rounded-2xl px-4 py-3 text-sm text-[#061D4C] focus:outline-none font-bold shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-[#061D4C] uppercase tracking-wider block">Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  placeholder="e.g. 80"
                  value={diastolic}
                  onChange={e => setDiastolic(e.target.value)}
                  className="w-full bg-white border-2 border-black focus:border-[#2563EB] rounded-2xl px-4 py-3 text-sm text-[#061D4C] focus:outline-none font-bold shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-[#061D4C] uppercase tracking-wider block">Heart Rate (bpm)</label>
                <input
                  type="number"
                  placeholder="e.g. 72"
                  value={heartRate}
                  onChange={e => setHeartRate(e.target.value)}
                  className="w-full bg-white border-2 border-black focus:border-[#2563EB] rounded-2xl px-4 py-3 text-sm text-[#061D4C] focus:outline-none font-bold shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-[#061D4C] uppercase tracking-wider block">Select Symptoms Present</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COMMON_SYMPTOMS.map((symptom) => {
                  const isChecked = selectedSymptoms.includes(symptom);
                  return (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => handleSymptomToggle(symptom)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        isChecked
                          ? 'bg-rose-50 border-[#FF2056] text-[#FF2056] shadow-sm'
                          : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
                      }`}
                    >
                      {symptom}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-[#061D4C] uppercase tracking-wider block">Additional Notes</label>
              <textarea
                rows="3"
                placeholder="Log how you are feeling, specific side effects, or external triggers..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-white border-2 border-black focus:border-[#2563EB] rounded-2xl px-4 py-3 text-sm text-[#061D4C] focus:outline-none font-bold resize-none shadow-sm"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={triggerDoctorReportPrint}
                className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-extrabold rounded-2xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" /> Export PDF Report
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-[#FF2056] hover:bg-[#E11244] text-white text-xs font-extrabold rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving log...' : 'Save Symptom Log'}
              </button>
            </div>
          </form>

          {/* Adherence Correlation Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
              <h4 className="text-xs font-black text-[#061D4C] uppercase tracking-wider pb-2 border-b border-slate-50 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#FF2056]" /> Correlation Engine
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Our diagnostic engine cross-references severe symptom outbreaks with missed dosage dates.
              </p>

              {correlationAnalysis && correlationAnalysis.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {correlationAnalysis.map((item, idx) => (
                    <div key={idx} className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-[#FF2056] flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Adherence Link Detected
                        </span>
                        <span className="text-[9px] font-extrabold text-slate-400">{item.date}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        Symptoms (Severity: <strong>{item.symptomSeverity}/10</strong>): <em>{item.symptoms}</em>
                      </p>
                      <p className="text-slate-600 text-[11px] pt-1.5 border-t border-rose-100/50">
                        Link: Missed <strong>{item.missedMed}</strong> ({item.time} intake block).
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#EFF6FF] border border-[#DBEAFE] p-5 rounded-2xl text-center space-y-2 flex flex-col items-center">
                  <Heart className="w-8 h-8 text-[#2563EB] animate-pulse" />
                  <p className="text-xs font-extrabold text-[#061D4C]">Healthy Alignment</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-[200px]">
                    No correlations detected. Ensure you log both symptoms and medications to run diagnostic screenings.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Symptom Severity & Heart Rate */}
            <div className="bg-white rounded-[2rem] border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
              <h4 className="text-xs font-black text-[#061D4C] uppercase tracking-wider pb-2 border-b border-slate-50 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#FF2056]" /> Symptom Severity & Heart Rate Trends
              </h4>
              <div className="h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} fontWeight="bold" />
                      <YAxis yAxisId="left" stroke="#FF2056" fontSize={10} fontWeight="bold" domain={[0, 10]} />
                      <YAxis yAxisId="right" orientation="right" stroke="#2563EB" fontSize={10} fontWeight="bold" domain={[40, 120]} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} />
                      <Line yAxisId="left" type="monotone" dataKey="Severity" stroke="#FF2056" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Severity (1-10)" />
                      <Line yAxisId="right" type="monotone" dataKey="HeartRate" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} name="HR (bpm)" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No trend data. Log vitals to generate plots.</div>
                )}
              </div>
            </div>

            {/* Chart 2: Blood Pressure Trends */}
            <div className="bg-white rounded-[2rem] border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
              <h4 className="text-xs font-black text-[#061D4C] uppercase tracking-wider pb-2 border-b border-slate-50 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-[#2563EB]" /> Blood Pressure Averages (mmHg)
              </h4>
              <div className="h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} fontWeight="bold" />
                      <YAxis stroke="#475569" fontSize={10} fontWeight="bold" domain={[50, 160]} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} />
                      <Line type="monotone" dataKey="Systolic" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} name="Systolic BP" connectNulls />
                      <Line type="monotone" dataKey="Diastolic" stroke="#60A5FA" strokeWidth={2} dot={{ r: 3 }} name="Diastolic BP" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No BP measurements recorded.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <h4 className="text-sm font-black text-[#061D4C] uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2563EB]" /> Historical Vitals & Symptom Logs
            </h4>
            <button
              onClick={triggerDoctorReportPrint}
              className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Print Report <Printer className="w-3.5 h-3.5" />
            </button>
          </div>

          {symptomLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Activity className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold uppercase tracking-wider">No logs recorded yet</p>
              <p className="text-[10px]">Use the Vital Logging tab to save your first daily record.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 text-left">Date</th>
                    <th className="pb-3 text-center">Severity</th>
                    <th className="pb-3 text-left">Symptoms</th>
                    <th className="pb-3 text-center">Blood Pressure</th>
                    <th className="pb-3 text-center">Heart Rate</th>
                    <th className="pb-3 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {symptomLogs.map((log) => (
                    <tr key={log._id || log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 font-bold text-[#061D4C]">{log.date}</td>
                      <td className="py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-lg font-black text-[10px] ${
                          log.severity >= 7 ? 'bg-rose-50 text-[#FF2056] border border-rose-100' :
                          log.severity >= 4 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {log.severity}/10
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-600 font-semibold max-w-[150px] truncate" title={log.symptoms.join(', ')}>
                        {log.symptoms.join(', ') || 'None'}
                      </td>
                      <td className="py-3.5 text-center font-bold text-[#061D4C]">
                        {log.bloodPressure?.systolic && log.bloodPressure?.diastolic 
                          ? `${log.bloodPressure.systolic}/${log.bloodPressure.diastolic} mmHg`
                          : '--'
                        }
                      </td>
                      <td className="py-3.5 text-center font-bold text-[#061D4C]">
                        {log.heartRate ? `${log.heartRate} bpm` : '--'}
                      </td>
                      <td className="py-3.5 text-slate-500 font-semibold max-w-[180px] truncate" title={log.notes}>
                        {log.notes || '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
