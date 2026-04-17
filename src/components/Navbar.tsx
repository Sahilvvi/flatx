'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { LanguageToggle } from '@/components/LanguageToggle';

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const navLinks = (
    <>
      <Link
        href="/"
        onClick={close}
        className="px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100"
      >
        Map
      </Link>
      <Link
        href="/insights"
        onClick={close}
        className="px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100"
      >
        Rent check
      </Link>
      <Link
        href="/match"
        onClick={close}
        className="px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100"
      >
        Match
      </Link>
      <Link
        href="/listings/new"
        onClick={close}
        className="px-3 py-2 rounded-md bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand-dark)] text-center"
      >
        + List
      </Link>

      {!loading && !user && (
        <Link
          href="/auth/login"
          onClick={close}
          className="px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100"
        >
          Sign in
        </Link>
      )}

      {!loading && user && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-100 md:border-t-0">
          <span className="text-xs text-slate-600 truncate max-w-[160px]">
            {profile?.phone ?? user.phone ?? user.email ?? 'Signed in'}
          </span>
          {profile?.is_verified && <VerifiedBadge size="sm" />}
          <button
            type="button"
            onClick={() => {
              close();
              signOut();
            }}
            className="px-2 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 text-xs ml-auto"
          >
            Sign out
          </button>
        </div>
      )}
    </>
  );

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

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {navLinks}
          <LanguageToggle />
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md text-slate-700 hover:bg-slate-100 -mr-2"
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown panel */}
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={close}
            className="md:hidden fixed inset-0 top-14 bg-slate-900/20 z-30"
          />
          <nav className="md:hidden absolute top-14 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-lg flex flex-col py-2 text-sm">
            {navLinks}
            <div className="px-3 py-2 border-t border-slate-100">
              <LanguageToggle />
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
