"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import {
  checkIn,
  checkOut,
  listToday,
  myHistory,
  myTodayRecord,
  totalStaffCount,
  workingHours,
  type AttendanceRecord,
} from "@/lib/attendance";
import { Card, CardKicker } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag } from "@/components/ui/tag";
import { Icon } from "@/components/icon";

function statusTag(status: AttendanceRecord["status"]) {
  switch (status) {
    case "present":
      return <Tag variant="tag-success">Present</Tag>;
    case "late":
      return <Tag variant="tag-warning">Late</Tag>;
    case "half_day":
      return <Tag variant="tag-warning">Half Day</Tag>;
    default:
      return <Tag variant="tag-danger">Absent</Tag>;
  }
}

function Stat({ kicker, value }: { kicker: string; value: number }) {
  return (
    <Card>
      <CardKicker>{kicker}</CardKicker>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 700, color: "var(--color-text)" }}>
        {value}
      </div>
    </Card>
  );
}

export function AttendanceDashboard() {
  const role = useStore((s) => s.role);
  const isManager = role === "manager";

  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [team, setTeam] = useState<AttendanceRecord[]>([]);
  const [totalStaff, setTotalStaff] = useState(0);
  const [clock, setClock] = useState(new Date());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const refresh = async () => {
    try {
      const [mine, hist] = await Promise.all([myTodayRecord(), myHistory()]);
      setToday(mine);
      setHistory(hist);
      if (isManager) {
        const [t, count] = await Promise.all([listToday(), totalStaffCount()]);
        setTeam(t);
        setTotalStaff(count);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load attendance.");
    }
  };

  useEffect(() => {
    void refresh();
    const tick = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doCheckIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await checkIn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check-in failed.");
    }
    setBusy(false);
  };

  const doCheckOut = async () => {
    if (!today) return;
    setBusy(true);
    setError(null);
    try {
      await checkOut(today.id, today.checkIn);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check-out failed.");
    }
    setBusy(false);
  };

  const presentCount = team.filter((t) => t.status === "present").length;
  const lateCount = team.filter((t) => t.status === "late").length;
  const absentCount = Math.max(0, totalStaff - team.length);

  const filteredTeam = team.filter(
    (t) =>
      t.userName.toLowerCase().includes(search.toLowerCase()) ||
      t.workDate.includes(search),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h3 style={{ margin: 0 }}>Attendance</h3>
        <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
          {clock.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>

      {error && (
        <div role="alert" style={{ fontSize: 13, color: "var(--color-accent-700)", background: "var(--color-danger-bg)", border: "1px solid var(--color-accent-200)", borderRadius: "var(--radius-md)", padding: "10px 14px" }}>
          {error}
        </div>
      )}

      {isManager && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
          <Stat kicker="Total Staff" value={totalStaff} />
          <Stat kicker="Present" value={presentCount} />
          <Stat kicker="Absent" value={absentCount} />
          <Stat kicker="Late" value={lateCount} />
        </div>
      )}

      {/* Self check-in/out — big, fast */}
      <Card elevated style={{ alignItems: "center", textAlign: "center", padding: 24, gap: 10 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 34, fontWeight: 700 }}>
          {clock.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}
        </div>
        {today && (
          <div style={{ fontSize: 13, color: "var(--color-muted)" }}>
            In: {new Date(today.checkIn).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            {" · "}
            Worked: {workingHours(today.checkIn, today.checkOut)}
          </div>
        )}
        {today && statusTag(today.status)}

        {!today ? (
          <Button variant="primary" block disabled={busy} onClick={doCheckIn} style={{ minHeight: 52, fontSize: 16, marginTop: 8 }}>
            <Icon name="ArrowCircleUp" size={20} />
            Check In
          </Button>
        ) : !today.checkOut ? (
          <Button variant="secondary" block disabled={busy} onClick={doCheckOut} style={{ minHeight: 52, fontSize: 16, marginTop: 8 }}>
            <Icon name="ArrowCircleDown" size={20} />
            Check Out
          </Button>
        ) : (
          <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 4 }}>
            Checked out at {new Date(today.checkOut).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </div>
        )}
      </Card>

      {isManager && (
        <section>
          <h5 style={{ margin: "0 0 10px", color: "var(--color-muted)" }}>Today&apos;s Attendance</h5>
          <Input
            placeholder="Search by name or date (YYYY-MM-DD)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          {filteredTeam.length === 0 ? (
            <Card className="text-muted" style={{ textAlign: "center", padding: 20, fontSize: 13 }}>
              No check-ins yet today.
            </Card>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeam.map((r) => (
                    <tr key={r.id}>
                      <td style={{ color: "var(--color-text)", fontWeight: 500 }}>{r.userName}</td>
                      <td>{new Date(r.checkIn).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</td>
                      <td>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—"}</td>
                      <td>{workingHours(r.checkIn, r.checkOut)}</td>
                      <td>{statusTag(r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section>
        <h5 style={{ margin: "0 0 10px", color: "var(--color-muted)" }}>My History</h5>
        {history.length === 0 ? (
          <Card className="text-muted" style={{ textAlign: "center", padding: 20, fontSize: 13 }}>
            No attendance records yet.
          </Card>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id}>
                    <td style={{ color: "var(--color-text)", fontWeight: 500 }}>{r.workDate}</td>
                    <td>{new Date(r.checkIn).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</td>
                    <td>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—"}</td>
                    <td>{workingHours(r.checkIn, r.checkOut)}</td>
                    <td>{statusTag(r.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
