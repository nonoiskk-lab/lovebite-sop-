"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL } from "@/lib/sops";
import { useStore } from "@/lib/store";

/** Signed-in identity + sign-out (configured mode). */
export function UserMenu() {
  const router = useRouter();
  const role = useStore((s) => s.role);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const signOut = async () => {
    await getSupabaseClient()?.auth.signOut();
    router.replace("/login");
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ textAlign: "right", lineHeight: 1.2 }}>
        <div style={{ fontSize: 13 }}>{email ?? "Signed in"}</div>
        <div className="text-muted" style={{ fontSize: 11 }}>
          {ROLE_LABEL[role]}
        </div>
      </div>
      <Button variant="secondary" onClick={signOut}>
        Sign out
      </Button>
    </div>
  );
}
