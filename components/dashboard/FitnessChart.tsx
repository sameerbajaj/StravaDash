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
      <div className="chrono-card p-6 rounded-lg h-80 flex flex-col items-center justify-center text-slate-text">
        <AlertCircle className="h-8 w-8 mb-2 text-slate-500" />
        <span className="text-sm font-mono uppercase tracking-wider">No Fitness Curve Data Available</span>
        <span className="text-[10px] text-slate-text/70 mt-1">Sync your runs to calculate load trends.</span>
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
    if (tsb > 10) return { label: 'Fresh / Tapering', color: 'text-volt border-volt/20 bg-volt/5' };
    if (tsb >= -10 && tsb <= 10) return { label: 'Optimal / Productive', color: 'text-green-400 border-green-500/20 bg-green-500/5' };
    if (tsb >= -30 && tsb < -10) return { label: 'Overload / Straining', color: 'text-orange border-orange/20 bg-orange/5' };
    return { label: 'Overreaching / Burnout Warning', color: 'text-red-500 border-red-500/20 bg-red-500/5' };
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
    <div ref={containerRef} className="chrono-card p-6 rounded-lg relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-extrabold tracking-widest text-white uppercase flex items-center gap-2">
            Fitness, Fatigue & Form <span className="text-[10px] font-mono text-slate-text bg-white/5 border border-white/10 px-1.5 py-0.5 rounded tracking-normal">BANISTER MODEL</span>
          </h2>
          <p className="text-xs text-slate-text mt-1">
            Tracking your CTL (Fitness), ATL (Fatigue), and TSB (Form) based on relative cardio stress scores.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-[10px] font-mono mt-4 md:mt-0">
          <div className="flex items-center space-x-1.5">
            <span className="h-1.5 w-4 bg-volt rounded shadow-[0_0_5px_var(--volt)]" />
            <span className="text-white">FITNESS (CTL)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-1.5 w-4 bg-orange rounded shadow-[0_0_5px_var(--orange)]" />
            <span className="text-white">FATIGUE (ATL)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-1.5 w-4 bg-white/20 border border-white/40 rounded" />
            <span className="text-white">FORM (TSB)</span>
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
            <filter id="volt-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* ATL Glow Filter */}
            <filter id="orange-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* TSB Area Gradient */}
            <linearGradient id="tsb-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
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
                stroke="rgba(255,255,255,0.03)"
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
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1.5"
          />

          {/* TSB Area */}
          <path d={tsbAreaPath} fill="url(#tsb-gradient)" />

          {/* ATL (Fatigue) Line */}
          <path
            d={atlPath}
            fill="none"
            stroke="var(--orange)"
            strokeWidth="2.5"
            filter="url(#orange-glow)"
          />

          {/* CTL (Fitness) Line */}
          <path
            d={ctlPath}
            fill="none"
            stroke="var(--volt)"
            strokeWidth="3"
            filter="url(#volt-glow)"
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
                  fill="#71717a"
                  fontSize="10"
                  fontFamily="Share Tech Mono"
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
              stroke="rgba(255, 255, 255, 0.15)"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
          )}

          {/* Hover Node Dots */}
          {hoveredDay && (
            <>
              <circle
                cx={getX(timeline.indexOf(hoveredDay))}
                cy={getY(hoveredDay.ctl)}
                r="5"
                fill="var(--volt)"
                stroke="#000"
                strokeWidth="1.5"
              />
              <circle
                cx={getX(timeline.indexOf(hoveredDay))}
                cy={getY(hoveredDay.atl)}
                r="5"
                fill="var(--orange)"
                stroke="#000"
                strokeWidth="1.5"
              />
            </>
          )}
        </svg>

        {/* Dynamic Tooltip Element */}
        {hoveredDay && (
          <div
            className="absolute z-10 pointer-events-none chrono-card p-3 rounded border border-white/10 text-xs font-mono w-48 shadow-xl"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            <p className="border-b border-white/5 pb-1 mb-1 text-slate-text font-bold">
              {new Date(hoveredDay.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-volt">FITNESS (CTL):</span>
              <span className="text-white font-bold">{hoveredDay.ctl}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-orange">FATIGUE (ATL):</span>
              <span className="text-white font-bold">{hoveredDay.atl}</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-white/5 pb-1 mb-1">
              <span className="text-slate-text">FORM (TSB):</span>
              <span className={`font-bold ${hoveredDay.tsb >= 0 ? 'text-volt' : 'text-red-500'}`}>
                {hoveredDay.tsb > 0 ? `+${hoveredDay.tsb}` : hoveredDay.tsb}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-text text-[10px]">DAILY STRESS:</span>
              <span className="text-white font-bold">{hoveredDay.stress}</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Day Status Dashboard */}
      {hoveredDay ? (
        <div className={`mt-4 border rounded p-3 flex items-center justify-between text-xs transition-all ${getFormStatus(hoveredDay.tsb).color}`}>
          <div className="flex items-center space-x-2">
            <Shield className="h-4.5 w-4.5" />
            <div>
              <span className="font-bold">Athlete Status: </span>
              <span>{getFormStatus(hoveredDay.tsb).label}</span>
            </div>
          </div>
          <span className="text-[10px] font-mono">TSB: {hoveredDay.tsb}</span>
        </div>
      ) : (
        <div className="mt-4 border border-white/5 rounded p-3 flex items-center justify-between text-xs text-slate-text bg-white/[0.01]">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4.5 w-4.5 text-volt animate-pulse" />
            <span>Hover or move cursor over the fitness curve chart to inspect historical metrics.</span>
          </div>
        </div>
      )}
    </div>
  );
}
