import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import {
  extractBestEfforts,
  generatePredictions,
  calculateFitnessMetrics,
  getHRZoneDistribution,
  ActivityData
} from '@/lib/strava-calculations';

// Mock/Demo data generator in case no athlete is logged in or for testing
function getMockDashboardData() {
  const now = new Date();
  const activities: ActivityData[] = [];
  const baseDate = new Date(now);
  baseDate.setDate(baseDate.getDate() - 120); // 4 months ago

  // Generate 120 days of training data with progressive running fitness
  for (let i = 0; i < 120; i++) {
    const currentDate = new Date(baseDate);
    currentDate.setDate(baseDate.getDate() + i);

    // Run 3-4 times a week, gradually increasing length
    const isRestDay = i % 7 === 0 || i % 7 === 2 || i % 7 === 5;
    if (!isRestDay) {
      const baseDistance = 5000 + Math.floor(i / 10) * 800; // start at 5k, build to 15k
      const variance = (Math.random() - 0.5) * 1500;
      const distance = Math.max(3000, baseDistance + variance);
      
      // Target running speed: starts at 4.2 m/s (~4:00/km) and speeds up to 4.7 m/s (~3:30/km)
      const speed = 4.0 + (i / 120) * 0.8 + (Math.random() - 0.5) * 0.4;
      const movingTime = Math.round(distance / speed);

      // Average HR corresponding to speed
      const averageHeartrate = Math.round(135 + (speed - 4.0) * 20 + (Math.random() - 0.5) * 10);
      const relativeEffort = Math.round((movingTime / 60) * (averageHeartrate / 140));

      activities.push({
        id: `mock-act-${i}`,
        name: `Progressive Aerobic Run #${i}`,
        distance,
        movingTime,
        elapsedTime: movingTime + 60,
        totalElevationGain: Math.round((distance / 100) * (Math.random() * 2)),
        type: 'Run',
        startDate: currentDate.toISOString(),
        averageSpeed: speed,
        maxSpeed: speed * 1.2,
        averageHeartrate,
        maxHeartrate: averageHeartrate + 20,
        relativeEffort,
      });
    }
  }

  const bestEfforts = extractBestEfforts(activities);
  const predictions = generatePredictions(bestEfforts);
  const fitnessTimeline = calculateFitnessMetrics(activities);
  const hrDistribution = getHRZoneDistribution(activities, 190);

  // Filter last 15 activities for raw list
  const recentActivities = [...activities]
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 15);

  // YTD Distance
  const ytdDistance = activities
    .filter(a => new Date(a.startDate).getFullYear() === now.getFullYear())
    .reduce((sum, a) => sum + a.distance, 0);

  return {
    isDemo: true,
    athlete: {
      id: 0,
      username: 'running_pro',
      firstname: 'Demo',
      lastname: 'Athlete',
      profile: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=150',
    },
    metrics: {
      ytdDistance,
      yearlyGoal: 1000000, // 1000 km in meters
      recentActivities,
      bestEfforts,
      predictions,
      fitnessTimeline: fitnessTimeline,
      hrDistribution,
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const athleteIdStr = cookieStore.get('athlete_id')?.value;
    const { searchParams } = new URL(request.url);
    const demoMode = searchParams.get('demo') === 'true';

    if (demoMode || !athleteIdStr) {
      return NextResponse.json(getMockDashboardData());
    }

    const athleteId = parseInt(athleteIdStr, 10);
    const athlete = await db.athlete.findUnique({
      where: { id: athleteId },
    });

    if (!athlete) {
      // Session exists but athlete deleted, clear cookie
      const response = NextResponse.json(getMockDashboardData());
      response.cookies.delete('athlete_id');
      return response;
    }

    // Get all activities for calculations
    const allDbActivities = await db.activity.findMany({
      where: { athleteId },
      orderBy: { startDate: 'desc' },
    });

    if (allDbActivities.length === 0) {
      // If database is empty, return empty stats but with athlete details
      return NextResponse.json({
        isDemo: false,
        athlete: {
          id: athlete.id,
          username: athlete.username,
          firstname: athlete.firstname,
          lastname: athlete.lastname,
          profile: athlete.profile,
        },
        metrics: {
          ytdDistance: 0,
          yearlyGoal: 1000000,
          recentActivities: [],
          bestEfforts: {},
          predictions: [],
          fitnessTimeline: [],
          hrDistribution: { distribution: {}, percentages: {}, totalSeconds: 0 },
        }
      });
    }

    // Format activities for calculations
    const activities: ActivityData[] = allDbActivities.map(act => ({
      id: act.id,
      name: act.name,
      distance: act.distance,
      movingTime: act.movingTime,
      elapsedTime: act.elapsedTime,
      totalElevationGain: act.totalElevationGain,
      type: act.type,
      startDate: act.startDate,
      averageSpeed: act.averageSpeed,
      maxSpeed: act.maxSpeed,
      averageHeartrate: act.averageHeartrate,
      maxHeartrate: act.maxHeartrate,
      relativeEffort: act.relativeEffort,
      rawData: act.rawData,
    }));

    const bestEfforts = extractBestEfforts(activities);
    const predictions = generatePredictions(bestEfforts);
    const fitnessTimeline = calculateFitnessMetrics(activities);
    const hrDistribution = getHRZoneDistribution(activities, 190); // Default Max HR 190

    // Recent activities (limit to 20 for feed list)
    const recentActivities = activities.slice(0, 20);

    // YTD calculation
    const currentYear = new Date().getFullYear();
    const ytdDistance = activities
      .filter(a => new Date(a.startDate).getFullYear() === currentYear)
      .reduce((sum, a) => sum + a.distance, 0);

    return NextResponse.json({
      isDemo: false,
      athlete: {
        id: athlete.id,
        username: athlete.username,
        firstname: athlete.firstname,
        lastname: athlete.lastname,
        profile: athlete.profile,
      },
      metrics: {
        ytdDistance,
        yearlyGoal: 1000000, // 1000 km in meters
        recentActivities,
        bestEfforts,
        predictions,
        fitnessTimeline: fitnessTimeline,
        hrDistribution,
      }
    });
  } catch (err: unknown) {
    console.error('Athlete dashboard fetch failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Database fetch error' },
      { status: 500 }
    );
  }
}
