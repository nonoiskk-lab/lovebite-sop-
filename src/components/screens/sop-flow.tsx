"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  SOP_DEFS,
  isTempOutOfRange,
  stepIndexLabel,
  type SopId,
} from "@/lib/sops";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { ChecklistStep } from "./flow/checklist-step";
import { PhotoStep, OpeningReviewStep } from "./flow/opening-steps";
import { ReadingsStep, TempReviewStep } from "./flow/temp-steps";
import { CashCountStep, CashPosStep, CashReviewStep } from "./flow/cash-steps";

function isSopId(v: string): v is SopId {
  return v === "opening" || v === "temp" || v === "cash";
}

export function SopFlow({ sopId, stepIndex }: { sopId: string; stepIndex: number }) {
  const router = useRouter();
  const s = useStore();

  const valid = isSopId(sopId);
  const def = valid ? SOP_DEFS[sopId] : null;
  const inRange = def ? stepIndex >= 0 && stepIndex < def.steps.length : false;

  // Guard invalid routes back to Today (after render, to keep hooks stable).
  useEffect(() => {
    if (!def || !inRange) router.replace("/today");
  }, [def, inRange, router]);

  if (!def || !inRange) return null;

  const kind = def.steps[stepIndex];
  const isLast = stepIndex === def.steps.length - 1;
  const progressPercent = Math.round(((stepIndex + 1) / def.steps.length) * 100);
  const stepLabel = `Step ${stepIndex + 1} of ${def.steps.length} · ${stepIndexLabel(
    def.id,
    kind,
  )}`;

  const canProceed = (): boolean => {
    switch (kind) {
      case "before":
        return s.beforePhoto;
      case "checklist":
        return (def.items ?? []).every((_, i) => s.checked[i]);
      case "after":
        return s.afterPhoto;
      case "readings":
        return s.fridgeTemp !== "" && s.freezerTemp !== "";
      case "photo":
        return def.id === "temp" ? s.tempPhoto : true; // cash proof is optional
      case "count":
        return s.cashCounted !== "";
      case "pos":
        return s.posSales !== "";
      default:
        return true;
    }
  };

  const goBack = () => {
    if (stepIndex === 0) router.push("/today");
    else router.push(`/sop/${sopId}/step/${stepIndex - 1}`);
  };

  const goNext = () => {
    if (!canProceed()) return;
    if (!isLast) {
      router.push(`/sop/${sopId}/step/${stepIndex + 1}`);
    } else {
      s.submitFlow(def.id);
      router.push("/confirm");
    }
  };

  const tempOut = isTempOutOfRange(
    s.fridgeTemp === "" ? null : parseFloat(s.fridgeTemp),
    s.freezerTemp === "" ? null : parseFloat(s.freezerTemp),
  );
  void tempOut; // status split handled inside step + store

  return (
    <>
      {/* Header: back + step label + progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Button variant="secondary" icon aria-label="Back" onClick={goBack}>
          <Icon name="ArrowLeft" size={16} />
        </Button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
            }}
          >
            {stepLabel}
          </div>
          <div
            style={{
              height: 5,
              borderRadius: 4,
              background: "var(--color-neutral-800)",
              overflow: "hidden",
              marginTop: 4,
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 4,
                background: "var(--color-accent)",
                width: `${progressPercent}%`,
                transition: "width 160ms ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Step body */}
      <div style={{ flex: 1 }}>
        {kind === "before" && (
          <PhotoStep
            title="Before Photo"
            description="Capture the dining area before opening tasks begin."
            captured={s.beforePhoto}
            onToggle={() => s.togglePhoto("beforePhoto")}
          />
        )}
        {kind === "checklist" && <ChecklistStep />}
        {kind === "after" && (
          <PhotoStep
            title="After Photo"
            description="Confirm the space is ready to receive guests."
            captured={s.afterPhoto}
            onToggle={() => s.togglePhoto("afterPhoto")}
          />
        )}
        {kind === "review" && def.id === "opening" && <OpeningReviewStep />}

        {kind === "readings" && <ReadingsStep />}
        {kind === "photo" && def.id === "temp" && (
          <PhotoStep
            title="Equipment Photo"
            description="Photograph the unit display showing the reading."
            captured={s.tempPhoto}
            onToggle={() => s.togglePhoto("tempPhoto")}
          />
        )}
        {kind === "review" && def.id === "temp" && <TempReviewStep />}

        {kind === "count" && <CashCountStep />}
        {kind === "pos" && <CashPosStep />}
        {kind === "photo" && def.id === "cash" && (
          <PhotoStep
            title="Proof Photo"
            optional
            captured={s.proofPhoto}
            onToggle={() => s.togglePhoto("proofPhoto")}
            emptyLabel="Tap to capture, or skip"
          />
        )}
        {kind === "review" && def.id === "cash" && <CashReviewStep />}
      </div>

      {/* Footer primary action */}
      <div style={{ marginTop: "auto", paddingTop: 8 }}>
        <Button
          variant="primary"
          block
          style={{ minHeight: 48, fontSize: 15 }}
          disabled={!canProceed()}
          onClick={goNext}
        >
          {isLast ? "Submit" : "Continue"}
        </Button>
      </div>
    </>
  );
}
