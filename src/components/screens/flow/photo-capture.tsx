"use client";

import { Icon } from "@/components/icon";

/**
 * Photo-capture target. In the prototype (and here) "capture" toggles a
 * boolean; in production this becomes a real camera/file flow to Supabase
 * Storage, keeping these same empty vs. captured visual states.
 */
export function PhotoCapture({
  captured,
  onToggle,
  emptyLabel = "Tap to capture",
}: {
  captured: boolean;
  onToggle: () => void;
  emptyLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={captured}
      style={{
        aspectRatio: "4 / 3",
        width: "100%",
        borderRadius: "var(--radius-md)",
        border: "1.5px dashed var(--color-divider)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 8,
        cursor: "pointer",
        background: "var(--color-surface)",
        color: "var(--color-text)",
        font: "inherit",
      }}
    >
      {captured ? (
        <>
          <Icon name="CheckCircle" size={34} color="var(--color-accent-300)" />
          <span style={{ fontSize: 13 }}>Photo captured</span>
        </>
      ) : (
        <>
          <Icon name="Camera" size={34} style={{ opacity: 0.6 }} />
          <span style={{ fontSize: 13, opacity: 0.7 }}>{emptyLabel}</span>
        </>
      )}
    </button>
  );
}
