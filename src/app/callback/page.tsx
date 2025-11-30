"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // The OAuth provider redirects here, but the token is in the hash.
    // We can't access the hash on the server, so the client must send it.
    if (window.location.hash) {
      // Forward the hash to our server-side callback handler.
      // The server will validate the state and set cookies.
      fetch(`/api/auth/callback${window.location.hash.replace("#", "?")}`)
        .then((res) => {
          if (res.ok) {
            // If the server successfully processed the token, redirect to home.
            router.replace("/");
          } else {
            // If the server found an error (e.g., state mismatch), redirect to login with an error.
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
        // Handle cases where there's no hash
        console.error("No hash found in callback URL");
        router.replace("/login?error=no_token");
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
