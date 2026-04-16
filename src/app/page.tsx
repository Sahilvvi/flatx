import { MapExplorer } from '@/components/map/MapExplorer';
import { fetchNearbyListings } from '@/lib/listings-service';
import { DEFAULT_LAT, DEFAULT_LNG } from '@/lib/env';

// Default revalidation: fresh on every request for the SSR'd first paint.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const initialListings = await fetchNearbyListings({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    radiusM: 8000,
    limit: 200,
  });
  return <MapExplorer initialListings={initialListings} />;
}
