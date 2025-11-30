import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import type { DerivAccount } from '@/types/deriv';
import { DERIV_APP_ID, REDIRECT_URI } from '@/config';

const OAUTH_STATE_COOKIE_NAME = "deriv_oauth_state";
const OAUTH_TOKEN_COOKIE_NAME = "deriv_oauth_token";
const ACCOUNTS_COOKIE_NAME = "deriv_accounts";
const SELECTED_ACCOUNT_COOKIE_NAME = "deriv_selected_account";


export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = cookies();
  const savedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;

  // 1. CRITICAL: Validate State
  if (!state || !savedState || state !== savedState) {
    console.error("OAuth state mismatch. Possible CSRF attack.", { urlState: state, cookieState: savedState });
    cookieStore.delete(OAUTH_STATE_COOKIE_NAME);
    const errorUrl = new URL('/login', req.url);
    errorUrl.searchParams.set('error', 'state_mismatch');
    return NextResponse.redirect(errorUrl);
  }

  cookieStore.delete(OAUTH_STATE_COOKIE_NAME);

  if (!code) {
      console.error("Authorization code missing from callback");
      const errorUrl = new URL('/login', req.url);
      errorUrl.searchParams.set('error', 'auth_failed');
      return NextResponse.redirect(errorUrl);
  }

  try {
    // 2. Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth.deriv.com/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: DERIV_APP_ID,
            // The client_secret should be stored as an environment variable and not hardcoded
            client_secret: process.env.DERIV_CLIENT_SECRET || '', 
            redirect_uri: REDIRECT_URI,
        }),
    });
    
    if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.text();
        console.error("Failed to exchange code for token:", errorBody);
        const errorUrl = new URL('/login', req.url);
        errorUrl.searchParams.set('error', 'token_exchange_failed');
        return NextResponse.redirect(errorUrl);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, loginid_list } = tokenData;
    
    if (!access_token || !loginid_list) {
         console.error("Token or account list missing from token exchange response");
         const errorUrl = new URL('/login', req.url);
         errorUrl.searchParams.set('error', 'auth_failed');
         return NextResponse.redirect(errorUrl);
    }

    const accounts: DerivAccount[] = loginid_list.map((acc: any) => ({
        loginid: acc.loginid,
        is_virtual: acc.is_virtual,
        currency: acc.currency,
        account_type: acc.account_type,
        account_category: acc.account_category,
        is_disabled: acc.is_disabled,
        created_at: acc.created_at,
        landing_company_name: acc.landing_company_name
    }));

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
        sameSite: 'lax',
    } as const;

    cookieStore.set(OAUTH_TOKEN_COOKIE_NAME, access_token, cookieOptions);
    cookieStore.set(ACCOUNTS_COOKIE_NAME, JSON.stringify(accounts), cookieOptions);

    const accountToSelect = accounts.find(acc => !acc.is_virtual) || accounts[0];
    if (accountToSelect) {
        cookieStore.set(SELECTED_ACCOUNT_COOKIE_NAME, JSON.stringify(accountToSelect), cookieOptions);
    }
    
    return NextResponse.redirect(new URL('/', req.url));

  } catch (error) {
    console.error("Error processing callback:", error);
    const errorUrl = new URL('/login', req.url);
    errorUrl.searchParams.set('error', 'callback_processing_failed');
    return NextResponse.redirect(errorUrl);
  }
}
