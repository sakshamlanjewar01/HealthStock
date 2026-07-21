import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, AlertCircle, Activity, Calendar, ShieldAlert, FileText, Printer, ChevronRight, Heart, HeartPulse, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { API_URL } from '../config.js';

const SIDE_EFFECTS = ["None", "Dizziness", "Headache", "Nausea", "Fatigue", "Muscle Pain", "Stomach Upset", "Dry Mouth"];

export default function HealthProgress({ logs = [], medicines = [] }) {
  const [progressLogs, setProgressLogs] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [healthIndex, setHealthIndex] = useState(10); // 1 to 10 scale (10 is Excellent, 1 is Poor)
  const [selectedSideEffects, setSelectedSideEffects] = useState(["None"]);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('new'); // 'new', 'history', 'trends'

  const fetchProgressLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/data/symptoms`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setProgressLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching progress logs:', err);
    }
  };

  useEffect(() => {
    fetchProgressLogs();
  }, []);

  const handleSideEffectToggle = (effect) => {
    if (effect === "None") {
      setSelectedSideEffects(["None"]);
      return;
    }

    let updated = selectedSideEffects.filter(e => e !== "None");
    if (updated.includes(effect)) {
      updated = updated.filter(e => e !== effect);
      if (updated.length === 0) updated.push("None");
    } else {
      updated.push(effect);
    }
    setSelectedSideEffects(updated);
  };

  const handleSaveLog = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 1. Future Date Check
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // allow logging for today
    if (selectedDate > today) {
      alert("The log date cannot be in the future. Please select a valid date.");
      setIsSubmitting(false);
      return;
    }

    // 2. Blood Pressure Validation
    if ((systolic && !diastolic) || (!systolic && diastolic)) {
      alert("Please enter both Systolic and Diastolic values for blood pressure, or leave both empty.");
      setIsSubmitting(false);
      return;
    }

    if (systolic && diastolic) {
      const sys = parseInt(systolic, 10);
      const dia = parseInt(diastolic, 10);
      if (isNaN(sys) || sys < 50 || sys > 250) {
        alert("Please enter a valid Systolic BP value (typically between 50 and 250 mmHg).");
        setIsSubmitting(false);
        return;
      }
      if (isNaN(dia) || dia < 30 || dia > 150) {
        alert("Please enter a valid Diastolic BP value (typically between 30 and 150 mmHg).");
        setIsSubmitting(false);
        return;
      }
      if (dia >= sys) {
        alert("Diastolic blood pressure must be lower than Systolic blood pressure.");
        setIsSubmitting(false);
        return;
      }
    }

    // 3. Heart Rate Validation
    if (heartRate) {
      const hr = parseInt(heartRate, 10);
      if (isNaN(hr) || hr < 30 || hr > 220) {
        alert("Please enter a valid Heart Rate / pulse (between 30 and 220 BPM).");
        setIsSubmitting(false);
        return;
      }
    }

    // Map healthIndex (10 is Excellent) to DB severity scale (1 is minimal symptoms/discomfort)
    // severity = 11 - healthIndex
    const severityVal = Math.max(1, Math.min(10, 11 - healthIndex));

    const payload = {
      date,
      severity: severityVal,
      symptoms: selectedSideEffects.filter(e => e !== "None"),
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
        alert("Daily health progress logged successfully!");
        fetchProgressLogs();
        setHealthIndex(10);
        setSelectedSideEffects(["None"]);
        setSystolic('');
        setDiastolic('');
        setHeartRate('');
        setNotes('');
        setActiveTab('history');
      }
    } catch (err) {
      console.error('Error saving progress log:', err);
      alert('Failed to save log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      const res = await fetch(`${API_URL}/data/symptoms/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        fetchProgressLogs();
      }
    } catch (err) {
      console.error('Error deleting progress log:', err);
    }
  };

  // Process data for Recharts Trend View
  const chartData = [...progressLogs].reverse().map(log => {
    // Map database severity (1-10 discomfort) back to health index (1-10 comfort)
    const computedHealthIndex = Math.max(1, Math.min(10, 11 - log.severity));
    return {
      date: log.date.substring(5), // MM-DD
      "Health Index": computedHealthIndex,
      "Heart Rate": log.heartRate || null,
      "Systolic BP": log.bloodPressure?.systolic || null,
      "Diastolic BP": log.bloodPressure?.diastolic || null
    };
  });

  const getConditionStatus = (log) => {
    const comfort = Math.max(1, Math.min(10, 11 - log.severity));
    if (comfort >= 8 && (!log.symptoms || log.symptoms.length === 0)) return { label: "Optimal", color: "text-emerald-500 bg-emerald-50 border-emerald-100" };
    if (comfort >= 5) return { label: "Stable", color: "text-blue-500 bg-blue-50 border-blue-100" };
    return { label: "Requires Care", color: "text-rose-500 bg-rose-50 border-rose-100" };
  };

  return (
    <div className="space-y-6 text-left w-full mx-auto pt-4 pb-12 relative z-20">
      
      {/* Standalone Brand Header Card */}
      <div className="bg-white rounded-[2rem] border border-slate-100/80 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
            <HeartPulse className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-[#0F2F57] tracking-tight leading-tight">Live Health Progress</h2>
            <p className="text-sm text-[#4B6B8B] font-medium mt-1">Track daily physiological feedback and post-medication side effects.</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 gap-1 select-none shrink-0">
          {[
            { id: 'new', label: 'Log Today' },
            { id: 'history', label: 'History' },
            { id: 'trends', label: 'Analytics' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === t.id ? 'bg-[#0B53FA] text-white shadow-sm' : 'text-slate-600 hover:text-[#0F2F57]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Panels */}
      {activeTab === 'new' && (
        <form onSubmit={handleSaveLog} className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: General Assessment */}
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Date of Log</label>
                <div className="relative flex items-center bg-white border border-slate-200 focus-within:border-[#4571A1] focus-within:ring-2 focus-within:ring-[#4571A1]/10 rounded-xl px-4 py-3 transition-all duration-200 shadow-sm">
                  <Calendar className="w-4 h-4 text-slate-400 mr-2.5" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="bg-transparent border-none text-sm text-slate-800 focus:outline-none w-full font-medium"
                  />
                </div>
              </div>

              {/* Health comfort scale */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">How is your overall health status today?</label>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {healthIndex === 10 ? 'Excellent (10/10)' : healthIndex >= 8 ? 'Good' : healthIndex >= 5 ? 'Fair' : 'Poor'}
                  </span>
                </div>
                <div className="space-y-2 pt-1">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={healthIndex}
                    onChange={e => setHealthIndex(parseInt(e.target.value, 10))}
                    style={{
                      background: `linear-gradient(to right, #10B981 ${((healthIndex - 1) / 9) * 100}%, #E2E8F0 ${((healthIndex - 1) / 9) * 100}%)`,
                      height: '8px'
                    }}
                    className="w-full rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                    <span>1 (Poor)</span>
                    <span>5 (Stable)</span>
                    <span>10 (Excellent)</span>
                  </div>
                </div>
              </div>

              {/* Side effects checklist */}
              <div className="space-y-3.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Have you experienced any side effects today?</label>
                <div className="grid grid-cols-2 gap-2">
                  {SIDE_EFFECTS.map(effect => {
                    const isSelected = selectedSideEffects.includes(effect);
                    return (
                      <button
                        type="button"
                        key={effect}
                        onClick={() => handleSideEffectToggle(effect)}
                        className={`px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${isSelected 
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm' 
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'}`}
                      >
                        <span>{effect}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Physiological Vitals */}
            <div className="space-y-5">
              <div className="bg-slate-50/60 border border-slate-100/80 p-5 rounded-[2rem] space-y-4">
                <h3 className="text-xs font-extrabold text-[#0F2F57] uppercase tracking-wider flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-emerald-500" /> Daily Physiological Vitals
                </h3>

                {/* Blood pressure */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Blood Pressure (mmHg)</label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center bg-white border border-slate-200 focus-within:border-[#4571A1] focus-within:ring-2 focus-within:ring-[#4571A1]/10 rounded-xl px-4 py-3 transition-all duration-200 shadow-sm flex-1">
                      <input
                        type="number"
                        placeholder="Systolic (e.g. 120)"
                        value={systolic}
                        onChange={e => setSystolic(e.target.value)}
                        className="bg-transparent border-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none w-full font-medium"
                      />
                    </div>
                    <span className="text-slate-400 font-bold">/</span>
                    <div className="relative flex items-center bg-white border border-slate-200 focus-within:border-[#4571A1] focus-within:ring-2 focus-within:ring-[#4571A1]/10 rounded-xl px-4 py-3 transition-all duration-200 shadow-sm flex-1">
                      <input
                        type="number"
                        placeholder="Diastolic (e.g. 80)"
                        value={diastolic}
                        onChange={e => setDiastolic(e.target.value)}
                        className="bg-transparent border-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none w-full font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Heart rate */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Heart Rate (BPM)</label>
                  <div className="relative flex items-center bg-white border border-slate-200 focus-within:border-[#4571A1] focus-within:ring-2 focus-within:ring-[#4571A1]/10 rounded-xl px-4 py-3 transition-all duration-200 shadow-sm">
                    <input
                      type="number"
                      placeholder="e.g. 72"
                      value={heartRate}
                      onChange={e => setHeartRate(e.target.value)}
                      className="bg-transparent border-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none w-full font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Daily Health Notes / Feedback</label>
                <textarea
                  rows="3"
                  placeholder="How did you feel today after taking your scheduled medicines?"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-2xl text-sm text-slate-850 placeholder:text-slate-400 focus:outline-none focus:border-[#4571A1] focus:ring-2 focus:ring-[#4571A1]/10 shadow-sm"
                />
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100/80 mt-6 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-3 bg-[#0B53FA] hover:bg-[#0944CD] text-white text-xs font-black rounded-xl transition-all shadow-md shadow-[#0B53FA]/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Logging...' : 'Save Daily Assessment'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4 animate-fadeIn">
          {progressLogs.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-[#0F2F57]">No Daily Logs Yet</h3>
              <p className="text-slate-400 text-xs mt-1.5 max-w-xs leading-relaxed">Submit your first daily health log to see your historical medical logs listed here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
              {progressLogs.map(log => {
                const healthRating = Math.max(1, Math.min(10, 11 - log.severity));
                const status = getConditionStatus(log);
                return (
                  <div key={log._id} className="p-4 bg-white rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-shadow">
                    
                    {/* Left: General info */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-sm font-bold text-[#0F2F57]">
                        {healthRating}
                      </div>
                      <div className="text-left space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-[#0F2F57] text-sm">{log.date}</h4>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                          Health Index: <strong className="text-[#0F2F57]">{healthRating}/10</strong> 
                          {log.symptoms?.length > 0 && ` • Side Effects: ${log.symptoms.join(', ')}`}
                        </p>
                        {log.notes && (
                          <p className="text-xs text-slate-450 italic font-semibold mt-1">"{log.notes}"</p>
                        )}
                      </div>
                    </div>

                    {/* Right: Vitals & Action */}
                    <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 border-slate-50 pt-2.5 md:pt-0">
                      <div className="flex items-center gap-4 text-left">
                        {log.bloodPressure && (
                          <div className="text-left">
                            <p className="text-[8px] text-slate-400 font-extrabold uppercase leading-none">Vitals BP</p>
                            <p className="text-xs font-black text-[#0F2F57] mt-1">{log.bloodPressure.systolic}/{log.bloodPressure.diastolic} mmHg</p>
                          </div>
                        )}
                        {log.heartRate && (
                          <div className="text-left border-l border-slate-100 pl-4">
                            <p className="text-[8px] text-slate-400 font-extrabold uppercase leading-none">Pulse Rate</p>
                            <p className="text-xs font-black text-[#0F2F57] mt-1">{log.heartRate} BPM</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteLog(log._id)}
                        className="text-slate-350 hover:text-rose-500 p-1.5 transition-colors cursor-pointer border border-transparent hover:border-rose-100 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6 animate-fadeIn">
          {chartData.length < 2 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-[#0F2F57]">Insufficient Data for Trends</h3>
              <p className="text-slate-400 text-xs mt-1.5 max-w-xs leading-relaxed">Log at least 2 daily assessments to display health indices and vital trends charts.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Daily Health Index Chart */}
              <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-3xl">
                <h4 className="text-xs font-extrabold text-[#0F2F57] uppercase tracking-wider mb-4 px-2">Health Index Over Time</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight={600} />
                      <YAxis domain={[1, 10]} stroke="#94a3b8" fontSize={10} fontWeight={600} />
                      <Tooltip />
                      <Line type="monotone" dataKey="Health Index" stroke="#10B981" strokeWidth={3} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Vitals Trends Chart */}
              <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-3xl">
                <h4 className="text-xs font-extrabold text-[#0F2F57] uppercase tracking-wider mb-4 px-2">Physiological Vital Trends</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight={600} />
                      <YAxis stroke="#94a3b8" fontSize={10} fontWeight={600} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Heart Rate" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="Systolic BP" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="Diastolic BP" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}

// Icon fallbacks inside scope
function Trash2(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
