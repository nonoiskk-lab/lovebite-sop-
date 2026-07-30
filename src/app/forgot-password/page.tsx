"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import { SITE_URL } from "@/lib/supabase/config";
import { isValidEmail } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setError("Enter a valid email address.");
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${SITE_URL}/reset-password`,
    });
    setBusy(false);
    if (error) return setError(error.message);
    setSent(true);
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "var(--color-bg)" }}>
      <Card elevated style={{ width: "min(400px, 100%)", gap: 16, padding: "var(--space-6)" }}>
        <div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-accent)" }}>
            LoveBITES
          </div>
          <h3 style={{ margin: "4px 0 0" }}>{sent ? "Check your email" : "Forgot password"}</h3>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--color-muted)" }}>
            {sent ? `We sent a reset link to ${email}.` : "We'll email you a link to reset it."}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Email" htmlFor="email">
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            {error && <div style={{ fontSize: 12, color: "var(--color-accent-600)" }}>{error}</div>}
            <Button type="submit" variant="primary" block disabled={busy} style={{ minHeight: 44 }}>
              {busy ? "Sending…" : "Send Reset Link"}
            </Button>
          </form>
        ) : null}

        <div style={{ textAlign: "center", fontSize: 13, color: "var(--color-body)" }}>
          <Link href="/login" style={{ color: "var(--color-accent)", fontWeight: 600, textDecoration: "none" }}>
            Back to Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}
