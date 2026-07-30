"use client";

import { useEffect, useState } from "react";
import { listHistory, type InventoryTx } from "@/lib/inventory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { Icon } from "@/components/icon";

export function HistoryPanel({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<InventoryTx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listHistory()
      .then(setHistory)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 100,
      }}
    >
      <Card elevated style={{ width: "min(520px, 100%)", maxHeight: "85vh", overflow: "auto", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <h4 style={{ margin: 0 }}>Stock History</h4>
          <Button variant="ghost" icon aria-label="Close" onClick={onClose} style={{ marginLeft: "auto" }}>
            <Icon name="X" size={18} />
          </Button>
        </div>

        {loading ? (
          <div className="text-muted" style={{ fontSize: 13 }}>Loading…</div>
        ) : history.length === 0 ? (
          <div className="text-muted" style={{ fontSize: 13 }}>No stock changes yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {history.map((h) => (
              <div
                key={h.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 0",
                  borderBottom: "1px solid var(--color-divider)",
                  fontSize: 13,
                }}
              >
                <Tag variant={h.changeType === "in" ? "tag-success" : "tag-neutral"}>
                  {h.changeType === "in" ? "Stock In" : "Stock Out"}
                </Tag>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "var(--color-text)" }}>{h.itemName}</div>
                  <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
                    {h.actorName} · {new Date(h.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
                <div style={{ fontWeight: 600, color: "var(--color-text)" }}>
                  {h.changeType === "in" ? "+" : "-"}
                  {h.quantityChanged}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
