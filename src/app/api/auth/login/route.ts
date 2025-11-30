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

    // Store state in a secure, httpOnly cookie
    cookies().set(OAUTH_STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
      sameSite: 'lax',
    });

    const params = new URLSearchParams({
      app_id: DERIV_APP_ID,
      l: "EN",
      state: state,
      // This is the *client-side* callback, which will then call our *server-side* callback
      redirect_uri: REDIRECT_URI, 
      scope: 'read trade trading_information',
      response_type: 'code' // Use Authorization Code Flow
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
