# Handoff: Daily SOP Execution (ROOS Phase 1)

## Overview
Phase 1 of the Restaurant Operations OS (ROOS): the daily SOP execution flow for floor/kitchen staff (mobile) and the oversight dashboard for managers (desktop). Covers three SOPs end-to-end: **Opening Checklist**, **Temperature Log**, and **Closing Cash Reconciliation** — from task start through photo/timer capture to manager approval and audit logging.

## About the Design Files
The bundled file (`ROOS Phase 1 - Daily SOPs.dc.html`) is an **HTML design reference** — a working, clickable prototype built to demonstrate exact layout, states, copy, and interaction flow. It is not production code to lift directly. Recreate this design in the target codebase's real stack (per the project brief: **Next.js App Router + TypeScript + Tailwind + shadcn/ui + Supabase**), using that stack's own component patterns, not by embedding this HTML.

The prototype is a single self-contained file using a lightweight in-house templating runtime (`{{ }}` bindings, `<sc-if>`/`<sc-for>` control flow, a `DCLogic` class with `state`/`renderVals()`). Treat its logic class as **pseudocode for the state machine and business rules**, not as literal JS to port — reimplement the same states/transitions idiomatically in React/Next.js (e.g. Zustand/React state + TanStack Query + Supabase mutations instead of local `setState`).

