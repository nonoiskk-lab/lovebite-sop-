"use client";

import { create } from "zustand";
import {
  ROLE_ACTOR,
  SOP_DEFS,
  isTempOutOfRange,
  type Role,
  type SopId,
  type SubmissionStatus,
} from "./sops";

/* ═══════════════════════════════════════════════════════════════════════════
   Data-layer shapes.

   `Submission` and `AuditEntry` are the two records this Phase-1 store keeps in
   memory. They map 1:1 to the `sop_submissions` and `audit_logs` tables in the
   suggested Supabase schema (see supabase/migrations). Swapping this store for
   real persistence means replacing the action bodies below with Supabase
   mutations + TanStack Query reads — the component API stays the same.
   ═══════════════════════════════════════════════════════════════════════ */

export interface MetaEntry {
  key: string;
  value: string;
}

export interface Submission {
  id: string;
  sopId: SopId;
  sopName: string;
  role: Role;
  roleLabel: string;
  actor: string;
  submittedAt: string;
  status: SubmissionStatus;
  meta: MetaEntry[];
}

export interface AuditEntry {
  id: string;
  time: string;
  text: string;
}

export interface ConfirmPayload {
  /** Phosphor icon name. */
  icon: string;
  title: string;
  message: string;
}

export type ResolveAction = "approve" | "reject" | "acknowledge";

interface FlowState {
  checked: Record<number, boolean>;
  beforePhoto: boolean;
  afterPhoto: boolean;
  proofPhoto: boolean;
  tempPhoto: boolean;
  timerSeconds: number;
  timerRunning: boolean;
  fridgeTemp: string;
  freezerTemp: string;
  cashCounted: string;
  posSales: string;
}

const emptyFlow: FlowState = {
  checked: {},
  beforePhoto: false,
  afterPhoto: false,
  proofPhoto: false,
  tempPhoto: false,
  timerSeconds: 0,
  timerRunning: false,
  fridgeTemp: "",
  freezerTemp: "",
  cashCounted: "",
  posSales: "",
};

interface StoreState extends FlowState {
  role: Role;
  submissions: Submission[];
  auditLog: AuditEntry[];
  confirm: ConfirmPayload | null;
  toast: string | null;

  // role
  setRole: (role: Role) => void;

  // flow lifecycle
  resetFlow: () => void;
  toggleCheck: (i: number) => void;
  togglePhoto: (key: "beforePhoto" | "afterPhoto" | "proofPhoto" | "tempPhoto") => void;
  startTimer: () => void;
  pauseTimer: () => void;
  tickTimer: () => void;
  setField: (
    key: "fridgeTemp" | "freezerTemp" | "cashCounted" | "posSales",
    value: string,
  ) => void;

  // mutations
  submitFlow: (sopId: SopId) => ConfirmPayload;
  resolveSubmission: (id: string, action: ResolveAction) => void;
  exportReport: () => void;
  clearToast: () => void;

  // reads
  latestFor: (sopId: SopId) => Submission | null;
}

