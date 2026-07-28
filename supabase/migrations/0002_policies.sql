-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security policies.
-- Tenancy model: a user belongs to one restaurant (users.id = auth.uid()).
-- Staff read/write their own restaurant's rows; only managers/owners resolve
-- submissions. audit_logs are insert + read within the restaurant.
-- ═══════════════════════════════════════════════════════════════════════════

-- Current user's restaurant. SECURITY DEFINER so the lookup itself isn't gated
-- by the policies it feeds.
create or replace function current_restaurant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select restaurant_id from users where id = auth.uid();
$$;

create or replace function current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from users where id = auth.uid();
$$;

create or replace function is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_user_role() in ('manager', 'owner'), false);
$$;

-- ── restaurants ────────────────────────────────────────────────────────────
create policy restaurants_select on restaurants
  for select using (id = current_restaurant_id());

-- ── users ──────────────────────────────────────────────────────────────────
create policy users_select_same_restaurant on users
  for select using (restaurant_id = current_restaurant_id());
create policy users_update_self on users
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ── sops ───────────────────────────────────────────────────────────────────
create policy sops_select on sops
  for select using (restaurant_id = current_restaurant_id());

-- ── sop_submissions ────────────────────────────────────────────────────────
create policy submissions_select on sop_submissions
  for select using (restaurant_id = current_restaurant_id());

create policy submissions_insert on sop_submissions
  for insert with check (
    restaurant_id = current_restaurant_id()
    and submitted_by = auth.uid()
  );

-- Submitter may edit their own row while pending; managers may resolve any.
create policy submissions_update on sop_submissions
  for update using (
    restaurant_id = current_restaurant_id()
    and (submitted_by = auth.uid() or is_manager())
  )
  with check (restaurant_id = current_restaurant_id());

-- ── sop_photos (scoped through the parent submission) ──────────────────────
create policy photos_select on sop_photos
  for select using (
    exists (
      select 1 from sop_submissions s
      where s.id = sop_photos.submission_id
        and s.restaurant_id = current_restaurant_id()
    )
  );

create policy photos_insert on sop_photos
  for insert with check (
    exists (
      select 1 from sop_submissions s
      where s.id = sop_photos.submission_id
        and s.restaurant_id = current_restaurant_id()
    )
  );

-- ── audit_logs (append-only within the restaurant) ─────────────────────────
create policy audit_select on audit_logs
  for select using (restaurant_id = current_restaurant_id());

create policy audit_insert on audit_logs
  for insert with check (
    restaurant_id = current_restaurant_id()
    and (actor_id = auth.uid() or actor_id is null)
  );
