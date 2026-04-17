import { NextResponse } from 'next/server';
import { computeRentInsight, createRentPoint } from '@/lib/listings-service';
import { validateRentPoint } from '@/lib/validation';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import type { BhkType } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/insights?lat=..&lng=..&radius=..&rent=..&bhk=..
 * Returns aggregate rent statistics around a point, plus a verdict telling
 * the user if they are over/under/fair-paying if `rent` is provided.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Invalid lat/lng' }, { status: 400 });
  }

  const radius = Number(url.searchParams.get('radius') ?? '1500');
  const rent = url.searchParams.get('rent');
  const bhk = (url.searchParams.get('bhk') as BhkType | null) ?? undefined;

  const stats = await computeRentInsight(lat, lng, radius, bhk);

  let verdict: {
    label: 'overpaying' | 'fair' | 'underpaying' | 'insufficient-data';
    message: string;
    delta_pct?: number;
  } = { label: 'insufficient-data', message: 'Not enough nearby data yet.' };

  if (rent && stats.sample_size >= 3 && stats.avg_rent) {
    const userRent = Number(rent);
    const delta = ((userRent - stats.avg_rent) / stats.avg_rent) * 100;
    if (delta > 10) {
      verdict = {
        label: 'overpaying',
        message: `You're paying ~${Math.round(delta)}% more than the local average.`,
        delta_pct: Math.round(delta),
      };
    } else if (delta < -10) {
      verdict = {
        label: 'underpaying',
        message: `You're paying ~${Math.round(-delta)}% less than the local average — great deal.`,
        delta_pct: Math.round(delta),
      };
    } else {
      verdict = {
        label: 'fair',
        message: `You're paying close to the local average (within ±10%).`,
        delta_pct: Math.round(delta),
      };
    }
  }

  return NextResponse.json({ stats, verdict });
}

/** POST /api/insights — contribute a rent data point. */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`insights:create:${ip}`);
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

  const v = validateRentPoint(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  try {
    await createRentPoint(v.data);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save data point';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
