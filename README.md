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
- **Zustand** for client state (the swappable data layer)
- **Phosphor** icons (`@phosphor-icons/react`)
- **Supabase** — schema + data-service seam in place; wiring is the next step
  (see [Wiring Supabase](#wiring-supabase))

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (type-checked)
npm run typecheck
```

No environment variables are required for Phase 1 — it runs entirely on an
in-memory store seeded with demo data.

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
    store.ts                   # Zustand store — the in-memory data layer
    data-service.ts            # the persistence seam (implement against Supabase)
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

## Wiring Supabase

Phase 1 is deliberately backend-free. The seam is ready:

1. `supabase/migrations/0001_init.sql` creates `restaurants`, `users`, `sops`,
   `sop_submissions`, `sop_photos`, and `audit_logs` (UUID PKs, `created_at` /
   `updated_at` / `created_by` / `updated_by` / soft-delete `deleted_at`, an
   `updated_at` trigger, and RLS enabled ready for policies).
2. Implement `DataService` (`src/lib/data-service.ts`) against Supabase —
   queries + mutations + Storage uploads for photos + an append to `audit_logs`
   on every state change.
3. Point the Zustand actions in `src/lib/store.ts` at that service (reads via
   TanStack Query, writes as authenticated mutations). The screens consume the
   store's action surface, which already mirrors the service methods, so the UI
   doesn't change.
4. Replace the dev role switcher with real auth + role claims, and add the
   loading / error / offline-queue states the PWA requirement calls for.

Copy `.env.example` to `.env.local` and fill in the Supabase keys once the
service is implemented.
```
