import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import SessionProvider from '@/components/SessionProvider';
import TVModeDetector from '@/components/TVModeDetector';
import AdBlockBanner from '@/components/AdBlockBanner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StreamVault',
  description: 'Your personal streaming destination',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'StreamVault' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-white min-h-screen`}>
        <SessionProvider>
          <TVModeDetector />
          <Navbar />
          <main className="pb-14 md:pb-0">{children}</main>
          <BottomNav />
          <AdBlockBanner />
        </SessionProvider>
      </body>
    </html>
  );
}
