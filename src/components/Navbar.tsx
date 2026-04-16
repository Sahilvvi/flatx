'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { VerifiedBadge } from '@/components/VerifiedBadge';

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth();
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span
            aria-hidden
            className="inline-block w-7 h-7 rounded-lg bg-[color:var(--brand)] text-white flex items-center justify-center text-xs font-bold"
          >
            MR
          </span>
          <span className="hidden sm:inline">Mumbai Rent Intelligence</span>
          <span className="sm:hidden">MRI</span>
        </Link>
        <nav className="flex items-center gap-1 md:gap-3 text-sm">
          <Link href="/" className="px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-100">
            Map
          </Link>
          <Link href="/insights" className="px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-100">
            Rent check
          </Link>
          <Link href="/match" className="px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-100">
            Match
          </Link>
          <Link
            href="/listings/new"
            className="ml-1 md:ml-2 px-3 py-1.5 rounded-md bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand-dark)]"
          >
            + List
          </Link>

          {!loading && !user && (
            <Link
              href="/auth/login"
              className="ml-1 px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-100"
            >
              Sign in
            </Link>
          )}

          {!loading && user && (
            <div className="ml-1 flex items-center gap-2">
              <span className="hidden md:inline text-xs text-slate-600 truncate max-w-[120px]">
                {profile?.phone ?? user.phone ?? user.email ?? 'Signed in'}
              </span>
              {profile?.is_verified && <VerifiedBadge size="sm" />}
              <button
                type="button"
                onClick={signOut}
                className="px-2 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 text-xs"
              >
                Sign out
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
