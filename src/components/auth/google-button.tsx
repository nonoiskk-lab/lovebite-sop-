"use client";

import { useState } from "react";
import { GoogleLogo } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import { SITE_URL } from "@/lib/supabase/config";

/**
 * "Continue with Google" — reusable across the auth screens (signup + login).
 * Kicks off Supabase Google OAuth (PKCE). The redirect completes at
 * /auth/callback, which is wired in a later phase; the Google provider must be
 * enabled in the Supabase dashboard for this to succeed.
 */
export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${SITE_URL}/auth/callback` },
    });
    // On success the browser navigates away to Google; only errors return here.
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Button
        type="button"
        variant="secondary"
        block
        onClick={onClick}
        disabled={busy}
        style={{ minHeight: 44 }}
      >
        <GoogleLogo size={18} weight="bold" />
        {busy ? "Redirecting…" : label}
      </Button>
      {error && (
        <div style={{ fontSize: 12, color: "var(--color-accent-600)" }}>{error}</div>
      )}
    </div>
  );
}
