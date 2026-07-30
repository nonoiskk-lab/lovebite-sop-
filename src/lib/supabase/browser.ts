"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/**
 * Browser Supabase client (cookie-backed session via @supabase/ssr).
 * Replaces the legacy localStorage client for the new SSR auth model — the
 * session cookie is readable by middleware + server components, so routes can
 * be protected on the server. Safe to call repeatedly; @supabase/ssr memoizes.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
