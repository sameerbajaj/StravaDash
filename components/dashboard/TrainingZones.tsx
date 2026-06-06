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
    z1: 'bg-accent-emerald',
    z2: 'bg-accent-cool',
    z3: 'bg-accent-amber',
    z4: 'bg-accent-warm',
    z5: 'bg-accent-danger',
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
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {/* Time in Zones */}
      <div className="dash-card md:col-span-3 p-6">
        <h2 className="section-title mb-6 flex items-center gap-2">
          Heart Rate Zones <span className="badge">Polarized</span>
        </h2>

        {totalSeconds === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-text-muted font-mono">
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
                      <span className="text-text-primary font-bold uppercase">{key}</span>
                      <span className="text-text-muted text-[10px]">({zoneInfo.min}-{zoneInfo.max} bpm)</span>
                      <span className="text-text-secondary/70 hidden sm:inline">{zoneInfo.name}</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-text-primary">{formatDuration(duration)}</span>
                      <span className="text-text-muted font-bold text-[10px]">{pct}%</span>
                    </div>
                  </div>
                  <div className="progress-track h-2">
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
      <div className="dash-card md:col-span-2 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 text-text-secondary mb-4">
            <BrainCircuit className="h-4 w-4 text-accent-cool" />
            <span className="text-xs font-mono tracking-wide">Base Fitness Index</span>
          </div>

          <div className="flex items-baseline space-x-1.5 mb-2">
            <span className="text-5xl font-mono font-bold text-text-primary">{polarizedRatio}%</span>
            <span className="text-text-muted font-mono text-xs">base load</span>
          </div>

          <div className="text-xs font-mono text-text-secondary mt-4">
            {feedback.state === 'optimal' && (
              <div className="flex items-start space-x-2 text-accent-cool bg-accent-cool-muted border border-accent-cool/15 p-3 rounded-lg">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[11px]">{feedback.label}</p>
                  <p className="text-[10px] mt-1 leading-relaxed text-text-secondary">{feedback.text}</p>
                </div>
              </div>
            )}
            {feedback.state === 'good' && (
              <div className="flex items-start space-x-2 text-accent-amber bg-accent-amber/5 border border-accent-amber/15 p-3 rounded-lg">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[11px]">{feedback.label}</p>
                  <p className="text-[10px] mt-1 leading-relaxed text-text-secondary">{feedback.text}</p>
                </div>
              </div>
            )}
            {feedback.state === 'overload' && (
              <div className="flex items-start space-x-2 text-accent-warm bg-accent-warm-muted border border-accent-warm/15 p-3 rounded-lg">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[11px]">{feedback.label}</p>
                  <p className="text-[10px] mt-1 leading-relaxed text-text-secondary">{feedback.text}</p>
                </div>
              </div>
            )}
            {feedback.state === 'none' && (
              <p className="text-text-muted text-[10px]">Add workout heart rate files to compute polarised indices.</p>
            )}
          </div>
        </div>

        <div className="text-[10px] text-text-muted font-mono border-t border-border-primary pt-4 mt-4">
          <p className="font-semibold mb-1">Pro Tip</p>
          <p className="leading-relaxed">Keep Z1/Z2 easy volume high to expand mitochondial density. Avoid running at tempo speed on rest days.</p>
        </div>
      </div>
    </div>
  );
}
