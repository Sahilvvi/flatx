import type { MetadataRoute } from 'next';
import { fetchAllListings } from '@/lib/listings-service';
import { SITE_URL } from '@/lib/env';

const STATIC_AREAS = [
  'bandra-west',
  'andheri-west',
  'andheri-east',
  'powai',
  'juhu',
  'malad-west',
  'goregaon-east',
  'thane-west',
  'dadar',
  'worli',
  'lower-parel',
  'chembur',
];

const STATIC_PATHS = ['', '/insights', '/match', '/listings/new', '/auth/login'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${base}${p || '/'}`,
    lastModified: now,
    changeFrequency: p === '' ? 'daily' : 'weekly',
    priority: p === '' ? 1 : 0.6,
  }));

  const areaEntries: MetadataRoute.Sitemap = STATIC_AREAS.map((a) => ({
    url: `${base}/${a}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  let listings: Awaited<ReturnType<typeof fetchAllListings>> = [];
  try {
    listings = await fetchAllListings();
  } catch {
    listings = [];
  }
  const listingEntries: MetadataRoute.Sitemap = listings.slice(0, 500).map((l) => ({
    url: `${base}/listings/${l.id}`,
    lastModified: l.created_at ? new Date(l.created_at) : now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticEntries, ...areaEntries, ...listingEntries];
}
