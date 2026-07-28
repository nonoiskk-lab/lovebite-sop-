# Setup

Two ways to run this app.

## 1. Demo mode (zero setup)

No backend, no keys. Data is seeded and persists in your browser (localStorage).
The dev role switcher lets you preview Kitchen / Front of House / Manager.

```bash
npm install
npm run dev      # http://localhost:3000
```

Everything works: SOP flows, real camera/photo capture (kept as a local
preview), the manager dashboard, and the **Export daily report** button
(downloads a real CSV that opens in Excel).

---

## 2. Live mode (Supabase)

This turns on real persistence, authentication, photo uploads, and
per-restaurant data. You only need to do four things — the app code is already
written to switch over automatically once the env vars are set.

### Step 1 — Create a Supabase project

Go to <https://supabase.com>, create a project, and from **Project Settings →
API** copy:

- Project URL
- `anon` public key

### Step 2 — Run the database migrations

In the Supabase dashboard **SQL Editor**, run the files in `supabase/migrations`
**in order**:

1. `0001_init.sql` — tables, enums, triggers, RLS enabled
2. `0002_policies.sql` — row-level-security policies (tenancy + roles)
3. `0003_storage.sql` — the private `sop-photos` bucket + its policies

Then optionally run `supabase/seed.sql` for a demo restaurant, users, and the
SOP catalog. (Or use the Supabase CLI: `supabase db push`.)

> The SOP catalog (`sops` table) **must** be seeded — the app resolves each SOP
> by its `slug` (`opening` / `temp` / `cash`). `seed.sql` does this.

### Step 3 — Create users

For each staff/manager, create an Auth user (**Authentication → Users → Add
user**, with a password), then insert a matching `users` row whose `id` equals
that auth user's UID, with the right `role` and `restaurant_id`. Example:

```sql
insert into users (id, restaurant_id, full_name, role, email)
values ('<auth-user-uid>', '<restaurant-id>', 'Ravi Kumar', 'kitchen', 'ravi@…');
```

### Step 4 — Set environment variables

```bash
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Restart `npm run dev`. The app now:

- shows a **/login** screen (email + password) instead of the role switcher,
- derives each user's role from their `users` row,
- reads/writes submissions, resolutions, and the audit log in Postgres,
- uploads captured photos to the `sop-photos` Storage bucket,
- enforces per-restaurant access via RLS.

No code changes are required — `getDataService()` and `AuthGate` detect the env
vars and switch modes on their own.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (type-checked) |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |

## Notes / next steps

- **Excel format**: export is CSV today (opens in Excel, dependency-free). Swap
  `src/lib/export-report.ts` for a true `.xlsx` writer if branded formatting is
  needed.
- **Offline**: submissions use optimistic writes + localStorage and the app is
  an installable PWA with an offline fallback. A full background **retry/sync
  queue** for writes made while offline is the recommended follow-up.
