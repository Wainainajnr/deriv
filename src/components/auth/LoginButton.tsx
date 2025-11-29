"use client";

import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

export function LoginButton() {
  const { login } = useAuth();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="w-full text-lg font-bold" size="lg">
          Login with Deriv
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-yellow-500" />
            Risk Disclaimer
          </AlertDialogTitle>
          <AlertDialogDescription>
            Trading involves a high level of risk and may not be suitable for
            all investors. The AI-generated suggestions provided by this tool
            are for informational purposes only and should not be considered
            financial advice. You are solely responsible for your own trading
            decisions and any resulting losses.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={login}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
