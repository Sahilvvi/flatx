import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { hasMapbox, hasSupabase } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Mumbai Rent Intelligence — Broker-free flats, rooms & flatmates',
  description:
    'Discover real Mumbai rent prices on an interactive map. Find flats, rooms or flatmates without brokers, and make decisions based on commute, not just distance.',
  metadataBase: new URL('https://flatx.local'),
  openGraph: {
    title: 'Mumbai Rent Intelligence',
    description: 'Map-first, broker-free rentals and flatmate matching for Mumbai.',
    type: 'website',
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
        <Navbar />
        <main className="min-h-[calc(100vh-56px)]">{children}</main>
      </body>
    </html>
  );
}
