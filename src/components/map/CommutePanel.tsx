'use client';

import { useState } from 'react';
import type { FeatureCollection } from 'geojson';
import { hasMapbox } from '@/lib/env';

export interface CommuteState {
  office: { lat: number; lng: number } | null;
  profile: 'driving' | 'cycling' | 'walking';
  minutes: number[];
  geojson: FeatureCollection | null;
  loading: boolean;
  error: string | null;
}

export const DEFAULT_COMMUTE: CommuteState = {
  office: null,
  profile: 'driving',
  minutes: [30, 45, 60],
  geojson: null,
  loading: false,
  error: null,
};

interface Props {
  value: CommuteState;
  onChange: (next: CommuteState) => void;
  onPickOffice: () => void;
  pickingOffice: boolean;
}

export function CommutePanel({ value, onChange, onPickOffice, pickingOffice }: Props) {
  const [open, setOpen] = useState(false);

  async function fetchIsochrones(office: { lat: number; lng: number }, profile: CommuteState['profile']) {
    onChange({ ...value, office, profile, loading: true, error: null });
    try {
      const params = new URLSearchParams({
        lat: String(office.lat),
        lng: String(office.lng),
        minutes: value.minutes.join(','),
        profile,
      });
      const res = await fetch(`/api/commute?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch commute zones');
      onChange({
        ...value,
        office,
        profile,
        geojson: data.isochrones ?? null,
        loading: false,
        error: data.isochrones ? null : data.note ?? 'No commute data',
      });
    } catch (err) {
      onChange({
        ...value,
        office,
        profile,
        loading: false,
        error: err instanceof Error ? err.message : 'Request failed',
      });
    }
  }

  function clear() {
    onChange(DEFAULT_COMMUTE);
    setOpen(false);
  }

  return (
    <div className="border-b border-slate-100">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
      >
        <span className="flex items-center gap-2">
          🚆 Commute zones
          {value.office && !value.loading && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
              on
            </span>
          )}
          {value.loading && <span className="text-[10px] text-slate-500">loading…</span>}
        </span>
        <span className="text-slate-400">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {!hasMapbox && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
              Requires a Mapbox token. Set <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable isochrones.
            </p>
          )}
          <div>
            <label className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
              Office / anchor location
            </label>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={onPickOffice}
                className={[
                  'flex-1 px-3 py-2 rounded-md border text-xs font-medium transition',
                  pickingOffice
                    ? 'bg-[color:var(--brand)] text-white border-[color:var(--brand)]'
                    : value.office
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400',
                ].join(' ')}
              >
                {pickingOffice
                  ? 'Click on the map…'
                  : value.office
                    ? `📍 ${value.office.lat.toFixed(3)}, ${value.office.lng.toFixed(3)}`
                    : '📍 Pick on map'}
              </button>
              {value.office && (
                <button
                  type="button"
                  onClick={clear}
                  className="px-2 py-2 text-xs text-slate-500 hover:text-slate-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
              Mode of travel
            </label>
            <div className="mt-1 flex gap-1">
              {(['driving', 'cycling', 'walking'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    if (value.office) fetchIsochrones(value.office, p);
                    else onChange({ ...value, profile: p });
                  }}
                  className={[
                    'flex-1 px-2 py-1.5 rounded-md border text-xs capitalize',
                    value.profile === p
                      ? 'bg-[color:var(--brand)] text-white border-[color:var(--brand)]'
                      : 'bg-white text-slate-700 border-slate-300',
                  ].join(' ')}
                >
                  {p === 'driving' ? '🚗 Drive' : p === 'cycling' ? '🚲 Cycle' : '🚶 Walk'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-around text-[11px] text-slate-600">
            <span className="flex items-center gap-1">
              <Swatch color="rgba(11,110,79,0.35)" /> 30 min
            </span>
            <span className="flex items-center gap-1">
              <Swatch color="rgba(255,179,71,0.35)" /> 45 min
            </span>
            <span className="flex items-center gap-1">
              <Swatch color="rgba(255,107,53,0.35)" /> 60 min
            </span>
          </div>

          {value.error && (
            <p className="text-[11px] text-red-700 bg-red-50 rounded px-2 py-1.5 border border-red-200">
              {value.error}
            </p>
          )}
          <p className="text-[11px] text-slate-500">
            Drop an office pin, and nearby listings within 45 min are highlighted automatically.
          </p>
        </div>
      )}
    </div>
  );
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-sm border border-slate-300"
      style={{ background: color }}
    />
  );
}
