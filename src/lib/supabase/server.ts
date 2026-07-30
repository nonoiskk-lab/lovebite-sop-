import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/**
 * Server Supabase client for RSC, Route Handlers, and Server Actions.
 * Reads/writes the session via Next's cookie store. Cookie writes from a pure
 * Server Component throw (read-only) — that's fine, the middleware refreshes
 * the session cookie on every request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — ignore; middleware handles refresh.
        }
      },
    },
  });
}
