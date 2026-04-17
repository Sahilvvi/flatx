-- Full-text / fuzzy search (pg_trgm) + duplicate-listing flagging.
-- Safe to run on an existing DB; all statements are idempotent.

create extension if not exists pg_trgm;

create index if not exists listings_title_trgm_idx
  on listings using gin (title gin_trgm_ops);
create index if not exists listings_description_trgm_idx
  on listings using gin (description gin_trgm_ops);
create index if not exists listings_area_name_trgm_idx
  on listings using gin (area_name gin_trgm_ops);

-- Trigram similarity search across title/description/area_name.
create or replace function search_listings_trgm(
  in_query text,
  in_limit int default 50
) returns setof listings
language sql
stable
as $$
  select l.*
  from listings l
  where l.title % in_query
     or l.description % in_query
     or coalesce(l.area_name, '') % in_query
  order by greatest(
    similarity(l.title, in_query),
    similarity(coalesce(l.description, ''), in_query),
    similarity(coalesce(l.area_name, ''), in_query)
  ) desc
  limit in_limit;
$$;

grant execute on function search_listings_trgm(text, int) to anon, authenticated, service_role;

-- Duplicate detector: two listings in the same area with the same WhatsApp
-- number and >0.8 title similarity are very likely the same place.
-- Returns (primary_id, duplicate_id, similarity) for moderation.
create or replace function find_duplicate_listings(
  in_min_similarity real default 0.8
) returns table (
  primary_id uuid,
  duplicate_id uuid,
  score real
)
language sql
stable
as $$
  select
    least(l1.id, l2.id) as primary_id,
    greatest(l1.id, l2.id) as duplicate_id,
    similarity(l1.title, l2.title) as score
  from listings l1
  join listings l2
    on l1.id < l2.id
   and coalesce(l1.area_name, '') = coalesce(l2.area_name, '')
   and l1.contact_whatsapp is not null
   and l1.contact_whatsapp = l2.contact_whatsapp
   and similarity(l1.title, l2.title) >= in_min_similarity;
$$;

grant execute on function find_duplicate_listings(real) to service_role;
