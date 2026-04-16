-- Mumbai Rent Intelligence Platform — initial schema
-- Run this in Supabase SQL editor (or via the Supabase CLI) before using the app.

-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists postgis;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
-- A lightweight profile row keyed off Supabase auth.users.id. Auth itself is
-- handled by Supabase; this table stores public profile data and contact info
-- (e.g. a WhatsApp number) that powers the "Chat on WhatsApp" button.
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique references auth.users(id) on delete set null,
  name text,
  email text unique,
  phone text,
  whatsapp text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------------------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  kind text not null default 'flat' check (kind in ('flat', 'room', 'flatmate')),
  title text not null,
  description text,
  rent integer not null check (rent >= 0),
  deposit integer check (deposit >= 0),
  bhk_type text not null check (bhk_type in ('1RK','1BHK','2BHK','3BHK','4BHK+','Room','Shared')),
  furnishing text not null default 'semi' check (furnishing in ('unfurnished','semi','furnished')),
  area_name text,
  lat double precision not null,
  lng double precision not null,
  geom geography(point, 4326) generated always as (
    st_setsrid(st_makepoint(lng, lat), 4326)::geography
  ) stored,
  images text[] not null default '{}',
  tags text[] not null default '{}', -- e.g. 'bachelor_friendly','pet_friendly','vegetarian_only'
  contact_whatsapp text,
  created_at timestamptz not null default now()
);

create index if not exists listings_geom_idx on public.listings using gist (geom);
create index if not exists listings_rent_idx on public.listings (rent);
create index if not exists listings_bhk_idx on public.listings (bhk_type);
create index if not exists listings_created_idx on public.listings (created_at desc);

-- ---------------------------------------------------------------------------
-- rent_data_points
-- ---------------------------------------------------------------------------
-- Crowd-sourced rent sightings. Separate from listings so users can contribute
-- "I pay X for a Y BHK at this pin" without creating a full listing. This is
-- what powers the Rent Insight tool.
create table if not exists public.rent_data_points (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.users(id) on delete set null,
  lat double precision not null,
  lng double precision not null,
  geom geography(point, 4326) generated always as (
    st_setsrid(st_makepoint(lng, lat), 4326)::geography
  ) stored,
  rent integer not null check (rent >= 0),
  bhk_type text not null check (bhk_type in ('1RK','1BHK','2BHK','3BHK','4BHK+','Room','Shared')),
  area_name text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists rent_data_geom_idx on public.rent_data_points using gist (geom);
create index if not exists rent_data_bhk_idx on public.rent_data_points (bhk_type);

-- ---------------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------------
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  score numeric(6,3) not null default 0,
  reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);
create index if not exists matches_user_idx on public.matches (user_id);

-- ---------------------------------------------------------------------------
-- RPCs — geo helpers
-- ---------------------------------------------------------------------------

-- Find listings within `radius_m` metres of (lat,lng) with optional filters.
create or replace function public.listings_nearby(
  in_lat double precision,
  in_lng double precision,
  in_radius_m integer default 3000,
  in_min_rent integer default null,
  in_max_rent integer default null,
  in_bhk text[] default null,
  in_furnishing text[] default null,
  in_limit integer default 200
)
returns table (
  id uuid,
  user_id uuid,
  kind text,
  title text,
  description text,
  rent integer,
  deposit integer,
  bhk_type text,
  furnishing text,
  area_name text,
  lat double precision,
  lng double precision,
  images text[],
  tags text[],
  contact_whatsapp text,
  distance_m double precision,
  created_at timestamptz
)
language sql
stable
as $$
  select l.id, l.user_id, l.kind, l.title, l.description, l.rent, l.deposit,
         l.bhk_type, l.furnishing, l.area_name, l.lat, l.lng, l.images, l.tags,
         l.contact_whatsapp,
         st_distance(l.geom, st_setsrid(st_makepoint(in_lng, in_lat), 4326)::geography) as distance_m,
         l.created_at
  from public.listings l
  where st_dwithin(l.geom, st_setsrid(st_makepoint(in_lng, in_lat), 4326)::geography, in_radius_m)
    and (in_min_rent is null or l.rent >= in_min_rent)
    and (in_max_rent is null or l.rent <= in_max_rent)
    and (in_bhk is null or l.bhk_type = any(in_bhk))
    and (in_furnishing is null or l.furnishing = any(in_furnishing))
  order by distance_m asc
  limit in_limit;
$$;

-- Aggregate rent stats within a radius for the Rent Insight feature. Uses
-- listings + rent_data_points together to get a richer sample.
create or replace function public.rent_insight(
  in_lat double precision,
  in_lng double precision,
  in_radius_m integer default 1500,
  in_bhk text default null
)
returns table (
  sample_size integer,
  avg_rent numeric,
  median_rent numeric,
  p25_rent numeric,
  p75_rent numeric,
  min_rent integer,
  max_rent integer
)
language sql
stable
as $$
  with combined as (
    select rent, bhk_type, geom from public.listings
    union all
    select rent, bhk_type, geom from public.rent_data_points
  )
  select count(*)::int as sample_size,
         round(avg(rent)::numeric, 0) as avg_rent,
         percentile_cont(0.5) within group (order by rent)::numeric as median_rent,
         percentile_cont(0.25) within group (order by rent)::numeric as p25_rent,
         percentile_cont(0.75) within group (order by rent)::numeric as p75_rent,
         min(rent) as min_rent,
         max(rent) as max_rent
  from combined
  where st_dwithin(geom, st_setsrid(st_makepoint(in_lng, in_lat), 4326)::geography, in_radius_m)
    and (in_bhk is null or bhk_type = in_bhk);
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.listings enable row level security;
alter table public.rent_data_points enable row level security;
alter table public.matches enable row level security;

-- Listings and rent data are publicly readable (the whole point of the map).
drop policy if exists "listings readable by all" on public.listings;
create policy "listings readable by all" on public.listings
  for select using (true);

drop policy if exists "rent data readable by all" on public.rent_data_points;
create policy "rent data readable by all" on public.rent_data_points
  for select using (true);

-- Writes go through the API route using the service-role key, so we do not
-- add anon insert policies here. If you want to allow direct-from-browser
-- writes later, add policies scoped to auth.uid().
