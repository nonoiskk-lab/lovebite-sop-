"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { ATTENTION_STATUSES, COMPLETED_STATUSES } from "@/lib/status";
import { listItems, isExpiringSoon } from "@/lib/inventory";
import { listToday, totalStaffCount } from "@/lib/attendance";
import { Card, CardKicker } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

function Stat({ kicker, value }: { kicker: string; value: number }) {
  return (
    <Card>
      <CardKicker>{kicker}</CardKicker>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 700, color: "var(--color-text)" }}>
        {value}
      </div>
    </Card>
  );
}

export function ReportsDashboard() {
  const submissions = useStore((s) => s.submissions);
  const [inventory, setInventory] = useState({ total: 0, low: 0, out: 0, expiring: 0 });
  const [attendance, setAttendance] = useState({ present: 0, late: 0, absent: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [items, today, staffCount] = await Promise.all([listItems(), listToday(), totalStaffCount()]);
        setInventory({
          total: items.length,
          low: items.filter((i) => i.quantity > 0 && i.quantity < i.minStock).length,
          out: items.filter((i) => i.quantity <= 0).length,
          expiring: items.filter((i) => isExpiringSoon(i.expiryDate)).length,
        });
        setAttendance({
          present: today.filter((t) => t.status === "present").length,
          late: today.filter((t) => t.status === "late").length,
          absent: Math.max(0, staffCount - today.length),
          total: staffCount,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load reports.");
      }
    })();
  }, []);

  const pending = submissions.filter((s) => ATTENTION_STATUSES.includes(s.status)).length;
  const flagged = submissions.filter((s) => s.status === "flagged").length;
  const completed = submissions.filter((s) => COMPLETED_STATUSES.includes(s.status)).length;

  const exportCsv = () => {
    const rows = [
      ["Section", "Metric", "Value"],
      ["SOP", "Pending Approvals", String(pending)],
      ["SOP", "Flagged", String(flagged)],
      ["SOP", "Completed Today", String(completed)],
      ["Inventory", "Total Items", String(inventory.total)],
      ["Inventory", "Low Stock", String(inventory.low)],
      ["Inventory", "Out of Stock", String(inventory.out)],
      ["Inventory", "Expiring Soon", String(inventory.expiring)],
      ["Attendance", "Present", String(attendance.present)],
      ["Attendance", "Late", String(attendance.late)],
      ["Attendance", "Absent", String(attendance.absent)],
    ];
    const csv = rows.map((r) => r.join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lovebites-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>Reports</h3>
          <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>Today&apos;s summary</div>
        </div>
        <Button variant="secondary" style={{ marginLeft: "auto" }} onClick={exportCsv}>
          <Icon name="FileXls" size={16} />
          Export Summary CSV
        </Button>
      </div>

      {error && (
        <div role="alert" style={{ fontSize: 13, color: "var(--color-accent-700)", background: "var(--color-danger-bg)", border: "1px solid var(--color-accent-200)", borderRadius: "var(--radius-md)", padding: "10px 14px" }}>
          {error}
        </div>
      )}

      <section>
        <h5 style={{ margin: "0 0 10px", color: "var(--color-muted)" }}>SOP Execution</h5>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
          <Stat kicker="Pending Approvals" value={pending} />
          <Stat kicker="Flagged" value={flagged} />
          <Stat kicker="Completed Today" value={completed} />
        </div>
      </section>

      <section>
        <h5 style={{ margin: "0 0 10px", color: "var(--color-muted)" }}>Inventory</h5>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
          <Stat kicker="Total Items" value={inventory.total} />
          <Stat kicker="Low Stock" value={inventory.low} />
          <Stat kicker="Out of Stock" value={inventory.out} />
          <Stat kicker="Expiring Soon" value={inventory.expiring} />
        </div>
      </section>

      <section>
        <h5 style={{ margin: "0 0 10px", color: "var(--color-muted)" }}>Attendance</h5>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
          <Stat kicker="Total Staff" value={attendance.total} />
          <Stat kicker="Present" value={attendance.present} />
          <Stat kicker="Late" value={attendance.late} />
          <Stat kicker="Absent" value={attendance.absent} />
        </div>
      </section>
    </div>
  );
}
