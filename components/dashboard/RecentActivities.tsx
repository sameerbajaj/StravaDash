'use client';

import { ActivityData, speedToPaceMinKm, formatDuration } from '@/lib/strava-calculations';
import { Calendar, Heart, ShieldAlert, FileSpreadsheet, Download } from 'lucide-react';

interface RecentActivitiesProps {
  activities: ActivityData[];
  isDemo?: boolean;
}

export default function RecentActivities({ activities, isDemo = false }: RecentActivitiesProps) {
  const runs = activities.filter(a => a.type === 'Run');

  if (runs.length === 0) {
    return (
      <div className="dash-card p-6 h-60 flex flex-col items-center justify-center text-text-muted">
        <ShieldAlert className="h-8 w-8 mb-2 text-text-muted" />
        <span className="text-sm font-mono uppercase tracking-wider">No Running Logs Found</span>
        <span className="text-[10px] text-text-muted mt-1">Activities will appear here once synchronized.</span>
      </div>
    );
  }

  return (
    <div className="dash-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="section-title flex items-center gap-3">
          Recent Activity Logs
          <span className="badge">RUNNING LOGS</span>
        </h2>
        <div className="flex items-center space-x-2">
          <a
            href={`/api/export?format=csv${isDemo ? '&demo=true' : ''}`}
            className="px-3 py-1.5 rounded-lg border border-border-primary hover:border-border-hover bg-bg-elevated text-text-secondary hover:text-accent-warm transition-all text-[11px] font-mono flex items-center gap-1.5"
            title="Download all activities as a CSV spreadsheet"
            download
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-text-muted group-hover:text-accent-warm" />
            <span>Export CSV</span>
          </a>
          <a
            href={`/api/export?format=json${isDemo ? '&demo=true' : ''}`}
            className="px-3 py-1.5 rounded-lg border border-border-primary hover:border-border-hover bg-bg-elevated text-text-secondary hover:text-accent-warm transition-all text-[11px] font-mono flex items-center gap-1.5"
            title="Download full JSON database backup (contains original Strava rawData)"
            download
          >
            <Download className="h-3.5 w-3.5 text-text-muted group-hover:text-accent-warm" />
            <span>Export Backup (JSON)</span>
          </a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-border-primary text-text-muted pb-2 select-none uppercase tracking-wider text-[10px]">
              <th className="py-3 font-semibold">Activity Details</th>
              <th className="py-3 font-semibold text-right">Distance</th>
              <th className="py-3 font-semibold text-right">Duration</th>
              <th className="py-3 font-semibold text-right">Avg Pace</th>
              <th className="py-3 font-semibold text-right">Elevation</th>
              <th className="py-3 font-semibold text-right hidden sm:table-cell">Avg Heart Rate</th>
              <th className="py-3 font-semibold text-right hidden md:table-cell">Cardio Load</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-text-primary">
            {runs.map(act => {
              const km = act.distance / 1000;
              const hasHR = !!act.averageHeartrate;
              const hasLoad = !!act.relativeEffort;

              return (
                <tr key={act.id} className="hover:bg-bg-card-hover transition-all duration-200 group">
                  <td className="py-3.5 pr-4 max-w-[200px] sm:max-w-xs">
                    <p className="font-sans font-bold text-text-primary group-hover:text-accent-warm transition-colors duration-200 truncate">
                      {act.name}
                    </p>
                    <div className="flex items-center space-x-2 text-[9px] text-text-muted mt-1">
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
                    {km.toFixed(2)} <span className="text-[10px] text-text-muted font-normal">km</span>
                  </td>

                  <td className="py-3.5 text-right text-text-secondary">
                    {formatDuration(act.movingTime)}
                  </td>

                  <td className="py-3.5 text-right text-accent-cool font-semibold">
                    {speedToPaceMinKm(act.averageSpeed)} <span className="text-[9px] text-text-muted font-normal">/km</span>
                  </td>

                  <td className="py-3.5 text-right text-text-secondary">
                    {act.totalElevationGain > 0 ? (
                      <span className="flex items-center justify-end space-x-1">
                        <span>+{Math.round(act.totalElevationGain)}</span>
                        <span className="text-[9px] text-text-muted font-normal">m</span>
                      </span>
                    ) : (
                      '--'
                    )}
                  </td>

                  <td className="py-3.5 text-right hidden sm:table-cell">
                    {hasHR ? (
                      <span className="flex items-center justify-end space-x-1.5 text-accent-danger">
                        <Heart className="h-3.5 w-3.5 fill-accent-danger/20" />
                        <span>{Math.round(act.averageHeartrate!)} bpm</span>
                      </span>
                    ) : (
                      '--'
                    )}
                  </td>

                  <td className="py-3.5 text-right hidden md:table-cell font-bold text-accent-warm">
                    {hasLoad ? (
                      <span className="bg-accent-warm-muted border border-accent-warm/20 px-2 py-0.5 rounded text-[10px] text-accent-warm">
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
