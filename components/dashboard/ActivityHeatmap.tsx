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
    if (meters === 0) return 'bg-bg-elevated border border-border-subtle hover:bg-bg-card-hover';
    if (meters < 5000) return 'bg-accent-warm/20 border border-accent-warm/10 hover:bg-accent-warm/30';
    if (meters < 10000) return 'bg-accent-warm/40 border border-accent-warm/20 hover:bg-accent-warm/50';
    if (meters < 15000) return 'bg-accent-cool/40 border border-accent-cool/20 hover:bg-accent-cool/50';
    return 'bg-accent-cool border border-accent-cool/40 hover:bg-accent-cool/90';
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="dash-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title flex items-center gap-3">
          Weekly Consistency Matrix
          <span className="badge">DAILY FREQUENCY</span>
        </h2>
        <CalendarRange className="h-4.5 w-4.5 text-accent-warm" />
      </div>

      <div className="flex items-start space-x-3 overflow-x-auto pb-2 scrollbar-thin">
        {/* Weekdays indicator */}
        <div className="grid grid-rows-7 gap-1.5 text-[8px] font-mono text-text-muted pt-5 pr-1 select-none">
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
                <div className="h-4 text-[8px] font-mono text-text-muted absolute -top-5 left-0 whitespace-nowrap">
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
      <div className="flex items-center justify-between mt-4 text-[9px] font-mono text-text-muted border-t border-border-subtle pt-4">
        <span>Showing training occurrences over the last 18 weeks</span>
        <div className="flex items-center space-x-1.5">
          <span>Less</span>
          <div className="h-2.5 w-2.5 rounded bg-bg-elevated border border-border-subtle" />
          <div className="h-2.5 w-2.5 rounded bg-accent-warm/20" />
          <div className="h-2.5 w-2.5 rounded bg-accent-warm/40" />
          <div className="h-2.5 w-2.5 rounded bg-accent-cool/40" />
          <div className="h-2.5 w-2.5 rounded bg-accent-cool" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
