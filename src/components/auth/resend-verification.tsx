"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { SITE_URL } from "@/lib/supabase/config";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

const COOLDOWN_SECONDS = 60;

const EMAIL_PROVIDERS: { match: string[]; label: string; url: string }[] = [
  { match: ["gmail.com", "googlemail.com"], label: "Open Gmail", url: "https://mail.google.com/mail/" },
  { match: ["outlook.com", "hotmail.com", "live.com"], label: "Open Outlook", url: "https://outlook.live.com/mail/" },
  { match: ["yahoo.com", "ymail.com"], label: "Open Yahoo Mail", url: "https://mail.yahoo.com/" },
];

function providerFor(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return EMAIL_PROVIDERS.find((p) => p.match.includes(domain)) ?? null;
}

/**
 * "Check your email" resend flow for signup verification. Reuses the signup
 * flow's own Supabase session-less resend — never creates a new user, only
 * re-sends the existing confirmation link (Supabase's resend({ type: "signup" })).
 */
export function ResendVerification({
  email,
  onUseAnotherEmail,
}: {
  email: string;
  onUseAnotherEmail: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const resend = async () => {
    if (busy || cooldown > 0) return;
    setBusy(true);
    setResult(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${SITE_URL}/auth/callback` },
    });
    setBusy(false);
    if (error) {
      setResult({ kind: "error", message: error.message });
      return;
    }
    setResult({ kind: "success", message: "Verification email sent successfully." });
    startCooldown();
  };

  const provider = providerFor(email);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Button
        variant="primary"
        block
        disabled={busy || cooldown > 0}
        onClick={resend}
        style={{ minHeight: 46 }}
      >
        {busy
          ? "Sending…"
          : cooldown > 0
            ? `Resend available in ${cooldown}s`
            : "Resend Verification Email"}
      </Button>

      {result?.kind === "success" && (
        <div
          role="status"
          className="animate-in"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: 12.5,
            color: "#04803a",
            background: "var(--color-success-bg)",
            border: "1px solid #b6e6cc",
            borderRadius: "var(--radius-md)",
            padding: "10px 12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            <Icon name="CheckCircle" size={16} color="#04803a" />
            {result.message}
          </div>
          <div style={{ opacity: 0.85 }}>Please check: Inbox · Spam · Promotions · Updates</div>
        </div>
      )}

      {result?.kind === "error" && (
        <div
          role="alert"
          className="animate-in"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12.5,
            color: "var(--color-accent-700)",
            background: "var(--color-danger-bg)",
            border: "1px solid var(--color-accent-200)",
            borderRadius: "var(--radius-md)",
            padding: "10px 12px",
          }}
        >
          <Icon name="Warning" size={16} color="var(--color-accent-500)" style={{ flex: "none" }} />
          {result.message}
        </div>
      )}

      {provider && (
        <a
          href={provider.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none" }}
        >
          <Button variant="secondary" block style={{ minHeight: 40 }}>
            {provider.label}
          </Button>
        </a>
      )}

      <button
        type="button"
        onClick={onUseAnotherEmail}
        style={{
          background: "none",
          border: 0,
          padding: 0,
          fontSize: 12.5,
          color: "var(--color-muted)",
          textDecoration: "underline",
          cursor: "pointer",
          alignSelf: "center",
        }}
      >
        Use another email
      </button>
    </div>
  );
}
