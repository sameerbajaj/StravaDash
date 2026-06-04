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
    <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Target Progress Wheel / Metric */}
      <div className="chrono-card lg:col-span-2 p-6 rounded-lg relative overflow-hidden flex flex-col justify-between">
        <div className="absolute right-0 top-0 w-48 h-48 radial-glow-orange opacity-40 pointer-events-none" />
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-slate-text">
              <Target className="h-4.5 w-4.5 text-orange" />
              <span className="text-xs font-mono uppercase tracking-wider">Annual Running Target</span>
            </div>
            <span className="font-mono text-xs text-orange bg-orange/10 px-2 py-0.5 rounded border border-orange/20">
              {percentage}%
            </span>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-5xl font-mono font-bold tracking-tight text-white">
              {ytdKm.toFixed(1)}
            </span>
            <span className="text-slate-text font-mono text-sm">/ {goalKm.toFixed(0)} km</span>
          </div>

          {/* Graphical Progress Bar */}
          <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden mt-6 mb-4 border border-white/5">
            <div 
              className="bg-gradient-to-r from-orange to-volt h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(255,75,0,0.4)]"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Ahead/Behind Pace Calculation */}
        <div className="flex items-center space-x-2 border-t border-white/5 pt-4 text-xs font-mono">
          <TrendingUp className={`h-4 w-4 ${deltaKm >= 0 ? 'text-volt' : 'text-red-500'}`} />
          {deltaKm >= 0 ? (
            <span className="text-slate-text">
              You are <span className="text-volt font-bold">+{deltaKm.toFixed(1)} km ahead</span> of pace (Target today: {targetYtdKm.toFixed(1)} km)
            </span>
          ) : (
            <span className="text-slate-text">
              You are <span className="text-red-500 font-bold">{deltaKm.toFixed(1)} km behind</span> target pace (Target today: {targetYtdKm.toFixed(1)} km)
            </span>
          )}
        </div>
      </div>

      {/* Elevation Gain */}
      <div className="chrono-card p-6 rounded-lg relative overflow-hidden flex flex-col justify-between">
        <div className="absolute right-0 top-0 w-32 h-32 radial-glow-volt opacity-20 pointer-events-none" />
        <div>
          <div className="flex items-center space-x-2 text-slate-text mb-4">
            <Compass className="h-4.5 w-4.5 text-volt" />
            <span className="text-xs font-mono uppercase tracking-wider">YTD Elevation Gain</span>
          </div>
          <span className="text-4xl font-mono font-bold text-white">
            {totalElevation.toLocaleString()}
          </span>
          <span className="text-slate-text font-mono text-sm ml-1">meters</span>
        </div>
        <p className="text-[10px] text-slate-text font-mono border-t border-white/5 pt-4 uppercase">
          Total climb in {currentYear}
        </p>
      </div>

      {/* Activity Summary Stats */}
      <div className="chrono-card p-6 rounded-lg relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 text-slate-text mb-4">
            <Flame className="h-4.5 w-4.5 text-orange" />
            <span className="text-xs font-mono uppercase tracking-wider">Volume Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-mono font-bold text-white">{runsCount}</p>
              <p className="text-[10px] text-slate-text font-mono uppercase">Runs</p>
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-white">
                {Math.round(totalSeconds / 3600)}
              </p>
              <p className="text-[10px] text-slate-text font-mono uppercase">Hours</p>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-slate-text font-mono border-t border-white/5 pt-4 uppercase">
          Avg duration: {runsCount > 0 ? formatDuration(Math.round(totalSeconds / runsCount)) : '0m'}
        </p>
      </div>
    </section>
  );
}
