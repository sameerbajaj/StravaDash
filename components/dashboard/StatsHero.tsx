'use client';

import { ActivityData, formatDuration } from '@/lib/strava-calculations';
import { Target, TrendingUp, Flame, Compass } from 'lucide-react';

interface StatsHeroProps {
  ytdDistance: number; // in meters
  yearlyGoal: number; // in meters
  activities: ActivityData[];
}

export default function StatsHero({ ytdDistance, yearlyGoal, activities }: StatsHeroProps) {
  const ytdKm = ytdDistance / 1000;
  const goalKm = yearlyGoal / 1000;
  const percentage = Math.min(100, Math.round((ytdKm / goalKm) * 100));

  // Calculate day-of-year target pace
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diffInMs = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1;
  const targetYtdKm = (dayOfYear / 365) * goalKm;
  const deltaKm = ytdKm - targetYtdKm;

  // Filter running activities for YTD statistics
  const currentYear = now.getFullYear();
  const ytdRuns = activities.filter(
    a => a.type === 'Run' && new Date(a.startDate).getFullYear() === currentYear
  );

  const totalElevation = ytdRuns.reduce((sum, a) => sum + a.totalElevationGain, 0);
  const totalSeconds = ytdRuns.reduce((sum, a) => sum + a.movingTime, 0);
  const runsCount = ytdRuns.length;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-stagger">
      {/* Target Progress */}
      <div className="dash-card lg:col-span-2 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-text-secondary">
              <Target className="h-4.5 w-4.5 text-accent-warm" />
              <span className="text-xs font-mono uppercase tracking-wider">Annual Running Target</span>
            </div>
            <span className="badge text-accent-warm bg-accent-warm-muted border-accent-warm/20">
              {percentage}%
            </span>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="section-title text-5xl tracking-tight">
              {ytdKm.toFixed(1)}
            </span>
            <span className="text-text-secondary font-mono text-sm">/ {goalKm.toFixed(0)} km</span>
          </div>

          {/* Progress Bar */}
          <div className="progress-track h-2.5 mt-6 mb-4">
            <div
              className="progress-fill h-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Ahead/Behind Pace */}
        <div className="flex items-center space-x-2 border-t border-border-subtle pt-4 text-xs font-mono">
          <TrendingUp className={`h-4 w-4 ${deltaKm >= 0 ? 'text-accent-cool' : 'text-accent-danger'}`} />
          {deltaKm >= 0 ? (
            <span className="text-text-secondary">
              You are <span className="text-accent-cool font-bold">+{deltaKm.toFixed(1)} km ahead</span> of pace (Target today: {targetYtdKm.toFixed(1)} km)
            </span>
          ) : (
            <span className="text-text-secondary">
              You are <span className="text-accent-danger font-bold">{deltaKm.toFixed(1)} km behind</span> target pace (Target today: {targetYtdKm.toFixed(1)} km)
            </span>
          )}
        </div>
      </div>

      {/* Elevation Gain */}
      <div className="dash-card p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 text-text-secondary mb-4">
            <Compass className="h-4.5 w-4.5 text-accent-cool" />
            <span className="text-xs font-mono uppercase tracking-wider">YTD Elevation Gain</span>
          </div>
          <span className="section-title text-4xl">
            {totalElevation.toLocaleString()}
          </span>
          <span className="text-text-secondary font-mono text-sm ml-1">meters</span>
        </div>
        <p className="text-[10px] text-text-muted font-mono border-t border-border-subtle pt-4 uppercase">
          Total climb in {currentYear}
        </p>
      </div>

      {/* Volume Summary */}
      <div className="dash-card p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 text-text-secondary mb-4">
            <Flame className="h-4.5 w-4.5 text-accent-warm" />
            <span className="text-xs font-mono uppercase tracking-wider">Volume Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-2xl font-bold text-text-primary">{runsCount}</p>
              <p className="text-[10px] text-text-muted font-mono uppercase">Runs</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-text-primary">
                {Math.round(totalSeconds / 3600)}
              </p>
              <p className="text-[10px] text-text-muted font-mono uppercase">Hours</p>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-text-muted font-mono border-t border-border-subtle pt-4 uppercase">
          Avg duration: {runsCount > 0 ? formatDuration(Math.round(totalSeconds / runsCount)) : '0m'}
        </p>
      </div>
    </section>
  );
}
