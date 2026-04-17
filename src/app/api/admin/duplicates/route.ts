import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/auth/admin';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/duplicates — returns pairs of likely duplicate listings.
 * Requires migration 0004_search_and_dedup.sql (find_duplicate_listings RPC).
 */
export async function GET(req: Request) {
  const check = await checkAdmin(req);
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason ?? 'forbidden' }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'supabase-not-configured' }, { status: 500 });

  const { data, error } = await admin.rpc('find_duplicate_listings', { in_min_similarity: 0.75 });
  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        hint: 'Run supabase/migrations/0004_search_and_dedup.sql first.',
      },
      { status: 500 },
    );
  }
  return NextResponse.json({ pairs: data ?? [] });
}
