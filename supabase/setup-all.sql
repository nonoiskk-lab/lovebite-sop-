-- ═══════════════════════════════════════════════════════════════════════════
-- ROOS — one-paste setup. Runs everything in order:
--   0001_init  →  0002_policies  →  0003_storage  →  seed
-- Paste this whole file into the Supabase SQL Editor and hit Run.
-- (Generated from the files in migrations/ + seed.sql — edit those, not this.)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────── 0001_init.sql ───────────────────────────
-- ═══════════════════════════════════════════════════════════════════════════
-- ROOS Phase 1 — Daily SOP Execution
-- Initial schema. Implements the "Suggested DB shape" from the design handoff.
--
-- Conventions (project core principles):
--   • all PKs are uuid (gen_random_uuid())
--   • every table carries created_at / updated_at / created_by / updated_by
--   • soft-delete via deleted_at (null = live)
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── enums ──────────────────────────────────────────────────────────────────
create type user_role as enum ('kitchen', 'foh', 'manager', 'owner');

create type submission_status as enum (
  'not_started',
  'pending',
  'flagged',
  'logged',
  'approved',
  'rejected',
  'acknowledged'
);

create type photo_kind as enum ('before', 'after', 'equipment', 'proof');

-- ── restaurants ────────────────────────────────────────────────────────────
create table restaurants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  timezone    text not null default 'Asia/Kolkata',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid,
  updated_by  uuid,
  deleted_at  timestamptz
);

-- ── users ──────────────────────────────────────────────────────────────────
-- Mirrors auth.users; `id` should equal the Supabase auth uid.
create table users (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id),
  full_name     text not null,
  role          user_role not null,
  email         text unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid,
  updated_by    uuid,
  deleted_at    timestamptz
);
create index users_restaurant_idx on users (restaurant_id);

-- ── sops (catalog) ─────────────────────────────────────────────────────────
create table sops (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id),
  slug          text not null,               -- 'opening' | 'temp' | 'cash'
  name          text not null,
  role          user_role not null,          -- which role performs it
  scheduled_at  text,                         -- display time, e.g. '6:45 AM'
  steps         jsonb not null default '[]',  -- ordered step-kind list
  icon          text,                         -- phosphor icon name
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid,
  updated_by    uuid,
  deleted_at    timestamptz,
  unique (restaurant_id, slug)
);

-- ── sop_submissions ────────────────────────────────────────────────────────
create table sop_submissions (
  id            uuid primary key default gen_random_uuid(),
  sop_id        uuid not null references sops (id),
  restaurant_id uuid not null references restaurants (id),
  submitted_by  uuid not null references users (id),
  submitted_at  timestamptz not null default now(),
  status        submission_status not null default 'pending',
  -- `data` holds the flow payload (checklist counts, readings, cash figures,
  -- computed meta) so reporting/audit can read a submission without joins.
  data          jsonb not null default '{}',
  resolved_by   uuid references users (id),
  resolved_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid,
  updated_by    uuid,
  deleted_at    timestamptz
);
create index sop_submissions_sop_idx on sop_submissions (sop_id);
create index sop_submissions_restaurant_idx on sop_submissions (restaurant_id);
create index sop_submissions_status_idx on sop_submissions (status);
create index sop_submissions_submitted_at_idx on sop_submissions (submitted_at desc);

-- ── sop_photos ─────────────────────────────────────────────────────────────
-- storage_path points at a Supabase Storage object (bucket: sop-photos).
create table sop_photos (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references sop_submissions (id) on delete cascade,
  kind          photo_kind not null,
  storage_path  text not null,
  created_at    timestamptz not null default now(),
  created_by    uuid,
  deleted_at    timestamptz
);
create index sop_photos_submission_idx on sop_photos (submission_id);

-- ── audit_logs (append-only) ───────────────────────────────────────────────
create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants (id),
  actor_id    uuid references users (id),   -- null = system action
  action      text not null,                -- human-readable audit line
  entity_type text,                          -- e.g. 'sop_submission'
  entity_id   uuid,
  created_at  timestamptz not null default now()
);
create index audit_logs_restaurant_idx on audit_logs (restaurant_id);
create index audit_logs_created_at_idx on audit_logs (created_at desc);

-- ── updated_at trigger ─────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array[
    'restaurants', 'users', 'sops', 'sop_submissions'
  ]
  loop
    execute format(
      'create trigger %I_set_updated_at before update on %I
         for each row execute function set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- ── Row Level Security (scaffold) ──────────────────────────────────────────
-- Enabled here; real policies belong with the auth/tenancy work. The intent:
-- staff read/write their own restaurant's rows; managers additionally resolve
-- submissions; audit_logs are insert-only + read within the restaurant.
alter table restaurants     enable row level security;
alter table users           enable row level security;
alter table sops            enable row level security;
alter table sop_submissions enable row level security;
alter table sop_photos      enable row level security;
alter table audit_logs      enable row level security;

-- ────────────────────────── 0002_policies.sql ────────────────────────
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

-- ────────────────────────── 0003_storage.sql ─────────────────────────
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

-- ───────────────────────────── seed.sql ──────────────────────────────
-- Demo seed for local dev. Matches the actors/SOPs used by the in-memory store.
insert into restaurants (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Lovebite — MG Road');

insert into users (id, restaurant_id, full_name, role, email)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'Ravi Kumar', 'kitchen', 'ravi@lovebite.example'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000001', 'Meera Iyer', 'foh', 'meera@lovebite.example'),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000001', 'Aisha Sen', 'manager', 'aisha@lovebite.example');

insert into sops (restaurant_id, slug, name, role, scheduled_at, icon, steps)
values
  ('00000000-0000-0000-0000-000000000001', 'opening', 'Opening Checklist', 'kitchen', '6:45 AM', 'Sun',
   '["before","checklist","after","review"]'),
  ('00000000-0000-0000-0000-000000000001', 'temp', 'Temperature Log', 'kitchen', '11:00 AM', 'Thermometer',
   '["readings","photo","review"]'),
  ('00000000-0000-0000-0000-000000000001', 'cash', 'Closing Cash Reconciliation', 'foh', '10:30 PM', 'CashRegister',
   '["count","pos","photo","review"]');
