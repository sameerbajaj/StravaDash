'use client';

import { calculateHRZones, formatDuration } from '@/lib/strava-calculations';
import { ShieldAlert, CheckCircle, BrainCircuit } from 'lucide-react';

interface TrainingZonesProps {
  hrDistribution: {
    distribution: Record<string, number>;
    percentages: Record<string, number>;
    totalSeconds: number;
  };
  maxHR?: number;
}

export default function TrainingZones({ hrDistribution, maxHR = 190 }: TrainingZonesProps) {
  const zones = calculateHRZones(maxHR);
  const { distribution, percentages, totalSeconds } = hrDistribution;

  const zoneKeys = ['z1', 'z2', 'z3', 'z4', 'z5'] as const;
  const zoneColors = {
    z1: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
    z2: 'bg-volt shadow-[0_0_8px_rgba(210,255,0,0.4)]',
    z3: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]',
    z4: 'bg-orange shadow-[0_0_8px_rgba(255,75,0,0.4)]',
    z5: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
  };

  // Evaluate Polarization Ratio: (Z1 + Z2) / Total
  const lowIntensitySeconds = (distribution.z1 || 0) + (distribution.z2 || 0);
  const polarizedRatio = totalSeconds > 0 ? Math.round((lowIntensitySeconds / totalSeconds) * 100) : 0;

  const getPolarizationFeedback = (ratio: number) => {
    if (totalSeconds === 0) return { label: 'Insufficient Data', text: 'No heart rate training files detected yet.', state: 'none' };
    if (ratio >= 80) {
      return {
        label: 'Optimal 80/20 Alignment',
        text: `Excellent polarized execution. ${ratio}% of your runs are spent at Z1/Z2 low intensity. This builds massive aerobic base capacity.`,
        state: 'optimal'
      };
    }
    if (ratio >= 70 && ratio < 80) {
      return {
        label: 'Good Aerobic Base Balance',
        text: `${ratio}% spent at base load. You are slightly running in the "middle intensity gray zone" (Z3). Slow down on recovery runs.`,
        state: 'good'
      };
    }
    return {
      label: 'Anaerobic Overload / High Intensity Risk',
      text: `Only ${ratio}% spent in base zones. You spend too much training in the gray zones (Z3/Z4). Consider adding slower base runs to prevent fatigue.`,
      state: 'overload'
    };
  };

  const feedback = getPolarizationFeedback(polarizedRatio);

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Time in Zones */}
      <div className="chrono-card md:col-span-2 p-6 rounded-lg">
        <h2 className="text-sm font-extrabold tracking-widest text-white uppercase mb-6 flex items-center gap-2">
          Heart Rate Training Distribution <span className="text-[10px] font-mono text-slate-text bg-white/5 border border-white/10 px-1.5 py-0.5 rounded tracking-normal">POLARIZED ZONES</span>
        </h2>

        {totalSeconds === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-text font-mono uppercase">
            No heart-rate training records found
          </div>
        ) : (
          <div className="space-y-4">
            {zoneKeys.map(key => {
              const zoneInfo = zones[key];
              const pct = percentages[key] || 0;
              const duration = distribution[key] || 0;

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-white font-bold uppercase">{key}</span>
                      <span className="text-slate-text text-[10px]">({zoneInfo.min}-{zoneInfo.max} bpm)</span>
                      <span className="text-slate-text/70">{zoneInfo.name}</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-white">{formatDuration(duration)}</span>
                      <span className="text-slate-text font-bold text-[10px]">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${zoneColors[key]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Polarized Analysis Panel */}
      <div className="chrono-card p-6 rounded-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 text-slate-text mb-4">
            <BrainCircuit className="h-4.5 w-4.5 text-volt" />
            <span className="text-xs font-mono uppercase tracking-wider">Base Fitness Index</span>
          </div>

          <div className="flex items-baseline space-x-1.5 mb-2">
            <span className="text-5xl font-mono font-bold text-white">{polarizedRatio}%</span>
            <span className="text-slate-text font-mono text-xs">base load</span>
          </div>

          <div className="text-xs font-mono text-slate-text mt-4">
            {feedback.state === 'optimal' && (
              <div className="flex items-start space-x-2 text-volt bg-volt/5 border border-volt/10 p-3 rounded">
                <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[11px] uppercase">{feedback.label}</p>
                  <p className="text-[10px] mt-1 leading-relaxed text-slate-300">{feedback.text}</p>
                </div>
              </div>
            )}
            {feedback.state === 'good' && (
              <div className="flex items-start space-x-2 text-amber-400 bg-amber-400/5 border border-amber-400/10 p-3 rounded">
                <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[11px] uppercase">{feedback.label}</p>
                  <p className="text-[10px] mt-1 leading-relaxed text-slate-300">{feedback.text}</p>
                </div>
              </div>
            )}
            {feedback.state === 'overload' && (
              <div className="flex items-start space-x-2 text-orange bg-orange/5 border border-orange/10 p-3 rounded">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[11px] uppercase">{feedback.label}</p>
                  <p className="text-[10px] mt-1 leading-relaxed text-slate-300">{feedback.text}</p>
                </div>
              </div>
            )}
            {feedback.state === 'none' && (
              <p className="text-slate-500 text-[10px]">Add workout heart rate files to compute polarised indices.</p>
            )}
          </div>
        </div>

        <div className="text-[10px] text-slate-text font-mono border-t border-white/5 pt-4">
          <p className="uppercase font-bold mb-1">PRO ATHLETICS TIP:</p>
          <p className="leading-relaxed">Keep Z1/Z2 easy volume high to expand mitochondial density. Avoid running at tempo speed on rest days.</p>
        </div>
      </div>
    </section>
  );
}
