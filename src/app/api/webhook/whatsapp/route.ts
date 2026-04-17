import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * WhatsApp listing-submission webhook.
 *
 * Compatible with Twilio's WhatsApp sandbox message webhook payload
 * (application/x-www-form-urlencoded with `From`, `Body`, `NumMedia`,
 * `MediaUrl0`, `Latitude`, `Longitude`, etc.). It parses a loosely-
 * structured text message into a pending listing row and responds with a
 * Twilio-flavoured TwiML acknowledgement so the sender sees a reply in
 * their chat.
 *
 * We intentionally write to `listings_drafts` (not `listings`) so the
 * admin moderation queue owns the "go-live" decision.
 *
 * Verification:
 *   GET  /api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
 *   → echoes hub.challenge iff the token matches WHATSAPP_VERIFY_TOKEN
 *     (for Meta/WhatsApp-Cloud style setups).
 */

/** Extract first numeric run from text (e.g. "rent 35k" → 35000). */
function parseRent(text: string): number | null {
  // "35,000" / "35000" / "35k" / "₹35000"
  const kMatch = text.match(/(\d+(?:[.,]\d+)?)\s*k\b/i);
  if (kMatch) {
    const n = Number(kMatch[1].replace(',', ''));
    if (Number.isFinite(n)) return Math.round(n * 1000);
  }
  const plain = text.match(/(?:rent|price|₹|rs\.?)\s*[:\-]?\s*([\d,]{3,})/i);
  if (plain) {
    const n = Number(plain[1].replace(/,/g, ''));
    if (Number.isFinite(n)) return n;
  }
  const any = text.match(/\b([\d,]{4,7})\b/);
  if (any) {
    const n = Number(any[1].replace(/,/g, ''));
    if (Number.isFinite(n) && n >= 1000 && n <= 10_000_000) return n;
  }
  return null;
}

/** Parse "2BHK" / "2 BHK" / "1RK" / "studio". */
function parseBhk(text: string): string {
  const m = text.match(/\b([1-4])\s*bhk\b/i);
  if (m) return `${m[1]}BHK`;
  if (/\b1\s*rk\b/i.test(text)) return '1RK';
  if (/\bstudio\b/i.test(text)) return '1RK';
  if (/\broom\b/i.test(text)) return 'Room';
  if (/\bshar/i.test(text)) return 'Shared';
  return '1BHK';
}

function parseArea(text: string): string | null {
  const m = text.match(/(?:in|at|near)\s+([A-Za-z][A-Za-z\s]{2,30})/i);
  if (!m) return null;
  return m[1].trim().replace(/\s+/g, ' ');
}

function twiml(body: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${body.replace(/[<&>]/g, '')}</Message></Response>`;
  return new Response(xml, { status: 200, headers: { 'Content-Type': 'application/xml' } });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === 'subscribe' && expected && token === expected && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return NextResponse.json({ ok: true, webhook: 'whatsapp' });
}

export async function POST(req: Request) {
  let from = '';
  let body = '';
  let mediaUrl: string | null = null;
  let lat: number | null = null;
  let lng: number | null = null;

  const contentType = req.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) {
      const json = (await req.json()) as Record<string, unknown>;
      from = String(json.From ?? json.from ?? '');
      body = String(json.Body ?? json.body ?? json.text ?? '');
      mediaUrl = (json.MediaUrl0 as string | undefined) ?? null;
      const jLat = json.Latitude ?? json.latitude;
      const jLng = json.Longitude ?? json.longitude;
      if (jLat != null) lat = Number(jLat);
      if (jLng != null) lng = Number(jLng);
    } else {
      const form = await req.formData();
      from = String(form.get('From') ?? '');
      body = String(form.get('Body') ?? '');
      mediaUrl = (form.get('MediaUrl0') as string | null) ?? null;
      const fLat = form.get('Latitude');
      const fLng = form.get('Longitude');
      if (fLat) lat = Number(fLat);
      if (fLng) lng = Number(fLng);
    }
  } catch {
    return twiml("Sorry, we couldn't read that message. Please try again.");
  }

  if (!body.trim() && !mediaUrl) {
    return twiml('Send a listing like: "2BHK in Bandra West, rent 45k, sea view" and (optionally) attach a photo + location.');
  }

  const rent = parseRent(body);
  const bhk = parseBhk(body);
  const area = parseArea(body);

  const admin = getSupabaseAdmin();
  if (!admin) {
    return twiml('Received — but the server is in demo mode, so we did not save it.');
  }

  const draft = {
    source: 'whatsapp' as const,
    raw_from: from,
    raw_body: body.slice(0, 2000),
    media_url: mediaUrl,
    parsed_rent: rent,
    parsed_bhk: bhk,
    parsed_area: area,
    lat,
    lng,
  };

  const { error } = await admin.from('listing_drafts').insert(draft);
  if (error) {
    // Table may not exist yet (requires migration 0005_listing_drafts.sql).
    // Log for operators; respond positively to the sender so they are not confused.
    console.error('[whatsapp webhook] listing_drafts insert failed:', error.message);
    return twiml(
      `Got it! We parsed "${bhk}" at "${area ?? '(area missing)'}" for ₹${rent ?? '?'}. A moderator will review shortly.`,
    );
  }

  return twiml(
    `Got it! We parsed "${bhk}" at "${area ?? '(area missing)'}" for ₹${rent ?? '?'}. A moderator will review and publish it shortly.`,
  );
}
