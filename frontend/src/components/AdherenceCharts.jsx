import React from 'react';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function AdherenceCharts({ metrics, reportPeriod = 'Weekly' }) {
  const { weeklyStats, monthlyStats, yearlyStats = [], medicineStats } = metrics;

  const isWeeklyView = reportPeriod === 'Weekly' || (reportPeriod === 'Custom' && monthlyStats.length <= 7);
  const isYearlyView = reportPeriod === 'Yearly' || (reportPeriod === 'Custom' && monthlyStats.length > 31);
  const isMonthlyView = reportPeriod === 'Monthly' || (!isWeeklyView && !isYearlyView);

  // 1. Weekly view data
  const weeklyChartData = Object.keys(weeklyStats).map(day => ({
    name: day.substring(0, 3),
    Adherence: weeklyStats[day],
    Missed: 100 - weeklyStats[day]
  }));

  // 2. Monthly/Custom daily trend view data
  const monthlyChartData = (monthlyStats || []).map(day => ({
    name: day.displayDate,
    Adherence: day.adherence,
  }));

  // 3. Yearly view data
  const yearlyChartData = (yearlyStats || []).map(item => ({
    name: item.name,
    Adherence: item.Adherence
  }));

  const successChartData = Object.keys(medicineStats).map(id => ({
    name: medicineStats[id].name,
    Rate: medicineStats[id].rate
  })).sort((a, b) => b.Rate - a.Rate);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg shadow-xl backdrop-blur-md text-left">
          <p className="text-xs font-semibold text-slate-400">{label}</p>
          <p className="text-sm font-bold text-teal-400 mt-1">
            {payload[0].name}: {payload[0].value}%
          </p>
          {payload[1] && (
            <p className="text-sm font-bold text-rose-400">
              {payload[1].name}: {payload[1].value}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const getChartTitleAndDesc = () => {
    if (isWeeklyView) {
      return {
        title: 'Weekly Adherence Chart',
        desc: 'Average intake success per day of the week'
      };
    }
    if (isYearlyView) {
      return {
        title: 'Yearly Adherence Chart',
        desc: 'Average intake success per month of the year'
      };
    }
    return {
      title: reportPeriod === 'Custom' ? 'Custom Adherence Chart' : 'Monthly Adherence Chart',
      desc: reportPeriod === 'Custom' ? 'Intake success trend for custom date range' : 'Daily intake success trend'
    };
  };

  const { title, desc } = getChartTitleAndDesc();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      
      {/* Weekly/Monthly/Yearly Adherence Summary Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between min-h-[360px]">
        <div>
          <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block"></span>
            {title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
        </div>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            {isWeeklyView ? (
              <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="weeklyTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" />
                    <stop offset="100%" stopColor="#0d9488" />
                  </linearGradient>
                  <linearGradient id="weeklyAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Adherence" fill="url(#weeklyTeal)" radius={[6, 6, 0, 0]} barSize={16}>
                  {weeklyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.Adherence >= 85 ? 'url(#weeklyTeal)' : 'url(#weeklyAmber)'} />
                  ))}
                </Bar>
              </BarChart>
            ) : isYearlyView ? (
              <BarChart data={yearlyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="yearlyTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" />
                    <stop offset="100%" stopColor="#0d9488" />
                  </linearGradient>
                  <linearGradient id="yearlyAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Adherence" fill="url(#yearlyTeal)" radius={[8, 8, 0, 0]} barSize={20}>
                  {yearlyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.Adherence >= 85 ? 'url(#yearlyTeal)' : 'url(#yearlyAmber)'} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdherence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.45}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Adherence" stroke="#2dd4bf" strokeWidth={3} fillOpacity={1} fill="url(#colorAdherence)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Medication Success Rates Progress Bars */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between min-h-[360px]">
        <div>
          <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block"></span>
            Medicine Success Rates
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Percentage of taken doses per medicine</p>
        </div>
        <div className="h-64 mt-4 overflow-y-auto pr-1">
          {successChartData.length > 0 ? (
            <div className="space-y-4 pt-2">
              {successChartData.map((item, idx) => (
                <div key={idx} className="space-y-1.5 text-left">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-350">{item.name}</span>
                    <span className={item.Rate >= 90 ? 'text-teal-400' : item.Rate >= 75 ? 'text-yellow-400' : 'text-rose-455'}>
                      {item.Rate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800/80">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        item.Rate >= 90 
                          ? 'bg-gradient-to-r from-teal-650 to-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.35)]' 
                          : item.Rate >= 75 
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400' 
                          : 'bg-gradient-to-r from-rose-600 to-rose-450 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                      }`} 
                      style={{ width: `${item.Rate}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-xs text-slate-500 mt-12">No active medicines logged.</div>
          )}
        </div>
      </div>

    </div>
  );
}
