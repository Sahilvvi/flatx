import { getSupabaseAdmin } from './supabase/admin';
import { hasSupabaseAdmin } from './env';
import { MOCK_LISTINGS, MOCK_RENT_POINTS } from './mock-data';
import { haversineMetres } from './geo';
import type {
  BhkType,
  Filters,
  Furnishing,
  Listing,
  ListingKind,
  RentInsightResult,
} from './types';
import type { NewListingInput, NewRentPointInput } from './validation';

/**
 * Central data-access layer. Prefers Supabase when configured, and otherwise
 * returns in-memory mock data so the app stays functional in demo mode.
 */

export interface NearbyQuery {
  lat: number;
  lng: number;
  radiusM?: number;
  minRent?: number;
  maxRent?: number;
  bhk?: BhkType[];
  furnishing?: Furnishing[];
  kind?: ListingKind;
  limit?: number;
}

export async function fetchNearbyListings(q: NearbyQuery): Promise<Listing[]> {
  const radius = q.radiusM ?? 3000;
  const limit = q.limit ?? 200;
  const admin = getSupabaseAdmin();

  if (admin && hasSupabaseAdmin) {
    const { data, error } = await admin.rpc('listings_nearby', {
      in_lat: q.lat,
      in_lng: q.lng,
      in_radius_m: radius,
      in_min_rent: q.minRent ?? null,
      in_max_rent: q.maxRent ?? null,
      in_bhk: q.bhk && q.bhk.length ? q.bhk : null,
      in_furnishing: q.furnishing && q.furnishing.length ? q.furnishing : null,
      in_limit: limit,
    });
    if (!error && Array.isArray(data)) {
      let rows = data as Listing[];
      if (q.kind) rows = rows.filter((r) => r.kind === q.kind);
      return rows;
    }
    // fall through to mocks on error
  }

  return filterMockListings(q, radius, limit);
}

function filterMockListings(q: NearbyQuery, radius: number, limit: number): Listing[] {
  return MOCK_LISTINGS.map((l) => ({
    ...l,
    distance_m: haversineMetres(q.lat, q.lng, l.lat, l.lng),
  }))
    .filter((l) => (l.distance_m ?? 0) <= radius)
    .filter((l) => (q.minRent === undefined ? true : l.rent >= q.minRent))
    .filter((l) => (q.maxRent === undefined ? true : l.rent <= q.maxRent))
    .filter((l) => (q.bhk && q.bhk.length ? q.bhk.includes(l.bhk_type) : true))
    .filter((l) => (q.furnishing && q.furnishing.length ? q.furnishing.includes(l.furnishing) : true))
    .filter((l) => (q.kind ? l.kind === q.kind : true))
    .sort((a, b) => (a.distance_m ?? 0) - (b.distance_m ?? 0))
    .slice(0, limit);
}

export async function fetchAllListings(filters?: Filters): Promise<Listing[]> {
  const admin = getSupabaseAdmin();
  if (admin && hasSupabaseAdmin) {
    let q = admin.from('listings').select('*').order('created_at', { ascending: false }).limit(500);
    if (filters?.minRent !== undefined) q = q.gte('rent', filters.minRent);
    if (filters?.maxRent !== undefined) q = q.lte('rent', filters.maxRent);
    if (filters?.bhk?.length) q = q.in('bhk_type', filters.bhk);
    if (filters?.furnishing?.length) q = q.in('furnishing', filters.furnishing);
    const { data, error } = await q;
    if (!error && Array.isArray(data)) return data as Listing[];
  }
  return MOCK_LISTINGS
    .filter((l) => (filters?.minRent === undefined ? true : l.rent >= filters.minRent))
    .filter((l) => (filters?.maxRent === undefined ? true : l.rent <= filters.maxRent))
    .filter((l) => (filters?.bhk?.length ? filters.bhk.includes(l.bhk_type) : true))
    .filter((l) => (filters?.furnishing?.length ? filters.furnishing.includes(l.furnishing) : true))
    .map((l) => ({ ...l, is_owner_verified: mockVerified(l.id) }));
}

/** Demo helper: pretend every other mock listing is from a verified user. */
function mockVerified(id: string): boolean {
  const m = id.match(/(\d+)$/);
  if (!m) return false;
  return Number(m[1]) % 2 === 0;
}

export async function fetchListingById(id: string): Promise<Listing | null> {
  const admin = getSupabaseAdmin();
  if (admin && hasSupabaseAdmin) {
    const { data, error } = await admin.from('listings').select('*').eq('id', id).maybeSingle();
    if (!error && data) return data as Listing;
  }
  const hit = MOCK_LISTINGS.find((l) => l.id === id) ?? null;
  return hit ? { ...hit, is_owner_verified: mockVerified(hit.id) } : null;
}

