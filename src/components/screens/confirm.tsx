"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";

export function ConfirmScreen() {
  const router = useRouter();
  const confirm = useStore((s) => s.confirm);

  // Direct navigation with no confirm payload → back to Today.
  useEffect(() => {
    if (!confirm) router.replace("/today");
  }, [confirm, router]);

  if (!confirm) return null;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        textAlign: "center",
        padding: "20px 10px",
        minHeight: 420,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--color-accent-100)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={confirm.icon} size={32} color="var(--color-accent-600)" />
      </div>
      <h3 style={{ margin: 0 }}>{confirm.title}</h3>
      <p style={{ margin: 0, fontSize: 13, opacity: 0.75, maxWidth: 260 }}>{confirm.message}</p>
      <Button
        variant="secondary"
        style={{ marginTop: 10, minHeight: 44 }}
        onClick={() => router.push("/today")}
      >
        Back to Today
      </Button>
    </div>
  );
}
