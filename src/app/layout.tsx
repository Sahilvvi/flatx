import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { hasMapbox, hasSupabase } from '@/lib/env';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://flatx.local';

export const metadata: Metadata = {
  title: {
    default: 'Mumbai Rent Intelligence — Broker-free flats, rooms & flatmates',
    template: '%s · Mumbai Rent Intelligence',
  },
  description:
    'Discover real Mumbai rent prices on an interactive map. Find flats, rooms or flatmates without brokers, and make decisions based on commute, not just distance.',
  metadataBase: new URL(SITE_URL),
  applicationName: 'Mumbai Rent Intelligence',
  keywords: [
    'Mumbai rent',
    'flats in Mumbai',
    'flatmates Mumbai',
    'PG Mumbai',
    'no broker',
    'rent prices map',
  ],
  openGraph: {
    title: 'Mumbai Rent Intelligence',
    description: 'Map-first, broker-free rentals and flatmate matching for Mumbai.',
    type: 'website',
    siteName: 'Mumbai Rent Intelligence',
    images: [{ url: '/og.svg', width: 1200, height: 630, alt: 'Mumbai Rent Intelligence' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mumbai Rent Intelligence',
    description: 'Map-first, broker-free rentals and flatmate matching for Mumbai.',
    images: ['/og.svg'],
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b6e4f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const demoMode = !hasSupabase || !hasMapbox;
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {demoMode ? (
          <div className="bg-amber-100 border-b border-amber-200 text-amber-900 text-xs md:text-sm px-4 py-2 text-center">
            <strong>Demo mode:</strong>{' '}
            {!hasMapbox && <>Mapbox token not set — map tiles will not load. </>}
            {!hasSupabase && <>Supabase not configured — showing sample Mumbai listings. </>}
            See <code className="bg-amber-200/60 px-1 rounded">README.md</code> to configure.
          </div>
        ) : null}
        <AuthProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-56px)]">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
