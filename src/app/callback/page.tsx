"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getCookie, setCookie, deleteCookie } from 'cookies-next';

const OAUTH_STATE_COOKIE_NAME = "deriv_oauth_state";
const OAUTH_TOKEN_COOKIE_NAME = "deriv_oauth_token";
const ACCOUNTS_COOKIE_NAME = "deriv_accounts";
const SELECTED_ACCOUNT_COOKIE_NAME = "deriv_selected_account";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      const token = params.get("token");
      const loginid_list = params.get("loginid_list");
      const state = params.get("state");
      const error = params.get("error");

      if (error) {
        console.error("OAuth callback error:", error);
        router.replace(`/login?error=${error}`);
        return;
      }

      const savedState = getCookie(OAUTH_STATE_COOKIE_NAME);
      deleteCookie(OAUTH_STATE_COOKIE_NAME); // Clean up state cookie

      if (!state || !savedState || state !== savedState) {
        console.error("OAuth state mismatch. Possible CSRF attack.");
        router.replace('/login?error=state_mismatch');
        return;
      }

      if (!token || !loginid_list) {
        console.error("Token or account list missing from callback.");
        router.replace('/login?error=auth_failed');
        return;
      }

      const accounts = loginid_list.split('+').map(accStr => {
        const [loginid, account_type, currency] = accStr.split(':');
        return {
          loginid,
          account_category: account_type === 'real' ? 'real' : 'demo',
          is_virtual: account_type === 'demo' ? 1 : 0,
          currency,
        };
      });

      const cookieOptions = {
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
        sameSite: 'lax',
      } as const;

      setCookie(OAUTH_TOKEN_COOKIE_NAME, token, cookieOptions);
      setCookie(ACCOUNTS_COOKIE_NAME, JSON.stringify(accounts), cookieOptions);

      const accountToSelect = accounts.find(acc => !acc.is_virtual) || accounts.find(acc => acc.is_virtual) || accounts[0];
      if (accountToSelect) {
        setCookie(SELECTED_ACCOUNT_COOKIE_NAME, JSON.stringify(accountToSelect), cookieOptions);
      }

      router.replace("/");

    } catch (e) {
      console.error("Error processing OAuth callback:", e);
      router.replace('/login?error=callback_processing_failed');
    }

  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Finalizing authentication...</p>
      </div>
    </div>
  );
}
