import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/auth/admin';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface Ctx {
  params: { id: string };
}

export async function DELETE(req: Request, { params }: Ctx) {
  const check = await checkAdmin(req);
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason ?? 'forbidden' }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'supabase-not-configured' }, { status: 500 });

  const { error } = await admin.from('listings').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const check = await checkAdmin(req);
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason ?? 'forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid-body' }, { status: 400 });
  }

  // Whitelist the fields an admin may patch.
  const allowed: Record<string, unknown> = {};
  for (const key of ['title', 'description', 'rent'] as const) {
    if (key in body) allowed[key] = body[key];
  }
  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'no-valid-fields' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'supabase-not-configured' }, { status: 500 });

  const { data, error } = await admin
    .from('listings')
    .update(allowed)
    .eq('id', params.id)
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listing: data });
}
