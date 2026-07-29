"use client";

import { useEffect } from "react";
import { useStore, fmtDuration } from "@/lib/store";
import { SOP_DEFS } from "@/lib/sops";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

const ITEMS = SOP_DEFS.opening.items ?? [];

export function ChecklistStep() {
  const checked = useStore((s) => s.checked);
  const toggleCheck = useStore((s) => s.toggleCheck);
  const timerSeconds = useStore((s) => s.timerSeconds);
  const timerRunning = useStore((s) => s.timerRunning);
  const startTimer = useStore((s) => s.startTimer);
  const pauseTimer = useStore((s) => s.pauseTimer);
  const tickTimer = useStore((s) => s.tickTimer);

  // Real 1s tick while running. Persists in the store across steps; resets when
  // the flow restarts (resetFlow). Production persists elapsed time server-side.
  useEffect(() => {
    if (!timerRunning) return;
    const h = setInterval(tickTimer, 1000);
    return () => clearInterval(h);
  }, [timerRunning, tickTimer]);

  const timerLabel = timerRunning ? "Pause" : timerSeconds > 0 ? "Resume" : "Start Timer";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Card
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="Timer" size={18} color="var(--color-accent-500)" />
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            {fmtDuration(timerSeconds)}
          </span>
        </div>
        <Button variant="secondary" onClick={() => (timerRunning ? pauseTimer() : startTimer())}>
          {timerLabel}
        </Button>
      </Card>

      <h4 style={{ margin: "6px 0 0" }}>Opening Checklist</h4>

      {ITEMS.map((label, i) => {
        const isChecked = !!checked[i];
        return (
          <Card
            key={label}
            role="button"
            tabIndex={0}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, cursor: "pointer" }}
            onClick={() => toggleCheck(i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleCheck(i);
              }
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: "1.5px solid",
                borderColor: isChecked ? "var(--color-accent)" : "var(--color-divider)",
                background: isChecked ? "var(--color-accent)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
              }}
            >
              {isChecked && <Icon name="Check" weight="bold" size={13} color="var(--color-bg)" />}
            </div>
            <span
              style={{
                fontSize: 14,
                opacity: isChecked ? 0.55 : 1,
                textDecoration: isChecked ? "line-through" : "none",
              }}
            >
              {label}
            </span>
          </Card>
        );
      })}
    </div>
  );
}
