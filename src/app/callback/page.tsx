"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state) {
      // Forward the auth code to our server-side API route.
      // The server will validate the state, exchange the code for a token, and set secure cookies.
      fetch(`/api/auth/callback?code=${code}&state=${state}`)
        .then((res) => {
          // The server will handle the redirect on success.
          // If there's an error, the server-side redirect will include an error query param.
          // We check the URL here to see if we were redirected back with an error.
          const finalSearchParams = new URLSearchParams(window.location.search);
          if (finalSearchParams.has('error')) {
              router.replace(`/login?error=${finalSearchParams.get('error')}`);
          } else if(res.redirected) {
             // Successful login, the server is redirecting us to the home page.
             window.location.href = res.url;
          } else {
            // Handle cases where the API call itself fails without a redirect
             router.replace(`/login?error=callback_api_failed`);
          }
        })
        .catch(err => {
            console.error("Error calling callback API:", err);
            router.replace("/login?error=callback_api_failed");
        });
    } else {
        // Handle cases where there's no code or state in the initial URL
        const error = searchParams.get('error');
        console.error("OAuth callback error:", error || "No code or state found");
        router.replace(`/login?error=${error || 'auth_failed'}`);
    }
  }, [router, searchParams]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Finalizing authentication...</p>
      </div>
    </div>
  );
}
