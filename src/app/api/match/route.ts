import { NextResponse } from 'next/server';
import { matchListings } from '@/lib/listings-service';
import type { BhkType, Furnishing, ListingKind } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/match
 * Body: { lat, lng, maxRent, minRent?, bhk?, furnishing?, kind?, tags?, radiusM? }
 * Returns: { matches: Array<{ listing, score, reasons }> }
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const maxRent = Number(body.maxRent);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(maxRent)) {
    return NextResponse.json({ error: 'lat, lng, maxRent are required' }, { status: 400 });
  }

  const matches = await matchListings({
    lat,
    lng,
    maxRent,
    minRent: body.minRent !== undefined ? Number(body.minRent) : undefined,
    bhk: Array.isArray(body.bhk) ? (body.bhk as BhkType[]) : undefined,
    furnishing: Array.isArray(body.furnishing) ? (body.furnishing as Furnishing[]) : undefined,
    kind: (body.kind as ListingKind | undefined) ?? undefined,
    tags: Array.isArray(body.tags) ? (body.tags as string[]) : undefined,
    radiusM: body.radiusM !== undefined ? Number(body.radiusM) : undefined,
  });

  return NextResponse.json({ matches });
}
