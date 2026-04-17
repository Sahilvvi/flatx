'use client';

import { BHK_OPTIONS, FURNISHING_OPTIONS, LISTING_KINDS } from '@/lib/types';
import type { BhkType, Furnishing, ListingKind } from '@/lib/types';
import { formatINR } from '@/lib/format';

import { useState } from 'react';

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
  const [isListening, setIsListening] = useState(false);

  const toggle = <T extends string>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const handleVoiceSearch = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Your browser does not support Voice Search.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => { console.error(e); setIsListening(false); };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      let nextFilters = { ...value };
      
      // Basic parse logic: "2 bhk under 40000"
      if (transcript.includes('1 bhk') || transcript.includes('1bhk')) {
        nextFilters.bhk = toggle(nextFilters.bhk, '1BHK');
      }
      if (transcript.includes('2 bhk') || transcript.includes('2bhk')) {
        nextFilters.bhk = toggle(nextFilters.bhk, '2BHK');
      }
      if (transcript.includes('3 bhk') || transcript.includes('3bhk')) {
        nextFilters.bhk = toggle(nextFilters.bhk, '3BHK');
      }
      
      const underMatch = transcript.match(/under (\d+)(k| thousand)?/);
      if (underMatch) {
        let val = Number(underMatch[1]);
        if (underMatch[2] === 'k' || underMatch[2]?.includes('thousand')) val *= 1000;
        nextFilters.maxRent = val;
      }
      
      onChange(nextFilters);
    };
    
    recognition.start();
  };

  return (
    <div className="flex flex-col gap-5 p-4 text-sm">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
        <button 
          onClick={handleVoiceSearch} 
          className={`flex items-center justify-center mx-auto gap-2 text-xs font-semibold px-4 py-2 rounded-full transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'}`}
        >
          <span>🎙️</span> {isListening ? 'Listening...' : 'Voice Search'}
        </button>
        <div className="text-[10px] text-slate-400 mt-2">Try: "2 BHK under 40k"</div>
      </div>
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
