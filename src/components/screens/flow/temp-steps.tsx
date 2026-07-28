"use client";

import { useStore } from "@/lib/store";
import { isTempOutOfRange } from "@/lib/sops";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Tag } from "@/components/ui/tag";
import { Icon } from "@/components/icon";
import { SummaryRow } from "./summary-row";

function parse(v: string): number | null {
  if (v === "") return null;
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
}

export function ReadingsStep() {
  const fridgeTemp = useStore((s) => s.fridgeTemp);
  const freezerTemp = useStore((s) => s.freezerTemp);
  const setField = useStore((s) => s.setField);

  const outOfRange = isTempOutOfRange(parse(fridgeTemp), parse(freezerTemp));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h4 style={{ margin: 0 }}>Temperature Readings</h4>
      <Field label="Refrigerator (°C)" htmlFor="fridge">
        <Input
          id="fridge"
          type="number"
          inputMode="decimal"
          placeholder="e.g. 3.5"
          value={fridgeTemp}
          onChange={(e) => setField("fridgeTemp", e.target.value)}
        />
      </Field>
      <Field label="Freezer (°C)" htmlFor="freezer">
        <Input
          id="freezer"
          type="number"
          inputMode="decimal"
          placeholder="e.g. -18"
          value={freezerTemp}
          onChange={(e) => setField("freezerTemp", e.target.value)}
        />
      </Field>

      {outOfRange && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            padding: "10px 12px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-accent-900)",
            border: "1px solid var(--color-accent-700)",
          }}
        >
          <Icon
            name="Warning"
            size={16}
            color="var(--color-accent-300)"
            style={{ flex: "none", marginTop: 1 }}
          />
          <span style={{ fontSize: 12, color: "var(--color-accent-200)" }}>
            Reading outside safe range — this will alert the manager automatically.
          </span>
        </div>
      )}
    </div>
  );
}

export function TempReviewStep() {
  const fridgeTemp = useStore((s) => s.fridgeTemp);
  const freezerTemp = useStore((s) => s.freezerTemp);
  const outOfRange = isTempOutOfRange(parse(fridgeTemp), parse(freezerTemp));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h4 style={{ margin: 0 }}>Review &amp; Submit</h4>
      <Card style={{ gap: 8 }}>
        <SummaryRow label="Fridge">{fridgeTemp}°C</SummaryRow>
        <SummaryRow label="Freezer">{freezerTemp}°C</SummaryRow>
        <SummaryRow label="Status">
          <Tag variant={outOfRange ? "tag-outline" : "tag-accent"}>
            {outOfRange ? "Flagged" : "Logged"}
          </Tag>
        </SummaryRow>
      </Card>
      <p style={{ margin: 0, fontSize: 12, opacity: 0.65 }}>
        {outOfRange
          ? "This reading will alert your manager immediately upon submission."
          : "Within safe range — this will auto-log with no approval needed."}
      </p>
    </div>
  );
}
