import React from 'react';
import { Award, AlertCircle, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';

export default function AdherenceInsights({ metrics }) {
  const { score, level, insights } = metrics;

  const getScoreColorClass = (val) => {
    if (val >= 90) return 'text-teal-400 border-teal-500/20 bg-teal-500/5';
    if (val >= 75) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
  };

  const getScoreRingGradientId = (val) => {
    if (val >= 90) return 'ringTeal';
    if (val >= 75) return 'ringAmber';
    return 'ringRose';
  };

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      
      {/* Score Card - glass hoverable */}
      <div className={`glass-panel glass-panel-hover p-4 sm:p-6 rounded-2xl flex flex-col justify-between border ${getScoreColorClass(score)} relative overflow-hidden group`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-5 rounded-full blur-3xl transition-all group-hover:scale-125 duration-700" />
        <div className="flex justify-between items-start text-left">
          <div>
            <h3 className="text-xs sm:text-sm font-semibold tracking-wide uppercase opacity-70">Adherence Score</h3>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">{score}%</p>
          </div>
          <span className="text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full uppercase bg-white/10 backdrop-blur-md">
            {level}
          </span>
        </div>
        {/* Circular ring with custom SVG linear gradients - compact on mobile */}
        <div className="flex justify-center my-3 sm:my-4">
          <div className="relative w-28 sm:w-36 h-28 sm:h-36">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 144 144">
              <defs>
                <linearGradient id="ringTeal" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
                <linearGradient id="ringAmber" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="ringRose" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#be123c" />
                </linearGradient>
              </defs>
              <circle cx="72" cy="72" r={radius} className="stroke-slate-800/60" strokeWidth="10" fill="transparent" />
              <circle 
                cx="72" 
                cy="72" 
                r={radius} 
                className="transition-all duration-1000 ease-out" 
                stroke={`url(#${getScoreRingGradientId(score)})`} 
                strokeWidth="10" 
                strokeDasharray={circumference} 
                strokeDashoffset={strokeDashoffset} 
                strokeLinecap="round" 
                fill="transparent" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <Award className="w-6 sm:w-8 h-6 sm:h-8 opacity-80" />
              <span className="text-[9px] sm:text-xs font-bold tracking-widest uppercase mt-1">HealthStock</span>
            </div>
          </div>
        </div>
        <div className="text-[11px] sm:text-xs opacity-75 text-left">
          Adherence level based on taken, skipped, and missed logs.
        </div>
      </div>

      {/* Insights Panel */}
      <div className="glass-panel glass-panel-hover md:col-span-2 p-4 sm:p-6 rounded-2xl border border-slate-800 flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl group-hover:bg-teal-500/10 transition-all duration-500" />
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div>
            <h3 className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-400" /> Medication Adherence Insights
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Dynamic analysis of intake behavior</p>
          </div>
          <span className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full uppercase">
            Active
          </span>
        </div>
        <div className="space-y-2.5 sm:space-y-3.5 max-h-[160px] sm:max-h-[175px] overflow-y-auto pr-1">
          {insights.length > 0 ? (
            insights.map((insight) => (
              <div 
                key={insight.id} 
                className={`p-3 sm:p-3.5 rounded-xl border text-xs sm:text-sm flex gap-2.5 sm:gap-3 items-start transition-all duration-300 ${
                  insight.type === 'success' 
                    ? 'bg-teal-950/20 border-teal-500/15 text-teal-200' 
                    : insight.type === 'warning'
                    ? 'bg-amber-950/20 border-amber-500/15 text-amber-200'
                    : 'bg-rose-950/20 border-rose-500/15 text-rose-200'
                }`}
              >
                {insight.type === 'success' && <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />}
                {insight.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                {insight.type === 'danger' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                <p className="leading-relaxed font-medium">{insight.text}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-5 sm:py-6 text-slate-500">
              <HelpCircle className="w-7 sm:w-8 h-7 sm:h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Gathering logs. Generate more logs to unlock adherence engine insights.</p>
            </div>
          )}
        </div>
        <div className="text-[10px] sm:text-xs text-slate-500 mt-3 sm:mt-4 pt-3 border-t border-slate-900/80 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
          <span>Insights refresh automatically upon marking daily schedules.</span>
        </div>
      </div>

    </div>
  );
}
