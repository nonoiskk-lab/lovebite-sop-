"use client";

import { useId } from "react";
import { Icon } from "@/components/icon";

/**
 * Photo-capture target. Opens the device camera / file picker, keeps an
 * object-URL preview, and hands the Blob up to the store. In Supabase mode the
 * Blob is uploaded to Storage on submit; in demo mode it stays a local preview.
 */
export function PhotoCapture({
  previewUrl,
  onCapture,
  onClear,
  emptyLabel = "Tap to capture",
}: {
  previewUrl: string | null;
  onCapture: (blob: Blob, previewUrl: string) => void;
  onClear: () => void;
  emptyLabel?: string;
}) {
  const inputId = useId();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onCapture(file, URL.createObjectURL(file));
    e.target.value = ""; // allow re-selecting the same file
  };

  const frameStyle: React.CSSProperties = {
    position: "relative",
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
    overflow: "hidden",
  };

  if (previewUrl) {
    return (
      <div style={frameStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Captured"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 55%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            background: "color-mix(in srgb, var(--color-bg) 70%, transparent)",
            padding: "3px 8px",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <Icon name="CheckCircle" size={14} color="var(--color-accent-300)" />
          Photo captured
        </div>
        <button
          type="button"
          onClick={onClear}
          className="btn btn-secondary"
          style={{ position: "absolute", bottom: 8, right: 8, fontSize: 12, padding: "4px 10px" }}
        >
          Retake
        </button>
      </div>
    );
  }

  return (
    <label htmlFor={inputId} style={frameStyle} aria-label={emptyLabel}>
      <Icon name="Camera" size={34} style={{ opacity: 0.6 }} />
      <span style={{ fontSize: 13, opacity: 0.7 }}>{emptyLabel}</span>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        style={{ display: "none" }}
      />
    </label>
  );
}
