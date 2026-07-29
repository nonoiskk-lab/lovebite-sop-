"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/icon";

/** Bottom-right toast; auto-dismisses ~3s after it appears. */
export function Toast() {
  const toast = useStore((s) => s.toast);
  const clearToast = useStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 3000);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        background: "var(--color-surface)",
        border: "1px solid var(--color-divider)",
        boxShadow: "var(--shadow-md)",
        padding: "10px 16px",
        borderRadius: "var(--radius-md)",
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        gap: 8,
        zIndex: 50,
      }}
    >
      <Icon name="CheckCircle" size={16} color="var(--color-success)" />
      {toast}
    </div>
  );
}
