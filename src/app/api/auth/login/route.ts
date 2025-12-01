import { NextResponse, type NextRequest } from 'next/server';
import { DERIV_APP_ID, REDIRECT_URI } from '@/config';
import { cookies } from 'next/headers';

const OAUTH_STATE_COOKIE_NAME = "deriv_oauth_state";

export async function GET(req: NextRequest) {
  try {
    // Generate a secure, random state value
    const state =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Store state in a client-accessible cookie for validation on the callback page
    // Using sameSite: 'none' is critical for OAuth flows that involve cross-site redirects
    (await cookies()).set(OAUTH_STATE_COOKIE_NAME, state, {
      httpOnly: false, // Must be readable by client-side JS on the callback page
      secure: true, // Required when using sameSite: 'none'
      maxAge: 60 * 15, // 15 minutes
      path: '/',
      sameSite: 'none', // Required for cross-site OAuth redirects
    });

    const params = new URLSearchParams({
      app_id: DERIV_APP_ID,
      l: "EN",
      state: state,
      redirect_uri: REDIRECT_URI,
      scope: 'read trade trading_information',
      response_type: 'token' // Use Implicit Flow
    });

    const oauthUrl = `https://oauth.deriv.com/oauth2/authorize?${params.toString()}`;

    // Redirect to the Deriv authorization URL
    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    console.error("Error creating login redirect:", error);
    const errorUrl = new URL('/login', req.url);
    errorUrl.searchParams.set('error', 'login_setup_failed');
    return NextResponse.redirect(errorUrl);
  }
}