export async function createListing(input: NewListingInput): Promise<Listing> {
  const admin = getSupabaseAdmin();
  if (admin && hasSupabaseAdmin) {
    const { data, error } = await admin
      .from('listings')
      .insert({
        kind: input.kind,
        title: input.title,
        description: input.description,
        rent: input.rent,
        deposit: input.deposit,
        bhk_type: input.bhk_type,
        furnishing: input.furnishing,
        area_name: input.area_name,
        lat: input.lat,
        lng: input.lng,
        tags: input.tags ?? [],
        images: input.images ?? [],
        contact_whatsapp: input.contact_whatsapp,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as Listing;
  }
  // Demo mode: echo back a synthesized listing. Not persisted.
  const listing: Listing = {
    id: `demo-${Date.now()}`,
    user_id: null,
    kind: input.kind,
    title: input.title,
    description: input.description ?? null,
    rent: input.rent,
    deposit: input.deposit ?? null,
    bhk_type: input.bhk_type,
    furnishing: input.furnishing,
    area_name: input.area_name ?? null,
    lat: input.lat,
    lng: input.lng,
    images: input.images ?? [],
    tags: input.tags ?? [],
    contact_whatsapp: input.contact_whatsapp ?? null,
    created_at: new Date().toISOString(),
  };
  return listing;
}

export async function createRentPoint(input: NewRentPointInput): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (admin && hasSupabaseAdmin) {
    const { error } = await admin.from('rent_data_points').insert({
      lat: input.lat,
      lng: input.lng,
      rent: input.rent,
      bhk_type: input.bhk_type,
      area_name: input.area_name,
      notes: input.notes,
    });
    if (error) throw new Error(error.message);
    return true;
  }
  return true; // demo mode: pretend it worked
}

export async function computeRentInsight(
  lat: number,
  lng: number,
  radiusM = 1500,
  bhk?: BhkType,
): Promise<RentInsightResult> {
  const admin = getSupabaseAdmin();
  if (admin && hasSupabaseAdmin) {
    const { data, error } = await admin.rpc('rent_insight', {
      in_lat: lat,
      in_lng: lng,
      in_radius_m: radiusM,
      in_bhk: bhk ?? null,
    });
    if (!error && Array.isArray(data) && data.length) {
      return data[0] as RentInsightResult;
    }
  }

  // Fallback using in-memory mocks.
  const all = [
    ...MOCK_LISTINGS.map((l) => ({ rent: l.rent, bhk_type: l.bhk_type, lat: l.lat, lng: l.lng })),
    ...MOCK_RENT_POINTS.map((p) => ({ rent: p.rent, bhk_type: p.bhk_type, lat: p.lat, lng: p.lng })),
  ]
    .filter((p) => haversineMetres(lat, lng, p.lat, p.lng) <= radiusM)
    .filter((p) => (bhk ? p.bhk_type === bhk : true))
    .map((p) => p.rent)
    .sort((a, b) => a - b);

  if (!all.length) {
    return {
      sample_size: 0,
      avg_rent: null,
      median_rent: null,
      p25_rent: null,
      p75_rent: null,
      min_rent: null,
      max_rent: null,
    };
  }

  const pct = (arr: number[], p: number) => {
    const idx = (arr.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return arr[lo];
    return arr[lo] + (arr[hi] - arr[lo]) * (idx - lo);
  };
  const avg = all.reduce((s, v) => s + v, 0) / all.length;
  return {
    sample_size: all.length,
    avg_rent: Math.round(avg),
    median_rent: Math.round(pct(all, 0.5)),
    p25_rent: Math.round(pct(all, 0.25)),
    p75_rent: Math.round(pct(all, 0.75)),
    min_rent: all[0],
    max_rent: all[all.length - 1],
  };
}

/**
 * Simple matching: score candidate listings vs a seeker's criteria. Location
 * proximity, budget fit, BHK/furnishing overlap, and tag overlap all feed
 * into a 0..100 score.
 */
export interface MatchQuery {
  lat: number;
  lng: number;
  maxRent: number;
  minRent?: number;
  bhk?: BhkType[];
  furnishing?: Furnishing[];
  kind?: ListingKind;
  tags?: string[];
  radiusM?: number;
}

export interface Match {
  listing: Listing;
  score: number;
  reasons: string[];
}

export async function matchListings(q: MatchQuery): Promise<Match[]> {
  const candidates = await fetchNearbyListings({
    lat: q.lat,
    lng: q.lng,
    radiusM: q.radiusM ?? 5000,
    kind: q.kind,
  });
  return candidates
    .map((listing) => {
      const reasons: string[] = [];
      let score = 0;
      const distance = listing.distance_m ?? haversineMetres(q.lat, q.lng, listing.lat, listing.lng);

      // Proximity: up to 40 pts, linearly decreasing to 0 at radius.
      const radius = q.radiusM ?? 5000;
      const proximity = Math.max(0, 1 - distance / radius) * 40;
      score += proximity;
      if (proximity > 25) reasons.push('Very close to your pin');
      else if (proximity > 10) reasons.push('Within commute range');

      // Budget: up to 35 pts if strictly within range; partial otherwise.
      if (listing.rent <= q.maxRent && (q.minRent === undefined || listing.rent >= q.minRent)) {
        score += 35;
        reasons.push('Within your budget');
      } else if (listing.rent <= q.maxRent * 1.15) {
        score += 18;
        reasons.push('Slightly above budget');
      }

      // BHK match: 10 pts.
      if (!q.bhk || q.bhk.length === 0 || q.bhk.includes(listing.bhk_type)) {
        score += 10;
        if (q.bhk && q.bhk.length) reasons.push(`${listing.bhk_type} matches preference`);
      }

      // Furnishing: 5 pts.
      if (!q.furnishing || q.furnishing.length === 0 || q.furnishing.includes(listing.furnishing)) {
        score += 5;
      }

      // Tags overlap: up to 10 pts.
      if (q.tags && q.tags.length) {
        const overlap = listing.tags.filter((t) => q.tags!.includes(t)).length;
        score += Math.min(10, overlap * 5);
        if (overlap > 0) reasons.push(`Matches ${overlap} preference${overlap > 1 ? 's' : ''}`);
      }

      return { listing, score: Math.round(score * 10) / 10, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);
}
