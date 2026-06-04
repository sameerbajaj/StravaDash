export interface ActivityData {
  id: string;
  name: string;
  distance: number; // in meters
  movingTime: number; // in seconds
  elapsedTime: number; // in seconds
  totalElevationGain: number; // in meters
  type: string;
  startDate: Date | string;
  averageSpeed: number; // m/s
  maxSpeed: number; // m/s
  averageHeartrate?: number | null;
  maxHeartrate?: number | null;
  relativeEffort?: number | null; // Suffer Score
}

// Convert m/s to Pace (min/km)
export function speedToPaceMinKm(speedMps: number): string {
  if (speedMps <= 0) return '--:--';
  const paceSecondsPerKm = 1000 / speedMps;
  const minutes = Math.floor(paceSecondsPerKm / 60);
  const seconds = Math.floor(paceSecondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Convert seconds to readable duration (e.g. 1h 24m 05s)
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }
  return `${m}m ${s}s`;
}

// Calculate Heart Rate Zones
export interface HRZoneDefinition {
  min: number;
  max: number;
  name: string;
}

export interface HRZones {
  z1: HRZoneDefinition;
  z2: HRZoneDefinition;
  z3: HRZoneDefinition;
  z4: HRZoneDefinition;
  z5: HRZoneDefinition;
}

export function calculateHRZones(maxHR: number): HRZones {
  return {
    z1: { name: 'Active Recovery', min: Math.round(maxHR * 0.5), max: Math.round(maxHR * 0.6) - 1 },
    z2: { name: 'Aerobic / Endurance', min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7) - 1 },
    z3: { name: 'Tempo / Steady State', min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.8) - 1 },
    z4: { name: 'Threshold / Hard', min: Math.round(maxHR * 0.8), max: Math.round(maxHR * 0.9) - 1 },
    z5: { name: 'Anaerobic / VO2 Max', min: Math.round(maxHR * 0.9), max: maxHR },
  };
}

// Group training distribution based on activity heart rates
export function getHRZoneDistribution(activities: ActivityData[], maxHR: number) {
  const zones = calculateHRZones(maxHR);
  const distribution = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };

  activities.forEach(act => {
    if (!act.averageHeartrate || act.type !== 'Run') return;
    const hr = act.averageHeartrate;
    const duration = act.movingTime;

    if (hr < zones.z1.min) return;
    if (hr < zones.z1.max) distribution.z1 += duration;
    else if (hr < zones.z2.max) distribution.z2 += duration;
    else if (hr < zones.z3.max) distribution.z3 += duration;
    else if (hr < zones.z4.max) distribution.z4 += duration;
    else distribution.z5 += duration;
  });

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  return {
    distribution,
    percentages: {
      z1: total ? Math.round((distribution.z1 / total) * 100) : 0,
      z2: total ? Math.round((distribution.z2 / total) * 100) : 0,
      z3: total ? Math.round((distribution.z3 / total) * 100) : 0,
      z4: total ? Math.round((distribution.z4 / total) * 100) : 0,
      z5: total ? Math.round((distribution.z5 / total) * 100) : 0,
    },
    totalSeconds: total
  };
}

// Find Personal Best Efforts from Summary Data
export interface BestEffort {
  distanceLabel: string;
  distanceMeters: number;
  timeSeconds: number;
  paceMps: number;
  activityName: string;
  activityId: string;
  date: Date;
}

export function extractBestEfforts(activities: ActivityData[]): Record<string, BestEffort | null> {
  const targets = [
    { label: '400m', meters: 400 },
    { label: '800m', meters: 800 },
    { label: '1K', meters: 1000 },
    { label: '1 Mile', meters: 1609.34 },
    { label: '5K', meters: 5000 },
    { label: '10K', meters: 10000 },
    { label: 'Half Marathon', meters: 21097.5 },
    { label: 'Marathon', meters: 42195 },
  ];

  const bests: Record<string, BestEffort | null> = {};
  targets.forEach(t => {
    bests[t.label] = null;
  });

  const runs = activities.filter(a => a.type === 'Run');

  runs.forEach(run => {
    targets.forEach(target => {
      // If the activity distance is equal to or slightly larger than target distance
      if (run.distance >= target.meters) {
        // Estimate the time for the exact distance using the run's average pace
        // This is a summary approximation when exact streams are not cached
        const estimatedTime = (target.meters / run.distance) * run.movingTime;
        const currentBest = bests[target.label];

        if (!currentBest || estimatedTime < currentBest.timeSeconds) {
          bests[target.label] = {
            distanceLabel: target.label,
            distanceMeters: target.meters,
            timeSeconds: estimatedTime,
            paceMps: target.meters / estimatedTime,
            activityName: run.name,
            activityId: run.id,
            date: new Date(run.startDate),
          };
        }
      }
    });
  });

  return bests;
}

