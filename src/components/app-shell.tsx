"use client";

import * as React from "react";
import { RoleSwitcher } from "@/components/role-switcher";
import { Toast } from "@/components/toast";

/**
 * Top-level chrome for the Phase-1 preview: the ROOS header + the dev role
 * switcher, with the active screen rendered below. Everything under here is
 * client-rendered because it reads the shared store.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        padding: "32px 40px 60px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <header style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
            }}
          >
            ROOS · Phase 1
          </div>
          <h2 style={{ marginTop: 2, marginBottom: 0 }}>Daily SOP Execution</h2>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <RoleSwitcher />
        </div>
      </header>

      <div className="hr" style={{ margin: 0 }} />

      <main>{children}</main>

      <Toast />
    </div>
  );
}
