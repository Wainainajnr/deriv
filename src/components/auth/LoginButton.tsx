"use client";

import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";

export function LoginButton() {
  const { login } = useAuth();

  return (
    <Button
      onClick={login}
      className="w-full text-lg font-bold"
      size="lg"
    >
      Login with Deriv
    </Button>
  );
}
