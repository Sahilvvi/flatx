import { createClient } from '@supabase/supabase-js';
import { ADMIN_EMAILS, SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from '../env';

export interface AdminCheckResult {
  allowed: boolean;
  reason?: 'missing-supabase' | 'no-token' | 'invalid-token' | 'not-admin';
  email?: string;
}

/**
 * Validates a bearer token from the Authorization header and checks whether
 * the caller's email is in the ADMIN_EMAILS allow-list.
 *
 * Server-side only. Uses a per-request anon-key client so each token is
 * verified through Supabase Auth.
 */
export async function checkAdmin(req: Request): Promise<AdminCheckResult> {
  if (!hasSupabase) return { allowed: false, reason: 'missing-supabase' };
  if (ADMIN_EMAILS.length === 0) return { allowed: false, reason: 'not-admin' };

  const header = req.headers.get('authorization') ?? req.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return { allowed: false, reason: 'no-token' };
  const token = header.slice('Bearer '.length).trim();
  if (!token) return { allowed: false, reason: 'no-token' };

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { allowed: false, reason: 'invalid-token' };

  const email = (data.user.email ?? '').toLowerCase();
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return { allowed: false, reason: 'not-admin', email };
  }
  return { allowed: true, email };
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
