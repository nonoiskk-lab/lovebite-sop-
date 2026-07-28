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
