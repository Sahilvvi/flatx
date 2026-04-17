// Supabase Edge Function: notify-alerts
//
// Drains `public.alert_deliveries` rows where status='queued' and dispatches
// them via the configured channel (email / whatsapp / push). Stubbed: real
// delivery requires SMTP / WhatsApp Business API credentials. Until those
// are wired, the function marks rows as 'sent' with a no-op log so operators
// can verify the queue itself drains correctly.
//
// Invoke:
//   supabase functions deploy notify-alerts --no-verify-jwt
//   supabase functions invoke notify-alerts
// Or schedule with pg_cron:
//   select cron.schedule('alerts-every-15-min', '*/15 * * * *',
//     $$ select net.http_post('<functions-url>/notify-alerts',
//                             '{}',
//                             '{"Content-Type":"application/json"}'::jsonb) $$);

// @ts-nocheck  -- Deno runtime; this file is not type-checked by the Next.js TS config.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface AlertRow {
  id: string;
  user_id: string | null;
  channel: 'email' | 'whatsapp' | 'push';
  payload: Record<string, unknown>;
  attempts: number;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

async function deliver(row: AlertRow): Promise<{ ok: true } | { ok: false; error: string }> {
  // Stub: wire real providers here.
  //
  // Email (Resend / SendGrid / SES):
  //   const key = Deno.env.get('RESEND_API_KEY');
  //   ...
  //
  // WhatsApp (Twilio or Meta Cloud):
  //   const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
  //   ...
  //
  // Push (Web Push):
  //   ...
  //
  // For now, log and accept.
  console.log(`[notify-alerts] would deliver ${row.channel} to user=${row.user_id ?? '(anon)'}`);
  return { ok: true };
}

serve(async () => {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return new Response(JSON.stringify({ error: 'missing-env' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: queue, error } = await supabase
    .from('alert_deliveries')
    .select('id, user_id, channel, payload, attempts')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  let sent = 0;
  let failed = 0;

  for (const row of (queue ?? []) as AlertRow[]) {
    const result = await deliver(row);
    if (result.ok) {
      await supabase
        .from('alert_deliveries')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          attempts: row.attempts + 1,
        })
        .eq('id', row.id);
      sent++;
    } else {
      await supabase
        .from('alert_deliveries')
        .update({
          status: row.attempts + 1 >= 3 ? 'failed' : 'queued',
          attempts: row.attempts + 1,
          last_error: result.error,
        })
        .eq('id', row.id);
      failed++;
    }
  }

  return new Response(JSON.stringify({ processed: queue?.length ?? 0, sent, failed }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
});
