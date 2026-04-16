-- Supabase Storage bucket for listing images.
-- Run this in the Supabase SQL editor after 0001_init.sql.

-- 1. Create the bucket (idempotent).
insert into storage.buckets (id, name, public)
values ('listings', 'listings', true)
on conflict (id) do nothing;

-- 2. Policies. Uploads are expected to go through our API route using the
-- service-role key, which bypasses RLS anyway — but these policies let you
-- read files publicly and also permit authenticated users to upload directly
-- if you later migrate to client-side uploads.

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

drop policy if exists "Owner can update own media" on storage.objects;
create policy "Owner can update own media"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'listings' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Owner can delete own media" on storage.objects;
create policy "Owner can delete own media"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'listings' and auth.uid()::text = (storage.foldername(name))[1]);
