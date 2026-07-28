/**
 * Whether a real Supabase backend is wired up. When false the app runs in
 * "demo mode" — an in-memory + localStorage data service and the dev role
 * switcher. Flip to true automatically by setting the two public env vars
 * (see .env.example / SETUP.md).
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured: boolean =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

/** Storage bucket that holds SOP photos. */
export const PHOTO_BUCKET = "sop-photos";
