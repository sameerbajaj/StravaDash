'use client';

import { useState, useRef, useMemo } from 'react';
import { FitnessDay } from '@/lib/strava-calculations';
import { Shield, Sparkles, AlertCircle } from 'lucide-react';

interface FitnessChartProps {
  timeline: FitnessDay[];
}

export default function FitnessChart({ timeline }: FitnessChartProps) {
  const [rangeDays, setRangeDays] = useState<number | 'all'>(90);
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

  // Filter timeline based on selected date range
  const filteredTimeline = useMemo(() => {
    if (rangeDays === 'all') return timeline;
    return timeline.slice(-rangeDays);
  }, [timeline, rangeDays]);

  // Ensure hovered day exists in the current view range
  const isHoveredDayInFiltered = hoveredDay && filteredTimeline.includes(hoveredDay);

  // Dimensions
  const svgWidth = 1000;
  const svgHeight = 300;
  const paddingLeft = 40;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 40;

  const width = svgWidth - paddingLeft - paddingRight;
  const height = svgHeight - paddingTop - paddingBottom;

  // Find min/max values of filtered data to scale Y axis dynamically
  const ctlValues = filteredTimeline.map(d => d.ctl);
  const atlValues = filteredTimeline.map(d => d.atl);
  const tsbValues = filteredTimeline.map(d => d.tsb);

  const maxVal = Math.max(...ctlValues, ...atlValues, 20) * 1.1;
  const minVal = Math.min(...tsbValues, -20) * 1.1;
  const range = maxVal - minVal;

  // Scale Functions
  const getX = (index: number) => {
    return paddingLeft + (index / (filteredTimeline.length - 1)) * width;
  };

  const getY = (value: number) => {
    return svgHeight - paddingBottom - ((value - minVal) / range) * height;
  };

  // Generate paths
  let ctlPath = '';
  let atlPath = '';
  let tsbAreaPath = '';

  filteredTimeline.forEach((day, index) => {
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

  // Close the TSB Area path to close it along the y=0 line
  if (filteredTimeline.length > 0) {
    const lastX = getX(filteredTimeline.length - 1);
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
    const index = Math.max(0, Math.min(filteredTimeline.length - 1, Math.round(relativeX * (filteredTimeline.length - 1))));

    const day = filteredTimeline[index];
    setHoveredDay(day);

    // Dynamic Tooltip bounds protection (prevents overflow cutting off on right/bottom)
    const tooltipWidth = 192; // equivalent to w-48 (12rem)
    const tooltipHeight = 145;

    let clientX = mouseX + 15;
    let clientY = mouseY - 65;

    // Shift tooltip to the left of the cursor if it hits the right edge of the card
    if (clientX + tooltipWidth > rect.width) {
      clientX = mouseX - tooltipWidth - 15;
    }
    // Clamp to left boundary
    if (clientX < 10) {
      clientX = 10;
    }

    // Adjust if overflowing top boundary
    if (clientY < 10) {
      clientY = mouseY + 15;
    }
    // Adjust if overflowing bottom boundary
    if (clientY + tooltipHeight > rect.height) {
      clientY = rect.height - tooltipHeight - 10;
    }

    setTooltipPos({ x: clientX, y: clientY });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  // Select labels for X axis based on data size
  const labelInterval = Math.max(1, Math.ceil(filteredTimeline.length / 5));

  return (
    <div ref={containerRef} className="dash-card p-6 relative">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="section-title flex items-center gap-2">
            Fitness, Fatigue & Form <span className="badge">Banister Model</span>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Tracking your CTL (Fitness), ATL (Fatigue), and TSB (Form) based on relative cardio stress scores.
          </p>
        </div>

        {/* Range Selector & Legends */}
        <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-4 mt-2 lg:mt-0">
          {/* Time range selection controls */}
          <div className="flex items-center space-x-1 bg-bg-elevated p-1 rounded-lg border border-border-primary text-[10px] font-mono">
            {([30, 90, 180, 365, 'all'] as const).map(days => (
              <button
                key={days}
                onClick={() => {
                  setRangeDays(days);
                  setHoveredDay(null); // Clear hover to avoid indexing issues
                }}
                className={`px-2.5 py-1 rounded transition-all font-semibold cursor-pointer ${
                  rangeDays === days
                    ? 'bg-accent-warm text-text-inverse shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {days === 'all' ? 'ALL' : days === 365 ? '1Y' : days === 180 ? '6M' : days === 90 ? '90D' : '30D'}
              </button>
            ))}
          </div>

          {/* Legend indicators */}
          <div className="flex items-center space-x-4 text-[10px] font-mono">
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
      </div>

      {/* SVG Canvas wrapper */}
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
          {filteredTimeline.map((day, idx) => {
            if (idx % labelInterval === 0 || idx === filteredTimeline.length - 1) {
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
          {hoveredDay && isHoveredDayInFiltered && (
            <line
              x1={getX(filteredTimeline.indexOf(hoveredDay))}
              y1={paddingTop}
              x2={getX(filteredTimeline.indexOf(hoveredDay))}
              y2={svgHeight - paddingBottom}
              stroke="var(--text-muted)"
              strokeDasharray="2 2"
              strokeWidth="1"
              opacity="0.4"
            />
          )}

          {/* Hover Node Dots */}
          {hoveredDay && isHoveredDayInFiltered && (
            <>
              <circle
                cx={getX(filteredTimeline.indexOf(hoveredDay))}
                cy={getY(hoveredDay.ctl)}
                r="4"
                fill="var(--chart-fitness)"
                stroke="var(--bg-card)"
                strokeWidth="2"
              />
              <circle
                cx={getX(filteredTimeline.indexOf(hoveredDay))}
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
        {hoveredDay && isHoveredDayInFiltered && (
          <div
            className="absolute z-10 pointer-events-none dash-card p-3 w-48 bg-bg-card/95 backdrop-blur-sm border border-border-primary"
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
      {hoveredDay && isHoveredDayInFiltered ? (
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
