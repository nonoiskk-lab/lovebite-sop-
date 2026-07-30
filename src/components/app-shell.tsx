"use client";

import * as React from "react";
import Link from "next/link";
import { RoleSwitcher } from "@/components/role-switcher";
import { UserMenu } from "@/components/auth/user-menu";
import { AuthGate } from "@/components/auth/auth-gate";
import { Toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Icon } from "@/components/icon";

/**
 * Top-level chrome: the ROOS header + (demo) role switcher or (configured)
 * user menu, an error banner, and the auth-gated active screen. The data load
 * is kicked off by AuthGate once the session (if any) is established.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const error = useStore((s) => s.error);

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
            LoveBITES · SOP
          </div>
          <h2 style={{ marginTop: 2, marginBottom: 0 }}>Daily SOP Execution</h2>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/inventory">
            <Button variant="secondary">
              <Icon name="Package" size={16} />
              Inventory
            </Button>
          </Link>
          <Link href="/attendance">
            <Button variant="secondary">
              <Icon name="Clock" size={16} />
              Attendance
            </Button>
          </Link>
          <Link href="/staff">
            <Button variant="secondary">
              <Icon name="Users" size={16} />
              Staff
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="secondary">
              <Icon name="ChartLineUp" size={16} />
              Reports
            </Button>
          </Link>
          {isSupabaseConfigured ? <UserMenu /> : <RoleSwitcher />}
        </div>
      </header>

      <div className="hr" style={{ margin: 0 }} />

      {error && (
        <div
          role="alert"
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-danger-bg)",
            border: "1px solid var(--color-accent-200)",
            fontSize: 13,
            color: "var(--color-accent-700)",
          }}
        >
          <Icon name="Warning" size={16} color="var(--color-accent-500)" style={{ flex: "none" }} />
          {error}
        </div>
      )}

      <main>
        <AuthGate>{children}</AuthGate>
      </main>

      <Toast />
    </div>
  );
}
