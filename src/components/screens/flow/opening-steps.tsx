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
  previewUrl,
  onCapture,
  onClear,
  emptyLabel,
  optional,
}: {
  title: string;
  description?: string;
  previewUrl: string | null;
  onCapture: (blob: Blob, previewUrl: string) => void;
  onClear: () => void;
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
      <PhotoCapture
        previewUrl={previewUrl}
        onCapture={onCapture}
        onClear={onClear}
        emptyLabel={emptyLabel}
      />
    </div>
  );
}

export function OpeningReviewStep() {
  const checked = useStore((s) => s.checked);
  const timerSeconds = useStore((s) => s.timerSeconds);
  const photos = useStore((s) => s.photos);

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const photoCount =
    (photos.before.previewUrl ? 1 : 0) + (photos.after.previewUrl ? 1 : 0);

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
