import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const BUCKET = 'listings';

/**
 * POST /api/uploads — accepts a multipart/form-data body with a single `file`
 * field and stores it in the Supabase Storage `listings` bucket. Returns the
 * public URL. Requires the service-role key (admin client) on the server.
 *
 * In demo mode (no Supabase), returns 503 so the UI can fall back to local
 * ObjectURL previews without persisting.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const gate = checkRateLimit(`uploads:${ip}`);
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'Too many uploads. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfter) } },
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          'Storage not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable image uploads.',
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing `file` field' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large — max ${(MAX_BYTES / 1024 / 1024).toFixed(0)} MB` },
      { status: 413 },
    );
  }
  const mime = file.type || 'application/octet-stream';
  if (!ALLOWED_MIME.has(mime)) {
    return NextResponse.json(
      { error: 'Only JPG / PNG / WEBP / GIF images allowed' },
      { status: 415 },
    );
  }

  const ext = mime.split('/')[1] ?? 'bin';
  const path = `listings/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: mime,
    upsert: false,
  });
  if (upErr) {
    const msg = upErr.message.toLowerCase();
    if (msg.includes('bucket') && (msg.includes('not found') || msg.includes('does not exist'))) {
      return NextResponse.json(
        {
          error:
            'Supabase Storage bucket "listings" does not exist. Create it via Dashboard → Storage or run the SQL in supabase/migrations/0002_storage.sql.',
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}
