import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
  hasSupabaseAdmin,
} from '../env';

let adminClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client configured with the service-role key. ONLY use
 * this in server-side code (API route handlers, Server Actions). Returns
 * `null` if env vars are missing so callers can fall back to mock data.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!hasSupabaseAdmin) return null;
  if (!adminClient) {
    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}
