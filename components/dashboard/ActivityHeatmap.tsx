'use client';

import { ActivityData } from '@/lib/strava-calculations';
import { CalendarRange } from 'lucide-react';

interface ActivityHeatmapProps {
  activities: ActivityData[];
}

export default function ActivityHeatmap({ activities }: ActivityHeatmapProps) {
  // We want to draw a grid representing the last 18 weeks
  const totalWeeks = 18;
  const totalDays = totalWeeks * 7;

  // Generate date array for the last 126 days ending today, aligned to start on Sunday
  const today = new Date();
  const endOffset = today.getDay(); // days since Sunday
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - endOffset)); // align to end of current week (Saturday)

  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - totalDays + 1);

  const days: { date: Date; dateStr: string; distance: number; runCount: number }[] = [];

  // Initialize days
  const iter = new Date(startDate);
  while (iter <= endDate) {
    days.push({
      date: new Date(iter),
      dateStr: iter.toISOString().split('T')[0],
      distance: 0,
      runCount: 0,
    });
    iter.setDate(iter.getDate() + 1);
  }

  // Populate activities
  activities.forEach(act => {
    if (act.type !== 'Run') return;
    const actDateStr = new Date(act.startDate).toISOString().split('T')[0];
    const dayObj = days.find(d => d.dateStr === actDateStr);
    if (dayObj) {
      dayObj.distance += act.distance;
      dayObj.runCount += 1;
    }
  });

  // Group into columns (weeks)
  const weeks: typeof days[] = [];
  for (let w = 0; w < totalWeeks; w++) {
    weeks.push(days.slice(w * 7, (w + 1) * 7));
  }

  // Helper for color intensity scaling
  const getColorClass = (meters: number) => {
    if (meters === 0) return 'bg-white/[0.03] border border-white/[0.01] hover:bg-white/10';
    if (meters < 5000) return 'bg-orange/20 border border-orange/10 shadow-[0_0_4px_rgba(255,75,0,0.1)] hover:bg-orange/30';
    if (meters < 10000) return 'bg-orange/50 border border-orange/20 shadow-[0_0_6px_rgba(255,75,0,0.2)] hover:bg-orange/60';
    if (meters < 15000) return 'bg-volt/40 border border-volt/20 shadow-[0_0_6px_rgba(210,255,0,0.2)] hover:bg-volt/50';
    return 'bg-volt border border-volt/40 shadow-[0_0_8px_rgba(210,255,0,0.4)] hover:bg-volt/90';
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="chrono-card p-6 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-extrabold tracking-widest text-white uppercase flex items-center gap-2">
          Weekly Consistency Matrix <span className="text-[10px] font-mono text-slate-text bg-white/5 border border-white/10 px-1.5 py-0.5 rounded tracking-normal">DAILY FREQUENCY</span>
        </h2>
        <CalendarRange className="h-4.5 w-4.5 text-orange" />
      </div>

      <div className="flex items-start space-x-3 overflow-x-auto pb-2 scrollbar-thin">
        {/* Weekdays indicator */}
        <div className="grid grid-rows-7 gap-1.5 text-[8px] font-mono text-slate-text/70 pt-5 pr-1 select-none">
          {weekdays.map((day, idx) => (
            <div key={day} className="h-3 w-5 flex items-center justify-start">
              {idx % 2 === 1 ? day : ''}
            </div>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div className="flex gap-1.5">
          {weeks.map((week, wIdx) => {
            const firstDayOfWeek = week[0].date;
            const showMonth = firstDayOfWeek.getDate() <= 7;
            const monthLabel = firstDayOfWeek.toLocaleDateString('en-US', { month: 'short' });

            return (
              <div key={wIdx} className="flex flex-col space-y-1.5 relative">
                {/* Month label */}
                <div className="h-4 text-[8px] font-mono text-slate-text/60 absolute -top-5 left-0 whitespace-nowrap">
                  {showMonth ? monthLabel : ''}
                </div>

                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    className={`h-3 w-3 rounded transition-all duration-300 ${getColorClass(day.distance)}`}
                    title={`${day.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}: ${day.distance > 0 ? `${(day.distance / 1000).toFixed(1)} km run` : 'Rest day'}`}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 text-[9px] font-mono text-slate-text border-t border-white/5 pt-4">
        <span>Showing training occurrences over the last 18 weeks</span>
        <div className="flex items-center space-x-1.5">
          <span>Less</span>
          <div className="h-2.5 w-2.5 rounded bg-white/[0.03]" />
          <div className="h-2.5 w-2.5 rounded bg-orange/20" />
          <div className="h-2.5 w-2.5 rounded bg-orange/50" />
          <div className="h-2.5 w-2.5 rounded bg-volt/40" />
          <div className="h-2.5 w-2.5 rounded bg-volt" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
