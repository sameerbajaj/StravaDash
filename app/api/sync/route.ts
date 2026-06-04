import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { syncActivities } from '@/lib/strava-api';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const athleteIdStr = cookieStore.get('athlete_id')?.value;

    if (!athleteIdStr) {
      return NextResponse.json({ error: 'Unauthorized. Athlete is not connected.' }, { status: 401 });
    }

    const athleteId = parseInt(athleteIdStr, 10);
    const { syncedCount } = await syncActivities(athleteId);

    return NextResponse.json({ success: true, syncedCount });
  } catch (err: unknown) {
    console.error('Manual sync failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error during activity sync.' },
      { status: 500 }
    );
  }
}
