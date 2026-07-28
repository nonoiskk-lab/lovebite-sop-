"use client";

import { useParams } from "next/navigation";
import { MobileFrame } from "@/components/mobile-frame";
import { SopFlow } from "@/components/screens/sop-flow";

export default function SopStepPage() {
  const params = useParams<{ sopId: string; step: string }>();
  const sopId = String(params.sopId);
  const step = Number.parseInt(String(params.step), 10);

  return (
    <MobileFrame>
      <SopFlow sopId={sopId} stepIndex={Number.isNaN(step) ? 0 : step} />
    </MobileFrame>
  );
}
