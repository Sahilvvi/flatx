-- Supabase Storage bucket for listing images.
-- Run this in the Supabase SQL editor after 0001_init.sql.

-- 1. Create the bucket (idempotent).
insert into storage.buckets (id, name, public)
values ('listings', 'listings', true)
on conflict (id) do nothing;

-- 2. Policies.
--
-- All writes go through /api/uploads using the service-role key, which
-- bypasses RLS. Public reads are allowed so <img src> works without auth.
--
-- We intentionally do NOT install owner-scoped update/delete policies: our
-- upload path stores files at `listings/{timestamp}-{random}.{ext}`, so
-- `(storage.foldername(name))[1]` is always 'listings' and any UID-based
-- policy would never match. If you later migrate to client-side uploads,
-- change the path to `{auth.uid()}/{timestamp}-{random}.{ext}` and add
-- owner-scoped policies then.

drop policy if exists "Public read listings media" on storage.objects;
create policy "Public read listings media"
  on storage.objects
  for select
  using (bucket_id = 'listings');

drop policy if exists "Authenticated can upload listings media" on storage.objects;
create policy "Authenticated can upload listings media"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'listings');

-- Previously-added "Owner can update own media" / "Owner can delete own media"
-- policies (keyed on (storage.foldername(name))[1]) are dropped if present so
-- they don't sit around looking valid but never matching any request.
drop policy if exists "Owner can update own media" on storage.objects;
drop policy if exists "Owner can delete own media" on storage.objects;
