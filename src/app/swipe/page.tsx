'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { SwipeableDeck } from '@/components/SwipeableDeck';
import type { Listing } from '@/lib/types';

const STORAGE_KEY = 'flatx.saved-listings';

function loadSaved(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function persistSaved(ids: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

/**
 * /swipe — Tinder-style browse mode for listings in the default Mumbai radius.
 * Saves liked IDs to localStorage (server-side persistence is a follow-up).
 */
export default function SwipePage() {
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    setSavedCount(loadSaved().length);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/listings/nearby?lat=19.076&lng=72.8777&radiusM=20000&limit=60');
        if (!res.ok) throw new Error(`listings: ${res.status}`);
        const json = (await res.json()) as { listings?: Listing[] };
        if (!cancelled) setListings(json.listings ?? []);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onLike = useCallback((l: Listing) => {
    const ids = loadSaved();
    if (!ids.includes(l.id)) {
      ids.push(l.id);
      persistSaved(ids);
      setSavedCount(ids.length);
    }
  }, []);

  if (err) {
    return <div className="max-w-md mx-auto px-4 py-16 text-rose-600 text-sm">Error: {err}</div>;
  }
  if (!listings) {
    return <div className="max-w-md mx-auto px-4 py-16 text-slate-500">Loading…</div>;
  }

  return (
    <div className="min-h-[80vh]">
      <header className="max-w-md mx-auto px-4 pt-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          ← Map
        </Link>
        <h1 className="text-base font-semibold text-slate-900">Discover</h1>
        <div className="text-xs text-slate-500">
          {savedCount > 0 ? `${savedCount} saved` : ''}
        </div>
      </header>

      <SwipeableDeck listings={listings} onLike={onLike} />
    </div>
  );
}
