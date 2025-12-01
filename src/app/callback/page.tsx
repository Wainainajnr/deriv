"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getCookie, setCookie, deleteCookie } from 'cookies-next';

const OAUTH_STATE_COOKIE_NAME = "deriv_oauth_state";
const ACCOUNTS_COOKIE_NAME = "deriv_accounts";
const SELECTED_ACCOUNT_COOKIE_NAME = "deriv_selected_account";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      // Deriv OAuth returns data in query parameters with format:
      // acct1, token1, cur1, acct2, token2, cur2, etc.
      const queryParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      // Check both query string and hash for state and error
      const state = queryParams.get("state") || hashParams.get("state");
      const error = queryParams.get("error") || hashParams.get("error");

      if (error) {
        console.error("OAuth callback error:", error);
        router.replace(`/login?error=${error}`);
        return;
      }

      const savedState = getCookie(OAUTH_STATE_COOKIE_NAME);

      console.log("OAuth Debug - Full URL:", window.location.href);
      console.log("OAuth Debug - Query string:", window.location.search);
      console.log("OAuth Debug - State from URL:", state);
      console.log("OAuth Debug - State from Cookie:", savedState);

      deleteCookie(OAUTH_STATE_COOKIE_NAME); // Clean up state cookie

      if (!state || !savedState || state !== savedState) {
        console.error("OAuth state mismatch. Possible CSRF attack.");
        console.error("Expected:", savedState, "Got:", state);
        router.replace('/login?error=state_mismatch');
        return;
      }

      // Parse Deriv's account format: acct1, token1, cur1, acct2, token2, cur2, etc.
      const accounts = [];
      let index = 1;

      while (queryParams.has(`acct${index}`)) {
        const loginid = queryParams.get(`acct${index}`);
        const token = queryParams.get(`token${index}`);
        const currency = queryParams.get(`cur${index}`);

        if (loginid && token && currency) {
          // Deriv account IDs: CR* = real, VRT* = virtual/demo
          const isVirtual = loginid.startsWith('VRT');
          accounts.push({
            loginid,
            token,
            account_category: isVirtual ? 'demo' : 'real',
            is_virtual: isVirtual ? 1 : 0,
            currency,
          });
        }
        index++;
      }

      console.log("OAuth Debug - Parsed accounts:", accounts);

      if (accounts.length === 0) {
        console.error("No accounts found in OAuth callback.");
        router.replace('/login?error=auth_failed');
        return;
      }

      const cookieOptions = {
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
        sameSite: 'lax',
      } as const;

      setCookie(ACCOUNTS_COOKIE_NAME, JSON.stringify(accounts), cookieOptions);

      // Select the first real account, or first demo account, or just first account
      const accountToSelect = accounts.find(acc => !acc.is_virtual) || accounts.find(acc => acc.is_virtual) || accounts[0];
      if (accountToSelect) {
        setCookie(SELECTED_ACCOUNT_COOKIE_NAME, JSON.stringify(accountToSelect), cookieOptions);
      }

      console.log("OAuth Debug - Authentication successful, redirecting to dashboard");
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
