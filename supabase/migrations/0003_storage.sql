-- ═══════════════════════════════════════════════════════════════════════════
-- Storage: the private bucket that holds SOP photos, keyed by
-- <restaurant_id>/<submission_id>/<kind>-<filename>. Access is scoped to the
-- user's own restaurant (the first path segment).
-- ═══════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('sop-photos', 'sop-photos', false)
on conflict (id) do nothing;

create policy "sop_photos read own restaurant"
  on storage.objects for select
  using (
    bucket_id = 'sop-photos'
    and (storage.foldername(name))[1] = current_restaurant_id()::text
  );

create policy "sop_photos insert own restaurant"
  on storage.objects for insert
  with check (
    bucket_id = 'sop-photos'
    and (storage.foldername(name))[1] = current_restaurant_id()::text
  );
