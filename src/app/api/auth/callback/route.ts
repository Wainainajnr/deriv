import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import type { DerivAccount } from '@/types/deriv';

const OAUTH_STATE_COOKIE_NAME = "deriv_oauth_state";
const OAUTH_TOKEN_COOKIE_NAME = "deriv_oauth_token";
const ACCOUNTS_COOKIE_NAME = "deriv_accounts";
const SELECTED_ACCOUNT_COOKIE_NAME = "deriv_selected_account";
const SIM_MODE_COOKIE_NAME = "deriv_sim_mode";


export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get("access_token");
  const accountListStr = searchParams.get("loginid_list");
  const state = searchParams.get("state");

  const cookieStore = cookies();
  const savedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;

  // 1. CRITICAL: Validate State
  if (!state || !savedState || state !== savedState) {
    console.error("OAuth state mismatch. Possible CSRF attack.", { urlState: state, cookieState: savedState });
    // Clear the invalid state cookie
    cookieStore.delete(OAUTH_STATE_COOKIE_NAME);
    // Return an error response that the client can handle
    return NextResponse.json({ error: "state_mismatch" }, { status: 400 });
  }

  // State is valid, clear it immediately to prevent reuse
  cookieStore.delete(OAUTH_STATE_COOKIE_NAME);

  if (!token || !accountListStr) {
      console.error("Token or account list missing from callback");
      return NextResponse.json({ error: "auth_failed" }, { status: 400 });
  }

  try {
    const accounts: DerivAccount[] = accountListStr.split('+').map(accStr => {
        const [loginid, accountType, currency] = accStr.split(':');
        const isVirtual = accountType === 'demo' ? 1 : 0;
        return {
            loginid,
            is_virtual: isVirtual,
            currency,
            account_type: accountType,
            account_category: isVirtual ? 'demo' : 'real',
            is_disabled: 0,
            created_at: 0,
            landing_company_name: '' // This info is not in the callback, will be populated later
        };
    });

    // Securely set cookies for the session
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
        sameSite: 'lax',
    } as const;

    cookieStore.set(OAUTH_TOKEN_COOKIE_NAME, token, cookieOptions);
    cookieStore.set(ACCOUNTS_COOKIE_NAME, JSON.stringify(accounts), cookieOptions);

    // Select the first real account, or the first account if none are real
    const accountToSelect = accounts.find(acc => !acc.is_virtual) || accounts[0];
    if (accountToSelect) {
        cookieStore.set(SELECTED_ACCOUNT_COOKIE_NAME, JSON.stringify(accountToSelect), cookieOptions);
    }
    
    // User has logged in, so simulation mode should be off
    cookieStore.set(SIM_MODE_COOKIE_NAME, 'false', cookieOptions);

    // Return a success response. The client will then redirect.
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error processing callback:", error);
    return NextResponse.json({ error: "callback_processing_failed" }, { status: 500 });
  }
}
