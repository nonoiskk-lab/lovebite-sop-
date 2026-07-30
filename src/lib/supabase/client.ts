"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createBrowserSSRClient } from "./browser";
import { isSupabaseConfigured } from "./config";

let cached: SupabaseClient | null = null;

/**
 * Returns the browser Supabase client, or null when the backend isn't
 * configured (demo mode). Backed by the cookie-based @supabase/ssr client
 * (src/lib/supabase/browser.ts) so the session is a single source of truth
 * shared with the OAuth callback route (src/app/auth/callback) — a session
 * started via "Continue with Google" is visible here too, not siloed in a
 * separate localStorage store.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (cached) return cached;
  cached = createBrowserSSRClient();
  return cached;
}
