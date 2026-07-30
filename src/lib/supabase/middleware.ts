import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/**
 * Refreshes the Supabase session cookie on every request and returns the
 * current user. The root `middleware.ts` (Phase 1) uses this to gate routes
 * server-side. IMPORTANT: always return `supabaseResponse` (or copy its
 * cookies) so the refreshed session is persisted.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Do not run code between createServerClient and getUser — it can log users
  // out at random (the session refresh must complete first).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
