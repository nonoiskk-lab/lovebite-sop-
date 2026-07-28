/**
 * SOP catalog + domain types.
 *
 * Ported from the prototype's `SOP_DEFS` / `ROLE_ACTOR` (see the design
 * handoff). In production these rows live in a `sops` table
 * (`id, name, role, steps jsonb`) — this file is the seed/source of truth
 * until that table is wired to Supabase.
 */

export type Role = "kitchen" | "foh" | "manager";

export type SopId = "opening" | "temp" | "cash";

export type StepKind =
  | "before"
  | "checklist"
  | "after"
  | "review"
  | "readings"
  | "photo"
  | "count"
  | "pos";

/** Lifecycle states for a submission. Mirrors the `status` enum in the DB. */
export type SubmissionStatus =
  | "not_started"
  | "pending"
  | "flagged"
  | "logged"
  | "approved"
  | "rejected"
  | "acknowledged";

export interface SopDef {
  id: SopId;
  name: string;
  time: string;
  role: Exclude<Role, "manager">;
  roleLabel: string;
  /** Phosphor icon name (regular weight). */
  icon: string;
  steps: StepKind[];
  /** Checklist rows — only present on the opening SOP. */
  items?: string[];
}

export const SOP_DEFS: Record<SopId, SopDef> = {
  opening: {
    id: "opening",
    name: "Opening Checklist",
    time: "6:45 AM",
    role: "kitchen",
    roleLabel: "Kitchen",
    icon: "Sun",
    steps: ["before", "checklist", "after", "review"],
    items: [
      "Unlock restaurant",
      "Turn on lights & AC",
      "Check kitchen equipment",
      "Clean dining area",
      "Check washrooms",
      "Verify inventory",
      "Mark staff attendance",
    ],
  },
  temp: {
    id: "temp",
    name: "Temperature Log",
    time: "11:00 AM",
    role: "kitchen",
    roleLabel: "Kitchen",
    icon: "Thermometer",
    steps: ["readings", "photo", "review"],
  },
  cash: {
    id: "cash",
    name: "Closing Cash Reconciliation",
    time: "10:30 PM",
    role: "foh",
    roleLabel: "Front of House",
    icon: "CashRegister",
    steps: ["count", "pos", "photo", "review"],
  },
};

export const SOP_ORDER: SopId[] = ["opening", "temp", "cash"];

/** Demo actor names per role — replaced by the authenticated user in prod. */
export const ROLE_ACTOR: Record<Role, string> = {
  kitchen: "Ravi Kumar",
  foh: "Meera Iyer",
  manager: "Aisha Sen (Manager)",
};

export const ROLE_LABEL: Record<Role, string> = {
  kitchen: "Kitchen Staff",
  foh: "Front of House",
  manager: "Manager",
};

/** Temperature safety thresholds — drive the flagged/logged split. */
export const TEMP_LIMITS = {
  fridgeMaxC: 5,
  freezerMaxC: -15,
} as const;

/** True when either reading is outside the safe range. */
export function isTempOutOfRange(
  fridge: number | null,
  freezer: number | null,
): boolean {
  return (
    (fridge !== null && !Number.isNaN(fridge) && fridge > TEMP_LIMITS.fridgeMaxC) ||
    (freezer !== null && !Number.isNaN(freezer) && freezer > TEMP_LIMITS.freezerMaxC)
  );
}

/** Human step labels used in the flow header ("Step 2 of 4 · Checklist"). */
export function stepIndexLabel(sopId: SopId, kind: StepKind): string {
  const labels: Record<StepKind, string> = {
    before: "Before Photo",
    checklist: "Checklist",
    after: "After Photo",
    review: "Review & Submit",
    readings: "Readings",
    photo: sopId === "temp" ? "Equipment Photo" : "Proof Photo",
    count: "Cash Count",
    pos: "Match POS",
  };
  return labels[kind];
}

export function sopsForRole(role: Role): SopDef[] {
  return SOP_ORDER.map((id) => SOP_DEFS[id]).filter((d) => d.role === role);
}
