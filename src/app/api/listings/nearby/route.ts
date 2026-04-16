import { NextResponse } from 'next/server';
import { fetchNearbyListings } from '@/lib/listings-service';
import type { BhkType, Furnishing, ListingKind } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** GET /api/listings/nearby?lat=..&lng=..&radius=..&... */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Invalid lat/lng' }, { status: 400 });
  }

  const radius = url.searchParams.get('radius');
  const minRent = url.searchParams.get('minRent');
  const maxRent = url.searchParams.get('maxRent');
  const bhk = url.searchParams.getAll('bhk') as BhkType[];
  const furnishing = url.searchParams.getAll('furnishing') as Furnishing[];
  const kind = url.searchParams.get('kind') as ListingKind | null;

  const listings = await fetchNearbyListings({
    lat,
    lng,
    radiusM: radius ? Number(radius) : undefined,
    minRent: minRent ? Number(minRent) : undefined,
    maxRent: maxRent ? Number(maxRent) : undefined,
    bhk: bhk.length ? bhk : undefined,
    furnishing: furnishing.length ? furnishing : undefined,
    kind: kind ?? undefined,
  });

  return NextResponse.json({ listings });
}
