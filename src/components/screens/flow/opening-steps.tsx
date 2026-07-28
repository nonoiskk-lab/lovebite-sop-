"use client";

import { useStore, fmtDuration } from "@/lib/store";
import { SOP_DEFS } from "@/lib/sops";
import { Card } from "@/components/ui/card";
import { PhotoCapture } from "./photo-capture";
import { SummaryRow } from "./summary-row";

const ITEM_COUNT = (SOP_DEFS.opening.items ?? []).length;

/** Generic titled photo step (Before / After / Equipment / Proof). */
export function PhotoStep({
  title,
  description,
  captured,
  onToggle,
  emptyLabel,
  optional,
}: {
  title: string;
  description?: string;
  captured: boolean;
  onToggle: () => void;
  emptyLabel?: string;
  optional?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h4 style={{ margin: 0 }}>
        {title}
        {optional && (
          <span style={{ opacity: 0.5, fontWeight: 400, fontSize: 12 }}> (optional)</span>
        )}
      </h4>
      {description && (
        <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>{description}</p>
      )}
      <PhotoCapture captured={captured} onToggle={onToggle} emptyLabel={emptyLabel} />
    </div>
  );
}

export function OpeningReviewStep() {
  const checked = useStore((s) => s.checked);
  const timerSeconds = useStore((s) => s.timerSeconds);
  const beforePhoto = useStore((s) => s.beforePhoto);
  const afterPhoto = useStore((s) => s.afterPhoto);

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const photoCount = (beforePhoto ? 1 : 0) + (afterPhoto ? 1 : 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h4 style={{ margin: 0 }}>Review &amp; Submit</h4>
      <Card style={{ gap: 8 }}>
        <SummaryRow label="Checklist">
          {checkedCount} / {ITEM_COUNT} complete
        </SummaryRow>
        <SummaryRow label="Time taken">{fmtDuration(timerSeconds)}</SummaryRow>
        <SummaryRow label="Photos">{photoCount} / 2 captured</SummaryRow>
      </Card>
      <p style={{ margin: 0, fontSize: 12, opacity: 0.65 }}>
        Submitting routes this to your manager for approval, with a timestamped audit entry.
      </p>
    </div>
  );
}