// Riegel Performance Predictions
// T2 = T1 * (D2 / D1)^1.06
export interface Prediction {
  distanceLabel: string;
  predictedTime: number; // in seconds
  predictedPace: string; // min/km
}

export function generatePredictions(bestEfforts: Record<string, BestEffort | null>): Prediction[] {
  // Find baseline: prefer 5K or 10K, fallback to any available
  const baselinePriorities = ['5K', '10K', '1 Mile', '1K', 'Half Marathon'];
  let baseline: BestEffort | null = null;

  for (const label of baselinePriorities) {
    if (bestEfforts[label]) {
      baseline = bestEfforts[label];
      break;
    }
  }

  if (!baseline) return [];

  const targets = [
    { label: '5K', meters: 5000 },
    { label: '10K', meters: 10000 },
    { label: 'Half Marathon', meters: 21097.5 },
    { label: 'Marathon', meters: 42195 },
  ];

  return targets.map(t => {
    const d1 = baseline!.distanceMeters;
    const t1 = baseline!.timeSeconds;
    const d2 = t.meters;

    const predictedTime = t1 * Math.pow(d2 / d1, 1.06);
    const paceMps = d2 / predictedTime;

    return {
      distanceLabel: t.label,
      predictedTime,
      predictedPace: speedToPaceMinKm(paceMps)
    };
  });
}

// Calculate Fitness (CTL), Fatigue (ATL), and Form (TSB)
// CTL_t = CTL_{t-1} * exp(-1/42) + Stress * (1 - exp(-1/42))
// ATL_t = ATL_{t-1} * exp(-1/7)  + Stress * (1 - exp(-1/7))
// TSB_t = CTL_{t-1} - ATL_{t-1}
export interface FitnessDay {
  date: string; // YYYY-MM-DD
  ctl: number;
  atl: number;
  tsb: number;
  stress: number;
}

export function calculateFitnessMetrics(activities: ActivityData[]): FitnessDay[] {
  if (activities.length === 0) return [];

  // Sort activities ascending by date
  const sorted = [...activities].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const firstDate = new Date(sorted[0].startDate);
  firstDate.setHours(0, 0, 0, 0);
  const lastDate = new Date(sorted[sorted.length - 1].startDate);
  lastDate.setHours(0, 0, 0, 0);

  // Create a map of daily stress (Relative Effort / Suffer Score or fallback to moving time duration / 60)
  const dailyStress: Record<string, number> = {};
  sorted.forEach(act => {
    const dateStr = new Date(act.startDate).toISOString().split('T')[0];
    // Strava Suffer Score is ideal, fallback to estimated stress based on volume
    const stress = act.relativeEffort || Math.round(act.movingTime / 60) * (act.averageHeartrate ? (act.averageHeartrate / 140) : 1);
    dailyStress[dateStr] = (dailyStress[dateStr] || 0) + stress;
  });

  const fitnessDays: FitnessDay[] = [];
  let ctl = 0;
  let atl = 0;

  // Constants
  const lambdaCTL = Math.exp(-1 / 42);
  const lambdaATL = Math.exp(-1 / 7);

  // Iterate chronologically through each day
  const iter = new Date(firstDate);
  while (iter <= lastDate) {
    const dateStr = iter.toISOString().split('T')[0];
    const stress = dailyStress[dateStr] || 0;

    const prevCTL = ctl;
    const prevATL = atl;

    ctl = prevCTL * lambdaCTL + stress * (1 - lambdaCTL);
    atl = prevATL * lambdaATL + stress * (1 - lambdaATL);
    const tsb = prevCTL - prevATL; // Form is from previous day's load

    fitnessDays.push({
      date: dateStr,
      ctl: Math.round(ctl * 10) / 10,
      atl: Math.round(atl * 10) / 10,
      tsb: Math.round(tsb * 10) / 10,
      stress
    });

    iter.setDate(iter.getDate() + 1);
  }

  return fitnessDays;
}
