import { NextResponse } from 'next/server';
import { MAPBOX_TOKEN, hasMapbox } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * GET /api/commute?lat=..&lng=..&minutes=30,45,60&profile=driving|cycling|walking
 *
 * Proxies Mapbox's Isochrone API so we can keep the token server-side when
 * desired (e.g. if the NEXT_PUBLIC_* token is restricted to the main map and
 * you use a separate server-side token for isochrones). Gracefully returns
 * `{ isochrones: null }` when Mapbox is not configured so the UI can render a
 * helpful empty state instead of crashing.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Invalid lat/lng' }, { status: 400 });
  }

  const minutesRaw = url.searchParams.get('minutes') ?? '30,45,60';
  const profile = url.searchParams.get('profile') ?? 'driving';
  if (!['driving', 'walking', 'cycling', 'driving-traffic'].includes(profile)) {
    return NextResponse.json({ error: 'Invalid profile' }, { status: 400 });
  }
  const minutes = minutesRaw
    .split(',')
    .map((m) => Number(m.trim()))
    .filter((m) => Number.isFinite(m) && m > 0 && m <= 60)
    .slice(0, 4);
  if (!minutes.length) return NextResponse.json({ error: 'Invalid minutes' }, { status: 400 });

  if (!hasMapbox) {
    return NextResponse.json({
      isochrones: null,
      note: 'Mapbox token not configured. Set NEXT_PUBLIC_MAPBOX_TOKEN to enable commute zones.',
    });
  }

  const endpoint =
    `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${lng},${lat}` +
    `?contours_minutes=${minutes.join(',')}` +
    `&polygons=true&denoise=1&generalize=0&access_token=${MAPBOX_TOKEN}`;

  try {
    const res = await fetch(endpoint, { next: { revalidate: 300 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Mapbox isochrone request failed', status: res.status },
        { status: 502 },
      );
    }
    const geojson = await res.json();
    return NextResponse.json({ isochrones: geojson });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
