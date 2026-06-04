'use client';

import { BestEffort, speedToPaceMinKm, formatDuration } from '@/lib/strava-calculations';
import { Award, Calendar, Flame } from 'lucide-react';

interface BestEffortsProps {
  bestEfforts: Record<string, BestEffort | null>;
}

export default function BestEfforts({ bestEfforts }: BestEffortsProps) {
  const distanceKeys = ['400m', '800m', '1K', '1 Mile', '5K', '10K', 'Half Marathon', 'Marathon'] as const;

  return (
    <div className="chrono-card p-6 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-extrabold tracking-widest text-white uppercase flex items-center gap-2">
          Personal Best Efforts <span className="text-[10px] font-mono text-slate-text bg-white/5 border border-white/10 px-1.5 py-0.5 rounded tracking-normal">ALL-TIME RECORDS</span>
        </h2>
        <Award className="h-4.5 w-4.5 text-volt animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {distanceKeys.map(key => {
          const effort = bestEfforts[key];

          if (!effort) {
            return (
              <div 
                key={key} 
                className="bg-white/[0.02] border border-white/5 p-4 rounded-lg flex flex-col justify-between h-32 opacity-50"
              >
                <div>
                  <span className="text-[10px] text-slate-text font-mono uppercase tracking-wider">{key}</span>
                  <p className="text-xl font-mono font-bold text-slate-600 mt-2">--:--</p>
                </div>
                <span className="text-[9px] text-slate-text/40 font-mono">NOT MET YET</span>
              </div>
            );
          }

          return (
            <div 
              key={key} 
              className="bg-white/[0.02] border border-white/5 p-4 rounded-lg flex flex-col justify-between h-32 hover:border-volt/20 hover:bg-white/[0.03] transition-all relative overflow-hidden group"
            >
              {/* Corner Glowing Trophy */}
              <div className="absolute -right-4 -top-4 w-12 h-12 bg-volt/5 rounded-full group-hover:scale-150 transition-all duration-500 pointer-events-none" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-text font-mono uppercase tracking-wider">{key}</span>
                  <Flame className="h-3 w-3 text-orange opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                {/* Stopwatch time format */}
                <p className="text-2xl font-mono font-bold text-white mt-1">
                  {formatDuration(Math.round(effort.timeSeconds))}
                </p>
                
                <p className="text-xs font-mono text-volt mt-0.5">
                  {speedToPaceMinKm(effort.paceMps)} <span className="text-[9px] text-slate-text font-normal">/ km</span>
                </p>
              </div>

              <div className="border-t border-white/5 pt-2 mt-2">
                <p className="text-[9px] text-white truncate max-w-full font-medium" title={effort.activityName}>
                  {effort.activityName}
                </p>
                <div className="flex items-center space-x-1 text-slate-text text-[8px] font-mono mt-0.5">
                  <Calendar className="h-2.5 w-2.5 shrink-0" />
                  <span>
                    {new Date(effort.date).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
