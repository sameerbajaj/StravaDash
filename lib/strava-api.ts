import { db } from './db';

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;


export interface TokenExchangeResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete: {
    id: number;
    username: string | null;
    firstname: string;
    lastname: string;
    profile: string | null;
  };
}

// Exchange authorization code for tokens
export async function exchangeToken(code: string): Promise<TokenExchangeResponse> {
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
    throw new Error('Strava Client ID or Client Secret is not configured in environment.');
  }

  const response = await fetch('https://www.strava.com/api/v3/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Strava token exchange failed: ${errText}`);
  }

  return response.json();
}

// Refresh athlete tokens if expired
export async function getValidAccessToken(athleteId: number): Promise<string> {
  const athlete = await db.athlete.findUnique({
    where: { id: athleteId },
  });

  if (!athlete) {
    throw new Error(`Athlete with ID ${athleteId} not found in database.`);
  }

  const now = Math.floor(Date.now() / 1000);
  // If token is still valid for at least 5 minutes, return it
  if (athlete.expiresAt > now + 300) {
    return athlete.accessToken;
  }

  // Refresh token
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
    throw new Error('Strava Client ID or Client Secret is not configured in environment.');
  }

  const response = await fetch('https://www.strava.com/api/v3/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: athlete.refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh Strava token: ${await response.text()}`);
  }

  const data = await response.json();

  // Update athlete in database
  await db.athlete.update({
    where: { id: athleteId },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
    },
  });

  return data.access_token;
}

// Sync activities from Strava to database
export async function syncActivities(athleteId: number): Promise<{ syncedCount: number }> {
  const accessToken = await getValidAccessToken(athleteId);

  // Find the latest activity in database to do incremental fetching
  const latestActivity = await db.activity.findFirst({
    where: { athleteId },
    orderBy: { startDate: 'desc' },
  });

  let page = 1;
  const perPage = 200;
  let hasMore = true;
  let syncedCount = 0;

  // If we have existing activities, fetch only activities since the latest one's start date
  const afterTimestamp = latestActivity
    ? Math.floor(new Date(latestActivity.startDate).getTime() / 1000)
    : undefined;

  while (hasMore) {
    let url = `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`;
    if (afterTimestamp) {
      url += `&after=${afterTimestamp}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch activities: ${await response.text()}`);
    }

    const activities = await response.json();

    if (!Array.isArray(activities) || activities.length === 0) {
      hasMore = false;
      break;
    }

    for (const act of activities) {
      // Upsert activity
      await db.activity.upsert({
        where: { id: String(act.id) },
        update: {
          name: act.name,
          distance: act.distance,
          movingTime: act.moving_time,
          elapsedTime: act.elapsed_time,
          totalElevationGain: act.total_elevation_gain,
          type: act.type,
          startDate: new Date(act.start_date),
          startDateLocal: new Date(act.start_date_local),
          timezone: act.timezone,
          averageSpeed: act.average_speed,
          maxSpeed: act.max_speed,
          averageCadence: act.average_cadence,
          averageHeartrate: act.average_heartrate,
          maxHeartrate: act.max_heartrate,
          calories: act.calories,
          relativeEffort: act.suffer_score || act.relative_effort,
          prCount: act.pr_count || 0,
          effortCount: act.effort_count || 0,
          deviceName: act.device_name,
          mapPolyline: act.map?.summary_polyline || null,
          rawData: JSON.stringify(act),
        },
        create: {
          id: String(act.id),
          athleteId,
          name: act.name,
          distance: act.distance,
          movingTime: act.moving_time,
          elapsedTime: act.elapsed_time,
          totalElevationGain: act.total_elevation_gain,
          type: act.type,
          startDate: new Date(act.start_date),
          startDateLocal: new Date(act.start_date_local),
          timezone: act.timezone,
          averageSpeed: act.average_speed,
          maxSpeed: act.max_speed,
          averageCadence: act.average_cadence,
          averageHeartrate: act.average_heartrate,
          maxHeartrate: act.max_heartrate,
          calories: act.calories,
          relativeEffort: act.suffer_score || act.relative_effort,
          prCount: act.pr_count || 0,
          effortCount: act.effort_count || 0,
          deviceName: act.device_name,
          mapPolyline: act.map?.summary_polyline || null,
          rawData: JSON.stringify(act),
        },
      });
      syncedCount++;
    }

    if (activities.length < perPage) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return { syncedCount };
}
