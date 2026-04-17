/**
 * Centralised access to environment variables with sensible fallbacks so the
 * app still renders (in "demo mode") when secrets are not yet configured.
 */

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export const DEFAULT_LAT = Number(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? '19.0760');
export const DEFAULT_LNG = Number(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? '72.8777');
export const DEFAULT_ZOOM = Number(process.env.NEXT_PUBLIC_DEFAULT_ZOOM ?? '11');

export const RATE_LIMIT_WINDOW = Number(process.env.RATE_LIMIT_WINDOW ?? '60');
export const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX ?? '20');

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://flatx.vercel.app').replace(/\/$/, '');

/** Comma-separated emails allowed to access /admin. */
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const hasSupabaseAdmin = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
export const hasMapbox = Boolean(MAPBOX_TOKEN);
