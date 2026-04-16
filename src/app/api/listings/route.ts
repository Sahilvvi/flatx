import { NextResponse } from 'next/server';
import {
  createListing,
  fetchAllListings,
} from '@/lib/listings-service';
import { validateListing } from '@/lib/validation';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import type { BhkType, Furnishing } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** GET /api/listings — browse listings with basic filters. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const minRent = url.searchParams.get('minRent');
  const maxRent = url.searchParams.get('maxRent');
  const bhk = url.searchParams.getAll('bhk') as BhkType[];
  const furnishing = url.searchParams.getAll('furnishing') as Furnishing[];

  const listings = await fetchAllListings({
    minRent: minRent ? Number(minRent) : undefined,
    maxRent: maxRent ? Number(maxRent) : undefined,
    bhk: bhk.length ? bhk : undefined,
    furnishing: furnishing.length ? furnishing : undefined,
  });

  return NextResponse.json({ listings });
}

/** POST /api/listings — create a new listing. Rate-limited per IP. */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`listings:create:${ip}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many submissions. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validation = validateListing(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  try {
    const listing = await createListing(validation.data);
    return NextResponse.json({ listing }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create listing';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
