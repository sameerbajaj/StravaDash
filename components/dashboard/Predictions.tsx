'use client';

import { Prediction, formatDuration } from '@/lib/strava-calculations';
import { Compass, Sparkles, Activity } from 'lucide-react';

interface PredictionsProps {
  predictions: Prediction[];
}

export default function Predictions({ predictions }: PredictionsProps) {
  if (!predictions || predictions.length === 0) {
    return (
      <div className="dash-card p-6 h-72 flex flex-col items-center justify-center text-text-muted">
        <Activity className="h-8 w-8 mb-2 text-text-muted animate-pulse" />
        <span className="text-sm font-mono uppercase tracking-wider">No Performance Predictions</span>
        <span className="text-[10px] text-text-muted mt-1">Add running files to compute target estimates.</span>
      </div>
    );
  }

  return (
    <div className="dash-card p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title flex items-center gap-3">
            Target Pace Predictions
            <span className="badge">RIEGEL PROJECTIONS</span>
          </h2>
          <Compass className="h-4.5 w-4.5 text-accent-warm animate-spin-slow" />
        </div>

        <p className="text-xs text-text-secondary mb-4 leading-relaxed font-sans">
          Estimated finish times calculated based on your aerobic fatigue coefficients and current speed capacity.
        </p>

        <div className="space-y-3 animate-stagger">
          {predictions.map(pred => (
            <div
              key={pred.distanceLabel}
              className="flex items-center justify-between border-b border-border-subtle pb-2.5 last:border-b-0 last:pb-0"
            >
              <div>
                <span className="text-[11px] text-text-primary font-mono font-bold">{pred.distanceLabel}</span>
                <p className="text-[9px] font-mono text-text-muted">Predicted Pace: {pred.predictedPace} /km</p>
              </div>
              <span className="text-sm font-mono font-bold text-accent-cool">
                {formatDuration(Math.round(pred.predictedTime))}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-border-subtle pt-4 flex items-start space-x-2 text-[9px] font-mono text-text-muted leading-relaxed">
        <Sparkles className="h-3.5 w-3.5 text-accent-warm shrink-0 mt-0.5" />
        <p>Projections assume optimized carbohydrate loading, flat terrain, temperate running climate, and balanced running paces.</p>
      </div>
    </div>
  );
}
