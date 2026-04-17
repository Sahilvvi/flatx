-- 0005: staging table for WhatsApp/API-submitted listings + saved-search alerts queue
--
-- Both tables are admin-only (no RLS policies for `anon`). Writes happen from
-- the Next.js server using the Supabase service-role key, and the admin panel
-- reads them the same way.

create table if not exists public.listing_drafts (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'whatsapp',       -- 'whatsapp' | 'api' | 'email'
  status text not null default 'pending',        -- 'pending' | 'published' | 'rejected'
  raw_from text,                                  -- e.g. 'whatsapp:+919812345678'
  raw_body text,
  media_url text,
  parsed_rent integer,
  parsed_bhk text,
  parsed_area text,
  lat double precision,
  lng double precision,
  promoted_listing_id uuid references public.listings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listing_drafts_status_idx
  on public.listing_drafts (status, created_at desc);

alter table public.listing_drafts enable row level security;
-- No policies on purpose — service role bypasses RLS; anon/auth users cannot read.

-- Queue of notification deliveries (email / WA / push) owed to users
-- whose saved searches matched a new listing. Consumed by the
-- notify-alerts Edge Function (supabase/functions/notify-alerts).
create table if not exists public.alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,                                   -- FK to auth.users; nullable because we may have anon saved searches later
  channel text not null default 'email',          -- 'email' | 'whatsapp' | 'push'
  payload jsonb not null,                         -- { listing_id, saved_search_id, snippet, ... }
  status text not null default 'queued',          -- 'queued' | 'sent' | 'failed'
  last_error text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists alert_deliveries_status_idx
  on public.alert_deliveries (status, created_at);

alter table public.alert_deliveries enable row level security;
