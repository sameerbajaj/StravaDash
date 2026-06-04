'use client';

import { ActivityData, speedToPaceMinKm, formatDuration } from '@/lib/strava-calculations';
import { Calendar, Heart, ShieldAlert } from 'lucide-react';

interface RecentActivitiesProps {
  activities: ActivityData[];
}

export default function RecentActivities({ activities }: RecentActivitiesProps) {
  const runs = activities.filter(a => a.type === 'Run');

  if (runs.length === 0) {
    return (
      <div className="chrono-card p-6 rounded-lg h-60 flex flex-col items-center justify-center text-slate-text">
        <ShieldAlert className="h-8 w-8 mb-2 text-slate-500" />
        <span className="text-sm font-mono uppercase tracking-wider">No Running Logs Found</span>
        <span className="text-[10px] text-slate-text/75 mt-1">Activities will appear here once synchronized.</span>
      </div>
    );
  }

  return (
    <div className="chrono-card p-6 rounded-lg">
      <h2 className="text-sm font-extrabold tracking-widest text-white uppercase mb-6 flex items-center gap-2">
        Recent Activity Logs <span className="text-[10px] font-mono text-slate-text bg-white/5 border border-white/10 px-1.5 py-0.5 rounded tracking-normal">RUNNING LOGS</span>
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-white/10 text-slate-text pb-2 select-none uppercase tracking-wider text-[10px]">
              <th className="py-3 font-semibold">Activity Details</th>
              <th className="py-3 font-semibold text-right">Distance</th>
              <th className="py-3 font-semibold text-right">Duration</th>
              <th className="py-3 font-semibold text-right">Avg Pace</th>
              <th className="py-3 font-semibold text-right">Elevation</th>
              <th className="py-3 font-semibold text-right hidden sm:table-cell">Avg Heart Rate</th>
              <th className="py-3 font-semibold text-right hidden md:table-cell">Cardio Load</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-white">
            {runs.map(act => {
              const km = act.distance / 1000;
              const hasHR = !!act.averageHeartrate;
              const hasLoad = !!act.relativeEffort;

              return (
                <tr key={act.id} className="hover:bg-white/[0.01] transition-all group">
                  <td className="py-3.5 pr-4 max-w-[200px] sm:max-w-xs">
                    <p className="font-sans font-bold text-white group-hover:text-volt transition-colors truncate">
                      {act.name}
                    </p>
                    <div className="flex items-center space-x-2 text-[9px] text-slate-text mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(act.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </td>
                  
                  <td className="py-3.5 text-right font-bold text-sm">
                    {km.toFixed(2)} <span className="text-[10px] text-slate-text font-normal">km</span>
                  </td>

                  <td className="py-3.5 text-right text-slate-200">
                    {formatDuration(act.movingTime)}
                  </td>

                  <td className="py-3.5 text-right text-volt font-semibold">
                    {speedToPaceMinKm(act.averageSpeed)} <span className="text-[9px] text-slate-text font-normal">/km</span>
                  </td>

                  <td className="py-3.5 text-right text-slate-200">
                    {act.totalElevationGain > 0 ? (
                      <span className="flex items-center justify-end space-x-1">
                        <span>+{Math.round(act.totalElevationGain)}</span>
                        <span className="text-[9px] text-slate-text font-normal">m</span>
                      </span>
                    ) : (
                      '--'
                    )}
                  </td>

                  <td className="py-3.5 text-right hidden sm:table-cell">
                    {hasHR ? (
                      <span className="flex items-center justify-end space-x-1.5 text-rose-400">
                        <Heart className="h-3.5 w-3.5 fill-rose-500/20" />
                        <span>{Math.round(act.averageHeartrate!)} bpm</span>
                      </span>
                    ) : (
                      '--'
                    )}
                  </td>

                  <td className="py-3.5 text-right hidden md:table-cell font-bold text-orange">
                    {hasLoad ? (
                      <span className="bg-orange/10 border border-orange/20 px-2 py-0.5 rounded text-[10px]">
                        {act.relativeEffort}
                      </span>
                    ) : (
                      '--'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
