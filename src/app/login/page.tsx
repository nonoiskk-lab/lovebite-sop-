"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/icon";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const sb = getSupabaseClient();
    if (!sb) {
      setError("Backend not configured — running in demo mode.");
      return;
    }
    setBusy(true);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "var(--color-bg)",
      }}
    >
      <Card elevated style={{ width: "min(400px, 100%)", gap: 16, padding: "var(--space-6)" }}>
        <div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
            }}
          >
            ROOS
          </div>
          <h3 style={{ margin: "4px 0 0" }}>Sign in</h3>
        </div>

        {!isSupabaseConfigured && (
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-accent-900)",
              border: "1px solid var(--color-accent-700)",
              fontSize: 12,
              color: "var(--color-accent-200)",
            }}
          >
            <Icon name="ShieldCheck" size={16} color="var(--color-accent-300)" style={{ flex: "none" }} />
            Demo mode — no backend configured. Open the app directly; the role switcher lets you
            preview every view.
          </div>
        )}

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>

          {error && (
            <div style={{ fontSize: 12, color: "var(--color-accent-300)" }}>{error}</div>
          )}

          <Button
            type="submit"
            variant="primary"
            block
            disabled={busy || !isSupabaseConfigured}
            style={{ minHeight: 44 }}
          >
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        {!isSupabaseConfigured && (
          <Button variant="secondary" block onClick={() => router.replace("/")}>
            Continue to demo
          </Button>
        )}
      </Card>
    </div>
  );
}
