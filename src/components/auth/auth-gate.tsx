"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/sops";

/**
 * In demo mode (no Supabase) this is a pass-through — the dev role switcher
 * drives the role. In configured mode it requires an authenticated session,
 * redirects to /login otherwise, and sets the role from the user's profile.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const setRole = useStore((s) => s.setRole);
  const [ready, setReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sb = getSupabaseClient();
    if (!sb) return;

    let active = true;

    const load = async () => {
      const { data } = await sb.auth.getSession();
      if (!active) return;
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await sb
        .from("users")
        .select("role")
        .eq("id", data.session.user.id)
        .single();
      if (!active) return;
      if (profile?.role) setRole(profile.role as Role);
      setReady(true);
    };

    void load();

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router, setRole]);

  if (!ready) {
    return (
      <div className="text-muted" style={{ padding: 40, fontSize: 14 }}>
        Checking your session…
      </div>
    );
  }

  return <>{children}</>;
}