## Fidelity
**High-fidelity.** Colors, type, spacing, radii, and copy are final per the bound Nocturne design system. Recreate pixel-close using the tokens below (or the codebase's equivalent Tailwind theme extension mapped to the same values).

## Design Tokens (Nocturne)
Full source in `reference/nocturne-styles.css` and `reference/nocturne-readme.md`. Key values:

- **Background**: `#161826` (page ground)
- **Surface** (cards): `#232532`
- **Text**: `#e9e9ed`
- **Accent** (single accent, mono scheme): `#9184d9`, with tonal ramp 100–900 (`#f5f4ff` → `#2b2741`)
- **Neutral ramp**: 100–900 (`#f3f5fe` → `#292b31`)
- **Divider**: `color-mix(in srgb, #e9e9ed 16%, transparent)`
- **Font**: Inter, weight 500 for headings (never bolder), 400 body. Sizes: h1 42px, h2 32px, h3 25px, h4 20px, h5 16px, h6 13px (uppercase, letter-spacing 0.08em)
- **Radii**: sm 4px, md 8px, lg 14px
- **Spacing scale** (0.7× density): 2.8 / 5.6 / 8.4 / 11.2 / 16.8 / 22.4 px
- **Shadows**: `--shadow-sm/md/lg` — hairline edge + ambient darkness (dark-ground elevation), never heavy stacked shadows
- **Buttons**: outlined only — `.btn-primary` is a 1px accent border on transparent, never a filled/solid button
- **Icons**: Phosphor icon set (regular weight), loaded via `@phosphor-icons/web`

Component classes used: `.card`/`.card-title`/`.card-kicker`/`.card-meta`, `.tag`/`.tag-accent`/`.tag-outline`/`.tag-neutral`, `.btn`/`.btn-primary`/`.btn-secondary`/`.btn-icon`/`.btn-block`, `.seg`/`.seg-opt`, `.field`/`.input`, `.table`, `.hr`.

## Screens / Views

### 1. Prototype chrome — Role switcher
Not part of the real product's UI — a dev-only segmented control (Kitchen Staff / Front of House / Manager) used to preview all three role experiences from one file. In the real app this is replaced by actual authenticated role-based routing (staff log in and land directly on their own view).

### 2. Staff/Chef & FOH — "Today" screen (mobile, 390×844-ish, iOS-style device frame)
- **Purpose**: Staff see only the SOPs assigned to their role for today, with live status.
- **Layout**: Vertical stack — greeting + date header, then a scrollable list of SOP cards, then a compliance footnote.
- **SOP card**: 38×38 icon tile (accent-800 bg, accent-200 icon) + SOP name (card-title) + time (card-meta, clock icon) + status tag on the right. Tap anywhere on card → opens that SOP's flow.
- **Status tags**: Not Started (`tag-neutral`), Pending Approval (`tag-outline`), Flagged (`tag-outline`), Logged/Approved/Acknowledged (`tag-accent`), Rejected (`tag-neutral`).
- **Kitchen role sees**: Opening Checklist (6:45 AM), Temperature Log (11:00 AM).
- **FOH role sees**: Closing Cash Reconciliation (10:30 PM).
- **Footer**: small compliance note — "Every step is timestamped and photo-verified for compliance audit" with a shield icon.

### 3. SOP Flow — shared shell (mobile)
- **Header**: back-arrow icon button + step label ("Step 2 of 4 · Checklist") + thin progress bar (accent fill on neutral-800 track, width = percent complete).
- **Footer**: full-width primary button, pinned to bottom, min-height 48px. Label is "Continue" until the last step, then "Submit". Disabled (45% opacity, per system default) until that step's required input is provided.
- **Back button** on step 1 returns to Today instead of stepping back.

#### Opening Checklist steps
1. **Before Photo** — dashed-border 4:3 tap target; camera icon + "Tap to capture" placeholder → toggles to a filled checkmark + "Photo captured". Required to continue.
2. **Checklist (+ Timer)** — sticky timer card at top (running mm:ss, Start/Pause/Resume button) above 7 large tappable checklist rows (Unlock restaurant, Turn on lights & AC, Check kitchen equipment, Clean dining area, Check washrooms, Verify inventory, Mark staff attendance). Each row: 22×22 checkbox square (accent fill + check icon when checked) + label (strikethrough + dimmed opacity once checked). All 7 must be checked to continue.
3. **After Photo** — same pattern as Before Photo, different copy. Required.
4. **Review & Submit** — read-only summary card (checklist count, time taken, photo count) + note that submitting routes to manager approval with an audit entry. Submitting always yields **Pending Approval** status.

#### Temperature Log steps
1. **Readings** — two numeric fields (Refrigerator °C, Freezer °C). If fridge > 5°C or freezer > -15°C, an inline warning banner appears (accent-900 bg, accent-700 border, warning icon) — real-time, before submit.
2. **Equipment Photo** — same photo-capture pattern, required.
3. **Review & Submit** — shows both readings + a computed status tag: **Flagged** (out of range) or **Logged** (in range, auto-approved with no manager step) — this is the one SOP that does *not* require manager sign-off unless flagged.

#### Closing Cash Reconciliation steps
1. **Cash Count** — numeric field, counted cash (₹). Required.
2. **Match POS Sales** — numeric field, POS system total (₹) + a live-computed "Difference" card (counted − POS, signed, ₹). Required.
3. **Proof Photo** *(optional)* — same photo pattern, but can be skipped; never blocks progression.
4. **Review & Submit** — recap of counted/POS/difference + note that submitting both generates the daily Excel summary and routes to manager approval. Always **Pending Approval**.

### 4. Confirmation screen (mobile)
Centered: 64px circular icon badge (accent-800 bg), title, one-line message, "Back to Today" button. Copy varies by outcome:
- Opening/Cash → "Submitted" / "Sent to your manager for approval, with a full timestamped record."
- Temp (in range) → "Logged" / "Reading auto-logged. No manager action needed."
- Temp (out of range) → "Flagged" / "Reading is outside the safe range. Your manager has been notified automatically."

### 5. Manager Dashboard (desktop)
- **Header**: title + date/shift subtitle + right-aligned "Export daily Excel report" secondary button (shows a bottom-right toast confirmation on click, auto-dismisses ~3s).
- **Stat row**: 3 cards — Pending Approvals, Flagged Alerts, Completed Today (large card-kicker + big number).
- **Two-column body** (2fr / 1fr):
  - **Left, "Needs Attention"**: one card per pending/flagged submission — status + role tags, SOP name, actor + submitted time, key metadata pairs (varies by SOP: checklist/time/photos; fridge/freezer/photo; counted/POS/difference/proof), and action buttons:
    - Temperature Log flagged items → single **Acknowledge** button.
    - Opening/Cash pending items → **Approve** (primary) + **Reject** (secondary) buttons.
    - Empty state: centered muted card, "Nothing pending — all clear."
  - **Left, below, "Live SOP Status — Today"**: `.table` with columns SOP / Role / Time / Status, one row per SOP type showing its latest submission.
  - **Right, "Audit Log"**: scrollable card, newest-first list of timestamped system + human actions (submissions, flags, approvals/rejections) — the compliance record. Each row: time (muted, fixed width) + action text.

## Interactions & Behavior
- All navigation is client-side state (role → screen → step); no page reloads.
- Photo "capture" is simulated: tapping the dashed placeholder toggles a captured/not-captured boolean. In production this becomes a real camera/file-upload flow (Supabase Storage), with the same visual states (empty vs. captured).
- Timer: a real running interval (1s tick) while on the Opening Checklist step; persists only in-memory (resets if the flow restarts) — production should persist elapsed time server-side per submission attempt.
- Validation gating: the primary "Continue/Submit" button is disabled until that step's required field(s) are filled — see per-step requirements above. This should become real form validation (Zod schemas) server + client side.
- Manager Approve/Reject/Acknowledge actions are optimistic local updates in the prototype; in production these are authenticated mutations that also update `status`, `resolved_by`, `resolved_at`, and append an audit log row.
- Temperature out-of-range detection (fridge > 5°C, freezer > -15°C) happens both live (inline warning during input) and at submit time (drives the status split between "Logged" and "Flagged" and whether it lands in the manager's "Needs Attention" queue).
- No loading/error states are shown in the prototype (all data is synchronous/local) — production must add loading skeletons, network error states, and offline queuing for spotty kitchen/floor connectivity (per the project's PWA requirement).

## State Management
Prototype's local state shape (reimplement as real client + server state):
- `role`: 'kitchen' | 'foh' | 'manager' — replace with authenticated user + role claim.
- `screen`: 'today' | 'flow' | 'confirm'; `activeSopId`; `stepIndex` — replace with routing (e.g. `/today`, `/sop/[sopId]/step/[n]`).
- Per-flow working state: `checked` (map), `beforePhoto`/`afterPhoto`/`proofPhoto`/`tempPhoto` (booleans — become uploaded file refs), `timerSeconds`/`timerRunning`, `fridgeTemp`/`freezerTemp`, `cashCounted`/`posSales`.
- `submissions`: array of `{ id, sopId, sopName, role, actor, submittedAt, status, meta }` — becomes a `sop_submissions` table (see suggested schema below).
- `auditLog`: array of `{ time, text }` — becomes an append-only `audit_logs` table, one row per state-changing action, with `actor_id`, `action`, `entity_type`, `entity_id`, `created_at`.

### Suggested DB shape (for the backend engineer)
- `restaurants`, `users` (role enum: kitchen/foh/manager/owner), `sops` (id, name, role, steps jsonb), `sop_submissions` (id uuid, sop_id fk, restaurant_id fk, submitted_by fk, submitted_at, status enum[not_started/pending/flagged/logged/approved/rejected/acknowledged], data jsonb, resolved_by fk nullable, resolved_at nullable, created_at, updated_at, deleted_at), `sop_photos` (submission_id fk, kind enum[before/after/equipment/proof], storage_path), `audit_logs` (id, actor_id fk, action text, entity_type, entity_id, created_at). All PK as UUID, standard created_by/updated_by/created_at/updated_at/soft-delete columns per the project's core principles.

## Assets
No custom illustrations or photography — only Phosphor icon glyphs (sun, thermometer, cash-register, camera, check-circle, check-bold, warning, timer, clock, arrow-left, shield-check, storefront, cooking-pot, chart-line-up, file-xls, hourglass-medium). The mobile screens are wrapped in a generic iOS-style device bezel (`reference/ios-frame.jsx`) purely for presentation — not part of the design system, and not needed in the real app (which runs in an actual mobile browser/PWA, not inside a bezel graphic).

## Files
- `ROOS Phase 1 - Daily SOPs.dc.html` — the full interactive prototype (open directly in a browser).
- `reference/ios-frame.jsx` — the device-bezel wrapper used for presentation only.
- `reference/nocturne-styles.css` — the full design-system token sheet + component CSS referenced above.
- `reference/nocturne-readme.md` — the design system's usage guide (color/type/spacing rules, do's/don'ts).
