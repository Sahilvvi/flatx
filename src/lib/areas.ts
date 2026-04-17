/**
 * Hand-curated list of popular Mumbai neighborhoods with rough centroid
 * coordinates. Used by `/[area]` dynamic pages and the sitemap.
 */

export interface AreaInfo {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  /** Optional aliases to match `area_name` in the DB (lowercased match). */
  aliases?: string[];
  blurb?: string;
}

export const AREAS: AreaInfo[] = [
  { slug: 'bandra-west', name: 'Bandra West', lat: 19.0596, lng: 72.8295, aliases: ['bandra'], blurb: 'Sea-facing flats, cafes, Bandstand — Mumbai\'s most walkable suburb.' },
  { slug: 'bandra-east', name: 'Bandra East', lat: 19.0596, lng: 72.8405, blurb: 'BKC-adjacent, newer towers, shorter commute for finance & consulting.' },
  { slug: 'andheri-west', name: 'Andheri West', lat: 19.1367, lng: 72.8269, aliases: ['andheri'], blurb: 'Nightlife, metro access, balanced rent for young professionals.' },
  { slug: 'andheri-east', name: 'Andheri East', lat: 19.1136, lng: 72.8697, blurb: 'Airport-side, corporate parks, metro + WEH access.' },
  { slug: 'powai', name: 'Powai', lat: 19.1197, lng: 72.9051, blurb: 'Lake views, IIT campus, tech offices — gated-society heavy.' },
  { slug: 'juhu', name: 'Juhu', lat: 19.1075, lng: 72.8263, blurb: 'Beach-side premium; actors, expats, and long-standing families.' },
  { slug: 'malad-west', name: 'Malad West', lat: 19.1869, lng: 72.8397, blurb: 'Infinity Mall side — affordable-to-mid-range family housing.' },
  { slug: 'goregaon-east', name: 'Goregaon East', lat: 19.1640, lng: 72.8539, blurb: 'Oberoi Mall & Nesco — good metro + WEH access, newer buildings.' },
  { slug: 'thane-west', name: 'Thane West', lat: 19.2183, lng: 72.9781, blurb: 'Big flats, lake views, long WE/CR commute — best value-for-space in MMR.' },
  { slug: 'dadar', name: 'Dadar', lat: 19.0180, lng: 72.8478, blurb: 'Central, CR/WR interchange, deeply rooted Marathi culture.' },
  { slug: 'worli', name: 'Worli', lat: 19.0176, lng: 72.8157, blurb: 'Sea Link gateway, premium high-rises, strong financial-district access.' },
  { slug: 'lower-parel', name: 'Lower Parel', lat: 18.9982, lng: 72.8300, blurb: 'Mills-turned-offices, Kamala Mills, Phoenix — walk-to-work ideal.' },
  { slug: 'chembur', name: 'Chembur', lat: 19.0619, lng: 72.9000, blurb: 'Monorail + metro, central-east location with quieter streets.' },
];

export function findArea(slug: string): AreaInfo | null {
  return AREAS.find((a) => a.slug === slug) ?? null;
}

/** True when a listing's `area_name` matches the area (case-insensitive). */
export function listingMatchesArea(areaName: string | null | undefined, area: AreaInfo): boolean {
  if (!areaName) return false;
  const name = areaName.toLowerCase().trim();
  const target = area.name.toLowerCase();
  if (name === target) return true;
  // Only accept alias matches when they are exact — substring matches like
  // `'bandra east'.includes('bandra')` wrongly pull East listings into the
  // West page and vice versa.
  if (area.aliases?.some((a) => name === a.toLowerCase())) return true;
  // Safe substring fallback: match the *full* area name as a substring so
  // values like `"Dadar East"` or `"Powai, Mumbai"` still map to the right
  // area page. This does NOT re-introduce the East/West bug because the full
  // area name (e.g. `"bandra west"`) is never a substring of `"bandra east"`.
  return name.includes(target);
}
