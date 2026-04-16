-- Adds a view and RPC variant that expose the listing owner's verification
-- status so the UI can render a verified badge without a second round-trip.

create or replace view public.listings_with_owner as
  select l.*, coalesce(u.is_verified, false) as is_owner_verified
  from public.listings l
  left join public.users u on u.id = l.user_id;

grant select on public.listings_with_owner to anon, authenticated, service_role;

-- Update the nearby RPC to include is_owner_verified.
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
  is_owner_verified boolean,
  created_at timestamptz
)
language sql
stable
as $$
  select l.id, l.user_id, l.kind, l.title, l.description, l.rent, l.deposit,
         l.bhk_type, l.furnishing, l.area_name, l.lat, l.lng, l.images, l.tags,
         l.contact_whatsapp,
         st_distance(l.geom, st_setsrid(st_makepoint(in_lng, in_lat), 4326)::geography) as distance_m,
         coalesce(u.is_verified, false) as is_owner_verified,
         l.created_at
  from public.listings l
  left join public.users u on u.id = l.user_id
  where st_dwithin(l.geom, st_setsrid(st_makepoint(in_lng, in_lat), 4326)::geography, in_radius_m)
    and (in_min_rent is null or l.rent >= in_min_rent)
    and (in_max_rent is null or l.rent <= in_max_rent)
    and (in_bhk is null or l.bhk_type = any(in_bhk))
    and (in_furnishing is null or l.furnishing = any(in_furnishing))
  order by distance_m asc
  limit in_limit;
$$;

-- Allow authenticated users to insert their own listings / rent data.
drop policy if exists "users can insert own listings" on public.listings;
create policy "users can insert own listings" on public.listings
  for insert to authenticated
  with check (user_id in (select id from public.users where auth_id = auth.uid()));

drop policy if exists "users can update own listings" on public.listings;
create policy "users can update own listings" on public.listings
  for update to authenticated
  using (user_id in (select id from public.users where auth_id = auth.uid()));

drop policy if exists "users can read own profile" on public.users;
create policy "users can read own profile" on public.users
  for select using (auth_id = auth.uid());

drop policy if exists "users can upsert own profile" on public.users;
create policy "users can upsert own profile" on public.users
  for insert to authenticated
  with check (auth_id = auth.uid());
