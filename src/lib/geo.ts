/**
 * Geo helpers. Pure TypeScript so they work in the browser and on the server
 * (e.g. when falling back to mock data without PostGIS).
 */

const EARTH_RADIUS_M = 6_371_000;

export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two lat/lng points, in metres. */
export function haversineMetres(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Roughly clamp a point into the Mumbai bounding box to guard against bad input. */
export function isInMumbaiBounds(lat: number, lng: number): boolean {
  return lat >= 18.85 && lat <= 19.35 && lng >= 72.75 && lng <= 73.05;
}
