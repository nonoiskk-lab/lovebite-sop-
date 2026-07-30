"use client";

import * as React from "react";
import { useId, useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { Field, Input } from "@/components/ui/input";

/**
 * Password input with a show/hide toggle, built on the design-system Field +
 * Input. Reusable across signup / login / reset. `children` renders below the
 * input (e.g. a strength meter or match hint).
 */
export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete = "new-password",
  id,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  id?: string;
  children?: React.ReactNode;
}) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const [show, setShow] = useState(false);

  return (
    <Field label={label} htmlFor={inputId}>
      <div style={{ position: "relative" }}>
        <Input
          id={inputId}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          style={{ paddingRight: 44 }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          style={{
            position: "absolute",
            right: 6,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            border: 0,
            background: "transparent",
            color: "var(--color-muted)",
            cursor: "pointer",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {show ? <EyeSlash size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {children}
    </Field>
  );
}