/* — small time/format helpers (client-side; run on user interaction) — */
function nowTime(): string {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function fmtDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

let idCounter = 0;
function uid(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

/* — seed data (mirrors the prototype's initial state) — */
const SEED_SUBMISSIONS: Submission[] = [
  {
    id: "s1",
    sopId: "temp",
    sopName: "Temperature Log",
    role: "kitchen",
    roleLabel: "Kitchen",
    actor: "Ravi Kumar",
    submittedAt: "11:04 AM",
    status: "flagged",
    meta: [
      { key: "Fridge", value: "4.1°C" },
      { key: "Freezer", value: "-9°C" },
      { key: "Note", value: "Freezer above -15°C threshold" },
    ],
  },
];

const SEED_AUDIT: AuditEntry[] = [
  {
    id: "a1",
    time: "11:05 AM",
    text: "System flagged Temperature Log — freezer reading -9°C exceeds -15°C safe threshold.",
  },
  { id: "a2", time: "11:04 AM", text: "Ravi Kumar submitted Temperature Log." },
  { id: "a3", time: "7:10 AM", text: "Aisha Sen (Manager) approved Opening Checklist." },
  {
    id: "a4",
    time: "6:58 AM",
    text: "Ravi Kumar submitted Opening Checklist for approval.",
  },
];

export const useStore = create<StoreState>((set, get) => ({
  ...emptyFlow,
  role: "kitchen",
  submissions: SEED_SUBMISSIONS,
  auditLog: SEED_AUDIT,
  confirm: null,
  toast: null,

  setRole: (role) => set({ role }),

  resetFlow: () => set({ ...emptyFlow, confirm: null }),

  toggleCheck: (i) =>
    set((s) => ({ checked: { ...s.checked, [i]: !s.checked[i] } })),

  togglePhoto: (key) => set((s) => ({ [key]: !s[key] }) as Partial<StoreState>),

  startTimer: () => set({ timerRunning: true }),
  pauseTimer: () => set({ timerRunning: false }),
  tickTimer: () => set((s) => ({ timerSeconds: s.timerSeconds + 1 })),

  setField: (key, value) => set({ [key]: value } as Partial<StoreState>),

  submitFlow: (sopId) => {
    const s = get();
    const def = SOP_DEFS[sopId];
    const actor = ROLE_ACTOR[s.role];
    const time = nowTime();

    let status: SubmissionStatus = "pending";
    let meta: MetaEntry[] = [];
    let confirm: ConfirmPayload;

    if (sopId === "opening") {
      const items = def.items ?? [];
      const checkedCount = items.filter((_, i) => s.checked[i]).length;
      const photoCount = (s.beforePhoto ? 1 : 0) + (s.afterPhoto ? 1 : 0);
      meta = [
        { key: "Checklist", value: `${checkedCount}/${items.length}` },
        { key: "Time taken", value: fmtDuration(s.timerSeconds) },
        { key: "Photos", value: `${photoCount}/2` },
      ];
      status = "pending";
      confirm = {
        icon: "HourglassMedium",
        title: "Submitted",
        message: "Sent to your manager for approval, with a full timestamped record.",
      };
    } else if (sopId === "temp") {
      const fridge = parseFloat(s.fridgeTemp);
      const freezer = parseFloat(s.freezerTemp);
      const flagged = isTempOutOfRange(
        Number.isNaN(fridge) ? null : fridge,
        Number.isNaN(freezer) ? null : freezer,
      );
      meta = [
        { key: "Fridge", value: `${s.fridgeTemp}°C` },
        { key: "Freezer", value: `${s.freezerTemp}°C` },
        { key: "Photo", value: s.tempPhoto ? "Captured" : "—" },
      ];
      status = flagged ? "flagged" : "logged";
      confirm = flagged
        ? {
            icon: "Warning",
            title: "Flagged",
            message:
              "Reading is outside the safe range. Your manager has been notified automatically.",
          }
        : {
            icon: "CheckCircle",
            title: "Logged",
            message: "Reading auto-logged. No manager action needed.",
          };
    } else {
      // cash
      const counted = parseFloat(s.cashCounted) || 0;
      const pos = parseFloat(s.posSales) || 0;
      const diff = counted - pos;
      meta = [
        { key: "Counted", value: `₹${counted.toFixed(2)}` },
        { key: "POS total", value: `₹${pos.toFixed(2)}` },
        { key: "Difference", value: `${diff >= 0 ? "+" : ""}₹${diff.toFixed(2)}` },
        { key: "Proof", value: s.proofPhoto ? "Attached" : "None" },
      ];
      status = "pending";
      confirm = {
        icon: "HourglassMedium",
        title: "Submitted",
        message: "Daily Excel summary generated. Sent to your manager for approval.",
      };
    }

    const submission: Submission = {
      id: uid("sub"),
      sopId: def.id,
      sopName: def.name,
      role: s.role,
      roleLabel: def.roleLabel,
      actor,
      submittedAt: time,
      status,
      meta,
    };
    const auditText = `${actor} submitted ${def.name}${
      status === "flagged" ? " — flagged out of range." : "."
    }`;

    set((prev) => ({
      confirm,
      submissions: [submission, ...prev.submissions],
      auditLog: [{ id: uid("a"), time, text: auditText }, ...prev.auditLog],
    }));

    return confirm;
  },

  resolveSubmission: (id, action) => {
    const time = nowTime();
    set((prev) => {
      const sub = prev.submissions.find((x) => x.id === id);
      if (!sub) return prev;
      const statusMap: Record<ResolveAction, SubmissionStatus> = {
        approve: "approved",
        reject: "rejected",
        acknowledge: "acknowledged",
      };
      const verbMap: Record<ResolveAction, string> = {
        approve: "approved",
        reject: "rejected",
        acknowledge: "acknowledged",
      };
      const newStatus = statusMap[action];
      const text = `${ROLE_ACTOR.manager} ${verbMap[action]} ${sub.sopName} from ${sub.actor}.`;
      return {
        submissions: prev.submissions.map((x) =>
          x.id === id ? { ...x, status: newStatus } : x,
        ),
        auditLog: [{ id: uid("a"), time, text }, ...prev.auditLog],
      };
    });
  },

  exportReport: () => {
    set({ toast: "Daily Excel report exported to Manager Reports." });
  },

  clearToast: () => set({ toast: null }),

  latestFor: (sopId) => {
    const list = get().submissions.filter((x) => x.sopId === sopId);
    return list.length ? list[0] : null;
  },
}));
