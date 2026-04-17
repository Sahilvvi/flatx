import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/auth/admin';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** GET /api/admin/listings — returns up to 500 most recent listings for moderation. */
export async function GET(req: Request) {
  const check = await checkAdmin(req);
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason ?? 'forbidden' }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'supabase-not-configured' }, { status: 500 });

  const { data, error } = await admin
    .from('listings')
    .select('id, title, rent, area_name, bhk_type, contact_whatsapp, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listings: data ?? [] });
}
