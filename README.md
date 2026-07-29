# ROOS — Daily SOP Execution (Phase 1)

Restaurant Operations OS, Phase 1: the daily SOP execution flow for floor/kitchen
staff (mobile) and the oversight dashboard for managers (desktop). Covers three
SOPs end-to-end — **Opening Checklist**, **Temperature Log**, and **Closing Cash
Reconciliation** — from task start through photo/timer capture to manager
approval and audit logging.

This is a faithful recreation of the `ROOS Phase 1 - Daily SOPs` design handoff
in the project's real stack, built pixel-close to the **Nocturne** design system.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with the Nocturne tokens mapped into the theme
- **shadcn/ui**-style primitives (`src/components/ui/*`), themed to Nocturne
- **Zustand** for client state (delegates to a swappable data service)
- **Phosphor** icons (`@phosphor-icons/react`)
- **Supabase** — auth, Postgres persistence, Storage photo uploads, and RLS,
  all integrated and env-gated
- **PWA** — installable, offline shell + service worker

## Two modes

The app runs the same UI in either mode and switches automatically:

- **Demo mode (default, zero setup)** — in-memory + `localStorage` data, the dev
  role switcher, camera capture kept as a local preview, real CSV export.
- **Live mode** — set the two Supabase env vars and it switches to real auth
  (`/login`), Postgres reads/writes, Storage uploads, and per-restaurant RLS.

Full instructions in **[SETUP.md](./SETUP.md)**.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000  (demo mode, no env needed)
npm run build    # production build (type-checked)
npm run typecheck
```

## What's implemented

Everything in the handoff's screen list:

- **Role switcher** (dev-only preview chrome) — Kitchen / Front of House / Manager.
  In production this is replaced by authenticated role-based routing.
- **Today** screen (mobile, in an iOS device frame) — role-scoped SOP cards with
  live status tags and a compliance footnote.
- **SOP flows** (mobile), each a stepped shell with a back button, progress bar,
  and a pinned Continue/Submit button gated on that step's required input:
  - *Opening Checklist*: Before Photo → Checklist (+ running timer) → After Photo → Review.
  - *Temperature Log*: Readings (live out-of-range warning) → Equipment Photo → Review.
    Auto-logs when in range; flags + notifies the manager when out of range.
  - *Closing Cash Reconciliation*: Cash Count → Match POS (live difference) →
    Proof Photo *(optional)* → Review.
- **Confirmation** screen — outcome-specific copy (Submitted / Logged / Flagged).
- **Manager Dashboard** (desktop) — stat row, a "Needs Attention" queue with
  Approve/Reject/Acknowledge actions, a live SOP-status table, an append-only
  audit log, and an "Export daily Excel report" toast.

Temperature thresholds (fridge > 5 °C, freezer > -15 °C) drive both the live
warning and the flagged/logged split, exactly as specified.

## Project structure

```
src/
  app/
    (app)/                     # shared chrome (role switcher + toast)
      today/                   # /today            — mobile Today
      sop/[sopId]/step/[step]/ # /sop/opening/step/0 … — stepped SOP flow
      confirm/                 # /confirm          — outcome screen
      manager/                 # /manager          — desktop dashboard
    page.tsx                   # routes to the current role's landing screen
    globals.css                # Nocturne tokens + component layer (ported)
  components/
    ui/                        # shadcn-style primitives (Button, Card, Input, Tag)
    screens/                   # Today, SopFlow (+ per-step parts), Confirm, Manager
    ios-frame.tsx              # presentation-only device bezel
    icon.tsx                   # Phosphor icon registry (name → component)
  lib/
    sops.ts                    # SOP catalog + domain types (seed / source of truth)
    status.ts                  # status → label + tag-class mapping
    store.ts                   # Zustand store — client cache + optimistic writes
    data-service.ts            # the persistence seam (DataService interface)
    data/                      # in-memory (demo) + Supabase impls + env selector
supabase/
  migrations/0001_init.sql     # schema from the handoff's "Suggested DB shape"
  seed.sql                     # demo restaurant / users / SOPs
```

## Design fidelity

The **Nocturne** design system is the source of truth for look. Its tokens and
component classes are ported verbatim into `src/app/globals.css` — colors, the
tonal ramps (100–900), Inter at weight 500 for headings, the 0.7×-density
spacing scale, 8px radii, hairline-edge elevation, and the fading rules. All
buttons are outlined (never filled); the accent is used as a line and a glow,
never a flood. Nothing hard-codes a hex, font, or px the tokens already carry.

## Supabase integration

The backend is implemented, not just stubbed:

- **Schema** — `supabase/migrations/0001_init.sql` (tables, enums, `updated_at`
  trigger, RLS on), `0002_policies.sql` (tenancy + role RLS policies),
  `0003_storage.sql` (private `sop-photos` bucket + policies). `seed.sql` seeds a
  demo restaurant / users / SOP catalog.
- **Data service** — `SupabaseDataService` (`src/lib/data/supabase.ts`) does the
  real queries, mutations, Storage uploads, and audit-log appends;
  `InMemoryDataService` backs demo mode. `getDataService()` picks one from env.
- **Auth** — `AuthGate` requires a session in live mode and derives the role
  from the user's `users` row; `/login` is a Supabase password sign-in. In demo
  mode the dev role switcher stands in.
- **Store** — Zustand actions do optimistic updates and delegate persistence to
  the data service, surfacing a non-blocking error banner on failure.

To turn it on, follow **[SETUP.md](./SETUP.md)** (create project → run
migrations → add users → set two env vars). No code changes needed.
