"use client";

import * as React from "react";

/** A label/value row inside a Review & Submit summary card. */
export function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span>{children}</span>
    </div>
  );
}
