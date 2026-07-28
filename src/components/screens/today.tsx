"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { ROLE_ACTOR, sopsForRole } from "@/lib/sops";
import { statusStyle } from "@/lib/status";
import { formatToday } from "@/lib/date";
import { Card, CardMeta, CardTitle } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { Icon } from "@/components/icon";

export function TodayScreen() {
  const router = useRouter();
  const role = useStore((s) => s.role);
  // Subscribe to submissions so status tags stay live after a submit.
  const submissions = useStore((s) => s.submissions);
  const initialized = useStore((s) => s.initialized);
  const resetFlow = useStore((s) => s.resetFlow);

  const sops = sopsForRole(role);
  const staffName = ROLE_ACTOR[role]?.split(" ")[0] ?? "there";

  const latestFor = (sopId: string) =>
    submissions.find((x) => x.sopId === sopId) ?? null;

  const open = (sopId: string) => {
    resetFlow();
    router.push(`/sop/${sopId}/step/0`);
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          suppressHydrationWarning
          style={{
            fontSize: 12,
            color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
          }}
        >
          {formatToday()}
        </div>
        <h3 style={{ margin: 0 }}>Good morning, {staffName}</h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!initialized &&
          sops.map((sop) => (
            <Card key={`skeleton-${sop.id}`} aria-hidden style={{ opacity: 0.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-neutral-800)",
                    flex: "none",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      width: "60%",
                      height: 12,
                      borderRadius: 4,
                      background: "var(--color-neutral-800)",
                    }}
                  />
                  <div
                    style={{
                      width: "35%",
                      height: 9,
                      borderRadius: 4,
                      background: "var(--color-neutral-800)",
                      marginTop: 8,
                    }}
                  />
                </div>
              </div>
            </Card>
          ))}
        {initialized &&
          sops.map((sop) => {
          const latest = latestFor(sop.id);
          const st = statusStyle(latest ? latest.status : "not_started");
          return (
            <Card
              key={sop.id}
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => open(sop.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  open(sop.id);
                }
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-accent-800)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "none",
                  }}
                >
                  <Icon name={sop.icon} size={19} color="var(--color-accent-200)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <CardTitle>{sop.name}</CardTitle>
                  <CardMeta>
                    <Icon name="Clock" size={12} />
                    {sop.time}
                  </CardMeta>
                </div>
                <Tag variant={st.tagClass}>{st.label}</Tag>
              </div>
            </Card>
          );
        })}
        {initialized && sops.length === 0 && (
          <Card style={{ textAlign: "center", padding: 24 }} className="text-muted">
            No SOPs assigned to this role today.
          </Card>
        )}
      </div>

      <div className="hr" />

      <div
        style={{
          fontSize: 12,
          color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
        }}
      >
        <Icon
          name="ShieldCheck"
          size={15}
          color="var(--color-accent-300)"
          style={{ flex: "none", marginTop: 1 }}
        />
        Every step is timestamped and photo-verified for compliance audit.
      </div>
    </>
  );
}
