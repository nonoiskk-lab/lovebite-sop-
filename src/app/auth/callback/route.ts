import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback (PKCE) — Google "Continue with Google" lands here after
 * consent. Exchanges the auth code for a session cookie, then redirects to
 * the dashboard. Profile creation (name/email/avatar/role) happens via the
 * `handle_new_user` DB trigger on `auth.users` insert (supabase/migrations),
 * which fires for every provider, including Google — this route does not
 * duplicate that logic, it only completes the sign-in and routes onward.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Dashboard: the root route resolves the signed-in user's role-based
      // landing (manager → /manager, staff/kitchen → /today) via AuthGate.
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
