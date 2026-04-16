'use client';

import { useState } from 'react';
import { LocationPicker } from '@/components/map/LocationPicker';
import {
  BHK_OPTIONS,
  FURNISHING_OPTIONS,
  LISTING_KINDS,
  type BhkType,
  type Furnishing,
  type ListingKind,
  type Listing,
} from '@/lib/types';
import { DEFAULT_LAT, DEFAULT_LNG } from '@/lib/env';
import { ListingCard } from '@/components/ListingCard';
import { formatINR } from '@/lib/format';

const PREFERENCE_TAGS = [
  'bachelor_friendly',
  'family_preferred',
  'pet_friendly',
  'vegetarian_only',
  'women_only',
  'non_smoker',
];

interface Match {
  listing: Listing;
  score: number;
  reasons: string[];
}

export function MatchForm() {
  const [kind, setKind] = useState<ListingKind>('flat');
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [maxRent, setMaxRent] = useState('60000');
  const [minRent, setMinRent] = useState('');
  const [bhk, setBhk] = useState<BhkType[]>(['1BHK', '2BHK']);
  const [furnishing, setFurnishing] = useState<Furnishing[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [radiusM, setRadiusM] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = <T extends string>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin) {
      setError('Drop a pin to tell us where you want to live / work from.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          lat: pin.lat,
          lng: pin.lng,
          maxRent: Number(maxRent),
          minRent: minRent ? Number(minRent) : undefined,
          bhk: bhk.length ? bhk : undefined,
          furnishing: furnishing.length ? furnishing : undefined,
          tags: tags.length ? tags : undefined,
          radiusM,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to compute matches');
      setMatches(data.matches as Match[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
        <section>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            I&apos;m looking for
          </label>
          <div className="flex gap-2 flex-wrap mt-2">
            {LISTING_KINDS.map((k) => (
              <button key={k} type="button" onClick={() => setKind(k)} className={chip(kind === k)}>
                {k === 'flat' ? 'A flat' : k === 'room' ? 'A room / PG' : 'A flatmate'}
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Anchor location
          </label>
          <div className="mt-2">
            <LocationPicker value={pin} onChange={setPin} />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Min rent (₹/mo)</span>
            <input
              type="number"
              value={minRent}
              onChange={(e) => setMinRent(e.target.value)}
              placeholder="Optional"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Max rent (₹/mo)</span>
            <input
              type="number"
              required
              min={1000}
              step={1000}
              value={maxRent}
              onChange={(e) => setMaxRent(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </section>

        <section>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">BHK preferences</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {BHK_OPTIONS.map((b) => (
              <button key={b} type="button" onClick={() => setBhk(toggle(bhk, b))} className={chip(bhk.includes(b))}>
                {b}
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Furnishing</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {FURNISHING_OPTIONS.map((f) => (
              <button key={f} type="button" onClick={() => setFurnishing(toggle(furnishing, f))} className={chip(furnishing.includes(f))}>
                {f === 'semi' ? 'Semi' : f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Society preferences
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {PREFERENCE_TAGS.map((t) => (
              <button key={t} type="button" onClick={() => setTags(toggle(tags, t))} className={chip(tags.includes(t))}>
                {t.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search radius</label>
            <span className="text-xs text-slate-500">{(radiusM / 1000).toFixed(1)} km</span>
          </div>
          <input
            type="range"
            min={1000}
            max={15000}
            step={500}
            value={radiusM}
            onChange={(e) => setRadiusM(Number(e.target.value))}
            className="w-full accent-[color:var(--brand)] mt-2"
          />
        </section>

        {error && <div className="text-xs text-red-600">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-md bg-[color:var(--brand)] text-white font-semibold text-sm hover:bg-[color:var(--brand-dark)] disabled:opacity-60"
        >
          {loading ? 'Finding matches…' : 'Show my matches'}
        </button>
      </form>

      <section className="space-y-3">
        {matches === null && !loading && (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Fill the form on the left to see ranked matches — we score by proximity, budget fit,
            BHK/furnishing match, and society preferences.
          </div>
        )}
        {matches && matches.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
            No matches in this radius. Try widening the radius or raising your max rent.
          </div>
        )}
        {matches?.map((m) => (
          <div key={m.listing.id} className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-[color:var(--brand)]">
                Score {Math.round(m.score)} / 100
              </span>
              <span className="text-xs text-slate-500">{formatINR(m.listing.rent)}/mo</span>
            </div>
            <ListingCard listing={m.listing} />
            {m.reasons.length > 0 && (
              <ul className="text-xs text-slate-600 list-disc list-inside pl-1">
                {m.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

function chip(active: boolean) {
  return [
    'px-3 py-1.5 rounded-full border text-xs font-medium transition',
    active
      ? 'bg-[color:var(--brand)] text-white border-[color:var(--brand)]'
      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400',
  ].join(' ');
}
