import React from 'react';

/**
 * LoadingSkeleton
 * ---------------
 * Renders beautiful pulsing grey/blue shimmer shapes to act as structural
 * placeholders while components fetch data from the API.
 */
export default function LoadingSkeleton({ type = 'card', count = 1 }) {
  const items = Array.from({ length: count });

  if (type === 'card') {
    return (
      <div className="space-y-3 w-full">
        {items.map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-5 bg-white rounded-3xl border border-[#E2E8F0] gap-4 animate-pulse"
          >
            <div className="flex gap-4 items-center w-full">
              <div className="w-12 h-12 bg-slate-200 rounded-2xl shrink-0" />
              <div className="space-y-2 w-full max-w-[200px]">
                <div className="h-3 bg-slate-200 rounded-md w-3/4" />
                <div className="h-2.5 bg-slate-200 rounded-md w-1/2" />
              </div>
            </div>
            <div className="h-9 bg-slate-200 rounded-xl w-24 shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'metric') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full animate-pulse">
        {items.map((_, i) => (
          <div key={i} className="p-5 bg-white rounded-3xl border border-[#E2E8F0] space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-2.5 bg-slate-200 rounded-md w-24" />
              <div className="w-8 h-8 bg-slate-200 rounded-xl" />
            </div>
            <div className="h-6 bg-slate-200 rounded-md w-16" />
            <div className="h-2.5 bg-slate-200 rounded-md w-32" />
          </div>
        ))}
      </div>
    );
  }

  return null;
}
