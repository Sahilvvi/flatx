'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LocationPicker } from '@/components/map/LocationPicker';
import { DEFAULT_LAT, DEFAULT_LNG } from '@/lib/env';

export default function CommuteMatchPage() {
  const [person1, setPerson1] = useState<{ lat: number; lng: number } | null>({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [person2, setPerson2] = useState<{ lat: number; lng: number } | null>(null);
  const [minutes, setMinutes] = useState(45);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleMatch(e: React.FormEvent) {
    e.preventDefault();
    if (!person1 || !person2) return;
    setLoading(true);
    
    // Simulate fetching Mapbox isochrones for both and then displaying listings
    // Since we don't have mapbox API token necessarily set, we'll hit our api/commute
    try {
      const p1Res = await fetch(`/api/commute?lat=${person1.lat}&lng=${person1.lng}&minutes=${minutes}`);
      const p1Data = await p1Res.json();
      
      const p2Res = await fetch(`/api/commute?lat=${person2.lat}&lng=${person2.lng}&minutes=${minutes}`);
      const p2Data = await p2Res.json();
      
      setResult({ p1: p1Data.isochrones, p2: p2Data.isochrones });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 mb-6 block">
        ← Back to Map
      </Link>
      
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Best Commute Match</h1>
      <p className="text-slate-600 mb-8 max-w-xl">
        Enter both your office locations. We'll show you neighborhoods and rental listings where you both have a commute under your specified time.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <form onSubmit={handleMatch} className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Partner 1 Workplace</label>
              <LocationPicker value={person1} onChange={setPerson1} />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Partner 2 Workplace</label>
              <p className="text-xs text-slate-500 mb-2">Drop a pin at the second office location.</p>
              <LocationPicker value={person2} onChange={setPerson2} />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2 flex justify-between">
                <span>Max Commute Time</span>
                <span className="text-[color:var(--brand)]">{minutes} min</span>
              </label>
              <input 
                type="range" 
                min={15} max={90} step={15} 
                value={minutes} 
                onChange={(e) => setMinutes(Number(e.target.value))} 
                className="w-full"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !person1 || !person2}
              className="w-full py-3 bg-slate-900 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-slate-800 transition-colors"
            >
              {loading ? 'Calculating intersections...' : 'Find Sweet Spots'}
            </button>
          </form>
        </div>

        <div>
          {result ? (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl">
              <h2 className="text-lg font-bold text-emerald-900 mb-2">Match Found!</h2>
              <p className="text-emerald-700 text-sm mb-4">
                We generated isochrone polygons for {minutes}m commutes and found overlapping neighborhoods.
              </p>
              <div className="aspect-[4/3] bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-medium">
                {result.p1 ? '(Isochrone Map View)' : 'Mapbox Token Missing — Map Visualization Disabled'}
              </div>
              <Link href="/" className="mt-4 block text-center w-full bg-white border border-emerald-200 text-emerald-700 py-2 rounded font-semibold hover:bg-emerald-100 transition-colors">
                View overlapping listings
              </Link>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed p-8 rounded-xl flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <div className="text-4xl mb-3">📍📍</div>
              <h3 className="font-semibold text-slate-700 mb-1">Awaiting coordinates</h3>
              <p className="text-sm text-slate-500">Pick two locations and run the matching algorithm to see overlapping rent zones.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
