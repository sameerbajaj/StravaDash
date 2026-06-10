import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { ActivityData } from '@/lib/strava-calculations';

// Simple CSV escaper
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  let str = String(val);
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Generate demo activities matching the structure of real db activities
function getDemoActivities(): any[] {
  const now = new Date();
  const activities = [];
  const baseDate = new Date(now);
  baseDate.setDate(baseDate.getDate() - 120);

  for (let i = 0; i < 120; i++) {
    const currentDate = new Date(baseDate);
    currentDate.setDate(baseDate.getDate() + i);

    const isRestDay = i % 7 === 0 || i % 7 === 2 || i % 7 === 5;
    if (!isRestDay) {
      const distance = 5000 + Math.floor(i / 10) * 800 + (Math.random() - 0.5) * 1500;
      const speed = 4.0 + (i / 120) * 0.8 + (Math.random() - 0.5) * 0.4;
      const movingTime = Math.round(distance / speed);
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
        startDate: currentDate,
        averageSpeed: speed,
        maxSpeed: speed * 1.2,
        averageHeartrate,
        maxHeartrate: averageHeartrate + 20,
        relativeEffort,
        averageCadence: 170 + Math.floor(Math.random() * 10),
        calories: Math.round((distance / 1000) * 65),
        rawData: JSON.stringify({ note: 'Demo activity' })
      });
    }
  }
  return activities;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const athleteIdStr = cookieStore.get('athlete_id')?.value;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const useDemo = searchParams.get('demo') === 'true' || !athleteIdStr;

    let athleteInfo = {
      id: 0,
      username: 'demo_athlete',
      firstname: 'Demo',
      lastname: 'Athlete',
    };

    let dbActivities: any[] = [];

    if (useDemo) {
      dbActivities = getDemoActivities();
    } else {
      const athleteId = parseInt(athleteIdStr!, 10);
      const athlete = await db.athlete.findUnique({
        where: { id: athleteId },
      });

      if (!athlete) {
        return NextResponse.json({ error: 'Athlete not found.' }, { status: 404 });
      }

      athleteInfo = {
        id: athlete.id,
        username: athlete.username || '',
        firstname: athlete.firstname || '',
        lastname: athlete.lastname || '',
      };

      dbActivities = await db.activity.findMany({
        where: { athleteId },
        orderBy: { startDate: 'desc' },
      });
    }

    const filenamePrefix = `${athleteInfo.firstname.toLowerCase()}_${athleteInfo.lastname.toLowerCase()}_stravadash`;

    // 1. JSON Format
    if (format === 'json') {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        isDemo: useDemo,
        athlete: athleteInfo,
        activities: dbActivities.map(act => {
          let parsedRaw = {};
          try {
            parsedRaw = JSON.parse(act.rawData);
          } catch (e) {
            parsedRaw = { error: 'Failed to parse raw data', raw: act.rawData };
          }
          return {
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
            averageCadence: act.averageCadence,
            calories: act.calories,
            rawData: parsedRaw,
          };
        }),
      };

      return new NextResponse(JSON.stringify(exportPayload, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filenamePrefix}_backup.json"`,
        },
      });
    }

    // 2. CSV Format
    if (format === 'csv') {
      const headers = [
        'Activity ID', 'Name', 'Type', 'Start Date', 'Distance (m)', 'Distance (km)',
        'Moving Time (s)', 'Elapsed Time (s)', 'Elevation Gain (m)',
        'Average Speed (m/s)', 'Max Speed (m/s)', 'Average Heartrate',
        'Max Heartrate', 'Relative Effort (Suffer Score)', 'Average Cadence', 'Calories'
      ];

      const csvRows = [headers.join(',')];

      for (const act of dbActivities) {
        const row = [
          escapeCsv(act.id),
          escapeCsv(act.name),
          escapeCsv(act.type),
          escapeCsv(new Date(act.startDate).toISOString()),
          escapeCsv(act.distance),
          escapeCsv((act.distance / 1000).toFixed(2)),
          escapeCsv(act.movingTime),
          escapeCsv(act.elapsedTime),
          escapeCsv(act.totalElevationGain),
          escapeCsv(act.averageSpeed?.toFixed(2)),
          escapeCsv(act.maxSpeed?.toFixed(2)),
          escapeCsv(act.averageHeartrate),
          escapeCsv(act.maxHeartrate),
          escapeCsv(act.relativeEffort),
          escapeCsv(act.averageCadence),
          escapeCsv(act.calories),
        ];
        csvRows.push(row.join(','));
      }

      const csvString = csvRows.join('\r\n');

      return new NextResponse(csvString, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filenamePrefix}_activities.csv"`,
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported format. Use json or csv.' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Export failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error during export' },
      { status: 500 }
    );
  }
}
