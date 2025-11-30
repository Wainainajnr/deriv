
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { Loader2 } from "lucide-react";
import { DerivAccount } from "@/types/deriv";

const OAUTH_STATE_KEY = "deriv_oauth_state";

export default function CallbackPage() {
  const router = useRouter();
  const { setTokenAndAccounts } = useAuth();

  useEffect(() => {
    try {
      // Deriv's implicit flow returns params in the hash, not the search query.
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get("token");
      const accountListStr = params.get("loginid_list");
      const state = params.get("state");

      // 1. Retrieve the saved state from sessionStorage.
      const savedState = sessionStorage.getItem(OAUTH_STATE_KEY);
      
      // 2. Immediately remove the state from storage to prevent reuse.
      sessionStorage.removeItem(OAUTH_STATE_KEY);

      // 3. CRITICAL: Verify that the received state matches the saved state.
      if (!state || state !== savedState) {
          console.error("OAuth state mismatch. Possible CSRF attack.");
          // Redirect to login with a specific error message.
          router.replace("/login?error=state_mismatch");
          return;
      }

      if (token && accountListStr) {
        // The account list is a string like "CR123:real:USD+VRTC456:demo:USD"
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
                landing_company_name: '' // This info is not in the callback
            };
        });
        
        // Add landing_company_name for consistency with the DerivAccount type
        const fullAccounts = accounts.map(acc => ({
            ...acc,
            landing_company_name: acc.is_virtual ? 'virtual' : 'svg' // Common values
        }));

        setTokenAndAccounts(token, fullAccounts);
        router.replace("/");
      } else {
        console.error("OAuth callback error: Token or account list not found in URL hash.");
        router.replace("/login?error=auth_failed");
      }
    } catch (error) {
      console.error("Error processing OAuth callback:", error);
      router.replace("/login?error=processing_failed");
    }
  }, [router, setTokenAndAccounts]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Authenticating...</p>
      </div>
    </div>
  );
}
