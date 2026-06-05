'use client';

import { useState, useRef } from 'react';
import { FitnessDay } from '@/lib/strava-calculations';
import { Shield, Sparkles, AlertCircle } from 'lucide-react';

interface FitnessChartProps {
  timeline: FitnessDay[];
}

export default function FitnessChart({ timeline }: FitnessChartProps) {
  const [hoveredDay, setHoveredDay] = useState<FitnessDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  if (!timeline || timeline.length === 0) {
    return (
      <div className="dash-card p-6 h-80 flex flex-col items-center justify-center text-text-muted">
        <AlertCircle className="h-8 w-8 mb-2" />
        <span className="text-sm font-mono tracking-wide">No fitness data available</span>
        <span className="text-[10px] text-text-muted/70 mt-1">Sync your runs to calculate load trends.</span>
      </div>
    );
  }

  // Dimensions
  const svgWidth = 1000;
  const svgHeight = 300;
  const paddingLeft = 40;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 40;

  const width = svgWidth - paddingLeft - paddingRight;
  const height = svgHeight - paddingTop - paddingBottom;

  // Find min/max values to scale Y axis
  const ctlValues = timeline.map(d => d.ctl);
  const atlValues = timeline.map(d => d.atl);
  const tsbValues = timeline.map(d => d.tsb);

  const maxVal = Math.max(...ctlValues, ...atlValues, 20) * 1.1;
  const minVal = Math.min(...tsbValues, -20) * 1.1;
  const range = maxVal - minVal;

  // Scale Functions
  const getX = (index: number) => {
    return paddingLeft + (index / (timeline.length - 1)) * width;
  };

  const getY = (value: number) => {
    return svgHeight - paddingBottom - ((value - minVal) / range) * height;
  };

  // Generate paths
  let ctlPath = '';
  let atlPath = '';
  let tsbAreaPath = '';

  timeline.forEach((day, index) => {
    const x = getX(index);
    const yCtl = getY(day.ctl);
    const yAtl = getY(day.atl);
    const yTsb = getY(day.tsb);
    const yZero = getY(0);

    if (index === 0) {
      ctlPath = `M ${x} ${yCtl}`;
      atlPath = `M ${x} ${yAtl}`;
      tsbAreaPath = `M ${x} ${yZero} L ${x} ${yTsb}`;
    } else {
      ctlPath += ` L ${x} ${yCtl}`;
      atlPath += ` L ${x} ${yAtl}`;
      tsbAreaPath += ` L ${x} ${yTsb}`;
    }
  });

  // Complete the TSB Area path to close it along the y=0 line
  if (timeline.length > 0) {
    const lastX = getX(timeline.length - 1);
    const firstX = getX(0);
    const yZero = getY(0);
    tsbAreaPath += ` L ${lastX} ${yZero} L ${firstX} ${yZero} Z`;
  }

  // Get current form status text & color
  const getFormStatus = (tsb: number) => {
    if (tsb > 10) return { label: 'Fresh / Tapering', color: 'text-accent-cool border-accent-cool/20 bg-accent-cool-muted' };
    if (tsb >= -10 && tsb <= 10) return { label: 'Optimal / Productive', color: 'text-accent-emerald border-accent-emerald/20 bg-accent-emerald/5' };
    if (tsb >= -30 && tsb < -10) return { label: 'Overload / Straining', color: 'text-accent-warm border-accent-warm/20 bg-accent-warm-muted' };
    return { label: 'Overreaching / Burnout Warning', color: 'text-accent-danger border-accent-danger/20 bg-accent-danger/5' };
  };

  // Hover Handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert mouseX from client coordinate space to SVG viewBox coordinate space
    const svgMouseX = (mouseX / rect.width) * svgWidth;

    // Map svgMouseX back to timeline index
    const relativeX = (svgMouseX - paddingLeft) / width;
    const index = Math.max(0, Math.min(timeline.length - 1, Math.round(relativeX * (timeline.length - 1))));

    const day = timeline[index];
    setHoveredDay(day);

    // Tooltip position (keep within boundaries)
    const clientX = mouseX + 15;
    const clientY = mouseY - 60;
    setTooltipPos({ x: clientX, y: clientY });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  // Select labels for X axis
  const labelInterval = Math.ceil(timeline.length / 5);

  return (
    <div ref={containerRef} className="dash-card p-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="section-title flex items-center gap-2">
            Fitness, Fatigue & Form <span className="badge">Banister Model</span>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Tracking your CTL (Fitness), ATL (Fatigue), and TSB (Form) based on relative cardio stress scores.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-[10px] font-mono mt-4 md:mt-0">
          <div className="flex items-center space-x-1.5">
            <span className="h-[3px] w-4 rounded-full" style={{ background: 'var(--chart-fitness)' }} />
            <span className="text-text-secondary">Fitness (CTL)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-[3px] w-4 rounded-full" style={{ background: 'var(--chart-fatigue)' }} />
            <span className="text-text-secondary">Fatigue (ATL)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-[3px] w-4 rounded-full bg-text-muted/30" />
            <span className="text-text-secondary">Form (TSB)</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* CTL Glow Filter */}
            <filter id="fitness-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* ATL Glow Filter */}
            <filter id="fatigue-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* TSB Area Gradient */}
            <linearGradient id="tsb-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-form-fill)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Grid Background Horizontal Lines */}
          {[0.25, 0.5, 0.75].map((ratio, idx) => {
            const val = minVal + ratio * range;
            const y = getY(val);
            return (
              <line
                key={idx}
                x1={paddingLeft}
                y1={y}
                x2={svgWidth - paddingRight}
                y2={y}
                stroke="var(--border-subtle)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Form baseline (TSB = 0) */}
          <line
            x1={paddingLeft}
            y1={getY(0)}
            x2={svgWidth - paddingRight}
            y2={getY(0)}
            stroke="var(--border-primary)"
            strokeWidth="1.5"
          />

          {/* TSB Area */}
          <path d={tsbAreaPath} fill="url(#tsb-gradient)" />

          {/* ATL (Fatigue) Line */}
          <path
            d={atlPath}
            fill="none"
            stroke="var(--chart-fatigue)"
            strokeWidth="2"
            filter="url(#fatigue-glow)"
          />

          {/* CTL (Fitness) Line */}
          <path
            d={ctlPath}
            fill="none"
            stroke="var(--chart-fitness)"
            strokeWidth="2.5"
            filter="url(#fitness-glow)"
          />

          {/* X Axis Date Labels */}
          {timeline.map((day, idx) => {
            if (idx % labelInterval === 0 || idx === timeline.length - 1) {
              const x = getX(idx);
              const formattedDate = new Date(day.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              return (
                <text
                  key={idx}
                  x={x}
                  y={svgHeight - paddingBottom + 20}
                  fill="var(--text-muted)"
                  fontSize="10"
                  fontFamily="Geist Mono, SF Mono, monospace"
                  textAnchor="middle"
                >
                  {formattedDate}
                </text>
              );
            }
            return null;
          })}

          {/* Hover Crosshair vertical bar */}
          {hoveredDay && (
            <line
              x1={getX(timeline.indexOf(hoveredDay))}
              y1={paddingTop}
              x2={getX(timeline.indexOf(hoveredDay))}
              y2={svgHeight - paddingBottom}
              stroke="var(--text-muted)"
              strokeDasharray="2 2"
              strokeWidth="1"
              opacity="0.4"
            />
          )}

          {/* Hover Node Dots */}
          {hoveredDay && (
            <>
              <circle
                cx={getX(timeline.indexOf(hoveredDay))}
                cy={getY(hoveredDay.ctl)}
                r="4"
                fill="var(--chart-fitness)"
                stroke="var(--bg-card)"
                strokeWidth="2"
              />
              <circle
                cx={getX(timeline.indexOf(hoveredDay))}
                cy={getY(hoveredDay.atl)}
                r="4"
                fill="var(--chart-fatigue)"
                stroke="var(--bg-card)"
                strokeWidth="2"
              />
            </>
          )}
        </svg>

        {/* Dynamic Tooltip Element */}
        {hoveredDay && (
          <div
            className="absolute z-10 pointer-events-none dash-card p-3 w-48"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            <p className="border-b border-border-primary pb-1 mb-1 text-text-muted font-mono font-semibold text-xs">
              {new Date(hoveredDay.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <div className="flex justify-between items-center py-0.5 text-xs font-mono">
              <span className="text-chart-fitness">Fitness (CTL):</span>
              <span className="text-text-primary font-bold">{hoveredDay.ctl}</span>
            </div>
            <div className="flex justify-between items-center py-0.5 text-xs font-mono">
              <span className="text-chart-fatigue">Fatigue (ATL):</span>
              <span className="text-text-primary font-bold">{hoveredDay.atl}</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-border-primary pb-1 mb-1 text-xs font-mono">
              <span className="text-text-muted">Form (TSB):</span>
              <span className={`font-bold ${hoveredDay.tsb >= 0 ? 'text-accent-cool' : 'text-accent-danger'}`}>
                {hoveredDay.tsb > 0 ? `+${hoveredDay.tsb}` : hoveredDay.tsb}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5 text-xs font-mono">
              <span className="text-text-muted text-[10px]">Daily Stress:</span>
              <span className="text-text-primary font-bold">{hoveredDay.stress}</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Day Status Dashboard */}
      {hoveredDay ? (
        <div className={`mt-4 border rounded-lg p-3 flex items-center justify-between text-xs transition-all ${getFormStatus(hoveredDay.tsb).color}`}>
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <div>
              <span className="font-semibold">Athlete Status: </span>
              <span>{getFormStatus(hoveredDay.tsb).label}</span>
            </div>
          </div>
          <span className="text-[10px] font-mono">TSB: {hoveredDay.tsb}</span>
        </div>
      ) : (
        <div className="mt-4 border border-border-primary rounded-lg p-3 flex items-center justify-between text-xs text-text-muted bg-bg-elevated">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-accent-warm animate-pulse" />
            <span>Hover over the chart to inspect historical metrics.</span>
          </div>
        </div>
      )}
    </div>
  );
}
