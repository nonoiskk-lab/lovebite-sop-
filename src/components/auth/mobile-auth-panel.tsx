"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE, isValidMobileNumber, toE164 } from "@/lib/phone";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { OtpInput } from "@/components/auth/otp-input";
import { useCooldown } from "@/components/auth/use-cooldown";

/**
 * Mobile + OTP auth flow shared by login and signup. Supabase phone auth
 * needs a provider (or, for internal testing, a "Test phone numbers and
 * OTPs" entry) configured in Dashboard → Authentication → Providers → Phone
 * before OTPs will actually be delivered/verified.
 */
export function MobileAuthPanel({
  mode,
  onAuthenticated,
}: {
  mode: "login" | "signup";
  onAuthenticated: () => void;
}) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [localNumber, setLocalNumber] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { cooldown, start: startCooldown } = useCooldown();

  const e164 = toE164(countryCode, localNumber);
  const numberOk = isValidMobileNumber(localNumber);
  const canSendOtp = numberOk && !busy && (mode === "login" || fullName.trim().length >= 2);

  const sendOtp = async () => {
    if (!canSendOtp) return;
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone: e164,
      options:
        mode === "signup"
          ? { shouldCreateUser: true, data: { full_name: fullName.trim() } }
          : { shouldCreateUser: false },
    });
    setBusy(false);
    if (error) {
      setError(
        mode === "login" && /not.*found|Signups not allowed/i.test(error.message)
          ? "No account found for this number. Try Sign Up instead."
          : error.message,
      );
      return;
    }
    setCode("");
    setStep("otp");
    startCooldown();
  };

  const resendOtp = async () => {
    if (cooldown > 0 || busy) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone: e164,
      options:
        mode === "signup"
          ? { shouldCreateUser: true, data: { full_name: fullName.trim() } }
          : { shouldCreateUser: false },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setCode("");
    startCooldown();
  };

  const verify = async (token: string) => {
    if (busy) return;
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ phone: e164, token, type: "sms" });
    setBusy(false);
    if (error) {
      setError(error.message);
      setCode("");
      return;
    }
    onAuthenticated();
  };

  if (step === "otp") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 13, color: "var(--color-body)", textAlign: "center" }}>
          Enter the 6-digit code sent to <strong style={{ color: "var(--color-text)" }}>{e164}</strong>
        </div>

        <OtpInput value={code} onChange={setCode} onComplete={verify} disabled={busy} autoFocus />

        {error && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              color: "var(--color-accent-700)",
              background: "var(--color-danger-bg)",
              border: "1px solid var(--color-accent-200)",
              borderRadius: "var(--radius-md)",
              padding: "9px 12px",
            }}
          >
            <Icon name="Warning" size={16} color="var(--color-accent-500)" style={{ flex: "none" }} />
            {error}
          </div>
        )}

        <Button
          variant="primary"
          block
          disabled={busy || code.length !== 6}
          onClick={() => verify(code)}
          style={{ minHeight: 46 }}
        >
          {busy ? "Verifying…" : "Verify & Continue"}
        </Button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setError(null);
            }}
            style={{
              background: "none",
              border: 0,
              padding: 0,
              fontSize: 12.5,
              color: "var(--color-muted)",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Change number
          </button>
          <button
            type="button"
            onClick={resendOtp}
            disabled={cooldown > 0 || busy}
            style={{
              background: "none",
              border: 0,
              padding: 0,
              fontSize: 12.5,
              fontWeight: 600,
              color: cooldown > 0 ? "var(--color-muted)" : "var(--color-accent)",
              cursor: cooldown > 0 ? "default" : "pointer",
            }}
          >
            {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {mode === "signup" && (
        <Field label="Full name" htmlFor="mobileFullName">
          <Input
            id="mobileFullName"
            type="text"
            autoComplete="name"
            placeholder="e.g. Ravi Kumar"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </Field>
      )}

      <Field label="Mobile number" htmlFor="mobileNumber">
        <div style={{ display: "flex", gap: 8 }}>
          <select
            className="input"
            aria-label="Country code"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            style={{ width: 92, flex: "none" }}
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
          <Input
            id="mobileNumber"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            value={localNumber}
            onChange={(e) => setLocalNumber(e.target.value)}
            required
          />
        </div>
      </Field>

      {error && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12.5,
            color: "var(--color-accent-700)",
            background: "var(--color-danger-bg)",
            border: "1px solid var(--color-accent-200)",
            borderRadius: "var(--radius-md)",
            padding: "9px 12px",
          }}
        >
          <Icon name="Warning" size={16} color="var(--color-accent-500)" style={{ flex: "none" }} />
          {error}
        </div>
      )}

      <Button variant="primary" block disabled={!canSendOtp} onClick={sendOtp} style={{ minHeight: 46 }}>
        {busy ? "Sending code…" : "Send OTP"}
      </Button>
    </div>
  );
}
