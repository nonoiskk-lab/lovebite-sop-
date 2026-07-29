/**
 * Whether a real Supabase backend is wired up. When false the app runs in
 * "demo mode" — an in-memory + localStorage data service and the dev role
 * switcher. It is now wired to the live project below.
 *
 * NOTE: the anon/publishable key is a PUBLIC client key by design — it is
 * shipped to every browser and is safe to commit. Row Level Security (see
 * supabase/migrations) is the actual access boundary. Env vars still win when
 * set (e.g. to point a fork at a different project).
 */
const DEFAULT_SUPABASE_URL = "https://ezrbzmogrtqwvowpapwt.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6cmJ6bW9ncnRxd3Zvd3BhcHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNDIyNTQsImV4cCI6MjEwMDgxODI1NH0.Y6o_F9LR_4svRZTMKHK3Gn_nb03c719caeASXAXyCw0";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured: boolean =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

/** Storage bucket that holds SOP photos. */
export const PHOTO_BUCKET = "sop-photos";
