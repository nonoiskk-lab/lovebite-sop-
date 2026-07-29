"use client";

import * as React from "react";

/**
 * iOS-style device bezel — presentation only (matches the prototype's
 * reference/ios-frame.jsx). Not part of the design system and not shipped in
 * the real PWA; it exists so the mobile screens read as phone screens in the
 * dev preview. Content lives inside a fixed 390×844 scroll viewport.
 */
function StatusBar() {
  const c = "#1c1c1c";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 30px 8px",
        position: "relative",
        zIndex: 20,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          fontFamily: '-apple-system, "SF Pro", system-ui, sans-serif',
          fontWeight: 600,
          fontSize: 15,
          color: c,
        }}
      >
        9:41
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <svg width="18" height="12" viewBox="0 0 19 12" aria-hidden>
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill={c} />
          <rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill={c} />
          <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill={c} />
          <rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill={c} />
        </svg>
        <svg width="16" height="12" viewBox="0 0 17 12" aria-hidden>
          <path
            d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z"
            fill={c}
          />
          <circle cx="8.5" cy="10.5" r="1.5" fill={c} />
        </svg>
        <svg width="26" height="13" viewBox="0 0 27 13" aria-hidden>
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={c} strokeOpacity="0.35" fill="none" />
          <rect x="2" y="2" width="20" height="9" rx="2" fill={c} />
          <path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill={c} fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

export function IOSDevice({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 402,
        height: 874,
        borderRadius: 56,
        padding: 6,
        background: "linear-gradient(160deg, #3a3d4a, #1c1e2a)",
        boxShadow: "var(--shadow-lg)",
        flex: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: 50,
          overflow: "hidden",
          background: "var(--color-bg)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Dynamic island */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 110,
            height: 30,
            borderRadius: 20,
            background: "#000",
            zIndex: 30,
          }}
        />
        <StatusBar />
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>{children}</div>
        {/* Home indicator */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "6px 0 8px",
            flex: "none",
          }}
        >
          <div
            style={{
              width: 134,
              height: 5,
              borderRadius: 3,
              background: "color-mix(in srgb, var(--color-text) 40%, transparent)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
