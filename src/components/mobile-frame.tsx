"use client";

import * as React from "react";
import { IOSDevice } from "@/components/ios-frame";

/** Centers mobile screen content inside the iOS device bezel. */
export function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <IOSDevice>
        <div
          style={{
            minHeight: "100%",
            background: "var(--color-bg)",
            color: "var(--color-text)",
            padding: "18px 18px 32px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {children}
        </div>
      </IOSDevice>
    </div>
  );
}
