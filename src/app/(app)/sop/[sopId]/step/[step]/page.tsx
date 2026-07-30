"use client";

import { useParams } from "next/navigation";
import { SopFlow } from "@/components/screens/sop-flow";

export default function SopStepPage() {
  const params = useParams<{ sopId: string; step: string }>();
  const sopId = String(params.sopId);
  const step = Number.parseInt(String(params.step), 10);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "60vh", maxWidth: 480 }}>
      <SopFlow sopId={sopId} stepIndex={Number.isNaN(step) ? 0 : step} />
    </div>
  );
}
