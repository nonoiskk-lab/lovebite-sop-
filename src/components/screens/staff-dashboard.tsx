"use client";

import { useEffect, useState } from "react";
import { listStaff, updateStaffRole, type StaffMember } from "@/lib/staff";
import { ROLE_LABEL, type Role } from "@/lib/sops";
import { Card } from "@/components/ui/card";

const ROLES: Role[] = ["kitchen", "foh", "manager"];

export function StaffDashboard() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      setStaff(await listStaff());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load staff.");
    }
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const changeRole = async (id: string, role: Role) => {
    setError(null);
    try {
      await updateStaffRole(id, role);
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, role } : s)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update role.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h3 style={{ margin: 0 }}>Staff Management</h3>
        <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
          {staff.length} staff member{staff.length === 1 ? "" : "s"}
        </div>
      </div>

      {error && (
        <div role="alert" style={{ fontSize: 13, color: "var(--color-accent-700)", background: "var(--color-danger-bg)", border: "1px solid var(--color-accent-200)", borderRadius: "var(--radius-md)", padding: "10px 14px" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-muted" style={{ fontSize: 13 }}>Loading…</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td style={{ color: "var(--color-text)", fontWeight: 500 }}>{s.fullName}</td>
                  <td>{s.email ?? "—"}</td>
                  <td>
                    <select
                      className="input"
                      style={{ minHeight: 36, width: 160 }}
                      value={s.role}
                      onChange={(e) => changeRole(s.id, e.target.value as Role)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Card className="text-muted" style={{ fontSize: 12, padding: 14 }}>
        Changing a role takes effect on that person&apos;s next sign-in.
      </Card>
    </div>
  );
}
