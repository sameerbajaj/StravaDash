import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeToken, syncActivities } from '@/lib/strava-api';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Strava OAuth error parameter received:', error);
    return NextResponse.redirect(new URL('/?error=access_denied', request.url));
  }

  if (!code) {
    console.error('No code parameter found in OAuth redirect');
    return NextResponse.redirect(new URL('/?error=missing_code', request.url));
  }

  try {
    // Exchange token
    const tokenData = await exchangeToken(code);
    const { athlete, access_token, refresh_token, expires_at } = tokenData;

    // Upsert Athlete in Database
    await db.athlete.upsert({
      where: { id: athlete.id },
      update: {
        username: athlete.username,
        firstname: athlete.firstname,
        lastname: athlete.lastname,
        profile: athlete.profile,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expires_at,
      },
      create: {
        id: athlete.id,
        username: athlete.username,
        firstname: athlete.firstname,
        lastname: athlete.lastname,
        profile: athlete.profile,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expires_at,
      },
    });

    // Run initial sync of activities
    try {
      await syncActivities(athlete.id);
    } catch (syncErr) {
      // Don't block the user's login if sync fails, just log it (rate limits or networking)
      console.error('Initial activity sync failed during login:', syncErr);
    }

    // Set athlete_id in session cookies
    const cookieStore = await cookies();
    cookieStore.set('athlete_id', String(athlete.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.redirect(new URL('/?success=connected', request.url));
  } catch (err: unknown) {
    console.error('Error during Strava OAuth callback processing:', err);
    const errMsg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.redirect(new URL(`/?error=auth_failed&message=${encodeURIComponent(errMsg)}`, request.url));
  }
}
