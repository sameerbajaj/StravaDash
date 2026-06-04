import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = process.env.STRAVA_REDIRECT_URI || 'http://localhost:3000/auth/callback';

  if (!clientId) {
    return NextResponse.json({ 
      configured: false,
      message: 'Strava Client ID is not configured on the server. Please set it in your environment variables.'
    });
  }

  const url = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=activity:read_all,profile:read_all`;

  return NextResponse.json({ 
    configured: true, 
    url 
  });
}
