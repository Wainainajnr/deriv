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
      // Forward the search params to our server-side callback handler.
      // The server will validate the state and set cookies.
      fetch(`/api/auth/callback?code=${code}&state=${state}`)
        .then((res) => {
          if (res.ok) {
            // If the server successfully processed the token, redirect to home.
             window.location.href = "/";
          } else {
            res.json().then(body => {
              console.error("OAuth callback error:", body.error);
              router.replace(`/login?error=${body.error || 'auth_failed'}`);
            });
          }
        })
        .catch(err => {
            console.error("Error calling callback API:", err);
            router.replace("/login?error=callback_api_failed");
        });
    } else {
        // Handle cases where there's no code or state
        console.error("No code or state found in callback URL");
        router.replace("/login?error=no_token");
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
