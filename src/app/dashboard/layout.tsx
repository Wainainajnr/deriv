"use client";
import { Header } from "@/components/shared/Header";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, isSimulationMode, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn && !isSimulationMode) {
      router.replace('/login');
    }
  }, [isLoading, isLoggedIn, isSimulationMode, router]);
  
  if (isLoading || (!isLoggedIn && !isSimulationMode)) {
    return (
       <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
