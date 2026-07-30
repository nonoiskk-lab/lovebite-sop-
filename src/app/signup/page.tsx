"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/auth/password-field";
import { GoogleButton } from "@/components/auth/google-button";
import { createClient } from "@/lib/supabase/browser";
import { SITE_URL } from "@/lib/supabase/config";
import { isValidEmail, checkPassword, unmetPasswordRules } from "@/lib/validation";

const METER_COLORS = [
  "var(--color-neutral-300)",
  "var(--color-danger)",
  "var(--color-warning)",
  "var(--color-info)",
  "var(--color-success)",
];

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const pw = checkPassword(password);
  const emailOk = email === "" || isValidEmail(email);
  const confirmOk = confirm === "" || confirm === password;

  const canSubmit =
    fullName.trim().length >= 2 &&
    isValidEmail(email) &&
    pw.valid &&
    confirm === password &&
    !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) return setError("Please enter your full name.");
    if (!isValidEmail(email)) return setError("Please enter a valid email address.");
    if (!pw.valid) return setError("Please choose a stronger password.");
    if (confirm !== password) return setError("Passwords do not match.");

    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${SITE_URL}/auth/callback`,
      },
    });
    setBusy(false);

    if (error) return setError(error.message);
    // Email confirmation on → no session yet; otherwise a session is returned.
    setDone(true);
    void data;
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
      <Card
        elevated
        className="animate-in"
        style={{ width: "min(420px, 100%)", gap: 18, padding: "var(--space-6)" }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
            }}
          >
            LoveBITES
          </div>
          <h3 style={{ margin: "4px 0 0" }}>{done ? "Check your email" : "Create your account"}</h3>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--color-muted)" }}>
            {done
              ? `We sent a confirmation link to ${email}. Verify it to activate your account.`
              : "Join your restaurant's daily operations workspace."}
          </p>
        </div>

        {done ? (
          <Link href="/login" style={{ textDecoration: "none" }}>
            <Button variant="primary" block style={{ minHeight: 44 }}>
              Go to Sign In
            </Button>
          </Link>
        ) : (
          <>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Full name" htmlFor="fullName">
                <Input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Ravi Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Field>

              <Field label="Email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={emailOk ? undefined : { borderColor: "var(--color-danger)" }}
                />
                {!emailOk && (
                  <div style={{ fontSize: 11.5, color: "var(--color-accent-600)", marginTop: 5 }}>
                    Enter a valid email address.
                  </div>
                )}
              </Field>

              <PasswordField
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="Create a strong password"
              >
                {password !== "" && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[1, 2, 3, 4].map((seg) => (
                        <div
                          key={seg}
                          style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 999,
                            background:
                              seg <= pw.score ? METER_COLORS[pw.score] : "var(--color-neutral-200)",
                            transition: "background 0.2s ease",
                          }}
                        />
                      ))}
                    </div>
                    <div
                      style={{
                        marginTop: 5,
                        fontSize: 11.5,
                        color: pw.valid ? "var(--color-success)" : "var(--color-muted)",
                      }}
                    >
                      {pw.valid
                        ? `Strength: ${pw.label}`
                        : `Needs ${unmetPasswordRules(pw).join(", ")}`}
                    </div>
                  </div>
                )}
              </PasswordField>

              <PasswordField
                label="Confirm password"
                value={confirm}
                onChange={setConfirm}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              >
                {!confirmOk && (
                  <div style={{ fontSize: 11.5, color: "var(--color-accent-600)", marginTop: 5 }}>
                    Passwords do not match.
                  </div>
                )}
              </PasswordField>

              {error && (
                <div
                  role="alert"
                  style={{
                    fontSize: 12.5,
                    color: "var(--color-accent-700)",
                    background: "var(--color-danger-bg)",
                    border: "1px solid var(--color-accent-200)",
                    borderRadius: "var(--radius-md)",
                    padding: "9px 12px",
                  }}
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                block
                disabled={!canSubmit}
                style={{ minHeight: 46 }}
              >
                {busy ? "Creating account…" : "Create Account"}
              </Button>
            </form>

            {/* divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: "var(--color-divider)" }} />
              <span style={{ fontSize: 12, color: "var(--color-muted)" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "var(--color-divider)" }} />
            </div>

            <GoogleButton />

            <div style={{ textAlign: "center", fontSize: 13, color: "var(--color-body)" }}>
              Already have an account?{" "}
              <Link
                href="/login"
                style={{ color: "var(--color-accent)", fontWeight: 600, textDecoration: "none" }}
              >
                Sign In
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
