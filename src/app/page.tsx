"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';

export default function HomePage() {
    const { isLoggedIn, isLoading, isSimulationMode } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (isLoggedIn || isSimulationMode) {
                router.replace('/dashboard');
            } else {
                router.replace('/login');
            }
        }
    }, [isLoggedIn, isLoading, isSimulationMode, router]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <div className="flex items-center gap-4 mb-4">
                <Logo />
            </div>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground mt-4">Loading your trading environment...</p>
        </div>
    );
}
