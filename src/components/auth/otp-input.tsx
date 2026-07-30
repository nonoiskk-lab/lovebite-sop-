"use client";

import { useEffect, useRef } from "react";

const LENGTH = 6;

/**
 * Six-box OTP input: auto-focus/auto-move between boxes, paste support
 * (splits a pasted code across boxes from the focused index), and an
 * onComplete callback fired once all boxes are filled.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");
  const firedFor = useRef<string>("");

  useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value.length === LENGTH && firedFor.current !== value) {
      firedFor.current = value;
      onComplete?.(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const applyFrom = (index: number, incoming: string) => {
    const merged = (value.slice(0, index) + incoming).slice(0, LENGTH);
    onChange(merged);
    const nextIndex = Math.min(merged.length, LENGTH - 1);
    inputsRef.current[nextIndex]?.focus();
  };

  const handleChange = (index: number, raw: string) => {
    const clean = digitsOnlyLocal(raw);
    if (!clean) {
      const next = digits.slice();
      next[index] = "";
      onChange(next.join(""));
      return;
    }
    if (clean.length > 1) {
      applyFrom(index, clean);
      return;
    }
    const next = digits.slice();
    next[index] = clean;
    onChange(next.join(""));
    if (index < LENGTH - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = digitsOnlyLocal(e.clipboardData.getData("text"));
    if (!pasted) return;
    e.preventDefault();
    applyFrom(index, pasted);
  };

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          aria-label={`Digit ${i + 1}`}
          style={{
            width: 44,
            height: 52,
            textAlign: "center",
            fontSize: 20,
            fontWeight: 600,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-divider)",
            background: "var(--color-surface)",
            color: "var(--color-text)",
          }}
        />
      ))}
    </div>
  );
}

function digitsOnlyLocal(value: string): string {
  return value.replace(/\D/g, "");
}
