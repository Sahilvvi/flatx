'use client';

import { BHK_OPTIONS, FURNISHING_OPTIONS, LISTING_KINDS } from '@/lib/types';
import type { BhkType, Furnishing, ListingKind } from '@/lib/types';
import { formatINR } from '@/lib/format';

export interface FiltersState {
  kind?: ListingKind;
  minRent: number;
  maxRent: number;
  bhk: BhkType[];
  furnishing: Furnishing[];
  radiusM: number;
}

export const DEFAULT_FILTERS: FiltersState = {
  kind: undefined,
  minRent: 0,
  maxRent: 200000,
  bhk: [],
  furnishing: [],
  radiusM: 5000,
};

interface Props {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  onReset?: () => void;
}

export function FiltersPanel({ value, onChange, onReset }: Props) {
  const toggle = <T extends string>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  return (
    <div className="flex flex-col gap-5 p-4 text-sm">
      <section>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Listing type
        </label>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onChange({ ...value, kind: undefined })}
            className={chipClass(!value.kind)}
          >
            Any
          </button>
          {LISTING_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onChange({ ...value, kind: value.kind === k ? undefined : k })}
              className={chipClass(value.kind === k)}
            >
              {k === 'flat' ? 'Full flats' : k === 'room' ? 'Rooms / PG' : 'Flatmates'}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Budget
          </label>
          <span className="text-xs text-slate-600">
            {formatINR(value.minRent)} – {formatINR(value.maxRent)}
          </span>
        </div>
        <div className="flex gap-3">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            value={value.minRent || ''}
            onChange={(e) => onChange({ ...value, minRent: Number(e.target.value) || 0 })}
            placeholder="Min"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            value={value.maxRent || ''}
            onChange={(e) => onChange({ ...value, maxRent: Number(e.target.value) || 0 })}
            placeholder="Max"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      </section>

      <section>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          BHK / Room
        </label>
        <div className="flex flex-wrap gap-2">
          {BHK_OPTIONS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => onChange({ ...value, bhk: toggle(value.bhk, b) })}
              className={chipClass(value.bhk.includes(b))}
            >
              {b}
            </button>
          ))}
        </div>
      </section>

      <section>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Furnishing
        </label>
        <div className="flex flex-wrap gap-2">
          {FURNISHING_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onChange({ ...value, furnishing: toggle(value.furnishing, f) })}
              className={chipClass(value.furnishing.includes(f))}
            >
              {f === 'semi' ? 'Semi-furnished' : f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Search radius
          </label>
          <span className="text-xs text-slate-600">{(value.radiusM / 1000).toFixed(1)} km</span>
        </div>
        <input
          type="range"
          min={500}
          max={15000}
          step={500}
          value={value.radiusM}
          onChange={(e) => onChange({ ...value, radiusM: Number(e.target.value) })}
          className="w-full accent-[color:var(--brand)]"
        />
      </section>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-slate-700 underline self-start"
        >
          Reset all
        </button>
      )}
    </div>
  );
}

function chipClass(active: boolean): string {
  return [
    'px-3 py-1.5 rounded-full border text-xs font-medium transition',
    active
      ? 'bg-[color:var(--brand)] text-white border-[color:var(--brand)]'
      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400',
  ].join(' ');
}
