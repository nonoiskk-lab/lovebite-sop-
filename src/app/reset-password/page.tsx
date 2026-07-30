"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/auth/password-field";
import { createClient } from "@/lib/supabase/browser";
import { checkPassword, unmetPasswordRules } from "@/lib/validation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const code = new URLSearchParams(window.location.search).get("code");
    (async () => {
      if (code) await supabase.auth.exchangeCodeForSession(code);
      setReady(true);
    })();
  }, []);

  const pw = checkPassword(password);
  const canSubmit = pw.valid && confirm === password && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw.valid) return setError("Please choose a stronger password.");
    if (confirm !== password) return setError("Passwords do not match.");
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    await supabase.auth.signOut();
    setDone(true);
    setTimeout(() => router.replace("/login"), 1500);
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "var(--color-bg)" }}>
      <Card elevated style={{ width: "min(400px, 100%)", gap: 16, padding: "var(--space-6)" }}>
        <div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-accent)" }}>
            LoveBITES
          </div>
          <h3 style={{ margin: "4px 0 0" }}>{done ? "Password updated" : "Set a new password"}</h3>
        </div>

        {!ready ? (
          <div className="text-muted" style={{ fontSize: 14 }}>Verifying link…</div>
        ) : done ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-muted)" }}>Redirecting to sign in…</p>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <PasswordField label="New password" value={password} onChange={setPassword} placeholder="Create a strong password">
              {password !== "" && !pw.valid && (
                <div style={{ fontSize: 11.5, color: "var(--color-muted)", marginTop: 5 }}>
                  Needs {unmetPasswordRules(pw).join(", ")}
                </div>
              )}
            </PasswordField>
            <PasswordField label="Confirm password" value={confirm} onChange={setConfirm} placeholder="Re-enter your password" />
            {error && <div style={{ fontSize: 12, color: "var(--color-accent-600)" }}>{error}</div>}
            <Button type="submit" variant="primary" block disabled={!canSubmit} style={{ minHeight: 44 }}>
              {busy ? "Updating…" : "Update Password"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
