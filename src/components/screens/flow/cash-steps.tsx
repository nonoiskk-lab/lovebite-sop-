"use client";

import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { SummaryRow } from "./summary-row";

function diffLabel(counted: string, pos: string): string {
  const c = parseFloat(counted) || 0;
  const p = parseFloat(pos) || 0;
  const d = c - p;
  return `${d >= 0 ? "+" : ""}₹${d.toFixed(2)}`;
}

const DIFF_COLOR = "var(--color-accent-300)";

export function CashCountStep() {
  const cashCounted = useStore((s) => s.cashCounted);
  const setField = useStore((s) => s.setField);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h4 style={{ margin: 0 }}>Cash Count</h4>
      <Field label="Counted cash (₹)" htmlFor="counted">
        <Input
          id="counted"
          type="number"
          inputMode="numeric"
          placeholder="e.g. 18250"
          value={cashCounted}
          onChange={(e) => setField("cashCounted", e.target.value)}
        />
      </Field>
    </div>
  );
}

export function CashPosStep() {
  const cashCounted = useStore((s) => s.cashCounted);
  const posSales = useStore((s) => s.posSales);
  const setField = useStore((s) => s.setField);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h4 style={{ margin: 0 }}>Match POS Sales</h4>
      <Field label="POS system total (₹)" htmlFor="pos">
        <Input
          id="pos"
          type="number"
          inputMode="numeric"
          placeholder="e.g. 18300"
          value={posSales}
          onChange={(e) => setField("posSales", e.target.value)}
        />
      </Field>
      <Card style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, opacity: 0.7 }}>Difference</span>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, color: DIFF_COLOR }}>
          {diffLabel(cashCounted, posSales)}
        </span>
      </Card>
    </div>
  );
}

export function CashReviewStep() {
  const cashCounted = useStore((s) => s.cashCounted);
  const posSales = useStore((s) => s.posSales);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h4 style={{ margin: 0 }}>Review &amp; Submit</h4>
      <Card style={{ gap: 8 }}>
        <SummaryRow label="Counted">₹{cashCounted}</SummaryRow>
        <SummaryRow label="POS total">₹{posSales}</SummaryRow>
        <SummaryRow label="Difference">
          <span style={{ color: DIFF_COLOR }}>{diffLabel(cashCounted, posSales)}</span>
        </SummaryRow>
      </Card>
      <p style={{ margin: 0, fontSize: 12, opacity: 0.65 }}>
        Submitting generates the daily Excel summary and routes to your manager for approval.
      </p>
    </div>
  );
}
