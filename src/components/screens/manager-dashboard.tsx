"use client";

import { useStore } from "@/lib/store";
import { SOP_DEFS, SOP_ORDER } from "@/lib/sops";
import {
  ATTENTION_STATUSES,
  COMPLETED_STATUSES,
  statusStyle,
} from "@/lib/status";
import { formatToday } from "@/lib/date";
import { downloadDailyReport } from "@/lib/export-report";
import { Card, CardKicker, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { Icon } from "@/components/icon";

const MUTED_HEADING = "color-mix(in srgb, var(--color-text) 65%, transparent)";

function Stat({ kicker, value }: { kicker: string; value: number }) {
  return (
    <Card>
      <CardKicker>{kicker}</CardKicker>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 30, fontWeight: 600 }}>
        {value}
      </div>
    </Card>
  );
}

export function ManagerDashboard() {
  const submissions = useStore((s) => s.submissions);
  const auditLog = useStore((s) => s.auditLog);
  const resolveSubmission = useStore((s) => s.resolveSubmission);
  const setToast = useStore((s) => s.setToast);

  const exportReport = () => {
    downloadDailyReport(submissions);
    setToast("Daily report exported.");
  };

  const attention = submissions.filter((x) => ATTENTION_STATUSES.includes(x.status));
  const pendingCount = attention.length;
  const flaggedCount = submissions.filter((x) => x.status === "flagged").length;
  const completedCount = submissions.filter((x) =>
    COMPLETED_STATUSES.includes(x.status),
  ).length;

  const liveRows = SOP_ORDER.map((id) => {
    const def = SOP_DEFS[id];
    const latest = submissions.find((x) => x.sopId === id) ?? null;
    const st = statusStyle(latest ? latest.status : "not_started");
    return {
      name: def.name,
      role: def.roleLabel,
      time: latest ? latest.submittedAt : def.time,
      st,
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div>
          <h3 style={{ margin: 0 }}>Manager Dashboard</h3>
          <div
            suppressHydrationWarning
            style={{
              fontSize: 12,
              color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
              marginTop: 2,
            }}
          >
            {formatToday()} · All shifts
          </div>
        </div>
        <Button variant="secondary" style={{ marginLeft: "auto" }} onClick={exportReport}>
          <Icon name="FileXls" size={16} />
          Export daily Excel report
        </Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <Stat kicker="Pending Approvals" value={pendingCount} />
        <Stat kicker="Flagged Alerts" value={flaggedCount} />
        <Stat kicker="Completed Today" value={completedCount} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Needs Attention */}
          <section>
            <h5 style={{ margin: "0 0 10px", color: MUTED_HEADING }}>Needs Attention</h5>
            {attention.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {attention.map((sub) => {
                  const st = statusStyle(sub.status);
                  const canAcknowledge = sub.sopId === "temp" && sub.status === "flagged";
                  const canApproveReject = sub.sopId !== "temp";
                  return (
                    <Card key={sub.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Tag variant={st.tagClass}>{st.label}</Tag>
                        <Tag variant="tag-neutral">{sub.roleLabel}</Tag>
                        <CardTitle style={{ marginLeft: 4 }}>{sub.sopName}</CardTitle>
                        <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.6 }}>
                          {sub.actor} · {sub.submittedAt}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 18,
                          flexWrap: "wrap",
                          fontSize: 12,
                          opacity: 0.8,
                          padding: "2px 0",
                        }}
                      >
                        {sub.meta.map((m) => (
                          <span key={m.key}>
                            <span style={{ opacity: 0.6 }}>{m.key}:</span> {m.value}
                          </span>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                        {canAcknowledge && (
                          <Button
                            variant="primary"
                            onClick={() => resolveSubmission(sub.id, "acknowledge")}
                          >
                            Acknowledge
                          </Button>
                        )}
                        {canApproveReject && (
                          <>
                            <Button
                              variant="primary"
                              onClick={() => resolveSubmission(sub.id, "approve")}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => resolveSubmission(sub.id, "reject")}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card
                className="text-muted"
                style={{ alignItems: "center", textAlign: "center", padding: 24, fontSize: 13 }}
              >
                Nothing pending — all clear.
              </Card>
            )}
          </section>

          {/* Live SOP Status */}
          <section>
            <h5 style={{ margin: "0 0 10px", color: MUTED_HEADING }}>Live SOP Status — Today</h5>
            <table className="table">
              <thead>
                <tr>
                  <th>SOP</th>
                  <th>Role</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {liveRows.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.role}</td>
                    <td>{row.time}</td>
                    <td>
                      <Tag variant={row.st.tagClass}>{row.st.label}</Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        {/* Audit Log */}
        <section>
          <h5 style={{ margin: "0 0 10px", color: MUTED_HEADING }}>Audit Log</h5>
          <Card style={{ maxHeight: 520, overflow: "auto", gap: 0 }}>
            {auditLog.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "9px 0",
                  borderBottom: "1px solid var(--color-divider)",
                }}
              >
                <span
                  style={{ fontSize: 11, opacity: 0.5, whiteSpace: "nowrap", flex: "none" }}
                >
                  {entry.time}
                </span>
                <span style={{ fontSize: 12.5, opacity: 0.9 }}>{entry.text}</span>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
}
