'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LocationPicker } from '@/components/map/LocationPicker';
import { BHK_OPTIONS, type BhkType, type RentInsightResult } from '@/lib/types';
import { formatINR } from '@/lib/format';
import { DEFAULT_LAT, DEFAULT_LNG } from '@/lib/env';

interface InsightResponse {
  stats: RentInsightResult;
  verdict: {
    label: 'overpaying' | 'fair' | 'underpaying' | 'insufficient-data';
    message: string;
    delta_pct?: number;
  };
}

export function RentInsightForm() {
  const sp = useSearchParams();
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(() => {
    const lat = Number(sp.get('lat'));
    const lng = Number(sp.get('lng'));
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat && lng) return { lat, lng };
    return { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
  });
  const [rent, setRent] = useState(sp.get('rent') ?? '');
  const [bhk, setBhk] = useState<BhkType>((sp.get('bhk') as BhkType) ?? '1BHK');
  const [radius, setRadius] = useState(1500);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InsightResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Contribution form state
  const [contribRent, setContribRent] = useState('');
  const [contribBhk, setContribBhk] = useState<BhkType>('1BHK');
  const [contribNote, setContribNote] = useState('');
  const [contribState, setContribState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');

  async function runInsight() {
    if (!pin) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        lat: String(pin.lat),
        lng: String(pin.lng),
        radius: String(radius),
        bhk,
      });
      if (rent) params.set('rent', rent);
      const res = await fetch(`/api/insights?${params.toString()}`);
      const data = (await res.json()) as InsightResponse;
      if (!res.ok) throw new Error((data as unknown as { error?: string }).error ?? 'Failed to load insight');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // Auto-run on first load if we have pin + rent from query params.
  const auto = Boolean(sp.get('lat') && sp.get('lng'));
  useEffect(() => {
    if (auto) runInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function contribute(e: React.FormEvent) {
    e.preventDefault();
    if (!pin) return;
    setContribState('sending');
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: pin.lat,
          lng: pin.lng,
          rent: Number(contribRent),
          bhk_type: contribBhk,
          notes: contribNote,
        }),
      });
      if (!res.ok) throw new Error();
      setContribState('ok');
      setContribRent('');
      setContribNote('');
    } catch {
      setContribState('err');
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold">Where do you live?</h2>
        <LocationPicker value={pin} onChange={setPin} />
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Current rent (₹/mo)</span>
            <input
              type="number"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              placeholder="e.g. 45000"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">BHK type</span>
            <select
              value={bhk}
              onChange={(e) => setBhk(e.target.value as BhkType)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              {BHK_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Radius</span>
            <span className="text-xs text-slate-500">{(radius / 1000).toFixed(1)} km</span>
          </div>
          <input
            type="range"
            min={500}
            max={5000}
            step={100}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full accent-[color:var(--brand)] mt-1"
          />
        </label>
        <button
          type="button"
          onClick={runInsight}
          disabled={!pin || loading}
          className="w-full py-2.5 rounded-md bg-[color:var(--brand)] text-white font-semibold text-sm hover:bg-[color:var(--brand-dark)] disabled:opacity-60"
        >
          {loading ? 'Crunching numbers…' : 'Check my rent'}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </section>

      <section className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold mb-3">The verdict</h2>
          {!result && <p className="text-sm text-slate-500">Enter your location and rent to see how it compares.</p>}
          {result && (
            <>
              <div
                className={`rounded-md px-4 py-3 text-sm font-medium ${toneClass(result.verdict.label)}`}
              >
                {result.verdict.message}
              </div>
              <dl className="grid grid-cols-3 gap-3 mt-4 text-center">
                <Stat label="Sample" value={String(result.stats.sample_size)} hint="nearby data points" />
                <Stat label="Average" value={formatINR(result.stats.avg_rent)} hint="per month" />
                <Stat label="Median" value={formatINR(result.stats.median_rent)} hint="per month" />
                <Stat label="25th %ile" value={formatINR(result.stats.p25_rent)} hint="cheapest quartile" />
                <Stat label="75th %ile" value={formatINR(result.stats.p75_rent)} hint="priciest quartile" />
                <Stat
                  label="Range"
                  value={
                    result.stats.min_rent && result.stats.max_rent
                      ? `${formatINR(result.stats.min_rent)}–${formatINR(result.stats.max_rent)}`
                      : '—'
                  }
                  hint="min / max"
                />
              </dl>
            </>
          )}
        </div>

        <form onSubmit={contribute} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h2 className="font-semibold">Help improve this — share your rent</h2>
          <p className="text-xs text-slate-500">
            Anonymously contribute a data point for the pinned location. Makes the numbers better
            for everyone.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Rent (₹/mo)</span>
              <input
                type="number"
                required
                min={1000}
                value={contribRent}
                onChange={(e) => setContribRent(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">BHK</span>
              <select
                value={contribBhk}
                onChange={(e) => setContribBhk(e.target.value as BhkType)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                {BHK_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Note (optional)</span>
            <input
              type="text"
              value={contribNote}
              onChange={(e) => setContribNote(e.target.value)}
              placeholder="e.g. 2yr-old building, parking included"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={!pin || contribState === 'sending'}
            className="w-full py-2 rounded-md bg-slate-900 text-white font-semibold text-sm disabled:opacity-60"
          >
            {contribState === 'sending' ? 'Saving…' : 'Submit data point'}
          </button>
          {contribState === 'ok' && <p className="text-xs text-emerald-700">Thanks! Saved.</p>}
          {contribState === 'err' && <p className="text-xs text-red-600">Failed to save.</p>}
        </form>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="border border-slate-100 rounded-md p-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="font-semibold text-slate-900 text-sm">{value}</div>
      <div className="text-[10px] text-slate-400">{hint}</div>
    </div>
  );
}

function toneClass(label: InsightResponse['verdict']['label']): string {
  switch (label) {
    case 'overpaying':
      return 'bg-red-50 text-red-800 border border-red-200';
    case 'underpaying':
      return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
    case 'fair':
      return 'bg-sky-50 text-sky-800 border border-sky-200';
    default:
      return 'bg-slate-50 text-slate-700 border border-slate-200';
  }
}
