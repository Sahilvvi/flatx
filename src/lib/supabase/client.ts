import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from '../env';

let browserClient: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase client for use in Client Components. Returns
 * `null` when Supabase env vars are not configured so callers can fall back
 * to demo mode instead of throwing.
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (!hasSupabase) return null;
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true },
    });
  }
  return browserClient;
}
