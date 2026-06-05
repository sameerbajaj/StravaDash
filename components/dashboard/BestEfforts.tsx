'use client';

import { BestEffort, speedToPaceMinKm, formatDuration } from '@/lib/strava-calculations';
import { Award, Calendar, Flame } from 'lucide-react';

interface BestEffortsProps {
  bestEfforts: Record<string, BestEffort | null>;
}

export default function BestEfforts({ bestEfforts }: BestEffortsProps) {
  const distanceKeys = ['400m', '800m', '1K', '1 Mile', '5K', '10K', 'Half Marathon', 'Marathon'] as const;

  return (
    <div className="dash-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title flex items-center gap-3">
          Personal Best Efforts
          <span className="badge">ALL-TIME RECORDS</span>
        </h2>
        <Award className="h-4.5 w-4.5 text-accent-warm" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        {distanceKeys.map(key => {
          const effort = bestEfforts[key];

          if (!effort) {
            return (
              <div
                key={key}
                className="bg-bg-elevated border border-border-subtle p-4 rounded-xl flex flex-col justify-between h-32 opacity-40"
              >
                <div>
                  <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">{key}</span>
                  <p className="text-xl font-mono font-bold text-text-muted mt-2">--:--</p>
                </div>
                <span className="text-[9px] text-text-muted font-mono">NOT MET YET</span>
              </div>
            );
          }

          return (
            <div
              key={key}
              className="bg-bg-elevated border border-border-primary p-4 rounded-xl flex flex-col justify-between h-32 hover:border-border-hover hover:bg-bg-card-hover transition-all duration-300 relative overflow-hidden group"
            >
              {/* Subtle warm accent dot */}
              <div className="absolute -right-2 -top-2 w-6 h-6 bg-accent-warm/10 rounded-full group-hover:scale-[2] transition-transform duration-500 pointer-events-none" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">{key}</span>
                  <Flame className="h-3 w-3 text-accent-warm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <p className="text-2xl font-mono font-bold text-text-primary mt-1">
                  {formatDuration(Math.round(effort.timeSeconds))}
                </p>

                <p className="text-xs font-mono text-accent-cool mt-0.5">
                  {speedToPaceMinKm(effort.paceMps)} <span className="text-[9px] text-text-muted font-normal">/ km</span>
                </p>
              </div>

              <div className="border-t border-border-subtle pt-2 mt-2">
                <p className="text-[9px] text-text-primary truncate max-w-full font-medium" title={effort.activityName}>
                  {effort.activityName}
                </p>
                <div className="flex items-center space-x-1 text-text-muted text-[8px] font-mono mt-0.5">
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
