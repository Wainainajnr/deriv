import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthProvider';
import { TradingDataProvider } from '@/context/TradingDataProvider';
import ClientOnly from '@/components/shared/ClientOnly';
import { Header } from '@/components/shared/Header';

export const metadata: Metadata = {
  title: 'DerivEdge',
  description: 'AI-powered Even/Odd Trading on Deriv',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;600&family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased min-h-screen bg-background">
        <AuthProvider>
          <ClientOnly>
            <TradingDataProvider>
                {children}
            </TradingDataProvider>
          </ClientOnly>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
